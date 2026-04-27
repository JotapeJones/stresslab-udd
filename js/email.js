/**
 * email.js — Integración con EmailJS para notificaciones automáticas
 *
 * NOTA: EmailJS no tiene scheduler nativo. Los recordatorios se envían cuando:
 * 1. El participante abre el chat y tiene sesión pendiente ese día (recordatorio inmediato)
 * 2. El investigador envía el resumen semanal manualmente desde el dashboard
 * 3. Opcionalmente: se puede configurar un Zap en Zapier (ver README.md)
 */

function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS no cargado. Los correos no funcionarán.');
    return false;
  }
  try {
    emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);
    return true;
  } catch (e) {
    console.warn('Error iniciando EmailJS:', e);
    return false;
  }
}

/**
 * Envía recordatorio de sesión al participante
 */
async function sendSessionReminder(participant) {
  if (!initEmailJS()) return false;
  if (!participant.email) return false;

  const techniqueNames = {
    respiracion: 'respiración lenta',
    mindfulness: 'meditación mindfulness',
    actividad: 'actividad física'
  };

  const mainTechnique = participant.techniques?.[0] || 'tu técnica';

  try {
    await emailjs.send(
      CONFIG.EMAILJS.SERVICE_ID,
      CONFIG.EMAILJS.TEMPLATE_REMINDER,
      {
        to_email:   participant.email,
        nickname:   participant.nickname || participant.code,
        technique:  techniqueNames[mainTechnique] || mainTechnique,
        chat_url:   window.location.origin + '/chat.html?code=' + participant.code,
        study_name: CONFIG.STUDY.name,
      }
    );
    console.log('Recordatorio enviado a:', participant.email);
    return true;
  } catch (err) {
    console.error('Error enviando recordatorio:', err);
    return false;
  }
}

/**
 * Envía resumen semanal al participante
 */
async function sendWeeklySummary(participant) {
  if (!initEmailJS()) return false;
  if (!participant.email) return false;

  const sessions = participant.sessions || {};
  const completedSessions = Object.values(sessions).filter(s => s.completed);

  // Calcular sesiones de la última semana
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekSessions = completedSessions.filter(s =>
    new Date(s.completedAt || 0) > oneWeekAgo
  );

  // Calcular promedio de bienestar
  const postCheckins = thisWeekSessions
    .filter(s => s.postCheckin)
    .map(s => s.postCheckin);

  const avgStress = postCheckins.length
    ? (postCheckins.reduce((a, b) => a + b.stress, 0) / postCheckins.length).toFixed(1)
    : '—';

  const avgMood = postCheckins.length
    ? (postCheckins.reduce((a, b) => a + b.mood, 0) / postCheckins.length).toFixed(1)
    : '—';

  try {
    await emailjs.send(
      CONFIG.EMAILJS.SERVICE_ID,
      CONFIG.EMAILJS.TEMPLATE_SUMMARY,
      {
        to_email:       participant.email,
        nickname:       participant.nickname || participant.code,
        sessions_done:  thisWeekSessions.length,
        sessions_planned: participant.sessionsPerWeek || 3,
        avg_stress:     avgStress,
        avg_mood:       avgMood,
        total_sessions: completedSessions.length,
        chat_url:       window.location.origin + '/chat.html?code=' + participant.code,
      }
    );
    return true;
  } catch (err) {
    console.error('Error enviando resumen semanal:', err);
    return false;
  }
}

/**
 * Verifica si corresponde enviar un recordatorio hoy
 * Se llama al cargar el chat
 */
async function checkAndSendTodayReminder(participant) {
  if (!participant.reminderHour || participant.state !== 'active') return;

  const sessions = participant.sessions || {};
  const today = new Date().toDateString();

  // ¿Ya hizo sesión hoy?
  const sessionToday = Object.values(sessions).some(s =>
    s.completed && new Date(s.completedAt || 0).toDateString() === today
  );
  if (sessionToday) return;

  // ¿El recordatorio fue enviado hoy?
  const lastReminderKey = `reminder_sent_${participant.code}_${today}`;
  if (localStorage.getItem(lastReminderKey)) return;

  // ¿Estamos dentro de la hora configurada? (±30 min)
  const now = new Date();
  const targetHour = parseInt(participant.reminderHour || 18);
  const targetMin  = parseInt(participant.reminderMinute || 0);
  const diffMins   = Math.abs((now.getHours() * 60 + now.getMinutes()) - (targetHour * 60 + targetMin));

  if (diffMins <= 30) {
    const sent = await sendSessionReminder(participant);
    if (sent) localStorage.setItem(lastReminderKey, '1');
  }
}

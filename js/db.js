/**
 * db.js — Capa de acceso a Firebase Realtime Database
 * Todas las operaciones CRUD para participantes y sesiones
 */

// ─── Inicialización de Firebase ──────────────────────────────────
let db = null;

function initFirebase() {
  if (db) return db;
  if (!firebase.apps.length) {
    firebase.initializeApp(CONFIG.FIREBASE);
  }
  db = firebase.database();
  return db;
}

// ─── Participantes ───────────────────────────────────────────────

/**
 * Obtiene todos los datos de un participante por código
 * @returns {Object|null} datos del participante o null si no existe
 */
async function getParticipant(code) {
  initFirebase();
  const snap = await db.ref(`participants/${code}`).once('value');
  return snap.val();
}

/**
 * Crea un participante nuevo con estado 'new'
 */
async function createParticipant(code) {
  initFirebase();
  const exists = await getParticipant(code);
  if (!exists) {
    await db.ref(`participants/${code}`).set({
      code,
      state: 'new',
      createdAt: new Date().toISOString(),
      sessions: {},
      conversationLog: [],
    });
  }
  return await getParticipant(code);
}

/**
 * Actualiza campos del participante (merge parcial)
 */
async function updateParticipant(code, fields) {
  initFirebase();
  await db.ref(`participants/${code}`).update(fields);
}

/**
 * Retorna todos los participantes (para el dashboard)
 */
async function getAllParticipants() {
  initFirebase();
  const snap = await db.ref('participants').once('value');
  const data = snap.val() || {};
  return Object.values(data);
}

// ─── Conversación ────────────────────────────────────────────────

/**
 * Agrega un mensaje al log de conversación
 */
async function appendConversationMessage(code, role, content) {
  initFirebase();
  const participant = await getParticipant(code);
  const log = participant?.conversationLog || [];
  log.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });
  // Guardar solo los últimos 100 mensajes en Firebase (resto se mantiene en memoria)
  const trimmed = log.slice(-100);
  await db.ref(`participants/${code}/conversationLog`).set(trimmed);
}

/**
 * Carga el historial de conversación completo
 */
async function getConversationLog(code) {
  initFirebase();
  const snap = await db.ref(`participants/${code}/conversationLog`).once('value');
  return snap.val() || [];
}

// ─── Sesiones ────────────────────────────────────────────────────

/**
 * Crea o actualiza una sesión
 */
async function saveSession(code, sessionId, sessionData) {
  initFirebase();
  await db.ref(`participants/${code}/sessions/${sessionId}`).update(sessionData);
}

/**
 * Marca el inicio de una sesión
 */
async function startSession(code, technique) {
  const sessionId = 'sess_' + Date.now().toString(36);
  const session = {
    id: sessionId,
    technique,
    startedAt: new Date().toISOString(),
    completed: false,
    preCheckin: null,
    postCheckin: null,
    missedReason: null,
  };
  await saveSession(code, sessionId, session);
  return sessionId;
}

/**
 * Guarda el check-in pre o post sesión
 */
async function saveCheckin(code, sessionId, phase, scores) {
  initFirebase();
  const field = phase === 'pre' ? 'preCheckin' : 'postCheckin';
  await db.ref(`participants/${code}/sessions/${sessionId}/${field}`).set({
    stress: scores.stress,
    energy: scores.energy,
    mood: scores.mood,
    timestamp: new Date().toISOString()
  });
}

/**
 * Finaliza una sesión (completa o no)
 */
async function endSession(code, sessionId, completed, missedReason = null) {
  initFirebase();
  await db.ref(`participants/${code}/sessions/${sessionId}`).update({
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    missedReason: missedReason || null,
  });
}

// ─── Cuestionario de cierre ──────────────────────────────────────

async function saveClosingQuestionnaire(code, data) {
  initFirebase();
  await db.ref(`participants/${code}/closingQuestionnaire`).set({
    ...data,
    completedAt: new Date().toISOString()
  });
  await updateParticipant(code, { state: 'closed' });
}

// ─── Procesamiento de bloques DATA desde Claude ──────────────────

/**
 * Parsea y ejecuta los bloques [DATA:{...}] del mensaje de Claude
 * Retorna el mensaje limpio sin los bloques DATA
 */
async function processDataBlocks(code, message) {
  const dataRegex = /\[DATA:(\{(?:[^{}]|(?:\{[^{}]*\}))*\})\]/g;
  const blocks = [];
  let match;

  while ((match = dataRegex.exec(message)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      blocks.push(data);
    } catch (e) {
      console.warn('Error parseando bloque DATA:', match[1], e);
    }
  }

  // Procesar cada bloque de datos
  let currentSessionId = localStorage.getItem(`stresslab_session_${code}`);

  for (const data of blocks) {
    try {
      switch (data.type) {

        case 'onboarding_complete':
          await updateParticipant(code, {
            nickname: data.nickname,
            email: data.email,
            techniques: data.techniques,
            sessionsPerWeek: data.sessionsPerWeek,
            reminderHour: data.reminderHour || '18',
            reminderMinute: data.reminderMinute || '00',
            interventionWeeks: data.interventionWeeks,
            state: 'active',
            onboardedAt: new Date().toISOString()
          });
          break;

        case 'session_start':
          const newSessionId = await startSession(code, data.technique);
          localStorage.setItem(`stresslab_session_${code}`, newSessionId);
          currentSessionId = newSessionId;
          // Notificar al chat sobre el nuevo sessionId
          window.dispatchEvent(new CustomEvent('session_started', {
            detail: { sessionId: newSessionId, technique: data.technique }
          }));
          break;

        case 'checkin':
          if (currentSessionId) {
            await saveCheckin(code, currentSessionId, data.phase, {
              stress: data.stress,
              energy: data.energy,
              mood: data.mood
            });
            if (data.phase === 'pre') {
              // Disparar animación de respiración si la técnica es respiracion
              window.dispatchEvent(new CustomEvent('checkin_pre_done', {
                detail: { sessionId: currentSessionId }
              }));
            }
          }
          break;

        case 'session_end':
          if (currentSessionId) {
            await endSession(code, currentSessionId, data.completed, data.missedReason);
            if (data.completed) {
              localStorage.removeItem(`stresslab_session_${code}`);
              currentSessionId = null;
            }
            window.dispatchEvent(new CustomEvent('session_ended', {
              detail: { completed: data.completed }
            }));
          }
          break;

        case 'closing':
          await saveClosingQuestionnaire(code, {
            stressStart: data.stressStart,
            stressEnd: data.stressEnd,
            useful: data.useful,
            continueAfter: data.continueAfter,
            comment: data.comment || ''
          });
          break;
      }
    } catch (err) {
      console.error('Error procesando bloque DATA:', data, err);
    }
  }

  // Retornar mensaje sin los bloques DATA
  return message.replace(dataRegex, '').trim();
}

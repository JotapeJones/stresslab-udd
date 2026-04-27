/**
 * chat.js — Motor conversacional
 * Integra la API de Claude (Anthropic) con la lógica del estudio
 */

// ─── Estado de la aplicación ─────────────────────────────────────
const AppState = {
  participant: null,
  conversationHistory: [],
  currentSessionId: null,
  isLoading: false,
  breathingActive: false,
};

// ─── Construcción del System Prompt ──────────────────────────────

function buildSystemPrompt(participant) {
  const techniqueNames = {
    respiracion: 'Respiración lenta diafragmática (10 min)',
    mindfulness:  'Mindfulness / Meditación guiada (15 min)',
    actividad:    'Actividad física aeróbica moderada (30-35 min)'
  };

  const techniques = (participant.techniques || [])
    .map(t => techniqueNames[t] || t)
    .join(', ') || '(por definir en onboarding)';

  const sessions      = participant.sessions || {};
  const completed     = Object.values(sessions).filter(s => s.completed).length;
  const totalPlanned  = (participant.sessionsPerWeek || 3) * (participant.interventionWeeks || 3);
  const stateInstructions = getStateInstructions(participant);

  return `Eres StressLab UDD, el asistente digital del Estudio de Cortisol Salival UDD 2026.
Tu misión es acompañar a estudiantes universitarios en la práctica autónoma de técnicas de reducción del estrés académico, en el marco de una tesis de pregrado de Tecnología Médica de la Universidad del Desarrollo, Santiago, Chile.

══════════════════════════════════════
PERFIL DEL PARTICIPANTE
══════════════════════════════════════
Código de participante: ${participant.code}
Apodo: ${participant.nickname || '(aún no definido)'}
Estado en el estudio: ${participant.state || 'new'}
Técnicas seleccionadas: ${techniques}
Sesiones completadas: ${completed} / ${totalPlanned}
Semanas de intervención: ${participant.interventionWeeks || '(por definir)'}

══════════════════════════════════════
REGLAS ABSOLUTAS — SEGUIRLAS SIEMPRE
══════════════════════════════════════
1. IDIOMA Y TONO: Responde siempre en español. Usa un tono cálido, cercano y motivador, como un tutor que acompaña. Nunca frío ni clínico.
2. NO DIAGNÓSTICO: Jamás diagnostiques condiciones médicas o psicológicas, ni des consejos clínicos.
3. NO REEMPLAZAS PROFESIONALES: Si el participante necesita apoyo psicológico, derívalo a profesionales.
4. SEGURIDAD PRIMERO: Si el participante expresa malestar emocional severo, ideación de autolesión o crisis de salud mental, responde con empatía y proporciona: "Para apoyo en salud mental puedes contactar a Psicología UDD: psicologia@udd.cl o al 600 600 6222 (interno 2500). El equipo investigador también está disponible en florencia.arrieta@udd.cl". No continúes la sesión en ese contexto.
5. DATOS ESTRUCTURADOS: Cuando necesites registrar datos, incluye al FINAL de tu mensaje un bloque con formato exacto: [DATA:{...}]. La aplicación los parsea automáticamente y NO los muestra al participante. Si no hay datos que registrar, no incluyas ningún bloque DATA.

══════════════════════════════════════
ESTADO ACTUAL — QUÉ HACER AHORA
══════════════════════════════════════
${stateInstructions}

══════════════════════════════════════
TÉCNICAS DE INTERVENCIÓN DISPONIBLES
══════════════════════════════════════

📍 RESPIRACIÓN LENTA DIAFRAGMÁTICA (10 minutos)
Base mecanística: la respiración a ~6 ciclos/min activa aferentes vagales mielinizadas → NTS → suprime descarga noradrenérgica al PVN hipotalámico → reduce señal de activación del eje HPA → baja cortisol. Efecto validado en metaanálisis (g = -0.35, IC95%: -0.55 a -0.14).
Protocolo: inspiración nasal 5 seg (abdomen se eleva) → expiración bucal lenta 5 seg. Posición: sentado o acostado, una mano en el abdomen.
La app activará automáticamente una animación visual sincronizada con los ciclos al comenzar la sesión.
Tu rol: introducción breve (1 min), animar durante la sesión, reflexión al cierre.

🧘 MINDFULNESS — MEDITACIÓN GUIADA (15 minutos)
Base mecanística: las MBI potencian regulación descendente CPFDL→amígdala, reducen reactividad amigdalina y atenúan activación anticipatoria del eje HPA. Meta-análisis: g = 0.41 sobre cortisol salival.
Secuencia: anclaje en respiración (3 min) → escaneo corporal (5 min) → observación de pensamientos (5 min) → retorno y apertura (2 min).
Tu rol: GUIAR ACTIVAMENTE con instrucciones secuenciales. Pausas de 45-60 segundos entre instrucciones. Lenguaje evocador, directo y sin jerga espiritual excesiva.

🏃 ACTIVIDAD FÍSICA AERÓBICA MODERADA (30-35 minutos)
Base mecanística: el ejercicio aeróbico regular incrementa BDNF hipocampal vía MAPK/ERK-CREB → neuroprotección → mejora retroalimentación negativa del eje HPA. "Cross-stressor adaptation hypothesis": la adaptación al ejercicio atenúa respuesta de cortisol ante estresores psicosociales.
Intensidad objetivo: 50-65% FCmáx. Para universitarios (~21 años): FCmáx ≈ 199 lpm → zona: 100-130 lpm. Señal práctica: puede conversar con cierta dificultad, suda levemente.
Opciones: caminar rápido, trote suave, bicicleta, subir escaleras, baile.
Protocolo: calentamiento 5 min → actividad principal 20-25 min → vuelta a la calma 5 min.

══════════════════════════════════════
FORMATO DE LOS BLOQUES DATA
══════════════════════════════════════
Incluye SOLO el bloque correspondiente al final de tu respuesta, en una línea separada.

Para completar ONBOARDING (cuando el participante confirma todos sus datos):
[DATA:{"type":"onboarding_complete","nickname":"APODO","email":"CORREO","techniques":["respiracion"],"sessionsPerWeek":3,"reminderHour":"18","reminderMinute":"00","interventionWeeks":3}]
(techniques puede incluir: "respiracion", "mindfulness", "actividad" — los que elija)

Para registrar INICIO DE SESIÓN (cuando el participante confirma que empieza):
[DATA:{"type":"session_start","technique":"respiracion"}]

Para registrar CHECK-IN PRE-sesión (con los 3 valores entre 0-10):
[DATA:{"type":"checkin","phase":"pre","stress":7,"energy":4,"mood":5}]

Para registrar CHECK-IN POST-sesión:
[DATA:{"type":"checkin","phase":"post","stress":3,"energy":7,"mood":8}]

Para registrar FIN DE SESIÓN exitosa:
[DATA:{"type":"session_end","completed":true}]

Para registrar sesión NO completada (con motivo):
[DATA:{"type":"session_end","completed":false,"missedReason":"no pudo"}]

Para registrar CUESTIONARIO DE CIERRE:
[DATA:{"type":"closing","stressStart":8,"stressEnd":4,"useful":"si","continueAfter":"si","comment":"Comentario opcional"}]
`;
}

// ─── Instrucciones por estado ─────────────────────────────────────

function getStateInstructions(participant) {
  const state = participant.state || 'new';
  const sessions = participant.sessions || {};
  const completedSessions = Object.values(sessions).filter(s => s.completed);
  const techniques = participant.techniques || [];
  const totalPlanned = (participant.sessionsPerWeek || 3) * (participant.interventionWeeks || 3);

  const techniqueDisplay = {
    respiracion: 'respiración lenta diafragmática',
    mindfulness: 'mindfulness/meditación guiada',
    actividad: 'actividad física aeróbica moderada'
  };

  if (state === 'new') {
    return `ESTADO: ONBOARDING — el participante accede por primera vez y aún no está registrado.

Guía al participante en el registro inicial. Avanza de a un paso a la vez, con calma.

PASOS (en orden):
1. BIENVENIDA: Salúdalo y explica en 2-3 frases qué es este chatbot y para qué sirve. Contexto: es parte de un estudio de tesis de Tecnología Médica UDD que mide cortisol salival como biomarcador de estrés académico. Tu rol es guiarlos en técnicas de reducción de estrés entre el 2° y 3° certamen.
2. APODO: Pídele que elija un apodo con el que prefiere que lo llames.
3. EMAIL: Pídele su correo electrónico para recordatorios automáticos de sesión. Aclara que es solo para el estudio.
4. TÉCNICAS: Presenta las 3 técnicas disponibles con una descripción breve pero motivadora de cada una (3-4 líneas). Pregunta cuál(es) quiere practicar (puede elegir 1, 2 o las 3).
5. FRECUENCIA: Pregunta cuántas sesiones por semana puede comprometerse (sugiere 3, mínimo 1, máximo 5).
6. HORARIO: Pregunta a qué hora del día prefiere recibir el recordatorio por correo (ej: 18:00).
7. DURACIÓN: Pregunta cuántas semanas tiene disponibles antes del certamen 3 (2, 3 o 4 semanas).
8. CONFIRMACIÓN: Resume toda la información y pide confirmación. Al confirmar, incluye el bloque DATA de onboarding_complete.
9. POST-ONBOARDING: Explica brevemente el flujo de una sesión (check-in → práctica → check-in) y di que puede iniciar cuando quiera.`;
  }

  if (state === 'active') {
    const lastSession = completedSessions
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))[0];
    const techniqueList = techniques.map(t => techniqueDisplay[t] || t).join(', ');

    return `ESTADO: INTERVENCIÓN ACTIVA
Participante: ${participant.nickname} | Técnicas: ${techniqueList}
Sesiones completadas: ${completedSessions.length} de ${totalPlanned}
Última sesión: ${lastSession ? new Date(lastSession.completedAt).toLocaleDateString('es-CL') : 'ninguna aún'}

CUANDO EL PARTICIPANTE INICIA CONVERSACIÓN:
- Salúdalo por su apodo con calidez
- Si toca sesión hoy: ofrece proactivamente iniciar la sesión
- Si no: pregunta cómo está, ofrece información o apoyo motivacional
- Puede hacer preguntas sobre las técnicas o el estudio en cualquier momento

FLUJO PARA INICIAR UNA SESIÓN:
1. Confirma la técnica (si eligió más de una, pregunta cuál hará hoy)
2. Explica brevemente qué va a pasar (duración, formato)
3. INCLUYE BLOQUE DATA session_start
4. CHECK-IN PRE: Pide calificar en escala 0-10 (0=nada, 10=máximo):
   → Nivel de ESTRÉS percibido ahora (0=ninguno, 10=extremo)
   → Nivel de ENERGÍA (0=agotado, 10=lleno de energía)
   → ESTADO DE ÁNIMO (0=muy mal, 10=excelente)
   Recoge los 3 valores juntos si puede, o uno por uno. Incluye BLOQUE DATA checkin pre.
5. GUÍA LA SESIÓN paso a paso según la técnica elegida
   → Para respiración: la app activa la animación automáticamente, tú acompañas con texto
   → Para mindfulness: guía activamente con instrucciones y pausas
   → Para actividad: guía cada fase con tiempo e indicaciones de intensidad
6. CHECK-IN POST: Mismos 3 ítems (estrés, energía, ánimo) al terminar. Incluye BLOQUE DATA checkin post.
7. Incluye BLOQUE DATA session_end completed:true
8. Mensaje de cierre: reconoce el esfuerzo, da un dato motivacional sobre el efecto de la técnica

El participante puede interrumpir la sesión para hacer preguntas — respóndelas y retoma desde donde se quedó.`;
  }

  if (state === 'closing') {
    return `ESTADO: CIERRE — el periodo de intervención ha terminado.

1. Reconoce el fin de la intervención y felicita al participante por completarla
2. Aplica el cuestionario de cierre (una pregunta a la vez):
   a. "Pensando en cuando empezaste la intervención, ¿cómo calificarías tu nivel de estrés en ese momento? (0-10)"
   b. "¿Y cómo calificarías tu nivel de estrés hoy? (0-10)"
   c. "¿Te resultó útil la técnica que practicaste? → Sí / No / Parcialmente"
   d. "¿Tienes intención de seguir practicándola después del estudio? → Sí / No / Tal vez"
   e. "¿Tienes algún comentario adicional? (opcional, puedes escribir lo que quieras)"
3. Incluye BLOQUE DATA closing con todas las respuestas
4. Recuerda el protocolo de muestra salival para el día del certamen 3 (antes de las 9:00 am, en ayunas, sin café ni ejercicio previo)
5. Mensaje de despedida cálido y agradecido`;
  }

  if (state === 'closed') {
    return `ESTADO: PARTICIPACIÓN COMPLETADA — el participante finalizó todo el proceso.
- Agradece su participación y destaca su contribución a la ciencia
- Recuerda la fecha de muestra salival pre-certamen 3 si corresponde
- Puede responder preguntas sobre las técnicas o el estudio
- No ofrecer nuevas sesiones de intervención`;
  }

  return `ESTADO: ACTIVO — responde con amabilidad y ofrece apoyo según lo que el participante necesite.`;
}

// ─── Llamada a la IA (Gemini o Anthropic según config) ───────────

async function callClaude(participant, userMessage) {
  // Agregar mensaje del usuario al historial
  AppState.conversationHistory.push({ role: 'user', content: userMessage });

  const history = AppState.conversationHistory.slice(-CONFIG.MAX_HISTORY_MESSAGES);
  const systemPrompt = buildSystemPrompt(participant);

  let rawContent = '';

  if (CONFIG.AI_PROVIDER === 'gemini') {
    rawContent = await _callGemini(systemPrompt, history);
  } else {
    rawContent = await _callAnthropic(systemPrompt, history);
  }

  // Procesar bloques DATA y obtener mensaje limpio
  const cleanContent = await processDataBlocks(participant.code, rawContent);

  // Agregar respuesta al historial (sin bloques DATA)
  AppState.conversationHistory.push({ role: 'assistant', content: cleanContent });

  // Recargar datos del participante desde Firebase
  AppState.participant = await getParticipant(participant.code);

  return cleanContent;
}

// ─── Gemini (Google AI Studio — gratis) ──────────────────────────
// Prueba automáticamente varios modelos en orden hasta que uno funcione.
// Esto resuelve el problema de cuota o modelo no disponible por región.

async function _callGemini(systemPrompt, history) {
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const requestBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: CONFIG.MAX_TOKENS,
      temperature: 0.75,
    }
  };

  const models = CONFIG.GEMINI_MODELS || ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Modelo no existe en esta cuenta/región → probar el siguiente
      if (response.status === 404) {
        lastError = new Error(`Modelo ${model} no disponible (404)`);
        continue;
      }

      // Cuota agotada → probar el siguiente
      if (response.status === 429) {
        const err = await response.json().catch(() => ({}));
        lastError = new Error(`Cuota agotada para ${model}: ${err.error?.message || ''}`);
        continue;
      }

      // Error de clave incorrecta → no tiene sentido probar más modelos
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Error de autenticación Gemini (${response.status}): ${err.error?.message || 'Verifica tu GEMINI_API_KEY en config.js'}`);
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Gemini API ${response.status}: ${err.error?.message || 'Error desconocido'}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } catch (e) {
      // Si el error lo lanzamos nosotros (auth, etc), propagar
      if (e.message.includes('autenticación') || e.message.includes('Verifica')) throw e;
      lastError = e;
      continue;
    }
  }

  // Ningún modelo funcionó
  throw new Error(
    'No se pudo conectar con Gemini. ' +
    (lastError?.message || '') +
    ' — Verifica tu GEMINI_API_KEY en config.js (debe venir de aistudio.google.com).'
  );
}

// ─── Anthropic Claude (para el estudio real) ─────────────────────

async function _callAnthropic(systemPrompt, history) {
  const requestBody = {
    model: CONFIG.ANTHROPIC_MODEL,
    max_tokens: CONFIG.MAX_TOKENS,
    system: systemPrompt,
    messages: history
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API ${response.status}: ${err.error?.message || 'Error desconocido'}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ─── Inicialización del chat ─────────────────────────────────────

async function initChat() {
  // Obtener código desde URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code')?.toUpperCase().trim();

  if (!code || !CONFIG.VALID_CODES.includes(code)) {
    window.location.href = 'index.html?error=codigo_invalido';
    return;
  }

  // Mostrar pantalla de carga
  showLoadingScreen(true);

  try {
    // Cargar o crear participante en Firebase
    let participant = await getParticipant(code);
    if (!participant) {
      participant = await createParticipant(code);
    }
    AppState.participant = participant;

    // Cargar historial de conversación
    const savedLog = await getConversationLog(code);
    // Solo los mensajes user/assistant para el API (sin timestamps)
    AppState.conversationHistory = savedLog.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Restaurar sessionId si hay sesión en curso
    const savedSessionId = localStorage.getItem(`stresslab_session_${code}`);
    if (savedSessionId) {
      const sessions = participant.sessions || {};
      const session = sessions[savedSessionId];
      if (session && !session.completed) {
        AppState.currentSessionId = savedSessionId;
      } else {
        localStorage.removeItem(`stresslab_session_${code}`);
      }
    }

    // Renderizar historial en el UI
    renderConversationHistory(savedLog);

    // Actualizar info del participante en sidebar
    updateParticipantSidebar(participant);

    // Si no hay historial, enviar primer mensaje
    if (savedLog.length === 0) {
      await sendInitialGreeting(participant);
    }

  } catch (error) {
    console.error('Error inicializando chat:', error);
    showError('Error al cargar tu perfil. Por favor recarga la página.');
  } finally {
    showLoadingScreen(false);
  }
}

async function sendInitialGreeting(participant) {
  const trigger = '[INICIO_CONVERSACION]';
  try {
    setTypingIndicator(true);
    const response = await callClaude(participant, trigger);
    appendMessage('assistant', response, true);
    // Guardar en Firebase (sin el trigger del sistema)
    await appendConversationMessage(participant.code, 'assistant', response);
  } catch (err) {
    console.error(err);
    appendMessage('assistant', '¡Hola! Bienvenido/a al estudio. Hay un pequeño problema de conexión, por favor recarga la página.', true);
  } finally {
    setTypingIndicator(false);
  }
}

// ─── Envío de mensajes ───────────────────────────────────────────

async function sendMessage(userText) {
  if (!userText.trim() || AppState.isLoading) return;

  const participant = AppState.participant;
  if (!participant) return;

  AppState.isLoading = true;
  clearInput();
  appendMessage('user', userText, true);
  setTypingIndicator(true);

  // Guardar mensaje del usuario en Firebase
  await appendConversationMessage(participant.code, 'user', userText);

  try {
    const response = await callClaude(participant, userText);
    setTypingIndicator(false);
    appendMessage('assistant', response, true);
    await appendConversationMessage(participant.code, 'assistant', response);
  } catch (error) {
    setTypingIndicator(false);
    const errorMsg = 'Hubo un problema de conexión. Por favor, intenta de nuevo en un momento.';
    appendMessage('assistant', errorMsg, true);
    console.error('Error enviando mensaje:', error);
  } finally {
    AppState.isLoading = false;
  }
}

// ─── UI Helpers ──────────────────────────────────────────────────

function appendMessage(role, content, animate = false) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}${animate ? ' fade-in' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${role}`;
  bubble.innerHTML = formatMessageContent(content);

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  scrollToBottom();
}

function formatMessageContent(text) {
  // Convertir saltos de línea y negrita básica
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function renderConversationHistory(log) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = '';

  for (const msg of log) {
    if (msg.role === 'user' && msg.content === '[INICIO_CONVERSACION]') continue;
    appendMessage(msg.role, msg.content, false);
  }
  scrollToBottom();
}

function setTypingIndicator(active) {
  const indicator = document.getElementById('typing-indicator');
  if (!indicator) return;
  indicator.style.display = active ? 'flex' : 'none';
  if (active) scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function clearInput() {
  const input = document.getElementById('message-input');
  if (input) input.value = '';
}

function showLoadingScreen(show) {
  const screen = document.getElementById('loading-screen');
  if (screen) screen.style.display = show ? 'flex' : 'none';
}

function showError(msg) {
  const el = document.getElementById('chat-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function updateParticipantSidebar(participant) {
  const nameEl = document.getElementById('sidebar-nickname');
  const codeEl = document.getElementById('sidebar-code');
  const stateEl = document.getElementById('sidebar-state');
  const sessionsEl = document.getElementById('sidebar-sessions');

  const sessions = participant.sessions || {};
  const completed = Object.values(sessions).filter(s => s.completed).length;
  const total = (participant.sessionsPerWeek || 3) * (participant.interventionWeeks || 3);

  const stateLabels = {
    new: 'Onboarding pendiente',
    active: 'Intervención activa',
    closing: 'Cierre pendiente',
    closed: 'Completado ✓'
  };

  if (nameEl) nameEl.textContent = participant.nickname || '—';
  if (codeEl) codeEl.textContent = participant.code;
  if (stateEl) stateEl.textContent = stateLabels[participant.state] || participant.state;
  if (sessionsEl) sessionsEl.textContent = `${completed} / ${total} sesiones`;
}

// ─── Listeners del DOM ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initChat();

  // Enviar con botón
  const btn = document.getElementById('send-btn');
  if (btn) btn.addEventListener('click', () => {
    const input = document.getElementById('message-input');
    if (input) sendMessage(input.value);
  });

  // Enviar con Enter (Shift+Enter = nueva línea)
  const input = document.getElementById('message-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });

    // Auto-resize del textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  // Escuchar eventos de sessión para disparar la animación de respiración
  window.addEventListener('session_started', (e) => {
    AppState.currentSessionId = e.detail.sessionId;
  });

  window.addEventListener('session_ended', () => {
    AppState.currentSessionId = null;
    // Actualizar sidebar
    if (AppState.participant) {
      getParticipant(AppState.participant.code).then(p => {
        if (p) {
          AppState.participant = p;
          updateParticipantSidebar(p);
        }
      });
    }
  });
});

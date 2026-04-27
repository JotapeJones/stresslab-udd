/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   StressLab UDD — Configuración del sistema                 ║
 * ║   EDITA ESTE ARCHIVO antes de subir a GitHub Pages          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * IMPORTANTE: Hay dos claves que parecen iguales pero son distintas:
 *
 *   GEMINI_API_KEY  → viene de aistudio.google.com
 *   FIREBASE.apiKey → viene de console.firebase.google.com
 *
 * Son servicios distintos de Google. No las confundas.
 */

const CONFIG = {

  // ─── PROVEEDOR DE IA ─────────────────────────────────────────────
  // 'gemini'    → Google Gemini (gratis, sin tarjeta) ← ACTIVO AHORA
  // 'anthropic' → Claude de Anthropic (para el estudio real, ~$2 total)
  AI_PROVIDER: 'gemini',

  // ─── GOOGLE GEMINI API ───────────────────────────────────────────
  // Dónde obtenerla: https://aistudio.google.com → "Get API key" → "Create API key"
  // Se ve así: AIzaSyXXXXXXXXXXXXXXXXXXXX (empieza con AIzaSy)
  GEMINI_API_KEY: 'AIzaSyDCDGUhvul6u8Ixomg1kkaRIt0L-dEH2u8',

  // ─── ANTHROPIC CLAUDE API (cuando estés lista para el estudio real)
  // Dónde obtenerla: https://console.anthropic.com → API Keys
  ANTHROPIC_API_KEY: 'sk-ant-COLOCA_TU_CLAVE_AQUÍ',

  // ─── FIREBASE REALTIME DATABASE ──────────────────────────────────
  // Dónde obtenerla: console.firebase.google.com → Configuración → Tus apps → </>
  // OJO: el apiKey de Firebase también empieza con AIzaSy, pero es DISTINTO al de Gemini
  FIREBASE: {
    apiKey:            'AIzaSyBO95v1VaccJB5MvdIMsPQ0CkklEsGC89U',
    authDomain:        'streab-udd.firebaseapp.com',
    databaseURL:       'https://streab-udd-default-rtdb.firebaseio.com',
    projectId:         'streab-udd',
    storageBucket:     'streab-udd.firebasestorage.app',
    messagingSenderId: '520031580990',
    appId:             '1:520031580990:web:354fa36be9caf39c62326f'
  },

  // ─── EMAILJS (se configura después, no es urgente) ───────────────
  EMAILJS: {
    SERVICE_ID:        'service_XXXXX',
    TEMPLATE_REMINDER: 'template_reminder',
    TEMPLATE_SUMMARY:  'template_summary',
    PUBLIC_KEY:        'TU_PUBLIC_KEY'
  },

  // ─── ACCESO INVESTIGADORES ───────────────────────────────────────
  // Cambia esto por la contraseña que quieras para entrar al panel
  RESEARCHER_PASSWORD: 'UDD2026stresslab',

  // ─── CÓDIGOS DE PARTICIPANTES ────────────────────────────────────
  VALID_CODES: ['TM-001', 'TM-002', 'TM-003', 'TM-004', 'TM-005', 'TM-006', 'TM-011', 'TM-012', 'TM-013', 'TM-014', 'TM-015', 'TM-016'],

  // ─── INFORMACIÓN DEL ESTUDIO ─────────────────────────────────────
  STUDY: {
    name:               'Estudio Cortisol Salival UDD 2026',
    institution:        'Universidad del Desarrollo, Santiago',
    researchers:        'Florencia Arrieta · Javiera Díaz',
    guide:              'T.M. Juan Pablo Alcayaga',
    mentalHealthEmail:  'psicologia@udd.cl',
    mentalHealthPhone:  '600 600 6222 (interno 2500)',
    researcherEmail:    'florencia.arrieta@udd.cl',
  },

  // ─── MODELOS DE IA ───────────────────────────────────────────────
  // No tocar — el código prueba automáticamente varios modelos si uno falla
  GEMINI_MODELS: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ],
  ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  MAX_TOKENS: 1200,

  // ─── LÍMITES DE CONVERSACIÓN ─────────────────────────────────────
  MAX_HISTORY_MESSAGES: 40,
};

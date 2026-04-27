/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   StressLab UDD — Configuración del sistema                 ║
 * ║   EDITA ESTE ARCHIVO antes de subir a GitHub Pages          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * CLAVES NECESARIAS:
 *
 *   GROQ_API_KEY   → viene de console.groq.com  (gratis, sin tarjeta)
 *   FIREBASE.*     → viene de console.firebase.google.com
 *
 * Cuando estés lista para el estudio real, cambia AI_PROVIDER a
 * 'anthropic' y agrega tu clave de Anthropic.
 */

const CONFIG = {

  // ─── PROVEEDOR DE IA ─────────────────────────────────────────────
  // 'groq'      → Groq (gratis, sin tarjeta, funciona en Chile) ← ACTIVO
  // 'anthropic' → Claude de Anthropic (para el estudio real, ~$2 total)
  AI_PROVIDER: 'groq',

  // ─── GROQ API (gratis) ───────────────────────────────────────────
  // Dónde obtenerla: https://console.groq.com → API Keys → Create API Key
  // Se ve así: gsk_XXXXXXXXXXXXXXXXXXXX
  GROQ_API_KEY: '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',

  // ─── ANTHROPIC CLAUDE API (para el estudio real) ─────────────────
  // Dónde obtenerla: https://console.anthropic.com → API Keys
  ANTHROPIC_API_KEY: 'sk-ant-COLOCA_TU_CLAVE_AQUÍ',

  // ─── FIREBASE REALTIME DATABASE ──────────────────────────────────
  // Dónde obtenerla: console.firebase.google.com → Configuración → Tus apps → </>
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
  RESEARCHER_PASSWORD: 'UDD2026stresslab',

  // ─── CÓDIGOS DE PARTICIPANTES ────────────────────────────────────
  VALID_CODES: ['TM-001', 'TM-002', 'TM-003', 'TM-004', 'TM-005', 'TM-006','TEST-001', 'TEST-002', 'TEST-003', 'TEST-004', 'TEST-005', 'TEST-006'],

  // ─── INFORMACIÓN DEL ESTUDIO ─────────────────────────────────────
  STUDY: {
    name:               'Estudio Cortisol Salival UDD 2026',
    institution:        'Universidad del Desarrollo, Santiago',
    researchers:        'Florencia Arrieta · Javiera Díaz',
    guide:              'T.M. Juan Pablo Alcaya',
    mentalHealthEmail:  'psicologia@udd.cl',
    mentalHealthPhone:  '600 600 6222 (interno 2500)',
    researcherEmail:    'florencia.arrieta@udd.cl',
  },

  // ─── MODELOS ─────────────────────────────────────────────────────
  // No tocar
  GROQ_MODEL:      'llama-3.3-70b-versatile',
  ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  MAX_TOKENS:      1200,

  // ─── LÍMITES DE CONVERSACIÓN ─────────────────────────────────────
  MAX_HISTORY_MESSAGES: 40,
};

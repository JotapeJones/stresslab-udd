/**
 * mindfulness.js — Sesión de meditación mindfulness guiada por voz
 *
 * Usa la Web Speech API (SpeechSynthesis) incorporada en el navegador.
 * Sin costo, sin API key, funciona en Chrome, Edge y Safari.
 * Mejor experiencia en Chrome con voces de Google en español.
 *
 * Estructura de la sesión (15 minutos total):
 *   Fase 1 — Anclaje en respiración   (3 min)
 *   Fase 2 — Escaneo corporal         (5 min)
 *   Fase 3 — Observación de pensamientos (5 min)
 *   Fase 4 — Retorno y apertura       (2 min)
 */

// ─── Guión completo de la sesión ────────────────────────────────
// Cada entrada: { text, pauseAfter (ms), phase }
// pauseAfter es el silencio DESPUÉS de terminar de hablar esa instrucción.

const MINDFULNESS_SCRIPT = [

  // ── FASE 1: Anclaje en respiración (aprox. 3 min) ─────────────
  {
    phase: 'Anclaje · Respiración',
    text: 'Bienvenida o bienvenido a tu sesión de mindfulness. Busca una posición cómoda, sentada o acostada. Cierra suavemente los ojos.',
    pauseAfter: 8000,
  },
  {
    phase: 'Anclaje · Respiración',
    text: 'Lleva tu atención a los puntos de contacto de tu cuerpo con la silla o la cama. Siente el peso de tu cuerpo apoyado.',
    pauseAfter: 10000,
  },
  {
    phase: 'Anclaje · Respiración',
    text: 'Ahora trae tu atención a la respiración. Sin modificarla, solo obsérvala. Nota cómo el aire entra por la nariz.',
    pauseAfter: 12000,
  },
  {
    phase: 'Anclaje · Respiración',
    text: 'Siente el leve frescor del aire al inhalar… y el leve calor al exhalar.',
    pauseAfter: 15000,
  },
  {
    phase: 'Anclaje · Respiración',
    text: 'Cada vez que la mente se aleje hacia pensamientos o preocupaciones, simplemente nota que se fue… y regresa suavemente a la respiración. Sin esfuerzo, sin juzgarte.',
    pauseAfter: 20000,
  },
  {
    phase: 'Anclaje · Respiración',
    text: 'Quédate unos momentos aquí, siguiendo el ritmo natural de tu respiración.',
    pauseAfter: 30000,
  },

  // ── FASE 2: Escaneo corporal (aprox. 5 min) ───────────────────
  {
    phase: 'Escaneo corporal',
    text: 'Ahora vamos a recorrer el cuerpo lentamente. Esto se llama escaneo corporal. No hay nada que cambiar, solo observar.',
    pauseAfter: 8000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Lleva tu atención a los pies. ¿Hay tensión? ¿Frío? ¿Hormigueo? Solo nota, sin hacer nada.',
    pauseAfter: 18000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Sube lentamente hacia las pantorrillas y las rodillas. Observa cualquier sensación que encuentres ahí.',
    pauseAfter: 18000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Lleva la atención a los muslos, las caderas y la zona lumbar. Si hay tensión, simplemente reconócela.',
    pauseAfter: 18000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Ahora el abdomen. ¿Está tenso o relajado? Nota cómo sube y baja suavemente con cada respiración.',
    pauseAfter: 18000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Sigue subiendo hacia el pecho, los hombros. Los hombros son donde acumulamos mucho estrés. Si puedes, déjalos caer un centímetro hacia abajo.',
    pauseAfter: 18000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Lleva la atención a los brazos, los codos, las manos, los dedos. Nota el peso de tus brazos.',
    pauseAfter: 15000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Y ahora el cuello, la mandíbula, la cara. La mandíbula suele estar apretada sin que nos demos cuenta. Deja que se suelte suavemente.',
    pauseAfter: 20000,
  },
  {
    phase: 'Escaneo corporal',
    text: 'Recorre ahora todo el cuerpo de una vez, como si lo vieras desde arriba. Nota dónde está tensa la energía y dónde está libre.',
    pauseAfter: 20000,
  },

  // ── FASE 3: Observación de pensamientos (aprox. 5 min) ────────
  {
    phase: 'Observación de pensamientos',
    text: 'Bien. Ahora vamos a cambiar el foco. En lugar del cuerpo, vamos a observar la mente.',
    pauseAfter: 8000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'Imagina que tu mente es el cielo. Los pensamientos son nubes que pasan. Tú no eres las nubes. Tú eres el cielo.',
    pauseAfter: 15000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'Cuando aparezca un pensamiento, no lo sigas. Solo nómbralo en voz baja para ti: "pensamiento". Y deja que pase.',
    pauseAfter: 20000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'Si aparece una preocupación por el certamen, por los ramos, por lo que sea, nómbrala: "preocupación". Y deja que pase.',
    pauseAfter: 25000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'No hay pensamientos buenos ni malos aquí. Todos son simplemente nubes que atraviesan el cielo.',
    pauseAfter: 25000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'Cada vez que notes que te enganchaste en un pensamiento y te fuiste con él, es el momento de mayor conciencia. Simplemente regresa al cielo.',
    pauseAfter: 25000,
  },
  {
    phase: 'Observación de pensamientos',
    text: 'Quédate en este espacio de observación. Cielo abierto. Pensamientos pasando. Tú, quieto y presente.',
    pauseAfter: 40000,
  },

  // ── FASE 4: Retorno y apertura (aprox. 2 min) ─────────────────
  {
    phase: 'Retorno y apertura',
    text: 'Estamos llegando al final de la sesión. Tómate un momento para reconocer que estuviste aquí, presente, para ti mismo.',
    pauseAfter: 10000,
  },
  {
    phase: 'Retorno y apertura',
    text: 'Lleva tu atención de vuelta a la respiración. Toma dos respiraciones más profundas y conscientes.',
    pauseAfter: 16000,
  },
  {
    phase: 'Retorno y apertura',
    text: 'Empieza a mover suavemente los dedos de las manos y de los pies. Mueve los hombros con suavidad.',
    pauseAfter: 12000,
  },
  {
    phase: 'Retorno y apertura',
    text: 'Cuando estés listo o lista, abre los ojos lentamente. No hay prisa.',
    pauseAfter: 10000,
  },
  {
    phase: 'Retorno y apertura',
    text: 'Has completado tu sesión de mindfulness. Tu sistema nervioso ha recibido una señal de calma. Llevas ese estado contigo el resto del día.',
    pauseAfter: 5000,
  },
];

// ─── Duración total del guión para barra de progreso ──────────────
const TOTAL_DURATION_MS = MINDFULNESS_SCRIPT.reduce((acc, step) => {
  // Estimación: 60 palabras por minuto = 1 palabra/seg → longitud texto en palabras
  const words   = step.text.split(' ').length;
  const speechMs = (words / 1.8) * 1000; // velocidad algo más lenta que normal
  return acc + speechMs + step.pauseAfter;
}, 0);

// ─── Clase principal ─────────────────────────────────────────────

class MindfulnessSession {
  constructor(onComplete) {
    this.onComplete    = onComplete;
    this.stepIndex     = 0;
    this.paused        = false;
    this.stopped       = false;
    this.voice         = null;
    this.utterance     = null;
    this.pauseTimeout  = null;
    this.elapsedMs     = 0;
    this.startTime     = null;
    this.progressInterval = null;

    // DOM
    this.overlay      = document.getElementById('mindfulness-overlay');
    this.instructionEl = document.getElementById('mindful-instruction');
    this.phaseEl      = document.getElementById('mindful-phase-label');
    this.progressEl   = document.getElementById('mindful-progress-fill');
    this.pauseBtn     = document.getElementById('mindful-pause-btn');
    this.exitBtn      = document.getElementById('mindful-exit-btn');
    this.warningEl    = document.getElementById('mindful-voice-warning');
  }

  // ─── Inicio ──────────────────────────────────────────────────
  start() {
    this._selectVoice();
    this._showOverlay();
    this._bindControls();
    this.startTime = Date.now();
    this._startProgressBar();
    this._runStep(0);
  }

  // ─── Selección de voz en español ─────────────────────────────
  _selectVoice() {
    const voices = window.speechSynthesis.getVoices();
    // Prioridad: voces Google en español → cualquier español → default
    const priorities = [
      v => v.name.includes('Google') && v.lang.startsWith('es'),
      v => v.lang.startsWith('es-CL'),
      v => v.lang.startsWith('es-419'),
      v => v.lang.startsWith('es'),
    ];
    for (const filter of priorities) {
      const match = voices.find(filter);
      if (match) { this.voice = match; break; }
    }
    if (!this.voice && this.warningEl) {
      this.warningEl.style.display = 'block';
      this.warningEl.textContent = '⚠ No se encontró voz en español. Se usará la voz predeterminada del sistema.';
    }
  }

  // ─── Overlay ─────────────────────────────────────────────────
  _showOverlay() {
    this.overlay.classList.add('visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.overlay.classList.add('opaque');
      });
    });
  }

  _hideOverlay() {
    this.overlay.classList.remove('opaque');
    setTimeout(() => {
      this.overlay.classList.remove('visible');
    }, 900);
  }

  // ─── Controles ───────────────────────────────────────────────
  _bindControls() {
    this.pauseBtn.addEventListener('click', () => this._togglePause());
    this.exitBtn.addEventListener('click',  () => this.stop(false));
  }

  _togglePause() {
    if (this.paused) {
      this.paused = false;
      this.pauseBtn.textContent = 'Pausar';
      window.speechSynthesis.resume();
      // Si estábamos en la pausa entre instrucciones, reanudar paso actual
      if (!window.speechSynthesis.speaking) {
        this._runStep(this.stepIndex);
      }
    } else {
      this.paused = true;
      this.pauseBtn.textContent = 'Reanudar';
      window.speechSynthesis.pause();
      if (this.pauseTimeout) {
        clearTimeout(this.pauseTimeout);
        this.pauseTimeout = null;
      }
    }
  }

  // ─── Ejecución del guión ─────────────────────────────────────
  _runStep(index) {
    if (this.stopped || index >= MINDFULNESS_SCRIPT.length) {
      this._finish(index >= MINDFULNESS_SCRIPT.length);
      return;
    }

    if (this.paused) return; // el usuario pausó, esperar

    const step = MINDFULNESS_SCRIPT[index];
    this.stepIndex = index;

    // Actualizar UI
    this._setInstruction(step.text);
    if (this.phaseEl) this.phaseEl.textContent = step.phase;

    // Crear utterance
    const utter = new SpeechSynthesisUtterance(step.text);
    utter.lang  = 'es-CL';
    utter.rate  = 0.88;   // algo más lento de lo normal, tono meditativo
    utter.pitch = 0.95;
    utter.volume = 1.0;
    if (this.voice) utter.voice = this.voice;

    utter.onend = () => {
      if (this.stopped || this.paused) return;
      // Pausa de silencio antes del próximo paso
      this.pauseTimeout = setTimeout(() => {
        this._runStep(index + 1);
      }, step.pauseAfter);
    };

    utter.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e.error);
      // Si hay error, igualmente avanzar al siguiente paso
      if (!this.stopped) {
        this.pauseTimeout = setTimeout(() => {
          this._runStep(index + 1);
        }, step.pauseAfter);
      }
    };

    this.utterance = utter;
    window.speechSynthesis.cancel(); // limpiar cualquier cola previa
    window.speechSynthesis.speak(utter);
  }

  // ─── Instrucción con fade ─────────────────────────────────────
  _setInstruction(text) {
    if (!this.instructionEl) return;
    this.instructionEl.classList.add('fading');
    setTimeout(() => {
      this.instructionEl.textContent = text;
      this.instructionEl.classList.remove('fading');
    }, 600);
  }

  // ─── Barra de progreso ───────────────────────────────────────
  _startProgressBar() {
    this.progressInterval = setInterval(() => {
      if (this.paused || this.stopped) return;
      const elapsed = Date.now() - this.startTime;
      const pct = Math.min((elapsed / TOTAL_DURATION_MS) * 100, 100);
      if (this.progressEl) this.progressEl.style.width = pct + '%';
    }, 1000);
  }

  // ─── Finalización ────────────────────────────────────────────
  _finish(completed) {
    this.stopped = true;
    window.speechSynthesis.cancel();
    if (this.pauseTimeout)     clearTimeout(this.pauseTimeout);
    if (this.progressInterval) clearInterval(this.progressInterval);
    if (this.progressEl && completed) this.progressEl.style.width = '100%';

    setTimeout(() => {
      this._hideOverlay();
      if (this.onComplete) this.onComplete(completed);
    }, 1500);
  }

  // Detener manualmente (llamado por el botón "Detener sesión")
  stop(completed = false) {
    this._finish(completed);
  }
}

// ─── Instancia activa ────────────────────────────────────────────
let activeMindfulnessSession = null;

// ─── Escuchar evento de inicio de sesión ─────────────────────────
// El evento 'session_started' lo dispara db.js cuando Claude emite
// el bloque [DATA:{"type":"session_start","technique":"mindfulness"}]

window.addEventListener('mindfulness_ready', (e) => {

  // Las voces pueden no estar cargadas aún en algunos navegadores
  const launchSession = () => {
    // Esperar 4 segundos para que Claude termine de dar instrucciones iniciales
    setTimeout(() => {
      activeMindfulnessSession = new MindfulnessSession((completed) => {
        activeMindfulnessSession = null;

        // Mostrar aviso en el chat para que el participante continúe
        const hint = document.getElementById('mindfulness-done-hint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { hint.style.display = 'none'; }, 10000);
        }

        console.log(completed
          ? '✅ Sesión de mindfulness completada.'
          : '⏸ Sesión de mindfulness detenida antes de completar.');
      });

      activeMindfulnessSession.start();
    }, 4000);
  };

  // Garantizar que las voces estén disponibles
  if (window.speechSynthesis.getVoices().length > 0) {
    launchSession();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      launchSession();
    };
  }
});

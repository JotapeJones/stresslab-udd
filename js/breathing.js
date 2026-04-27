/**
 * breathing.js — Controlador de la animación de respiración guiada
 * Implementa el protocolo de respiración lenta diafragmática (5s/5s)
 */

class BreathingSession {
  constructor(options = {}) {
    this.inhaleMs    = (options.inhaleSeconds || 5) * 1000;
    this.exhaleMs    = (options.exhaleSeconds || 5) * 1000;
    this.totalMs     = (options.totalMinutes || 10) * 60 * 1000;
    this.onComplete  = options.onComplete  || (() => {});
    this.onPhase     = options.onPhase     || (() => {});

    // Estado interno
    this.startTime   = null;
    this.phase       = 'idle';
    this.rafId       = null;
    this.running     = false;

    // Elementos DOM
    this.overlay     = document.getElementById('breathing-overlay');
    this.sphere      = document.getElementById('breath-sphere');
    this.phaseLabel  = document.getElementById('breath-phase-label');
    this.timerLabel  = document.getElementById('breath-timer-label');
    this.progressBar = document.getElementById('breath-progress-fill');
    this.cycleLabel  = document.getElementById('breath-cycle-label');
    this.exitBtn     = document.getElementById('breath-exit-btn');

    // Botón para salir anticipadamente
    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => {
        this.stop(false);
      });
    }
  }

  start() {
    this.running   = true;
    this.startTime = performance.now();
    this.setPhase('inhale');
    this.show();
    this.tick(this.startTime);
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.add('visible');
      // Pequeño delay para que la transición CSS se active
      requestAnimationFrame(() => {
        if (this.overlay) this.overlay.classList.add('opaque');
      });
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('opaque');
      setTimeout(() => {
        if (this.overlay) this.overlay.classList.remove('visible');
      }, 600);
    }
  }

  setPhase(phase) {
    this.phase = phase;
    this.onPhase(phase);

    if (!this.sphere || !this.phaseLabel) return;

    if (phase === 'inhale') {
      this.phaseLabel.textContent = 'Inhala';
      this.phaseLabel.style.color = 'rgba(200, 240, 220, 1)';
      this.sphere.style.transition = `transform ${this.inhaleMs}ms cubic-bezier(0.33, 0, 0.66, 1)`;
      this.sphere.style.transform   = 'scale(1.3)';
    } else {
      this.phaseLabel.textContent = 'Exhala';
      this.phaseLabel.style.color = 'rgba(160, 210, 200, 1)';
      this.sphere.style.transition = `transform ${this.exhaleMs}ms cubic-bezier(0.33, 0, 0.66, 1)`;
      this.sphere.style.transform   = 'scale(0.72)';
    }
  }

  tick(now) {
    if (!this.running) return;

    const elapsed   = now - this.startTime;
    const remaining = Math.max(0, this.totalMs - elapsed);
    const cycleMs   = this.inhaleMs + this.exhaleMs;
    const cyclePos  = elapsed % cycleMs;

    // Actualizar fase
    const shouldBeInhale = cyclePos < this.inhaleMs;
    if (shouldBeInhale && this.phase !== 'inhale') {
      this.setPhase('inhale');
    } else if (!shouldBeInhale && this.phase !== 'exhale') {
      this.setPhase('exhale');
    }

    // Actualizar cuenta atrás
    if (this.timerLabel) {
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      this.timerLabel.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Actualizar barra de progreso
    if (this.progressBar) {
      const pct = Math.min(100, (elapsed / this.totalMs) * 100);
      this.progressBar.style.width = pct + '%';
    }

    // Actualizar contador de ciclos
    if (this.cycleLabel) {
      const cyclesDone = Math.floor(elapsed / cycleMs) + 1;
      const totalCycles = Math.ceil(this.totalMs / cycleMs);
      this.cycleLabel.textContent = `Ciclo ${cyclesDone} / ${totalCycles}`;
    }

    if (elapsed >= this.totalMs) {
      this.stop(true);
      return;
    }

    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  stop(completed = true) {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.hide();
    setTimeout(() => {
      this.onComplete(completed);
    }, 650);
  }
}

// ─── Integración con el chat ──────────────────────────────────────

let activeBreathingSession = null;

/**
 * Inicia la sesión de respiración cuando Claude lo activa
 * La animación dura 10 minutos y luego vuelve al chat
 */
function startBreathingAnimation(onComplete) {
  if (activeBreathingSession) return;

  activeBreathingSession = new BreathingSession({
    inhaleSeconds: 5,
    exhaleSeconds: 5,
    totalMinutes: 10,
    onComplete: (completed) => {
      activeBreathingSession = null;
      if (onComplete) onComplete(completed);
    }
  });

  activeBreathingSession.start();
}

function stopBreathingAnimation() {
  if (activeBreathingSession) {
    activeBreathingSession.stop(false);
    activeBreathingSession = null;
  }
}

// Escuchar el evento de inicio de sesión de respiración
window.addEventListener('breathing_ready', (e) => {
  {
    // Esperar 3 segundos para que Claude termine de dar instrucciones
    setTimeout(() => {
      startBreathingAnimation((completed) => {
        // Al terminar la animación, notificar al chat
        const msg = completed
          ? '✅ Animación completada. La sesión de respiración ha terminado.'
          : '⏸ Has pausado la animación de respiración.';
        console.log(msg);
        // Trigger para que el usuario continúe la conversación
        const hint = document.getElementById('breathing-done-hint');
        if (hint) {
          hint.style.display = 'block';
          setTimeout(() => { hint.style.display = 'none'; }, 8000);
        }
      });
    }, 3000);
  }
});

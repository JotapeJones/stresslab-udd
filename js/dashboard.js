/**
 * dashboard.js — Panel del investigador
 * Visualización de datos de todos los participantes + exportación CSV
 */

// ─── Estado ──────────────────────────────────────────────────────

const DashState = {
  participants: [],
  selectedCode: null,
  chart: null,
};

// ─── Inicialización ───────────────────────────────────────────────

async function initDashboard() {
  // Verificar autenticación
  const authed = sessionStorage.getItem('researcher_authed');
  if (!authed) {
    window.location.href = 'index.html?mode=researcher';
    return;
  }

  showDashboardLoading(true);
  try {
    await loadAllData();
    renderOverviewCards();
    renderParticipantTable();
    if (DashState.participants.length > 0) {
      selectParticipant(DashState.participants[0].code);
    }
  } catch (err) {
    console.error('Error cargando dashboard:', err);
    showDashError('Error al cargar los datos. Verifica la configuración de Firebase.');
  } finally {
    showDashboardLoading(false);
  }
}

async function loadAllData() {
  DashState.participants = await getAllParticipants();
  // Ordenar por código
  DashState.participants.sort((a, b) => a.code.localeCompare(b.code));
}

// ─── Tarjetas de resumen ─────────────────────────────────────────

function renderOverviewCards() {
  const ps = DashState.participants;

  const totalActive   = ps.filter(p => p.state === 'active').length;
  const totalClosed   = ps.filter(p => p.state === 'closed').length;
  const totalSessions = ps.reduce((acc, p) => {
    return acc + Object.values(p.sessions || {}).filter(s => s.completed).length;
  }, 0);

  // Calcular adherencia global
  const adherenceValues = ps.map(p => {
    const done     = Object.values(p.sessions || {}).filter(s => s.completed).length;
    const planned  = (p.sessionsPerWeek || 3) * (p.interventionWeeks || 3);
    return planned > 0 ? (done / planned) * 100 : 0;
  }).filter(v => v > 0);

  const avgAdherence = adherenceValues.length
    ? (adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length).toFixed(0)
    : '—';

  setCardValue('card-active', totalActive);
  setCardValue('card-closed', totalClosed);
  setCardValue('card-sessions', totalSessions);
  setCardValue('card-adherence', avgAdherence !== '—' ? avgAdherence + '%' : '—');
}

function setCardValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ─── Tabla de participantes ───────────────────────────────────────

function renderParticipantTable() {
  const tbody = document.getElementById('participants-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  for (const p of DashState.participants) {
    const sessions  = Object.values(p.sessions || {});
    const completed = sessions.filter(s => s.completed).length;
    const planned   = (p.sessionsPerWeek || 3) * (p.interventionWeeks || 3);
    const adherence = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    const techniqueMap = { respiracion: 'Resp', mindfulness: 'Mind', actividad: 'Act' };
    const techniquesStr = (p.techniques || []).map(t => techniqueMap[t] || t).join('+') || '—';

    const stateColors = {
      new: '#F59E0B',
      active: '#10B981',
      closing: '#6366F1',
      closed: '#6B7280',
    };
    const stateLabels = {
      new: 'Pendiente',
      active: 'Activo',
      closing: 'Cierre',
      closed: 'Completo',
    };

    const tr = document.createElement('tr');
    tr.className = DashState.selectedCode === p.code ? 'selected' : '';
    tr.innerHTML = `
      <td><strong>${p.code}</strong></td>
      <td>${p.nickname || '—'}</td>
      <td>
        <span class="badge" style="background:${stateColors[p.state] || '#999'}20;color:${stateColors[p.state] || '#999'};border:1px solid ${stateColors[p.state] || '#999'}40">
          ${stateLabels[p.state] || p.state}
        </span>
      </td>
      <td>${techniquesStr}</td>
      <td>${completed} / ${planned}</td>
      <td>
        <div class="adherence-bar-container">
          <div class="adherence-bar" style="width:${adherence}%;background:${adherence >= 70 ? '#10B981' : adherence >= 40 ? '#F59E0B' : '#EF4444'}"></div>
          <span>${adherence}%</span>
        </div>
      </td>
      <td>
        <button class="btn-view" onclick="selectParticipant('${p.code}')">Ver detalle</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// ─── Detalle de participante ─────────────────────────────────────

function selectParticipant(code) {
  DashState.selectedCode = code;
  renderParticipantTable(); // Re-render para marcar seleccionado

  const p = DashState.participants.find(x => x.code === code);
  if (!p) return;

  renderParticipantDetail(p);
  renderBienestarChart(p);
  renderSessionsTable(p);
  renderClosingQuestionnaire(p);

  // Scroll al detalle
  document.getElementById('participant-detail')?.scrollIntoView({ behavior: 'smooth' });
}

function renderParticipantDetail(p) {
  const container = document.getElementById('participant-detail');
  if (!container) return;
  container.style.display = 'block';

  const title = document.getElementById('detail-title');
  if (title) title.textContent = `${p.code} — ${p.nickname || 'Sin apodo'}`;

  const sessions  = Object.values(p.sessions || {});
  const completed = sessions.filter(s => s.completed);
  const planned   = (p.sessionsPerWeek || 3) * (p.interventionWeeks || 3);

  const infoEl = document.getElementById('detail-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span>Código</span><strong>${p.code}</strong></div>
        <div class="detail-item"><span>Apodo</span><strong>${p.nickname || '—'}</strong></div>
        <div class="detail-item"><span>Email</span><strong>${p.email || '—'}</strong></div>
        <div class="detail-item"><span>Estado</span><strong>${p.state}</strong></div>
        <div class="detail-item"><span>Técnicas</span><strong>${(p.techniques || []).join(', ') || '—'}</strong></div>
        <div class="detail-item"><span>Sesiones/sem</span><strong>${p.sessionsPerWeek || '—'}</strong></div>
        <div class="detail-item"><span>Semanas</span><strong>${p.interventionWeeks || '—'}</strong></div>
        <div class="detail-item"><span>Sesiones completas</span><strong>${completed.length} / ${planned}</strong></div>
        <div class="detail-item"><span>Recordatorio</span><strong>${p.reminderHour || '—'}:${(p.reminderMinute || '00').padStart(2,'0')}</strong></div>
        <div class="detail-item"><span>Onboarding</span><strong>${p.onboardedAt ? new Date(p.onboardedAt).toLocaleDateString('es-CL') : 'Pendiente'}</strong></div>
      </div>
    `;
  }
}

function renderBienestarChart(p) {
  const ctx = document.getElementById('bienestar-chart');
  if (!ctx) return;

  const sessions = Object.values(p.sessions || {})
    .filter(s => s.completed && s.preCheckin && s.postCheckin)
    .sort((a, b) => new Date(a.startedAt || 0) - new Date(b.startedAt || 0));

  if (sessions.length === 0) {
    ctx.parentElement.innerHTML = '<p class="no-data">Sin sesiones completas aún</p>';
    return;
  }

  const labels   = sessions.map((s, i) => `Sesión ${i+1}`);
  const preStress  = sessions.map(s => s.preCheckin.stress);
  const postStress = sessions.map(s => s.postCheckin.stress);
  const preMood    = sessions.map(s => s.preCheckin.mood);
  const postMood   = sessions.map(s => s.postCheckin.mood);

  if (DashState.chart) DashState.chart.destroy();

  DashState.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Estrés PRE',
          data: preStress,
          borderColor: '#EF4444',
          backgroundColor: '#EF444420',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Estrés POST',
          data: postStress,
          borderColor: '#10B981',
          backgroundColor: '#10B98120',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Ánimo PRE',
          data: preMood,
          borderColor: '#F59E0B',
          backgroundColor: '#F59E0B20',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Ánimo POST',
          data: postMood,
          borderColor: '#6366F1',
          backgroundColor: '#6366F120',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Evolución de bienestar subjetivo (0-10)' }
      },
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderSessionsTable(p) {
  const tbody = document.getElementById('sessions-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const sessions = Object.values(p.sessions || {})
    .sort((a, b) => new Date(a.startedAt || 0) - new Date(b.startedAt || 0));

  for (const s of sessions) {
    const date     = s.startedAt ? new Date(s.startedAt).toLocaleDateString('es-CL') : '—';
    const preStr   = s.preCheckin  ? `E:${s.preCheckin.stress} En:${s.preCheckin.energy} Á:${s.preCheckin.mood}` : '—';
    const postStr  = s.postCheckin ? `E:${s.postCheckin.stress} En:${s.postCheckin.energy} Á:${s.postCheckin.mood}` : '—';
    const statusIcon = s.completed ? '✅' : (s.missedReason ? `❌ ${s.missedReason}` : '⏳');

    const stressDelta = (s.preCheckin && s.postCheckin)
      ? (s.preCheckin.stress - s.postCheckin.stress)
      : null;
    const deltaStr = stressDelta !== null
      ? `<span style="color:${stressDelta > 0 ? '#10B981' : stressDelta < 0 ? '#EF4444' : '#999'}">
           ${stressDelta > 0 ? '▼' : stressDelta < 0 ? '▲' : '—'} ${Math.abs(stressDelta)}
         </span>`
      : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date}</td>
      <td>${s.technique || '—'}</td>
      <td>${preStr}</td>
      <td>${postStr}</td>
      <td>${deltaStr}</td>
      <td>${statusIcon}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderClosingQuestionnaire(p) {
  const container = document.getElementById('closing-data');
  if (!container) return;

  if (!p.closingQuestionnaire) {
    container.innerHTML = '<p class="no-data">Cuestionario de cierre pendiente</p>';
    return;
  }

  const q = p.closingQuestionnaire;
  container.innerHTML = `
    <div class="closing-grid">
      <div><span>Estrés al inicio</span><strong>${q.stressStart}/10</strong></div>
      <div><span>Estrés al cierre</span><strong>${q.stressEnd}/10</strong></div>
      <div><span>Cambio</span><strong style="color:${q.stressStart > q.stressEnd ? '#10B981' : '#EF4444'}">
        ${q.stressStart > q.stressEnd ? '▼ Bajó ' + (q.stressStart - q.stressEnd) + ' pts' : '▲ Subió ' + (q.stressEnd - q.stressStart) + ' pts'}
      </strong></div>
      <div><span>¿Fue útil?</span><strong>${q.useful}</strong></div>
      <div><span>¿Continuará?</span><strong>${q.continueAfter}</strong></div>
    </div>
    ${q.comment ? `<div class="closing-comment"><strong>Comentario:</strong> "${q.comment}"</div>` : ''}
  `;
}

// ─── Exportación CSV ──────────────────────────────────────────────

function exportToCSV() {
  const rows = [];
  const headers = [
    'Código', 'Apodo', 'Estado', 'Técnicas', 'Ses/semana', 'Semanas',
    'Sesiones completadas', 'Sesiones planificadas', 'Adherencia%',
    'Estrés PRE promedio', 'Estrés POST promedio', 'Ánimo PRE promedio', 'Ánimo POST promedio',
    'Cierre - Estrés inicio', 'Cierre - Estrés fin', 'Cierre - Útil', 'Cierre - Continúa',
    'Cierre - Comentario'
  ];
  rows.push(headers);

  for (const p of DashState.participants) {
    const sessions   = Object.values(p.sessions || {});
    const completed  = sessions.filter(s => s.completed);
    const planned    = (p.sessionsPerWeek || 3) * (p.interventionWeeks || 3);
    const adherence  = planned > 0 ? Math.round((completed.length / planned) * 100) : 0;

    const withCheckins = completed.filter(s => s.preCheckin && s.postCheckin);
    const avg = (field, phase) => withCheckins.length
      ? (withCheckins.reduce((a, s) => a + s[phase][field], 0) / withCheckins.length).toFixed(2)
      : '';

    const cq = p.closingQuestionnaire;

    rows.push([
      p.code,
      p.nickname || '',
      p.state,
      (p.techniques || []).join(';'),
      p.sessionsPerWeek || '',
      p.interventionWeeks || '',
      completed.length,
      planned,
      adherence,
      avg('stress', 'preCheckin'),
      avg('stress', 'postCheckin'),
      avg('mood', 'preCheckin'),
      avg('mood', 'postCheckin'),
      cq?.stressStart ?? '',
      cq?.stressEnd   ?? '',
      cq?.useful      ?? '',
      cq?.continueAfter ?? '',
      cq?.comment     || '',
    ]);
  }

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `stresslab_udd_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSessionsCSV() {
  const rows = [['Código', 'Sesión', 'Fecha', 'Técnica', 'Estrés PRE', 'Energía PRE', 'Ánimo PRE',
    'Estrés POST', 'Energía POST', 'Ánimo POST', 'Delta Estrés', 'Completada', 'Motivo no completada']];

  for (const p of DashState.participants) {
    const sessions = Object.values(p.sessions || {})
      .sort((a, b) => new Date(a.startedAt || 0) - new Date(b.startedAt || 0));

    sessions.forEach((s, i) => {
      const delta = (s.preCheckin && s.postCheckin)
        ? s.preCheckin.stress - s.postCheckin.stress
        : '';
      rows.push([
        p.code, i+1,
        s.startedAt ? new Date(s.startedAt).toLocaleDateString('es-CL') : '',
        s.technique || '',
        s.preCheckin?.stress ?? '', s.preCheckin?.energy ?? '', s.preCheckin?.mood ?? '',
        s.postCheckin?.stress ?? '', s.postCheckin?.energy ?? '', s.postCheckin?.mood ?? '',
        delta,
        s.completed ? 'SI' : 'NO',
        s.missedReason || '',
      ]);
    });
  }

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `stresslab_sesiones_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── UI helpers ───────────────────────────────────────────────────

function showDashboardLoading(show) {
  const el = document.getElementById('dash-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showDashError(msg) {
  const el = document.getElementById('dash-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function refreshDashboard() {
  showDashboardLoading(true);
  try {
    await loadAllData();
    renderOverviewCards();
    renderParticipantTable();
    if (DashState.selectedCode) selectParticipant(DashState.selectedCode);
  } finally {
    showDashboardLoading(false);
  }
}

async function sendWeeklySummaryToAll() {
  const btn = document.getElementById('btn-send-summaries');
  if (btn) btn.disabled = true;

  let sent = 0;
  for (const p of DashState.participants) {
    if (p.state === 'active' && p.email) {
      const ok = await sendWeeklySummary(p);
      if (ok) sent++;
    }
  }

  alert(`Resúmenes semanales enviados: ${sent} de ${DashState.participants.filter(p => p.state === 'active' && p.email).length}`);
  if (btn) btn.disabled = false;
}

// ─── Inicialización ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  initDashboard();

  document.getElementById('btn-export-csv')?.addEventListener('click', exportToCSV);
  document.getElementById('btn-export-sessions')?.addEventListener('click', exportSessionsCSV);
  document.getElementById('btn-refresh')?.addEventListener('click', refreshDashboard);
  document.getElementById('btn-send-summaries')?.addEventListener('click', sendWeeklySummaryToAll);
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('researcher_authed');
    window.location.href = 'index.html';
  });
});

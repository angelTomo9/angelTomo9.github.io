// Estado inicial y recuperación de LocalStorage
let currentPoints = parseInt(localStorage.getItem('angel_xp')) || 50;
let streakDays = parseInt(localStorage.getItem('angel_streak')) || 3;

function switchTab(tabId) {
  // Quitar active de todos los botones y paneles
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  // Activar el seleccionado
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');

  // Activar el botón correspondiente
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
}

const levels = [
  { min: 0, max: 50, name: "Nivel 1: Aspirante a Ingeniero Informático" },
  { min: 51, max: 120, name: "Nivel 2: Arquitecto de Algoritmos" },
  { min: 121, max: 220, name: "Nivel 3: Maestro de la Lógica & PAU" },
  { min: 221, max: 400, name: "Nivel 4: Candidato a Matrícula de Honor" },
  { min: 401, max: 1000, name: "Nivel 5: Élite de Bachillerato (10.0)" }
];

function updateUI() {
  const pointsEl = document.getElementById('totalPoints');
  const streakEl = document.getElementById('streakDays');
  const levelEl = document.getElementById('currentLevel');
  const barEl = document.getElementById('xpProgressBar');

  if (pointsEl) pointsEl.innerHTML = `${currentPoints} <span class="unit">XP</span>`;
  if (streakEl) streakEl.innerHTML = `🔥 ${streakDays} <span class="unit">DÍAS</span>`;

  // Calcular nivel actual
  const currentLvlObj = levels.find(l => currentPoints >= l.min && currentPoints <= l.max) || levels[0];
  if (levelEl) levelEl.textContent = currentLvlObj.name;

  // Barra de progreso
  const range = currentLvlObj.max - currentLvlObj.min;
  const progressInLvl = currentPoints - currentLvlObj.min;
  const pct = Math.min(Math.max((progressInLvl / range) * 100, 5), 100);
  if (barEl) barEl.style.width = `${pct}%`;

  localStorage.setItem('angel_xp', currentPoints);
  localStorage.setItem('angel_streak', streakDays);
  renderAuditLog();
}

function logEvent(actionName, xpValue) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let logs = JSON.parse(localStorage.getItem('angel_audit_logs')) || [];
  logs.unshift({ time: timeStr, action: actionName, xp: xpValue });

  if (logs.length > 25) logs.pop(); // Mantener los últimos 25 eventos

  localStorage.setItem('angel_audit_logs', JSON.stringify(logs));

  if (xpValue > 0) {
    currentPoints += xpValue;
    showToast(`Registrado [${timeStr}]: ${actionName} (+${xpValue} XP)`);
  } else {
    showToast(`Registrado [${timeStr}]: ${actionName}`);
  }

  updateUI();
}

function renderAuditLog() {
  const listEl = document.getElementById('auditLogList');
  if (!listEl) return;

  const logs = JSON.parse(localStorage.getItem('angel_audit_logs')) || [
    { time: "16:25:00", action: "Inicio de tarde y arranque de Reto 1", xp: 0 },
    { time: "19:24:00", action: "Test Pág. 27 Lengua superado con 10/10", xp: 15 },
    { time: "19:30:00", action: "Salida al gimnasio (entrenamiento de fuerza)", xp: 15 }
  ];

  listEl.innerHTML = logs.map(l => `
    <li class="audit-log-entry">
      <span class="timestamp">[${l.time}]</span>
      <span class="action">${l.action}</span>
      ${l.xp > 0 ? `<strong style="color: var(--accent-green); margin-left:auto;">+${l.xp} XP</strong>` : ''}
    </li>
  `).join('');
}

function toggleTask(checkboxId, taskId, xpValue) {
  const checkbox = document.getElementById(checkboxId);
  const item = document.getElementById(taskId);

  if (checkbox && item) {
    if (checkbox.checked) {
      item.classList.remove('pending');
      item.classList.add('done');
      currentPoints += xpValue;
      showToast(`¡Bien hecho Ángel! +${xpValue} XP conseguidos.`);
    } else {
      item.classList.remove('done');
      item.classList.add('pending');
      currentPoints -= xpValue;
      showToast(`Tarea desmarcada. -${xpValue} XP.`);
    }
    updateUI();
  }
}

function checkAllDailyDone() {
  const pendingTasks = [
    { cb: 'check-tec', id: 'mission-tec', xp: 10 },
    { cb: 'check-gym', id: 'mission-gym', xp: 15 },
    { cb: 'check-calc', id: 'mission-calc', xp: 5 }
  ];

  let added = 0;
  pendingTasks.forEach(t => {
    const el = document.getElementById(t.cb);
    if (el && !el.checked) {
      el.checked = true;
      const row = document.getElementById(t.id);
      if (row) {
        row.classList.remove('pending');
        row.classList.add('done');
      }
      currentPoints += t.xp;
      added += t.xp;
    }
  });

  if (added > 0) {
    showToast(`¡Tarde completada al 100%! +${added} XP sumados.`);
  } else {
    showToast("Todas las tareas de hoy ya estaban completadas.");
  }
  updateUI();
}

function showToast(msg) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = '#22c55e';
    toast.style.color = '#052e16';
    toast.style.padding = '14px 24px';
    toast.style.borderRadius = '10px';
    toast.style.fontWeight = '800';
    toast.style.fontSize = '0.95rem';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'all 0.3s ease';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2800);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
});

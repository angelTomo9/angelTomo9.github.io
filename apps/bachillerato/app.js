// Centro de Mando 1º Bachillerato — app.js (v5.0 Full Task System)

// 1. GESTIÓN DE PUNTOS Y RACHA
let currentPoints = parseInt(localStorage.getItem('angel_xp')) || 50;
let streakDays = parseInt(localStorage.getItem('angel_streak')) || 3;
let currentFilter = 'all';

const levels = [
  { min: 0, max: 50, name: "Nivel 1: Aspirante a Ingeniero Informático" },
  { min: 51, max: 120, name: "Nivel 2: Arquitecto de Algoritmos" },
  { min: 121, max: 220, name: "Nivel 3: Maestro de la Lógica & PAU" },
  { min: 221, max: 400, name: "Nivel 4: Candidato a Matrícula de Honor" },
  { min: 401, max: 1000, name: "Nivel 5: Élite de Bachillerato (10.0)" }
];

// 2. ESTADO PREDETERMINADO DE TAREAS
const defaultTasks = {
  'task-agenda': { title: 'Auditoría de Agenda (100% materias)', xp: 20, completed: true, group: 'today' },
  'task-ingles-p8': { title: 'Inglés EOI: Pág. 8 ejercicios 2, 3, 4 y 5', xp: 15, completed: false, group: 'today' },
  'task-filo-p16': { title: 'Filosofía: Págs. 16 a 19 (Lectura y presocráticos)', xp: 15, completed: false, group: 'today' },
  'task-lengua-hojas': { title: 'Lengua Castellana: Hojas del dossier', xp: 10, completed: false, group: 'today' },
  'task-gym': { title: 'Gimnasio: Sesión 3 de fuerza (18:30 - 20:00)', xp: 15, completed: false, group: 'today' },
  
  'task-cae-dest': { title: 'Inglés CAE (Ana): Destination Págs. 18 y 19', xp: 15, completed: false, group: 'extra' },
  'task-cae-boost': { title: 'Inglés CAE (Ana): Booster Págs. 36 y 37 (Reading)', xp: 15, completed: false, group: 'extra' },
  'task-galeria': { title: 'Personal: Limpiar y organizar galería del móvil', xp: 10, completed: false, group: 'extra' },
  'task-cena': { title: 'Personal: Cena en familia sin pantallas (21:40)', xp: 10, completed: false, group: 'extra' },
  
  'task-fisica-p56': { title: 'Física y Química (Editex): Pág. 56 nº 2', xp: 10, completed: false, group: 'weekend' },
  'task-fisica-teams': { title: 'Física y Química: Hoja Teams nº 1', xp: 10, completed: false, group: 'weekend' },
  'task-tec-14': { title: 'Tecnología (Donostiarra): Ejercicios 1 al 14', xp: 15, completed: false, group: 'weekend' },
  'task-filo-sofia': { title: 'Filosofía: Lectura "El mundo de Sofía"', xp: 10, completed: false, group: 'weekend' },

  'task-tic-apa7': { title: 'TIC: Memoria Word C.A. River Ebro (APA 7)', xp: 25, completed: true, group: 'projects' }
};

let tasksState = {};

function initTasks() {
  const saved = localStorage.getItem('angel_tasks_v5');
  if (saved) {
    try {
      tasksState = JSON.parse(saved);
      // Asegurar que todas las defaultTasks existan
      Object.keys(defaultTasks).forEach(id => {
        if (!tasksState[id]) {
          tasksState[id] = defaultTasks[id];
        }
      });
    } catch (e) {
      tasksState = JSON.parse(JSON.stringify(defaultTasks));
    }
  } else {
    tasksState = JSON.parse(JSON.stringify(defaultTasks));
  }
  saveTasks();
}

function saveTasks() {
  localStorage.setItem('angel_tasks_v5', JSON.stringify(tasksState));
}

// 3. ALTERNAR TAREA (CLICK EN CUALQUIER PARTE DE LA TARJETA)
function toggleTask(taskId) {
  if (!tasksState[taskId]) return;

  const isNowCompleted = !tasksState[taskId].completed;
  tasksState[taskId].completed = isNowCompleted;
  saveTasks();

  const xp = tasksState[taskId].xp || 10;
  const title = tasksState[taskId].title;

  if (isNowCompleted) {
    currentPoints += xp;
    playCompletionChime();
    showToast(`🎉 ¡Completada: ${title}! (+${xp} XP)`);
    logEvent(`✅ Tarea terminada: ${title}`, xp);
  } else {
    currentPoints = Math.max(0, currentPoints - xp);
    showToast(`Tarea desmarcada: ${title} (-${xp} XP)`);
  }

  updateTaskDOM(taskId);
  updateUI();
  updateProgressBars();
}

function updateTaskDOM(taskId) {
  const card = document.getElementById(taskId);
  if (!card) return;

  const isDone = tasksState[taskId].completed;
  const checkbox = card.querySelector('.custom-checkbox');
  const badge = card.querySelector('.status-tag');

  if (isDone) {
    card.classList.add('is-completed');
    if (checkbox) checkbox.classList.add('checked');
    if (badge) {
      badge.textContent = '✓ COMPLETADA';
      badge.className = 'status-tag tag-done';
    }
  } else {
    card.classList.remove('is-completed');
    if (checkbox) checkbox.classList.remove('checked');
    if (badge) {
      badge.textContent = '⏳ PENDIENTE';
      badge.className = 'status-tag tag-pending';
    }
  }

  applyFilterVisibility(card, isDone);
}

function applyFilterVisibility(card, isDone) {
  if (currentFilter === 'all') {
    card.style.display = 'flex';
  } else if (currentFilter === 'pending') {
    card.style.display = isDone ? 'none' : 'flex';
  } else if (currentFilter === 'completed') {
    card.style.display = isDone ? 'flex' : 'none';
  }
}

// 4. FILTRAR TAREAS (TODAS / PENDIENTES / COMPLETADAS)
function setFilter(filterType) {
  currentFilter = filterType;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active');
    }
  });

  Object.keys(tasksState).forEach(id => {
    const card = document.getElementById(id);
    if (card) {
      applyFilterVisibility(card, tasksState[id].completed);
    }
  });
}

// 5. MARCAR BLOQUE COMPLETO
function markGroupDone(groupName) {
  let addedXP = 0;
  let count = 0;

  Object.keys(tasksState).forEach(id => {
    if (tasksState[id].group === groupName && !tasksState[id].completed) {
      tasksState[id].completed = true;
      addedXP += tasksState[id].xp;
      count++;
      updateTaskDOM(id);
    }
  });

  if (count > 0) {
    currentPoints += addedXP;
    playCompletionChime();
    saveTasks();
    showToast(`🌟 ¡${count} tareas completadas en bloque! (+${addedXP} XP)`);
    updateUI();
    updateProgressBars();
  } else {
    showToast("Todas las tareas de este bloque ya estaban completadas.");
  }
}

// 6. PROGRESO Y CONTADORES
function updateProgressBars() {
  const allIds = Object.keys(tasksState);
  const total = allIds.length;
  const completed = allIds.filter(id => tasksState[id].completed).length;
  const pct = Math.round((completed / total) * 100) || 0;

  const globalBar = document.getElementById('globalProgressBar');
  const globalLabel = document.getElementById('globalProgressLabel');
  if (globalBar) globalBar.style.width = `${pct}%`;
  if (globalLabel) globalLabel.textContent = `${completed} de ${total} tareas (${pct}%)`;

  // Grupo Hoy
  const todayIds = allIds.filter(id => tasksState[id].group === 'today');
  const todayDone = todayIds.filter(id => tasksState[id].completed).length;
  const todayBadge = document.getElementById('todayProgressBadge');
  if (todayBadge) todayBadge.textContent = `${todayDone}/${todayIds.length} hechas`;

  // Grupo Extraescolar
  const extraIds = allIds.filter(id => tasksState[id].group === 'extra');
  const extraDone = extraIds.filter(id => tasksState[id].completed).length;
  const extraBadge = document.getElementById('extraProgressBadge');
  if (extraBadge) extraBadge.textContent = `${extraDone}/${extraIds.length} hechas`;
}

// 7. AÑADIR TAREA PERSONALIZADA EN DIRECTO
function addCustomTaskPrompt() {
  const title = prompt("Escribe el nombre de la nueva tarea que quieras apuntar:");
  if (!title || title.trim() === "") return;

  const xpStr = prompt("¿Cuántos XP otorga al completarse? (ejemplo: 15):", "15");
  const xp = parseInt(xpStr) || 15;

  const newId = 'custom-' + Date.now();
  tasksState[newId] = {
    title: title.trim(),
    xp: xp,
    completed: false,
    group: 'extra',
    isCustom: true
  };
  saveTasks();

  // Insertar en la lista del DOM
  const list = document.getElementById('extraTaskList');
  if (list) {
    const card = document.createElement('li');
    card.id = newId;
    card.className = 'task-card';
    card.onclick = () => toggleTask(newId);
    card.innerHTML = `
      <div class="custom-checkbox">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-content">
        <strong class="task-title">${title.trim()}</strong>
        <span class="task-desc">Tarea personalizada añadida por Ángel</span>
      </div>
      <div class="task-meta">
        <span class="status-tag tag-pending">⏳ PENDIENTE</span>
        <span class="xp-pill-badge">+${xp} XP</span>
      </div>
    `;
    list.appendChild(card);
  }

  updateProgressBars();
  showToast(`✅ Tarea "${title.trim()}" añadida a tu lista.`);
}

// 8. SONIDO CELEBRACIÓN (WEB AUDIO API NATIVO, SIN ARCHIVOS EXTERNOS)
function playCompletionChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // Ignorar si el navegador bloquea audio sin interacción
  }
}

// 9. NAVEGACIÓN ENTRE PESTAÑAS
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
}

// 10. VISOR Y COPIA DE TIC (NORMAS APA 7)
function toggleTicViewer() {
  const viewer = document.getElementById('ticDocumentViewer');
  const label = document.getElementById('toggleViewerText');
  if (!viewer) return;

  if (viewer.classList.contains('open')) {
    viewer.classList.remove('open');
    if (label) label.textContent = 'Ver Documento Completo';
  } else {
    viewer.classList.add('open');
    if (label) label.textContent = 'Ocultar Documento';
  }
}

function copyTicContent() {
  const textToCopy = `===============================================================
MEMORIA EN WORD: CLUB ATLÉTICO RIVER EBRO (NORMAS APA 7ª EDICIÓN)
===============================================================

                                                                               1

      Estructura y Planificación de la Presentación Institucional del
                       Club Atlético River Ebro
                Análisis Histórico, Deportivo y Social

                      Ángel Moreno Gutiérrez
         1º de Bachillerato D — Ciencias y Tecnología
               IES La Rioja
            Tecnologías de la Información y la Comunicación (TIC I)
                            Profesor/a TEC 1
                        23 de septiembre de 2026

---------------------------------------------------------------
JERARQUÍA DE TÍTULOS Y SECCIONES EN WORD
---------------------------------------------------------------
1. Introducción y Justificación del Proyecto
   1.1. Objeto del Trabajo: Importancia del club en Rincón de Soto.
   1.2. Metodología y Fuentes: FRF y archivo municipal.
   1.3. Objetivos de la Presentación.

2. Historia e Identidad Institucional
   2.1. Fundación y Antecedentes (1932).
   2.2. Simbología y Colores: Escudo heráldico y franjirroja.
   2.3. Las Instalaciones: Estadio San Miguel.

3. Estructura Deportiva y Competiciones
   3.1. Primer Equipo Masculino (Tercera Federación - Grupo XVI).
   3.2. Fútbol Base y Cantera: Categorías formativas.

4. Dimensión Social, Afición y Comunidad
   4.1. El Tejido Social de Rincón de Soto.
   4.2. Impacto Económico y Promoción Local (Pera con D.O.P.).

5. Guión Técnico de 10 Diapositivas para PowerPoint (Regla 6x6)
   - D1: Portada Institucional (Escudo HD y colores corporativos)
   - D2: Índice de Contenidos (4 bloques temáticos)
   - D3: Orígenes y Fundación (Foto histórica 1932 + línea de tiempo)
   - D4: Identidad y Símbolos (Escudo y camiseta franjirroja)
   - D5: Estadio San Miguel (Aforo, césped y dimensiones)
   - D6: Trayectoria en Tercera RFEF (Gráfico de clasificaciones y playoffs)
   - D7: Cantera y Deporte Base (Fotografías y formación)
   - D8: Vínculo con Rincón de Soto (Afición y patrocinio de la Pera)
   - D9: Retos de Futuro (Modernización y sostenibilidad)
   - D10: Conclusiones y Preguntas (Logo y contacto institucional)

6. Conclusiones del Trabajo

7. Referencias (Normas APA 7 - Sangría Francesa 1,27 cm)
   Federación Riojana de Fútbol. (2025). Clasificaciones oficiales y actas arbitrales: Grupo XVI Tercera Federación. https://www.frfutbol.com
   Gobierno de La Rioja. (2024). Registro de entidades deportivas de La Rioja: Club Atlético River Ebro (Exp. 1932/RE). Consejería de Deporte y Juventud.
   Pérez, M. (2022). Noventa años de pasión franjirroja: Memoria gráfica del C.A. River Ebro (1932-2022). Editorial Riojana.
   Rincón de Soto, Ayuntamiento de. (2023). Instalaciones deportivas municipales: Estadio San Miguel. Portal Municipal de Rincón de Soto. https://www.rincondesoto.org
===============================================================`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('📋 ¡Estructura APA 7 copiada al portapapeles!');
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('📋 ¡Estructura APA 7 copiada al portapapeles!');
  } catch (err) {
    showToast('⚠️ No se pudo copiar automáticamente. Abre el visor.');
  }
  document.body.removeChild(textArea);
}

function copyLicenseCode(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`📋 ¡Código ${code} copiado al portapapeles!`);
    }).catch(() => {
      fallbackCopy(code);
    });
  } else {
    fallbackCopy(code);
  }
}

// 11. REGISTRO Y AUDITORÍA
function logEvent(actionName, xpValue) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let logs = JSON.parse(localStorage.getItem('angel_audit_logs')) || [];
  logs.unshift({ time: timeStr, action: actionName, xp: xpValue });

  if (logs.length > 25) logs.pop();

  localStorage.setItem('angel_audit_logs', JSON.stringify(logs));
  renderAuditLog();
}

function renderAuditLog() {
  const listEl = document.getElementById('auditLogList');
  if (!listEl) return;

  const logs = JSON.parse(localStorage.getItem('angel_audit_logs')) || [
    { time: "16:25:00", action: "Inicio de tarde y auditoría de agenda", xp: 20 },
    { time: "18:00:00", action: "Generación de Memoria Word APA 7 River Ebro", xp: 25 },
    { time: "18:25:00", action: "Incorporación deberes CAE Ana y Limpieza Galería", xp: 0 }
  ];

  listEl.innerHTML = logs.map(l => `
    <li class="audit-log-entry">
      <span class="timestamp">[${l.time}]</span>
      <span class="action">${l.action}</span>
      ${l.xp > 0 ? `<strong style="color: var(--accent-green); margin-left:auto;">+${l.xp} XP</strong>` : ''}
    </li>
  `).join('');
}

// 12. ACTUALIZACIÓN GENERAL DE LA INTERFAZ
function updateUI() {
  const pointsEl = document.getElementById('totalPoints');
  const streakEl = document.getElementById('streakDays');
  const levelEl = document.getElementById('currentLevel');
  const barEl = document.getElementById('xpProgressBar');

  if (pointsEl) pointsEl.innerHTML = `${currentPoints} <span class="unit">XP</span>`;
  if (streakEl) streakEl.innerHTML = `🔥 ${streakDays} <span class="unit">DÍAS</span>`;

  const currentLvlObj = levels.find(l => currentPoints >= l.min && currentPoints <= l.max) || levels[0];
  if (levelEl) levelEl.textContent = currentLvlObj.name;

  const range = currentLvlObj.max - currentLvlObj.min;
  const progressInLvl = currentPoints - currentLvlObj.min;
  const pct = Math.min(Math.max((progressInLvl / range) * 100, 5), 100);
  if (barEl) barEl.style.width = `${pct}%`;

  localStorage.setItem('angel_xp', currentPoints);
  localStorage.setItem('angel_streak', streakDays);
  renderAuditLog();
}

function showToast(msg) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
}

// 13. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  initTasks();
  Object.keys(tasksState).forEach(id => updateTaskDOM(id));
  updateProgressBars();
  updateUI();
});

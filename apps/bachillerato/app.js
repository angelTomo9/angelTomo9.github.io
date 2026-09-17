// Centro de Mando 1º Bachillerato — app.js (v4.0)

let currentPoints = parseInt(localStorage.getItem('angel_xp')) || 50;
let streakDays = parseInt(localStorage.getItem('angel_streak')) || 3;

const levels = [
  { min: 0, max: 50, name: "Nivel 1: Aspirante a Ingeniero Informático" },
  { min: 51, max: 120, name: "Nivel 2: Arquitecto de Algoritmos" },
  { min: 121, max: 220, name: "Nivel 3: Maestro de la Lógica & PAU" },
  { min: 221, max: 400, name: "Nivel 4: Candidato a Matrícula de Honor" },
  { min: 401, max: 1000, name: "Nivel 5: Élite de Bachillerato (10.0)" }
];

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
}

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

function logEvent(actionName, xpValue) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let logs = JSON.parse(localStorage.getItem('angel_audit_logs')) || [];
  logs.unshift({ time: timeStr, action: actionName, xp: xpValue });

  if (logs.length > 25) logs.pop();

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

function toggleTask(checkboxId, taskId, xpValue) {
  const checkbox = document.getElementById(checkboxId);
  const item = document.getElementById(taskId);

  if (checkbox && item) {
    let savedTasks = JSON.parse(localStorage.getItem('angel_tasks_state')) || {};
    
    if (checkbox.checked) {
      item.classList.remove('pending');
      item.classList.add('done');
      currentPoints += xpValue;
      savedTasks[checkboxId] = true;
      showToast(`¡Tarea completada! +${xpValue} XP ganados.`);
    } else {
      item.classList.remove('done');
      item.classList.add('pending');
      currentPoints -= xpValue;
      savedTasks[checkboxId] = false;
      showToast(`Tarea desmarcada. -${xpValue} XP.`);
    }
    
    localStorage.setItem('angel_tasks_state', JSON.stringify(savedTasks));
    updateUI();
  }
}

function restoreTasksState() {
  const savedTasks = JSON.parse(localStorage.getItem('angel_tasks_state')) || {};
  Object.keys(savedTasks).forEach(cbId => {
    const cb = document.getElementById(cbId);
    if (cb && savedTasks[cbId]) {
      cb.checked = true;
      const row = cb.closest('.mission-item');
      if (row) {
        row.classList.remove('pending');
        row.classList.add('done');
      }
    }
  });
}

function checkAllDailyDone() {
  const tasksToComplete = [
    { cb: 'check-ingles-p8', id: 'mission-ingles-p8', xp: 15 },
    { cb: 'check-filo-p16', id: 'mission-filo-p16', xp: 15 },
    { cb: 'check-lengua-hojas', id: 'mission-lengua-hojas', xp: 10 },
    { cb: 'check-gym-jueves', id: 'mission-gym-jueves', xp: 15 }
  ];

  let added = 0;
  let savedTasks = JSON.parse(localStorage.getItem('angel_tasks_state')) || {};

  tasksToComplete.forEach(t => {
    const el = document.getElementById(t.cb);
    const row = document.getElementById(t.id);
    if (el && !el.checked) {
      el.checked = true;
      if (row) {
        row.classList.remove('pending');
        row.classList.add('done');
      }
      savedTasks[t.cb] = true;
      currentPoints += t.xp;
      added += t.xp;
    }
  });

  localStorage.setItem('angel_tasks_state', JSON.stringify(savedTasks));

  if (added > 0) {
    showToast(`¡Bloque de Hoy completado! +${added} XP sumados.`);
  } else {
    showToast("Todas las tareas de hoy ya estaban marcadas.");
  }
  updateUI();
}

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
JERARQUÍA DE TÍTULOS Y SECCIONES
---------------------------------------------------------------
1. Introducción y Justificación del Proyecto
   1.1. Objeto del Trabajo: Importancia del club en Rincón de Soto.
   1.2. Metodología y Fuentes: FRF y archivo municipal.
   1.3. Objetivos de la Presentación.

2. Historia e Identidad Institucional
   2.1. Fundación y Antecedentes (1932).
   2.2. Simbología y Colores:
        - 2.2.1. El Escudo (heráldica y río Ebro).
        - 2.2.2. La Indumentaria (camiseta franjirroja).
   2.3. Las Instalaciones: Estadio San Miguel.

3. Estructura Deportiva y Competiciones
   3.1. Primer Equipo Masculino (Tercera Federación - Grupo XVI).
   3.2. Fútbol Base y Cantera: Categorías y valores formativos.

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
   Síntesis valorativa de la gestión y arraigo del club.

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

function showToast(msg) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = '#0284c7';
    toast.style.color = '#ffffff';
    toast.style.padding = '14px 24px';
    toast.style.borderRadius = '12px';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '0.92rem';
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

document.addEventListener('DOMContentLoaded', () => {
  restoreTasksState();
  updateUI();
});

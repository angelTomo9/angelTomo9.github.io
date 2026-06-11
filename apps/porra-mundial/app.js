// 1. BASE DE DATOS LOCAL
const participantes = [
    {
      id: 1,
      nombre: "Ángel",
      apodo: "El Míster",
      seleccionPeor: "Uzbekistán",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Angel",
      stats: { nacimiento: "15-05-1998", altura: "1.80m", peso: "75kg", equipo: "Ángel FC" },
      predicciones: { 
        maxGoleador: "Morata", campeon: "España", subcampeon: "Alemania",
        "p1": { home: 3, away: 0 },
        "p2": { home: 1, away: 1 },
        "p3": { home: 2, away: 1 },
        "p4": { home: 0, away: 1 }
      },
      puntos: 0
    },
    {
      id: 2,
      nombre: "Iker",
      apodo: "Casillas Jr",
      seleccionPeor: "Haití",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Iker",
      stats: { nacimiento: "10-02-1999", altura: "1.85m", peso: "80kg", equipo: "Muro FC" },
      predicciones: { 
        maxGoleador: "Mbappé", campeon: "Francia", subcampeon: "Inglaterra",
        "p1": { home: 2, away: 0 },
        "p2": { home: 2, away: 1 },
        "p3": { home: 1, away: 1 },
        "p4": { home: 1, away: 2 }
      },
      puntos: 0
    },
    {
      id: 3,
      nombre: "Ibai",
      apodo: "El Gigante",
      seleccionPeor: "Cabo Verde",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ibai",
      stats: { nacimiento: "26-03-1995", altura: "1.82m", peso: "100kg", equipo: "Porcinos FC" },
      predicciones: { 
        maxGoleador: "Kane", campeon: "Argentina", subcampeon: "España",
        "p1": { home: 4, away: 0 },
        "p2": { home: 0, away: 0 },
        "p3": { home: 3, away: 2 },
        "p4": { home: 2, away: 2 }
      },
      puntos: 0
    },
    {
      id: 4,
      nombre: "Xavi",
      apodo: "El Maestro",
      seleccionPeor: "Corea del Norte",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Xavi",
      stats: { nacimiento: "25-01-1980", altura: "1.70m", peso: "68kg", equipo: "Tiki Taka FC" },
      predicciones: { 
        maxGoleador: "Messi", campeon: "Argentina", subcampeon: "Brasil",
        "p1": { home: 1, away: 0 },
        "p2": { home: 3, away: 1 },
        "p3": { home: 0, away: 0 },
        "p4": { home: 0, away: 3 }
      },
      puntos: 0
    }
  ];
  
const partidos = [
    {
        id: "p1", jornada: "J1 Fase de Grupos", local: "España", bandLocal: "🇪🇸", visitante: "Cabo Verde", bandVisitante: "🇨🇻",
        fechaIso: "2026-06-10T16:00:00Z", // Partido en el pasado
        resultadoReal: { home: 3, away: 0 }, finalizado: true
    },
    {
        id: "p2", jornada: "J1 Fase de Grupos", local: "Brasil", bandLocal: "🇧🇷", visitante: "Haití", bandVisitante: "🇭🇹",
        fechaIso: "2026-06-10T20:00:00Z", // Partido en el pasado (Prueba regla Peor Equipo: Haití anota 1 y recibe 3)
        resultadoReal: { home: 3, away: 1 }, finalizado: true
    },
    {
        id: "p3", jornada: "J2 Fase de Grupos", local: "Francia", bandLocal: "🇫🇷", visitante: "Inglaterra", bandVisitante: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        fechaIso: new Date(Date.now() + 3600000).toISOString(), // Dentro de 1h
        resultadoReal: null, finalizado: false
    },
    {
        id: "p4", jornada: "J2 Fase de Grupos", local: "Argentina", bandLocal: "🇦🇷", visitante: "Uzbekistán", bandVisitante: "🇺🇿",
        fechaIso: new Date(Date.now() + 86400000).toISOString(), // Mañana
        resultadoReal: null, finalizado: false
    }
];

let usuarioActivoId = participantes[0].id;
let jornadaActiva = partidos[0].jornada;

// 2. LÓGICA CORE Y CALCULO DE PUNTOS
function calcularPuntos() {
    participantes.forEach(user => {
        user.puntos = 0; // Reset

        partidos.forEach(p => {
            if (!p.finalizado) return;

            // 2.1 Puntos normales
            const pred = user.predicciones[p.id];
            if (pred) {
                const rH = p.resultadoReal.home;
                const rA = p.resultadoReal.away;
                
                if (pred.home === rH && pred.away === rA) {
                    user.puntos += 3; // Exacto
                } else if (Math.sign(rH - rA) === Math.sign(pred.home - pred.away)) {
                    user.puntos += 1; // Tendencia
                }
            }

            // 2.2 Bonus Peor Equipo
            if (p.local === user.seleccionPeor || p.visitante === user.seleccionPeor) {
                const golesFavor = p.local === user.seleccionPeor ? p.resultadoReal.home : p.resultadoReal.away;
                const golesContra = p.local === user.seleccionPeor ? p.resultadoReal.away : p.resultadoReal.home;

                if (golesFavor > 0) user.puntos += golesFavor;
                if (golesContra === 3) user.puntos += 1;
            }
        });
    });

    participantes.sort((a, b) => b.puntos - a.puntos);
}

// 3. RENDERIZADO DE LA UI
function renderizar() {
    calcularPuntos();
    
    // Select de usuarios
    const select = document.getElementById('user-select');
    select.innerHTML = '';
    participantes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nombre;
        if (p.id === usuarioActivoId) opt.selected = true;
        select.appendChild(opt);
    });

    // Vista Panini
    const paniniContainer = document.getElementById('panini-container');
    paniniContainer.innerHTML = '';
    participantes.forEach(p => {
        paniniContainer.innerHTML += `
            <div class="cromo-panini">
                <div class="cromo-puntos">${p.puntos} PTS</div>
                <div class="cromo-header">
                    <img src="${p.foto}" class="cromo-foto">
                    <div class="cromo-nombre">${p.nombre}</div>
                    <div class="cromo-apodo">"${p.apodo}"</div>
                </div>
                <ul class="cromo-stats">
                    <li><span>Nacimiento:</span> <strong>${p.stats.nacimiento}</strong></li>
                    <li><span>Físico:</span> <strong>${p.stats.altura} / ${p.stats.peso}</strong></li>
                    <li><span>Club:</span> <strong>${p.stats.equipo}</strong></li>
                    <li><span>Peor Sel:</span> <strong style="color:var(--accent)">${p.seleccionPeor}</strong></li>
                </ul>
            </div>
        `;
    });

    // Pestañas Jornadas
    const jornadas = [...new Set(partidos.map(p => p.jornada))];
    const tabsContainer = document.getElementById('matchdays-tabs-container');
    tabsContainer.innerHTML = '';
    jornadas.forEach(j => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${j === jornadaActiva ? 'active' : ''}`;
        btn.textContent = j;
        btn.onclick = () => { jornadaActiva = j; renderizar(); };
        tabsContainer.appendChild(btn);
    });

    // Partidos
    const fixContainer = document.getElementById('fixtures-container');
    fixContainer.innerHTML = '';
    const partidosJornada = partidos.filter(p => p.jornada === jornadaActiva);
    const user = participantes.find(u => u.id === usuarioActivoId);
    const now = new Date();

    partidosJornada.forEach(p => {
        const pred = user.predicciones[p.id] || { home: '', away: '' };
        const fechaObj = new Date(p.fechaIso);
        const estaBloqueado = now >= fechaObj || p.finalizado;

        // Clase de color según acierto
        let claseColor = '';
        if (p.finalizado && pred.home !== '') {
            const rH = p.resultadoReal.home;
            const rA = p.resultadoReal.away;
            if (pred.home === rH && pred.away === rA) claseColor = 'acierto-perfecto';
            else if (Math.sign(rH - rA) === Math.sign(pred.home - pred.away)) claseColor = 'acierto-tendencia';
            else claseColor = 'error-total';
        }

        fixContainer.innerHTML += `
            <div class="partido-card">
                <div class="partido-header">
                    <span>${fechaObj.toLocaleString()}</span>
                    <span class="partido-timer ${estaBloqueado ? 'locked' : ''}">
                        ${estaBloqueado ? (p.finalizado ? 'FINALIZADO' : 'CERRADO') : 'ABIERTO'}
                    </span>
                </div>
                <div class="partido-cuerpo">
                    <div class="equipo">
                        <span class="equipo-bandera">${p.bandLocal}</span>
                        <span class="equipo-nombre">${p.local}</span>
                    </div>
                    <div class="prediccion-inputs">
                        <input type="number" class="${claseColor}" value="${pred.home}" ${estaBloqueado ? 'disabled' : ''}>
                        <span style="color:var(--text-muted); font-weight:bold;">:</span>
                        <input type="number" class="${claseColor}" value="${pred.away}" ${estaBloqueado ? 'disabled' : ''}>
                    </div>
                    <div class="equipo">
                        <span class="equipo-bandera">${p.bandVisitante}</span>
                        <span class="equipo-nombre">${p.visitante}</span>
                    </div>
                </div>
            </div>
        `;
    });

    // Leaderboard
    const lbBody = document.getElementById('leaderboard-body');
    lbBody.innerHTML = '';
    participantes.forEach((p, i) => {
        lbBody.innerHTML += `
            <tr>
                <td style="color:var(--gold); font-size:1.5rem">#${i + 1}</td>
                <td>${p.nombre}</td>
                <td style="color:var(--accent); font-size:1.5rem; font-weight:bold">${p.puntos}</td>
            </tr>
        `;
    });
}

// 4. EVENTOS Y SETUP INICIAL
document.addEventListener('DOMContentLoaded', () => {
    // Cambio de usuario
    document.getElementById('user-select').addEventListener('change', (e) => {
        usuarioActivoId = parseInt(e.target.value);
        renderizar();
    });

    // Navegación principal
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Loop de bloqueo para inputs (verifica cada minuto)
    setInterval(renderizar, 60000);

    // Primer render
    renderizar();
});

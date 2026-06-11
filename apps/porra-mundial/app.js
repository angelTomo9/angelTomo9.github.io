/**
 * app.js - Lógica Principal (V3: Panini Gamificada)
 */

const State = {
    activeUserId: participantes[0].id,
    currentJornada: partidos.length > 0 ? partidos[0].jornada : ''
};

class GameEngine {
    static init() {
        this.calculatePoints();
        this.setupNavigation();
        this.renderUserSelector();
        this.renderPaniniAlbum();
        this.renderDashboard();
        this.renderLeaderboard();
        this.renderRulesBonuses();
        this.startTimers();
    }

    /**
     * Motor de cálculo: recorre participantes y partidos para asignar los puntos a cada participante.
     */
    static calculatePoints() {
        participantes.forEach(user => {
            user.puntos = 0; // Reinicio
            user.exactos = 0;
            user.tendencias = 0;
            user.peorEquipoPuntos = 0;

            partidos.forEach(p => {
                if (!p.finalizado) return;

                const pred = user.predicciones[p.id];
                if (!pred) return;

                const rHome = p.resultadoReal.home;
                const rAway = p.resultadoReal.away;
                const pHome = pred.home;
                const pAway = pred.away;

                // Lógica Estándar
                if (rHome === pHome && rAway === pAway) {
                    user.puntos += reglas.aciertoPerfecto;
                    user.exactos++;
                } else if (Math.sign(rHome - rAway) === Math.sign(pHome - pAway)) {
                    user.puntos += reglas.tendencia;
                    user.tendencias++;
                }

                // Lógica Peor Equipo
                if (user.seleccionPeor === p.equipoLocal || user.seleccionPeor === p.equipoVisitante) {
                    const golesFavor = user.seleccionPeor === p.equipoLocal ? rHome : rAway;
                    const golesContra = user.seleccionPeor === p.equipoLocal ? rAway : rHome;

                    if (golesFavor > 0) {
                        user.puntos += (golesFavor * reglas.peorEquipoGolFavor);
                        user.peorEquipoPuntos += golesFavor;
                    }
                    if (golesContra === 3) {
                        user.puntos += reglas.peorEquipoGolesContra3;
                        user.peorEquipoPuntos += reglas.peorEquipoGolesContra3;
                    }
                }
            });
        });

        // Ordenamos el array mutándolo
        participantes.sort((a, b) => b.puntos - a.puntos);
    }

    /**
     * Sistema de pestañas principal (Menú inferior/lateral)
     */
    static setupNavigation() {
        const btns = document.querySelectorAll('.nav-btn');
        const views = document.querySelectorAll('.view-section');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                views.forEach(v => v.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.target).classList.add('active');
            });
        });
    }

    static renderUserSelector() {
        const select = document.getElementById('user-select');
        select.innerHTML = '';
        participantes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.apodo;
            if (p.id === State.activeUserId) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            State.activeUserId = parseInt(e.target.value);
            this.renderDashboard();
            this.renderRulesBonuses();
        });
    }

    /**
     * VISTA 1: El Álbum Panini (Cuadrícula interactiva)
     */
    static renderPaniniAlbum() {
        const container = document.getElementById('panini-container');
        container.innerHTML = '';

        participantes.forEach(user => {
            const card = document.createElement('div');
            card.className = 'panini-card-container';

            // Animación holográfica interactiva al mover el ratón
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Rotación 3D
                const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg
                const rotateY = ((x - centerX) / centerX) * 15;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            });

            card.innerHTML = `
                <div class="panini-card">
                    <div class="card-top">
                        <div class="card-points">${user.puntos} PTS</div>
                        <img src="${user.foto}" class="card-avatar" alt="Foto">
                        <div class="card-name">${user.nombre}</div>
                        <div class="card-alias">"${user.apodo}"</div>
                    </div>
                    <div class="card-bottom">
                        <div class="stat-row">
                            <span class="stat-label">Nacimiento</span>
                            <span class="stat-value">${user.stats.nacimiento}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Altura / Peso</span>
                            <span class="stat-value">${user.stats.altura} / ${user.stats.peso}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Club Base</span>
                            <span class="stat-value">${user.stats.equipo}</span>
                        </div>
                        <div class="worst-team-badge">
                            <span>PEOR SELECCIÓN:</span>
                            <span style="font-size:1.1rem">${user.seleccionPeor}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * VISTA 2: Dashboard de Partidos por Pestañas
     */
    static renderDashboard() {
        const tabsContainer = document.getElementById('matchdays-tabs-container');
        const fixturesContainer = document.getElementById('fixtures-container');
        
        // Extraer jornadas únicas
        const jornadas = [...new Set(partidos.map(p => p.jornada))];
        if(!State.currentJornada && jornadas.length > 0) State.currentJornada = jornadas[0];

        // Renderizar Pestañas
        tabsContainer.innerHTML = '';
        jornadas.forEach(jor => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${jor === State.currentJornada ? 'active' : ''}`;
            btn.textContent = jor;
            btn.addEventListener('click', () => {
                State.currentJornada = jor;
                this.renderDashboard();
            });
            tabsContainer.appendChild(btn);
        });

        // Renderizar Partidos de la jornada seleccionada para el usuario activo
        fixturesContainer.innerHTML = '';
        const user = participantes.find(u => u.id === State.activeUserId);
        const userPreds = user ? user.predicciones : {};

        const partidosJornada = partidos.filter(p => p.jornada === State.currentJornada);
        const now = new Date();

        partidosJornada.forEach(p => {
            const pred = userPreds[p.id] || { home: '', away: '' };
            const matchDate = new Date(p.fechaIso);
            const isLocked = now >= matchDate || p.finalizado;

            let inputClassHome = '';
            let inputClassAway = '';
            let lockText = '';

            // Regla estricta de color
            if (p.finalizado && pred.home !== '') {
                const rH = p.resultadoReal.home;
                const rA = p.resultadoReal.away;
                
                if (pred.home === rH && pred.away === rA) {
                    inputClassHome = inputClassAway = 'input-exact';
                } else if (Math.sign(rH - rA) === Math.sign(pred.home - pred.away)) {
                    inputClassHome = inputClassAway = 'input-tendency';
                } else {
                    inputClassHome = inputClassAway = 'input-fail';
                }
            }

            const card = document.createElement('div');
            card.className = 'fixture-card';
            card.innerHTML = `
                <div class="fixture-header">
                    <span>${matchDate.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span class="fixture-timer ${isLocked ? 'locked' : ''}" data-date="${p.fechaIso}">
                        ${isLocked ? (p.finalizado ? 'FINALIZADO' : 'CERRADO') : 'Calculando...'}
                    </span>
                </div>
                <div class="fixture-teams">
                    <div class="f-team">
                        <span class="f-flag">${p.banderaLocal}</span>
                        <span class="f-name">${p.equipoLocal}</span>
                    </div>
                    <div class="f-inputs">
                        <input type="number" class="${inputClassHome}" value="${pred.home}" ${isLocked ? 'disabled' : ''}>
                        <span style="color: var(--text-muted); font-weight: bold;">:</span>
                        <input type="number" class="${inputClassAway}" value="${pred.away}" ${isLocked ? 'disabled' : ''}>
                    </div>
                    <div class="f-team">
                        <span class="f-flag">${p.banderaVisitante}</span>
                        <span class="f-name">${p.equipoVisitante}</span>
                    </div>
                </div>
            `;
            fixturesContainer.appendChild(card);
        });
    }

    /**
     * VISTA 3: Leaderboard / Clasificación
     */
    static renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';

        participantes.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="row-pos ${i === 0 ? 'row-pos-1' : ''}">#${i + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${p.foto}" style="width:30px; border-radius:50%; border:2px solid var(--accent)">
                        ${p.nombre} "${p.apodo}"
                    </div>
                </td>
                <td class="row-pts">${p.puntos} PTS</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * VISTA 4: Mostrar Bonos del usuario activo
     */
    static renderRulesBonuses() {
        const container = document.getElementById('bonuses-display');
        const user = participantes.find(u => u.id === State.activeUserId);
        if (!user) return;

        container.innerHTML = `
            <div class="bonus-item">
                <span class="bonus-label">Selección Campeona:</span>
                <span class="bonus-val">${user.predicciones.campeon}</span>
            </div>
            <div class="bonus-item">
                <span class="bonus-label">Subcampeona:</span>
                <span class="bonus-val">${user.predicciones.subcampeon}</span>
            </div>
            <div class="bonus-item">
                <span class="bonus-label">Máx. Goleador:</span>
                <span class="bonus-val">${user.predicciones.maxGoleador}</span>
            </div>
        `;
    }

    /**
     * Temporizadores de cuenta atrás globales
     */
    static startTimers() {
        setInterval(() => {
            const timers = document.querySelectorAll('.fixture-timer[data-date]');
            const now = new Date().getTime();

            timers.forEach(t => {
                const limit = new Date(t.dataset.date).getTime();
                const diff = limit - now;

                if (diff > 0 && !t.classList.contains('locked')) {
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    t.textContent = `-${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                } else {
                    // Si expiró y no estaba bloqueado, forzar re-render de la vista para aplicar 'disabled' a los inputs
                    if (!t.classList.contains('locked') && t.textContent !== 'CERRADO' && t.textContent !== 'FINALIZADO') {
                        this.renderDashboard(); 
                    }
                }
            });
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    GameEngine.init();
});

/**
 * app.js - Lógica Principal de la Porra Mundial V2
 * 
 * Arquitectura Modular:
 * 1. State Management (Gestión del estado de los datos locales)
 * 2. Business Logic (Motor de cálculo de puntuaciones)
 * 3. UI Renderers (Actualización dinámica del DOM)
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const AppState = {
    // Inicializamos con el primer usuario de la lista simulada
    currentUser: tournamentData.users[0], 
    
    // Extendemos los usuarios con los campos dinámicos para calcular la puntuación
    users: tournamentData.users.map(u => ({ 
        ...u, 
        totalPoints: 0, 
        exacts: 0, 
        tendencies: 0, 
        worstTeamPoints: 0 
    })),
    
    matches: tournamentData.matches,
    teams: tournamentData.teams,
    predictions: tournamentData.predictions,
    config: tournamentData.config
};


// ==========================================
// 2. BUSINESS LOGIC (MOTOR DE PUNTUACIÓN)
// ==========================================
class ScoringEngine {
    /**
     * Recalcula todos los puntos de todos los usuarios en base a los partidos finalizados.
     */
    static calculate() {
        // Reset de puntuaciones
        AppState.users.forEach(u => {
            u.totalPoints = 0;
            u.exacts = 0;
            u.tendencies = 0;
            u.worstTeamPoints = 0;
        });

        AppState.matches.forEach(match => {
            // Solo puntuamos partidos finalizados (90 Minutos Regulares)
            if (match.status !== 'FINISHED') return;

            const homeGoals = match.homeScore;
            const awayGoals = match.awayScore;

            // --- A. LÓGICA DE PREDICCIONES NORMALES ---
            AppState.users.forEach(user => {
                const userPreds = AppState.predictions[user.id];
                if (!userPreds) return;
                
                const pred = userPreds[match.id];
                if (!pred) return; // El usuario no hizo pronóstico

                if (pred.homeScore === homeGoals && pred.awayScore === awayGoals) {
                    // ACIERTO PERFECTO
                    user.totalPoints += AppState.config.points.exact;
                    user.exacts++;
                } else if (Math.sign(homeGoals - awayGoals) === Math.sign(pred.homeScore - pred.awayScore)) {
                    // ACIERTO DE TENDENCIA (Gana mismo equipo o Empate)
                    user.totalPoints += AppState.config.points.tendency;
                    user.tendencies++;
                }
            });

            // --- B. LÓGICA CAÓTICA DE LA PEOR SELECCIÓN ---
            AppState.users.forEach(user => {
                const worstTeamId = user.bonuses.worstTeam;
                if (!worstTeamId) return;

                let goalsScored = 0;
                let goalsConceded = 0;

                // Identificamos si la peor selección jugó en este partido
                if (match.homeTeam === worstTeamId) {
                    goalsScored = homeGoals;
                    goalsConceded = awayGoals;
                } else if (match.awayTeam === worstTeamId) {
                    goalsScored = awayGoals;
                    goalsConceded = homeGoals;
                } else {
                    return; // No jugó
                }

                // Regla B.1: +1 punto por cada gol que marque
                if (goalsScored > 0) {
                    user.worstTeamPoints += goalsScored;
                    user.totalPoints += goalsScored;
                }

                // Regla B.2: +1 punto extra si le marcan EXACTAMENTE 3 goles
                if (goalsConceded === 3) {
                    user.worstTeamPoints += 1;
                    user.totalPoints += 1;
                }
            });
        });

        // Ordenamos la clasificación de mayor a menor puntuación total
        AppState.users.sort((a, b) => b.totalPoints - a.totalPoints);
    }
}


// ==========================================
// 3. UI RENDERERS (VISTAS)
// ==========================================
class UIRenderer {
    static init() {
        ScoringEngine.calculate();
        
        this.setupNavigation();
        this.renderHeader();
        this.renderUserSelector();
        
        this.renderLeaderboard();
        this.renderFixtures(AppState.currentUser.id);
        this.renderPaniniAlbum();
        this.renderBonuses(AppState.currentUser.id);
        
        this.startCountdowns();
    }

    /**
     * Configura el menú de navegación lateral/inferior
     */
    static setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.view-section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.target).classList.add('active');
            });
        });
    }

    static renderHeader() {
        document.getElementById('current-user-name').textContent = AppState.currentUser.name;
        document.getElementById('current-user-avatar').src = AppState.currentUser.avatar;
    }

    /**
     * Selector para ver los pronósticos/bonos de diferentes amigos
     */
    static renderUserSelector() {
        const select = document.getElementById('user-predictions-select');
        select.innerHTML = '';
        AppState.users.forEach(u => {
            const option = document.createElement('option');
            option.value = u.id;
            option.textContent = u.name;
            if (u.id === AppState.currentUser.id) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this.renderFixtures(e.target.value);
            this.renderBonuses(e.target.value);
        });
    }

    /**
     * Renderiza la tabla de clasificación dinámica
     */
    static renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';

        AppState.users.forEach((user, index) => {
            const tr = document.createElement('tr');
            
            // Clase para color del top 3
            const posClass = index < 3 ? `pos-${index + 1}` : '';
            
            tr.innerHTML = `
                <td class="lb-pos ${posClass}">#${index + 1}</td>
                <td>
                    <div class="lb-player">
                        <img src="${user.avatar}" class="lb-avatar" alt="Avatar">
                        <span>${user.name}</span>
                    </div>
                </td>
                <td class="lb-pts">${user.totalPoints}</td>
                <td><span style="color:var(--success); font-weight:bold;">${user.exacts}</span> exactos</td>
                <td><span style="color:var(--warning); font-weight:bold;">${user.tendencies}</span> tendencias</td>
                <td><span style="color:var(--danger); font-weight:bold;">+${user.worstTeamPoints}</span> pts</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /**
     * Renderiza las tarjetas de los partidos con sus inputs interactivos
     */
    static renderFixtures(viewUserId) {
        const container = document.getElementById('fixtures-container');
        container.innerHTML = '';

        const viewUserPreds = AppState.predictions[viewUserId] || {};

        AppState.matches.forEach(match => {
            const home = AppState.teams[match.homeTeam];
            const away = AppState.teams[match.awayTeam];
            const pred = viewUserPreds[match.id] || { homeScore: '', awayScore: '' };
            
            const matchDate = new Date(match.datetime);
            const now = new Date();
            const hasStarted = now >= matchDate || match.status === 'FINISHED';
            const isFinished = match.status === 'FINISHED';

            // Comprobar resultado del pronóstico para colorear
            let resultClass = 'res-pending';
            let resultText = 'Esperando resultado...';
            
            if (isFinished && pred.homeScore !== '') {
                if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
                    resultClass = 'res-exact'; resultText = '¡Acierto Perfecto! (+3)';
                } else if (Math.sign(match.homeScore - match.awayScore) === Math.sign(pred.homeScore - pred.awayScore)) {
                    resultClass = 'res-tendency'; resultText = 'Tendencia (+1)';
                } else {
                    resultClass = 'res-fail'; resultText = 'Fallaste (0)';
                }
            }

            const card = document.createElement('div');
            card.className = 'fixture-card';
            
            card.innerHTML = `
                <div class="fixture-time">
                    ${matchDate.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    ${!hasStarted ? `<span class="countdown" data-time="${match.datetime}">...</span>` : '<span class="countdown" style="color:var(--text-secondary); background:transparent;">Bloqueado</span>'}
                </div>
                
                <div class="fixture-teams">
                    <div class="team">
                        <span class="team-flag">${home.flag}</span>
                        <span class="team-name">${home.name}</span>
                    </div>
                    
                    <div class="score-inputs">
                        <input type="number" class="score-input" value="${pred.homeScore}" ${hasStarted ? 'disabled' : ''} placeholder="-">
                        <span style="color:var(--text-secondary); font-weight:bold;">:</span>
                        <input type="number" class="score-input" value="${pred.awayScore}" ${hasStarted ? 'disabled' : ''} placeholder="-">
                    </div>
                    
                    <div class="team">
                        <span class="team-flag">${away.flag}</span>
                        <span class="team-name">${away.name}</span>
                    </div>
                </div>

                ${isFinished ? `
                    <div class="fixture-result ${resultClass}">
                        Resultado Real: ${match.homeScore} - ${match.awayScore}
                        <br>${resultText}
                    </div>
                ` : ''}
            `;
            
            container.appendChild(card);
        });
    }

    /**
     * Renderiza el Álbum de Cromos Panini con efecto FLIP 3D
     */
    static renderPaniniAlbum() {
        const container = document.getElementById('panini-container');
        container.innerHTML = '';

        AppState.users.forEach(user => {
            const worstTeam = AppState.teams[user.bonuses.worstTeam];
            const card = document.createElement('div');
            card.className = 'panini-card';
            
            card.innerHTML = `
                <!-- Cara Frontal -->
                <div class="panini-front">
                    <div style="width:100%; text-align:right; font-weight:bold; color:var(--text-secondary)">ID: ${user.id}</div>
                    <img src="${user.avatar}" class="p-avatar" alt="Avatar">
                    <div class="p-name">${user.name}</div>
                    <div class="p-points">${user.totalPoints} PTS</div>
                    <div style="margin-top:auto; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase;">
                        Team: ${user.panini.alias}
                    </div>
                </div>

                <!-- Reverso (Estadísticas) -->
                <div class="panini-back">
                    <div class="p-name" style="font-size: 1.5rem;">${user.panini.alias}</div>
                    <div style="font-size: 2rem; margin-bottom: 1rem;">${worstTeam ? worstTeam.flag : '❓'}</div>
                    <ul class="p-stats-list">
                        <li>
                            <span class="p-stats-label">Nacimiento</span>
                            <span class="p-stats-value">${user.panini.dob}</span>
                        </li>
                        <li>
                            <span class="p-stats-label">Altura</span>
                            <span class="p-stats-value">${user.panini.height}</span>
                        </li>
                        <li>
                            <span class="p-stats-label">Peso</span>
                            <span class="p-stats-value">${user.panini.weight}</span>
                        </li>
                        <li>
                            <span class="p-stats-label">Peor Equipo</span>
                            <span class="p-stats-value">${worstTeam ? worstTeam.name : '-'}</span>
                        </li>
                        <li>
                            <span class="p-stats-label">Aciertos %</span>
                            <span class="p-stats-value">${user.exacts > 0 ? ((user.exacts / AppState.matches.filter(m=>m.status==='FINISHED').length)*100).toFixed(0) : 0}%</span>
                        </li>
                    </ul>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * Muestra los bonos del usuario seleccionado
     */
    static renderBonuses(userId) {
        const container = document.getElementById('user-bonuses-display');
        const user = AppState.users.find(u => u.id === userId);
        if (!user) return;

        const championTeam = AppState.teams[user.bonuses.champion];
        const subTeam = AppState.teams[user.bonuses.subChampion];
        const worstTeam = AppState.teams[user.bonuses.worstTeam];

        container.innerHTML = `
            <div class="bonus-pill">
                <span class="bp-label">Campeón (+10)</span>
                <span class="bp-value">${championTeam ? championTeam.flag + ' ' + championTeam.name : '-'}</span>
            </div>
            <div class="bonus-pill">
                <span class="bp-label">Subcampeón (+5)</span>
                <span class="bp-value">${subTeam ? subTeam.flag + ' ' + subTeam.name : '-'}</span>
            </div>
            <div class="bonus-pill">
                <span class="bp-label">Goleador (+5)</span>
                <span class="bp-value">👟 ${user.bonuses.topScorer}</span>
            </div>
            <div class="bonus-pill" style="border-color: var(--danger)">
                <span class="bp-label" style="color:var(--danger)">Peor Selección</span>
                <span class="bp-value">${worstTeam ? worstTeam.flag + ' ' + worstTeam.name : '-'}</span>
            </div>
        `;
    }

    /**
     * Actualiza los temporizadores cada segundo
     */
    static startCountdowns() {
        setInterval(() => {
            const countdowns = document.querySelectorAll('.countdown[data-time]');
            const now = new Date().getTime();

            countdowns.forEach(el => {
                const matchTime = new Date(el.dataset.time).getTime();
                const diff = matchTime - now;

                if (diff <= 0) {
                    el.textContent = "Bloqueado";
                    el.style.color = 'var(--text-secondary)';
                    el.style.background = 'transparent';
                    el.removeAttribute('data-time');
                    
                    // Bloquear inputs inmediatamente si se cumple el tiempo mientras la app está abierta
                    const card = el.closest('.fixture-card');
                    if (card) {
                        const inputs = card.querySelectorAll('input');
                        inputs.forEach(i => i.disabled = true);
                    }
                } else {
                    // Cálculo de HH:MM:SS
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    el.textContent = `Faltan ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
            });
        }, 1000);
    }
}

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UIRenderer.init();
});

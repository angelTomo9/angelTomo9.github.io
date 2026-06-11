document.addEventListener('DOMContentLoaded', async () => {
    // 1. Navegación por pestañas
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // 2. Cargar datos del JSON de la API
    let matchesData = [];
    try {
        const response = await fetch('results.json');
        if (response.ok) {
            const data = await response.json();
            matchesData = data.matches || [];
        } else {
            console.error('No se pudieron cargar los resultados.');
        }
    } catch (e) {
        console.error('Error cargando results.json', e);
    }

    // 3. Procesar Participantes y Calcular Puntos
    const participants = appData.participants.map(p => ({ ...p, points: 0, exacts: 0, tendencies: 0 }));

    matchesData.forEach(match => {
        // En la API, el estado TIMED es programado, IN_PLAY es en juego, FINISHED es terminado
        const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED';
        if (!isFinished) return;

        const homeScore = match.score.fullTime.home;
        const awayScore = match.score.fullTime.away;
        
        // Multiplicador (Ej: partidos de España)
        const multiplier = appData.doublePointsMatches.includes(match.id) ? 2 : 1;

        participants.forEach(p => {
            const pred = p.predictions[match.id];
            if (!pred) return;

            // Lógica de cálculo
            if (pred.homeScore === homeScore && pred.awayScore === awayScore) {
                // Acierto perfecto
                p.points += appData.rules.exactMatch * multiplier;
                p.exacts++;
            } else {
                // Tendencia (ganador o empate)
                const realTendency = Math.sign(homeScore - awayScore);
                const predTendency = Math.sign(pred.homeScore - pred.awayScore);
                if (realTendency === predTendency) {
                    p.points += appData.rules.tendency * multiplier;
                    p.tendencies++;
                }
            }
        });
    });

    // Ordenar clasificación
    participants.sort((a, b) => b.points - a.points);

    // 4. Renderizar Clasificación
    const lbContainer = document.getElementById('leaderboard-container');
    lbContainer.innerHTML = '';
    
    if (participants.length === 0) {
        lbContainer.innerHTML = '<p>No hay participantes configurados.</p>';
    }

    participants.forEach((p, index) => {
        lbContainer.innerHTML += `
            <div class="leaderboard-item">
                <div class="rank">#${index + 1}</div>
                <div class="player-info">
                    <img src="${p.avatarUrl}" alt="${p.name}" class="player-avatar">
                    <div class="player-name">${p.name}</div>
                </div>
                <div class="points">${p.points} <span style="font-size: 0.8rem; font-weight: normal;">pts</span></div>
            </div>
        `;
    });

    // 5. Renderizar Partidos
    const matchesContainer = document.getElementById('matches-container');
    
    // Solo mostrar los partidos de la fase de grupos o todos ordenados por fecha
    matchesData.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    matchesContainer.innerHTML = '';
    matchesData.forEach(match => {
        const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED';
        const homeScore = isFinished ? match.score.fullTime.home : '-';
        const awayScore = isFinished ? match.score.fullTime.away : '-';
        const homeTeamName = match.homeTeam.name || 'TBD';
        const awayTeamName = match.awayTeam.name || 'TBD';
        const homeCrest = match.homeTeam.crest || '';
        const awayCrest = match.awayTeam.crest || '';
        const date = new Date(match.utcDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        
        let predictionsHtml = '';
        participants.forEach(p => {
            const pred = p.predictions[match.id];
            let statusClass = 'status-pending';
            let predText = pred ? `${pred.homeScore} - ${pred.awayScore}` : '-';
            
            if (isFinished && pred) {
                if (pred.homeScore === match.score.fullTime.home && pred.awayScore === match.score.fullTime.away) {
                    statusClass = 'status-exact';
                } else if (Math.sign(pred.homeScore - pred.awayScore) === Math.sign(match.score.fullTime.home - match.score.fullTime.away)) {
                    statusClass = 'status-tendency';
                } else {
                    statusClass = 'status-fail';
                }
            }
            
            predictionsHtml += `
                <div class="prediction-item ${statusClass}">
                    <span>${p.name}</span>
                    <span>${predText}</span>
                </div>
            `;
        });

        // Marcador visual para partidos de doble puntuación
        const isDouble = appData.doublePointsMatches.includes(match.id);
        const doubleBadge = isDouble ? '<span style="background:var(--gold);color:#000;font-size:0.7rem;padding:2px 6px;border-radius:4px;margin-bottom:5px;display:inline-block;font-weight:bold;">PUNTOS x2</span><br>' : '';

        matchesContainer.innerHTML += `
            <div class="match-card">
                <div class="match-header">
                    <div class="team home">
                        <span>${homeTeamName}</span>
                        ${homeCrest ? `<img src="${homeCrest}" class="team-flag" alt="">` : ''}
                    </div>
                    <div class="score-box">
                        ${doubleBadge}
                        <div class="real-score">${homeScore} - ${awayScore}</div>
                        <div class="match-status">${isFinished ? 'Finalizado' : date}</div>
                    </div>
                    <div class="team away">
                        <span>${awayTeamName}</span>
                        ${awayCrest ? `<img src="${awayCrest}" class="team-flag" alt="">` : ''}
                    </div>
                </div>
                <div class="predictions-list">
                    ${predictionsHtml}
                </div>
            </div>
        `;
    });

    // 6. Renderizar Cartas de Participantes
    const partsContainer = document.getElementById('participants-container');
    partsContainer.innerHTML = '';
    participants.forEach(p => {
        partsContainer.innerHTML += `
            <div class="participant-card">
                <div class="card-header">
                    <img src="${p.avatarUrl}" alt="${p.name}">
                    <h3>${p.name}</h3>
                </div>
                <div class="card-body">
                    <div class="bonus-item">
                        <span class="bonus-label">Campeón</span>
                        <span class="bonus-value">${p.bonuses.champion}</span>
                    </div>
                    <div class="bonus-item">
                        <span class="bonus-label">Subcampeón</span>
                        <span class="bonus-value">${p.bonuses.subChampion}</span>
                    </div>
                    <div class="bonus-item">
                        <span class="bonus-label">Pichichi</span>
                        <span class="bonus-value">${p.bonuses.topScorer}</span>
                    </div>
                    <div class="bonus-item">
                        <span class="bonus-label">Peor Selección</span>
                        <span class="bonus-value">${p.bonuses.worstTeam}</span>
                    </div>
                </div>
            </div>
        `;
    });
});

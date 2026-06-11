document.addEventListener('DOMContentLoaded', () => {
    // --- PASO 1: LOGIN Y SESIÓN ---
    const validUsers = ['ángel', 'angel', 'iker', 'ibai', 'xavi'];
    const secretCode = 'charos';

    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const secretCodeInput = document.getElementById('secret-code');
    const errorMessage = document.getElementById('error-message');
    const displayUser = document.getElementById('display-user');
    const logoutBtn = document.getElementById('logout-btn');

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const switchScreen = (hideScreen, showScreen) => {
        hideScreen.classList.remove('active');
        hideScreen.classList.add('hidden');
        
        setTimeout(() => {
            showScreen.classList.remove('hidden');
            showScreen.classList.add('active');
        }, 300);
    };

    const checkSession = () => {
        const storedUser = localStorage.getItem('usuarioLogueado') || localStorage.getItem('porraMundialUser');
        if (storedUser) {
            localStorage.setItem('usuarioLogueado', storedUser);
            displayUser.textContent = `Hola, ${storedUser}`;
            loginScreen.classList.remove('active');
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            mainScreen.classList.add('active');
            
            iniciarSeccionPartidos();
        }
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const code = secretCodeInput.value.trim();
        const normalizedUsername = removeAccents(username.toLowerCase());

        if (validUsers.includes(normalizedUsername) && code === secretCode) {
            errorMessage.classList.add('hidden');
            const displayName = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
            localStorage.setItem('usuarioLogueado', displayName);
            displayUser.textContent = `Hola, ${displayName}`;
            
            switchScreen(loginScreen, mainScreen);
            iniciarSeccionPartidos();
        } else {
            errorMessage.classList.remove('hidden');
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogueado');
        usernameInput.value = '';
        secretCodeInput.value = '';
        errorMessage.classList.add('hidden');
        switchScreen(mainScreen, loginScreen);
    });

    // --- TABS (Pestañas) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden');
            });

            // Poner active al seleccionado
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.target);
            target.classList.remove('hidden');
            target.classList.add('active');
        });
    });


    // --- PASO 2: SECCIÓN DE PARTIDOS CON API REAL ---
    const matchesContainer = document.getElementById('matches-container');
    const savePredictionsBtn = document.getElementById('save-predictions-btn');
    
    let partidos = []; // Se llenará desde la API
    const API_KEY = '44f1435bc3704c82b557fb70255ec7cf';

    const fetchResultadosReales = async () => {
        try {
            const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
                method: 'GET',
                headers: {
                    'X-Auth-Token': API_KEY
                }
            });
            const data = await response.json();
            
            if (data && data.matches) {
                // Mapear y ordenar los partidos por fecha (del más antiguo al más nuevo)
                partidos = data.matches.map(m => {
                    return {
                        id: m.id,
                        stage: m.stage || m.group || 'Fase de Grupos',
                        utcDate: m.utcDate,
                        status: m.status, // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED
                        homeTeam: m.homeTeam?.name ? m.homeTeam.name : 'TBD',
                        awayTeam: m.awayTeam?.name ? m.awayTeam.name : 'TBD',
                        homeCrest: m.homeTeam?.crest || null,
                        awayCrest: m.awayTeam?.crest || null,
                        winnerReal: m.score?.winner // HOME_TEAM, AWAY_TEAM, DRAW
                    };
                }).sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
            }
        } catch (error) {
            console.error('Error fetching data from API:', error);
            matchesContainer.innerHTML = '<div class="error-msg text-center">Error al cargar los partidos desde la API.</div>';
        }
    };

    const formatFecha = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-ES', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Renderizar Tarjetas
    const renderPartidos = () => {
        if (!matchesContainer) return;
        if (partidos.length === 0) {
            matchesContainer.innerHTML = '<div class="loading-spinner">No hay partidos disponibles.</div>';
            return;
        }

        matchesContainer.innerHTML = '';
        const usuarioActual = localStorage.getItem('usuarioLogueado');
        // predicciones guardará el ID del partido y qué equipo ganó ('home' o 'away')
        const prediccionesGuardadas = JSON.parse(localStorage.getItem(`predicciones_v2_${usuarioActual}`)) || {};
        const ahora = new Date();

        partidos.forEach(partido => {
            const fechaPartido = new Date(partido.utcDate);
            const isEmpezado = ahora >= fechaPartido || partido.status === 'IN_PLAY' || partido.status === 'FINISHED';
            const hasResultadoReal = partido.status === 'FINISHED';
            
            // Obtener predicción del usuario (home o away)
            const predSeleccionada = prediccionesGuardadas[partido.id] || null;

            let cardClasses = 'match-card';
            let puntosHtml = '';

            // Lógica de aciertos si está finalizado
            if (hasResultadoReal && predSeleccionada) {
                let winnerAPI = 'draw';
                if (partido.winnerReal === 'HOME_TEAM') winnerAPI = 'home';
                if (partido.winnerReal === 'AWAY_TEAM') winnerAPI = 'away';

                if (predSeleccionada === winnerAPI) {
                    cardClasses += ' acierto-perfecto';
                    puntosHtml = '<div class="puntos-badge puntos-3">+3 Puntos (Acierto)</div>';
                } else {
                    cardClasses += ' error-total';
                    puntosHtml = '<div class="puntos-badge puntos-0">0 Puntos (Fallo)</div>';
                }
            }

            let statusText = isEmpezado ? (hasResultadoReal ? 'Finalizado' : 'En juego') : formatFecha(partido.utcDate);
            let statusClass = isEmpezado && !hasResultadoReal ? 'live' : (hasResultadoReal ? 'finished' : '');

            const disabledClass = isEmpezado ? 'disabled' : '';

            // Banderas (usar imagen de API o fallback)
            const homeFlag = partido.homeCrest ? `<img src="${partido.homeCrest}" class="flag" alt="bandera">` : `<span class="flag-emoji">🏳️</span>`;
            const awayFlag = partido.awayCrest ? `<img src="${partido.awayCrest}" class="flag" alt="bandera">` : `<span class="flag-emoji">🏳️</span>`;

            // Clases para mostrar selección
            const homeSelectedClass = predSeleccionada === 'home' ? 'selected' : '';
            const awaySelectedClass = predSeleccionada === 'away' ? 'selected' : '';

            // Normalizar stage nombre
            let stageName = partido.stage.replace('_', ' ');

            const cardHtml = `
                <div class="${cardClasses}" data-id="${partido.id}">
                    <div class="match-header">
                        <span>${stageName}</span>
                        <span class="match-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="teams-container">
                        <div class="team team-selectable ${homeSelectedClass} ${disabledClass}" data-match-id="${partido.id}" data-team="home">
                            ${homeFlag}
                            <span class="team-name">${partido.homeTeam}</span>
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team team-selectable ${awaySelectedClass} ${disabledClass}" data-match-id="${partido.id}" data-team="away">
                            ${awayFlag}
                            <span class="team-name">${partido.awayTeam}</span>
                        </div>
                    </div>
                    ${puntosHtml}
                </div>
            `;
            matchesContainer.innerHTML += cardHtml;
        });

        // Añadir eventos de click a los equipos
        document.querySelectorAll('.team-selectable:not(.disabled)').forEach(teamDiv => {
            teamDiv.addEventListener('click', function() {
                const matchId = this.dataset.matchId;
                const team = this.dataset.team;
                
                // Buscar el contenedor padre
                const parentContainer = this.closest('.teams-container');
                // Quitar selected de ambos
                parentContainer.querySelectorAll('.team-selectable').forEach(el => el.classList.remove('selected'));
                // Poner selected al clickado
                this.classList.add('selected');
            });
        });
    };

    // Guardar Predicciones (solo qué equipo gana)
    if (savePredictionsBtn) {
        savePredictionsBtn.addEventListener('click', () => {
            const usuarioActual = localStorage.getItem('usuarioLogueado');
            if (!usuarioActual) return;

            const ahora = new Date();
            let predicciones = JSON.parse(localStorage.getItem(`predicciones_v2_${usuarioActual}`)) || {};
            let hayCambios = false;

            // Recorrer el DOM para buscar seleccionados
            document.querySelectorAll('.match-card').forEach(card => {
                const matchId = card.dataset.id;
                const partidoObj = partidos.find(p => p.id == matchId);
                
                if (partidoObj) {
                    const fechaPartido = new Date(partidoObj.utcDate);
                    // Solo guarda si el partido NO ha empezado
                    if (ahora < fechaPartido && partidoObj.status === 'TIMED' || partidoObj.status === 'SCHEDULED') {
                        const selectedTeam = card.querySelector('.team.selected');
                        if (selectedTeam) {
                            const val = selectedTeam.dataset.team; // 'home' o 'away'
                            if (predicciones[matchId] !== val) {
                                predicciones[matchId] = val;
                                hayCambios = true;
                            }
                        }
                    }
                }
            });

            if (hayCambios) {
                localStorage.setItem(`predicciones_v2_${usuarioActual}`, JSON.stringify(predicciones));
                mostrarToast('¡Pronósticos guardados correctamente!');
                renderPartidos();
            } else {
                mostrarToast('No hay nuevos pronósticos o los partidos ya han empezado.');
            }
        });
    }

    const mostrarToast = (mensaje) => {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const iniciarSeccionPartidos = async () => {
        await fetchResultadosReales();
        renderPartidos();
        
        setInterval(() => {
            // Actualización visual periódica para bloquear si llegó la hora
            renderPartidos();
        }, 60000);
    };

    checkSession();
});

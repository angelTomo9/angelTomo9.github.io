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
        // Soporte retrocompatible por si ya estaban con 'porraMundialUser'
        const storedUser = localStorage.getItem('usuarioLogueado') || localStorage.getItem('porraMundialUser');
        if (storedUser) {
            // Aseguramos que se guarde en la clave que pidió el usuario
            localStorage.setItem('usuarioLogueado', storedUser);
            
            displayUser.textContent = `Hola, ${storedUser}`;
            loginScreen.classList.remove('active');
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            mainScreen.classList.add('active');
            
            // Iniciar lógica de partidos del Paso 2
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
        localStorage.removeItem('porraMundialUser');
        usernameInput.value = '';
        secretCodeInput.value = '';
        errorMessage.classList.add('hidden');
        
        switchScreen(mainScreen, loginScreen);
    });

    // --- PASO 2: SECCIÓN DE PARTIDOS, API Y PREDICCIONES ---
    const matchesContainer = document.getElementById('matches-container');
    const savePredictionsBtn = document.getElementById('save-predictions-btn');
    
    // 1. Estructura de Datos (Simulando respuesta de API)
    let partidos = [
        {
            id: 1,
            equipoLocal: 'España',
            equipoVisitante: 'Croacia',
            banderaLocal: '🇪🇸',
            banderaVisitante: '🇭🇷',
            fechaHora: '2026-06-15T18:00:00', // Fecha futura (abierto)
            resultadoReal: { golesLocal: null, golesVisitante: null }
        },
        {
            id: 2,
            equipoLocal: 'Brasil',
            equipoVisitante: 'Suiza',
            banderaLocal: '🇧🇷',
            banderaVisitante: '🇨🇭',
            fechaHora: '2026-06-16T21:00:00', // Fecha futura (abierto)
            resultadoReal: { golesLocal: null, golesVisitante: null }
        },
        {
            id: 3,
            equipoLocal: 'Argentina',
            equipoVisitante: 'México',
            banderaLocal: '🇦🇷',
            banderaVisitante: '🇲🇽',
            fechaHora: '2026-06-10T20:00:00', // Fecha pasada (cerrado, con resultado)
            resultadoReal: { golesLocal: 2, golesVisitante: 1 } 
        }
    ];

    // 2. Integración con API (Simulador Fetch)
    const fetchResultadosReales = async () => {
        /* 
        // ESTRUCTURA PARA API REAL (Ej: football-data.org o API-Football)
        try {
            // Ejemplo con API-Football
            const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': 'TU_API_KEY_AQUI'
                }
            });
            const data = await response.json();
            
            // Lógica de mapeo de datos reales a nuestra estructura de "partidos"
            // Por ejemplo:
            // data.response.forEach(fixture => {
            //     // Buscar por ID y actualizar "resultadoReal" si el status es "Finalizado" (FT)
            //     if (fixture.fixture.status.short === 'FT') {
            //         actualizarResultado(fixture.fixture.id, fixture.goals.home, fixture.goals.away);
            //     }
            // });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        */

        // SIMULACIÓN: Aquí podríamos actualizar los partidos dinámicamente.
        console.log("Resultados obtenidos de la API (simulada).");
    };

    // Formatear la fecha para mostrarla amigable
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

    // 3. Renderizar Tarjetas
    const renderPartidos = () => {
        if (!matchesContainer) return;
        matchesContainer.innerHTML = '';

        const usuarioActual = localStorage.getItem('usuarioLogueado');
        const prediccionesGuardadas = JSON.parse(localStorage.getItem(`predicciones_${usuarioActual}`)) || {};
        const ahora = new Date();

        partidos.forEach(partido => {
            const fechaPartido = new Date(partido.fechaHora);
            
            // 4. Bloqueo de Seguridad por Fecha/Hora
            const isEmpezado = ahora >= fechaPartido;
            const hasResultadoReal = partido.resultadoReal.golesLocal !== null && partido.resultadoReal.golesVisitante !== null;
            
            // Obtener predicción del usuario si existe
            const predLocal = prediccionesGuardadas[partido.id]?.local ?? '';
            const predVisit = prediccionesGuardadas[partido.id]?.visitante ?? '';

            // Determinar clases de estilo y bloqueo
            let cardClasses = 'match-card';
            let puntosHtml = '';

            // 5. Comparación Visual en Tiempo Real
            if (hasResultadoReal && predLocal !== '' && predVisit !== '') {
                const golesLocalReal = partido.resultadoReal.golesLocal;
                const golesVisitanteReal = partido.resultadoReal.golesVisitante;
                const pLocal = parseInt(predLocal);
                const pVisit = parseInt(predVisit);

                const realResult = Math.sign(golesLocalReal - golesVisitanteReal);
                const predResult = Math.sign(pLocal - pVisit);

                if (golesLocalReal === pLocal && golesVisitanteReal === pVisit) {
                    // Acierto perfecto (3 puntos)
                    cardClasses += ' acierto-perfecto';
                    puntosHtml = '<div class="puntos-badge puntos-3">+3 Puntos (Pleno exacto)</div>';
                } else if (realResult === predResult) {
                    // Acierto tendencia (1 punto)
                    cardClasses += ' acierto-tendencia';
                    puntosHtml = '<div class="puntos-badge puntos-1">+1 Punto (Tendencia)</div>';
                } else {
                    // Error total (0 puntos)
                    cardClasses += ' error-total';
                    puntosHtml = '<div class="puntos-badge puntos-0">0 Puntos (Fallo)</div>';
                }
            }

            let statusText = isEmpezado ? (hasResultadoReal ? 'Finalizado' : 'En juego') : formatFecha(partido.fechaHora);
            let statusClass = isEmpezado && !hasResultadoReal ? 'live' : (hasResultadoReal ? 'finished' : '');

            // Atributo disable si ya ha empezado
            const disabledAttr = isEmpezado ? 'disabled' : '';

            const cardHtml = `
                <div class="${cardClasses}" data-id="${partido.id}">
                    <div class="match-header">
                        <span>Fase de Grupos</span>
                        <span class="match-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="teams-container">
                        <div class="team">
                            <span class="flag">${partido.banderaLocal}</span>
                            <span class="team-name">${partido.equipoLocal}</span>
                            <div class="prediction-inputs">
                                <input type="number" min="0" max="20" class="score-input" 
                                       id="local-${partido.id}" value="${predLocal}" ${disabledAttr} placeholder="-">
                            </div>
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team">
                            <span class="flag">${partido.banderaVisitante}</span>
                            <span class="team-name">${partido.equipoVisitante}</span>
                            <div class="prediction-inputs">
                                <input type="number" min="0" max="20" class="score-input" 
                                       id="visitante-${partido.id}" value="${predVisit}" ${disabledAttr} placeholder="-">
                            </div>
                        </div>
                    </div>
                    ${puntosHtml}
                </div>
            `;
            matchesContainer.innerHTML += cardHtml;
        });
    };

    // Guardar Predicciones por Usuario
    if (savePredictionsBtn) {
        savePredictionsBtn.addEventListener('click', () => {
            const usuarioActual = localStorage.getItem('usuarioLogueado');
            if (!usuarioActual) return;

            const ahora = new Date();
            let predicciones = JSON.parse(localStorage.getItem(`predicciones_${usuarioActual}`)) || {};
            let hayCambios = false;

            partidos.forEach(partido => {
                const fechaPartido = new Date(partido.fechaHora);
                
                // Solo guardar si el partido NO ha empezado (Doble validación de seguridad)
                if (ahora < fechaPartido) {
                    const inputLocal = document.getElementById(`local-${partido.id}`);
                    const inputVisitante = document.getElementById(`visitante-${partido.id}`);
                    
                    if (inputLocal && inputVisitante) {
                        const valLocal = inputLocal.value;
                        const valVisitante = inputVisitante.value;
                        
                        // Solo guardar si hay valores numéricos introducidos
                        if (valLocal !== '' && valVisitante !== '') {
                            predicciones[partido.id] = {
                                local: parseInt(valLocal),
                                visitante: parseInt(valVisitante)
                            };
                            hayCambios = true;
                        }
                    }
                }
            });

            if (hayCambios) {
                localStorage.setItem(`predicciones_${usuarioActual}`, JSON.stringify(predicciones));
                mostrarToast('¡Pronósticos guardados correctamente!');
                renderPartidos(); // Re-render para mostrar posibles estilos actualizados
            } else {
                mostrarToast('No hay nuevos pronósticos válidos o los partidos ya han empezado.');
            }
        });
    }

    // Utilidad: Mostrar Toast Notification (mensaje emergente elegante)
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

    // Función principal para iniciar la sección cuando el usuario entra
    const iniciarSeccionPartidos = async () => {
        await fetchResultadosReales();
        renderPartidos();
        
        // Actualizar automáticamente cada minuto por si un partido empieza mientras está en la pantalla
        setInterval(() => {
            renderPartidos();
        }, 60000);
    };

    // Ejecución inicial 
    checkSession();
});

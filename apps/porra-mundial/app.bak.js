document.addEventListener('DOMContentLoaded', () => {
    // 1. Credenciales válidas
    const validUsers = ['ángel', 'angel', 'iker', 'ibai', 'xavi'];
    const secretCode = 'charos';

    // Referencias al DOM
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const secretCodeInput = document.getElementById('secret-code');
    const errorMessage = document.getElementById('error-message');
    const displayUser = document.getElementById('display-user');
    const logoutBtn = document.getElementById('logout-btn');

    // Función para quitar acentos
    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Función para manejar transiciones de pantalla de forma fluida
    const switchScreen = (hideScreen, showScreen) => {
        hideScreen.classList.remove('active');
        hideScreen.classList.add('hidden');
        
        setTimeout(() => {
            showScreen.classList.remove('hidden');
            showScreen.classList.add('active');
        }, 300); // 300ms de transición configurados en el CSS
    };

    // Comprobar si hay un usuario logueado en localStorage al cargar la página
    const checkSession = () => {
        const storedUser = localStorage.getItem('porraMundialUser');
        if (storedUser) {
            displayUser.textContent = `Hola, ${storedUser}`;
            // Saltamos el login directamente
            loginScreen.classList.remove('active');
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            mainScreen.classList.add('active');
        }
    };

    // Manejar el submit del formulario
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const code = secretCodeInput.value.trim();
        
        // Normalizamos el nombre (minúsculas y sin acentos)
        const normalizedUsername = removeAccents(username.toLowerCase());

        // Validar credenciales
        if (validUsers.includes(normalizedUsername) && code === secretCode) {
            // Credenciales correctas
            errorMessage.classList.add('hidden');
            
            // Formatear nombre para mostrarlo (primera letra mayúscula)
            const displayName = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
            
            // Guardar sesión
            localStorage.setItem('porraMundialUser', displayName);
            displayUser.textContent = `Hola, ${displayName}`;
            
            // Transición fluida al menú principal
            switchScreen(loginScreen, mainScreen);
        } else {
            // Error en las credenciales
            errorMessage.classList.remove('hidden');
            
            // Pequeña animación de error (opcional)
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    });

    // Funcionalidad extra: Botón de salir
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('porraMundialUser');
        usernameInput.value = '';
        secretCodeInput.value = '';
        errorMessage.classList.add('hidden');
        
        switchScreen(mainScreen, loginScreen);
    });

    // Iniciar
    checkSession();
});
// Inicializacion completada

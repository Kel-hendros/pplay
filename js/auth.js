/**
 * Authentication Module
 * Handles user authentication with Supabase
 */

const Auth = {
    currentUser: null,
    onAuthChangeCallbacks: [],

    /**
     * Initialize authentication
     */
    init: async () => {
        // Check for existing session
        try {
            const session = await db.auth.getSession();
            if (session?.user) {
                Auth.currentUser = session.user;
                Auth.notifyAuthChange(true);
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }

        // Listen for auth changes
        db.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                Auth.currentUser = session.user;
                Auth.notifyAuthChange(true);
            } else if (event === 'SIGNED_OUT') {
                Auth.currentUser = null;
                Auth.notifyAuthChange(false);
            }
        });
    },

    /**
     * Sign up a new user
     */
    signUp: async (email, password, username) => {
        try {
            const data = await db.auth.signUp(email, password, username);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in an existing user
     */
    signIn: async (email, password) => {
        try {
            const data = await db.auth.signIn(email, password);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign out the current user
     */
    signOut: async () => {
        try {
            await db.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return Auth.currentUser !== null;
    },

    /**
     * Get current user
     */
    getUser: () => {
        return Auth.currentUser;
    },

    /**
     * Get user ID
     */
    getUserId: () => {
        return Auth.currentUser?.id;
    },

    /**
     * Get username
     */
    getUsername: () => {
        return Auth.currentUser?.user_metadata?.username ||
               Auth.currentUser?.email?.split('@')[0] ||
               'Usuario';
    },

    /**
     * Register callback for auth state changes
     */
    onAuthChange: (callback) => {
        Auth.onAuthChangeCallbacks.push(callback);
    },

    /**
     * Notify all callbacks of auth state change
     */
    notifyAuthChange: (isAuthenticated) => {
        Auth.onAuthChangeCallbacks.forEach(cb => cb(isAuthenticated));
    }
};

// UI Controller for Auth Modal
const AuthUI = {
    modal: null,
    loginForm: null,
    registerForm: null,
    isLoginMode: true,

    init: () => {
        AuthUI.modal = document.getElementById('auth-modal');
        AuthUI.loginForm = document.getElementById('login-form');
        AuthUI.registerForm = document.getElementById('register-form');

        // Close button
        document.getElementById('auth-modal-close')?.addEventListener('click', AuthUI.close);

        // Switch between login/register
        document.getElementById('auth-switch-btn')?.addEventListener('click', AuthUI.toggleMode);

        // Form submissions
        AuthUI.loginForm?.addEventListener('submit', AuthUI.handleLogin);
        AuthUI.registerForm?.addEventListener('submit', AuthUI.handleRegister);

        // Close on overlay click
        AuthUI.modal?.addEventListener('click', (e) => {
            if (e.target === AuthUI.modal) AuthUI.close();
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await Auth.signOut();
            window.location.hash = '#login';
        });
    },

    open: (mode = 'login') => {
        AuthUI.isLoginMode = mode === 'login';
        AuthUI.updateMode();
        AuthUI.modal?.classList.add('active');
    },

    close: () => {
        AuthUI.modal?.classList.remove('active');
        AuthUI.clearErrors();
    },

    toggleMode: () => {
        AuthUI.isLoginMode = !AuthUI.isLoginMode;
        AuthUI.updateMode();
    },

    updateMode: () => {
        const title = document.getElementById('auth-modal-title');
        const switchText = document.getElementById('auth-switch-text');
        const switchBtn = document.getElementById('auth-switch-btn');

        if (AuthUI.isLoginMode) {
            title.textContent = 'Iniciar Sesión';
            AuthUI.loginForm.style.display = 'block';
            AuthUI.registerForm.style.display = 'none';
            switchText.textContent = '¿No tienes cuenta?';
            switchBtn.textContent = 'Regístrate';
        } else {
            title.textContent = 'Crear Cuenta';
            AuthUI.loginForm.style.display = 'none';
            AuthUI.registerForm.style.display = 'block';
            switchText.textContent = '¿Ya tienes cuenta?';
            switchBtn.textContent = 'Inicia Sesión';
        }

        AuthUI.clearErrors();
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        const btn = AuthUI.loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Iniciando...';

        const result = await Auth.signIn(email, password);

        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';

        if (result.success) {
            AuthUI.close();
            window.location.hash = '#character-sheet';
        } else {
            errorEl.textContent = result.error || 'Error al iniciar sesión';
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');

        const btn = AuthUI.registerForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Creando cuenta...';

        const result = await Auth.signUp(email, password, username);

        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';

        if (result.success) {
            AuthUI.close();
            Toast.show('¡Cuenta creada! Bienvenido a Perspective Play', 'success');
            window.location.hash = '#character-sheet';
        } else {
            errorEl.textContent = result.error || 'Error al crear cuenta';
        }
    },

    clearErrors: () => {
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
    }
};

// Toast Notification System
const Toast = {
    container: null,

    init: () => {
        Toast.container = document.getElementById('toast-container');
    },

    show: (message, type = 'info', duration = 4000) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        Toast.container?.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

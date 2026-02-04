/**
 * Main Application Controller
 * Handles routing and app initialization
 */

const App = {
    initialized: false,

    /**
     * Initialize the application
     */
    init: async () => {
        if (App.initialized) return;
        App.initialized = true;

        console.log('Initializing Perspective Play...');

        // Check if db is available
        if (typeof window.db === 'undefined') {
            console.error('Database module not loaded. Retrying in 100ms...');
            App.initialized = false;
            setTimeout(App.init, 100);
            return;
        }

        // Make db available as local variable
        const db = window.db;

        // Initialize Supabase
        await db.init();

        // Initialize components
        Toast.init();
        AuthUI.init();
        await Auth.init();
        Navbar.init();

        // Setup routing
        App.setupRouter();

        // Initial route
        App.handleRoute();

        // Listen for auth changes
        Auth.onAuthChange((isAuthenticated) => {
            if (isAuthenticated) {
                Navbar.show();
                // Redirect to character sheet if on login/register
                const hash = window.location.hash;
                if (hash === '#login' || hash === '#register' || hash === '') {
                    window.location.hash = '#character-sheet';
                }
            } else {
                Navbar.hide();
            }
        });

        console.log('Perspective Play initialized!');
    },

    /**
     * Setup hash-based router
     */
    setupRouter: () => {
        window.addEventListener('hashchange', App.handleRoute);
    },

    /**
     * Handle route changes
     */
    handleRoute: () => {
        const hash = window.location.hash || '#character-sheet';
        const [route, param] = hash.substring(1).split('/');

        console.log('Routing to:', route, param);

        // Check authentication for protected routes
        const publicRoutes = ['login', 'register'];
        if (!publicRoutes.includes(route) && !Auth.isAuthenticated()) {
            AuthUI.open(route === 'register' ? 'register' : 'login');
            return;
        }

        // Update navbar active state
        Navbar.updateActiveLink();

        // Hide loading
        document.getElementById('loading').style.display = 'none';

        // Route to appropriate view
        switch (route) {
            case 'login':
                AuthUI.open('login');
                break;

            case 'register':
                AuthUI.open('register');
                break;

            case 'character-sheet':
                AuthUI.close();
                CharacterSheetView.render();
                break;

            case 'scenarios':
                AuthUI.close();
                ScenariosCatalogView.render();
                break;

            case 'play':
                AuthUI.close();
                if (param) {
                    ScenarioPlayView.render(param);
                } else {
                    window.location.hash = '#scenarios';
                }
                break;

            case 'profile':
                AuthUI.close();
                ProfileView.render();
                break;

            default:
                // Default to character sheet
                window.location.hash = '#character-sheet';
                break;
        }
    },

    /**
     * Show global loading state
     */
    showLoading: () => {
        document.getElementById('loading').style.display = 'flex';
    },

    /**
     * Hide global loading state
     */
    hideLoading: () => {
        document.getElementById('loading').style.display = 'none';
    },

    /**
     * Navigate to a route
     */
    navigate: (route) => {
        window.location.hash = route;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

// Also initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    App.init();
}

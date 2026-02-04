/**
 * Admin Application Controller
 * Main controller for the admin panel
 */

const AdminApp = {
    isAdmin: false,

    /**
     * Initialize admin app
     */
    init: async () => {
        console.log('Initializing Admin App...');

        // Initialize Supabase
        await db.init();

        // Check authentication
        const session = await db.auth.getSession();

        if (!session) {
            // Redirect to login
            window.location.href = 'app.html';
            return;
        }

        // Check admin status
        AdminApp.isAdmin = await AdminDB.isAdmin();

        if (!AdminApp.isAdmin) {
            AdminApp.showAccessDenied();
            return;
        }

        // Setup UI
        AdminApp.setupUI();

        // Setup routing
        AdminApp.setupRouting();

        // Hide loading, show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('admin-main').style.display = 'block';

        // Navigate to current route
        AdminApp.handleRoute();

        console.log('Admin App initialized');
    },

    /**
     * Show access denied screen
     */
    showAccessDenied: () => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('access-denied').style.display = 'flex';
        document.getElementById('admin-main').style.display = 'none';
        document.getElementById('admin-navbar').style.display = 'none';
    },

    /**
     * Setup UI elements
     */
    setupUI: () => {
        // Update user info
        const user = Auth.getUsername();
        document.getElementById('user-name').textContent = user || 'Admin';
        document.getElementById('user-avatar').textContent = (user || 'A').charAt(0).toUpperCase();

        // Logout handler
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await db.auth.signOut();
            window.location.href = 'app.html';
        });
    },

    /**
     * Setup hash-based routing
     */
    setupRouting: () => {
        window.addEventListener('hashchange', AdminApp.handleRoute);
    },

    /**
     * Handle route changes
     */
    handleRoute: () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const [route, param] = hash.split('/');

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkRoute = link.dataset.route;
            link.classList.toggle('active', linkRoute === route);
        });

        // Route to appropriate view
        switch (route) {
            case 'dashboard':
                AdminDashboard.render();
                break;

            case 'scenarios':
                if (param) {
                    ScenarioEditor.render(param);
                } else {
                    ScenariosList.render();
                }
                break;

            case 'skills':
                SkillsManager.render();
                break;

            default:
                AdminDashboard.render();
        }
    }
};

// Toast utility (if not already defined)
if (typeof Toast === 'undefined') {
    window.Toast = {
        show: (message, type = 'info') => {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
                <span class="toast-message">${message}</span>
            `;

            container.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', AdminApp.init);

console.log('admin-app.js loaded');

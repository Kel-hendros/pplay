/**
 * Navbar Component
 * Handles navigation and user menu
 */

const Navbar = {
    init: () => {
        // Update active nav link based on current route
        Navbar.updateActiveLink();

        // User dropdown toggle
        const userMenuBtn = document.getElementById('user-menu-btn');
        const dropdown = userMenuBtn?.closest('.dropdown');

        userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown?.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown?.classList.remove('active');
        });

        // Listen for auth changes
        Auth.onAuthChange(Navbar.updateUserInfo);
    },

    updateActiveLink: () => {
        const hash = window.location.hash || '#character-sheet';
        const route = hash.split('/')[0].replace('#', '');

        document.querySelectorAll('.nav-link').forEach(link => {
            const linkRoute = link.dataset.route;
            if (linkRoute === route || (route === 'play' && linkRoute === 'scenarios')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    updateUserInfo: (isAuthenticated) => {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const navbarUser = document.getElementById('navbar-user');

        if (isAuthenticated && Auth.currentUser) {
            const username = Auth.getUsername();
            userAvatar.textContent = username.charAt(0).toUpperCase();
            userName.textContent = username;
            navbarUser.style.display = 'block';
        } else {
            navbarUser.style.display = 'none';
        }
    },

    show: () => {
        document.getElementById('app-navbar').style.display = 'flex';
    },

    hide: () => {
        document.getElementById('app-navbar').style.display = 'none';
    }
};

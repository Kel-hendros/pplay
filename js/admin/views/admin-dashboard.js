/**
 * Admin Dashboard View
 */

const AdminDashboard = {
    stats: null,

    /**
     * Render dashboard
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="admin-dashboard">
                <div class="dashboard-header">
                    <h1>Dashboard de Administración</h1>
                    <p>Gestiona escenarios, personajes y habilidades de Perspective Play</p>
                </div>

                <div class="dashboard-stats" id="dashboard-stats">
                    <div class="loading-container">
                        <div class="spinner"></div>
                    </div>
                </div>

                <div class="dashboard-actions">
                    <a href="#scenarios/new" class="btn btn-primary">
                        ➕ Nuevo Escenario
                    </a>
                    <a href="#scenarios" class="btn btn-secondary">
                        📋 Ver Escenarios
                    </a>
                    <a href="#skills" class="btn btn-secondary">
                        ⭐ Gestionar Habilidades
                    </a>
                </div>
            </div>
        `;

        await AdminDashboard.loadStats();
    },

    /**
     * Load dashboard stats
     */
    loadStats: async () => {
        try {
            const stats = await AdminDB.stats.getDashboard();
            AdminDashboard.stats = stats;

            const statsContainer = document.getElementById('dashboard-stats');
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-card-icon">🎮</div>
                    <div class="stat-card-value">${stats.totalScenarios}</div>
                    <div class="stat-card-label">Escenarios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">⭐</div>
                    <div class="stat-card-value">${stats.totalSkills}</div>
                    <div class="stat-card-label">Habilidades</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">👥</div>
                    <div class="stat-card-value">${stats.totalUsers}</div>
                    <div class="stat-card-label">Usuarios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">✅</div>
                    <div class="stat-card-value">${stats.completedSessions}</div>
                    <div class="stat-card-label">Sesiones Completadas</div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('dashboard-stats').innerHTML = `
                <div class="empty-state">
                    <p>Error al cargar estadísticas</p>
                </div>
            `;
        }
    }
};

console.log('admin-dashboard.js loaded');

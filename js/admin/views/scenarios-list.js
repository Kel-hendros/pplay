/**
 * Scenarios List View
 * Admin list of all scenarios with CRUD actions
 */

const ScenariosList = {
    scenarios: [],

    /**
     * Render scenarios list
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="scenarios-admin">
                <div class="page-header">
                    <h1>Escenarios</h1>
                    <a href="#scenarios/new" class="btn btn-primary">
                        ➕ Nuevo Escenario
                    </a>
                </div>

                <div class="scenarios-table" id="scenarios-table">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Cargando escenarios...</p>
                    </div>
                </div>
            </div>
        `;

        await ScenariosList.loadScenarios();
    },

    /**
     * Load scenarios from database
     */
    loadScenarios: async () => {
        try {
            ScenariosList.scenarios = await AdminDB.scenarios.getAll();
            ScenariosList.renderTable();
        } catch (error) {
            console.error('Error loading scenarios:', error);
            document.getElementById('scenarios-table').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <h3>Error al cargar</h3>
                    <p>No se pudieron cargar los escenarios</p>
                </div>
            `;
        }
    },

    /**
     * Render scenarios table
     */
    renderTable: () => {
        const tableContainer = document.getElementById('scenarios-table');

        if (ScenariosList.scenarios.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-2xl);">
                    <div class="empty-state-icon">🎮</div>
                    <h3>No hay escenarios</h3>
                    <p>Crea tu primer escenario para comenzar</p>
                    <a href="#scenarios/new" class="btn btn-primary">Crear Escenario</a>
                </div>
            `;
            return;
        }

        const difficultyLabels = {
            beginner: { label: 'Principiante', class: 'beginner' },
            intermediate: { label: 'Intermedio', class: 'intermediate' },
            advanced: { label: 'Avanzado', class: 'advanced' }
        };

        tableContainer.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Escenario</th>
                        <th>Dificultad</th>
                        <th>Habilidades</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${ScenariosList.scenarios.map(scenario => {
                        const difficulty = difficultyLabels[scenario.difficulty] || difficultyLabels.beginner;
                        const skills = scenario.scenario_skills?.map(ss => ss.skill?.name).filter(Boolean).join(', ') || '-';

                        return `
                            <tr>
                                <td>
                                    <div class="scenario-title-cell">
                                        <div class="avatar">${scenario.is_premium ? '👑' : '🎮'}</div>
                                        <div>
                                            <strong>${scenario.title}</strong>
                                            <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                                                ${scenario.estimated_time || 15} min
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge scenario-difficulty ${difficulty.class}">
                                        ${difficulty.label}
                                    </span>
                                </td>
                                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                                    ${skills}
                                </td>
                                <td>
                                    ${scenario.is_published !== false
                                        ? '<span class="badge badge-primary">Publicado</span>'
                                        : '<span class="badge">Borrador</span>'}
                                </td>
                                <td>
                                    <div class="scenario-actions">
                                        <a href="#scenarios/${scenario.id}" class="btn btn-sm btn-secondary">
                                            ✏️ Editar
                                        </a>
                                        <button class="btn btn-sm btn-ghost" onclick="ScenariosList.duplicate('${scenario.id}')">
                                            📋
                                        </button>
                                        <button class="btn btn-sm btn-ghost danger" onclick="ScenariosList.delete('${scenario.id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Delete scenario
     */
    delete: async (id) => {
        const scenario = ScenariosList.scenarios.find(s => s.id === id);
        if (!confirm(`¿Eliminar el escenario "${scenario?.title}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await AdminDB.scenarios.delete(id);
            Toast.show('Escenario eliminado', 'success');
            await ScenariosList.loadScenarios();
        } catch (error) {
            console.error('Error deleting scenario:', error);
            Toast.show('Error al eliminar el escenario', 'error');
        }
    },

    /**
     * Duplicate scenario
     */
    duplicate: async (id) => {
        try {
            const scenario = ScenariosList.scenarios.find(s => s.id === id);
            if (!scenario) return;

            const newScenario = {
                ...scenario,
                id: undefined,
                title: `${scenario.title} (copia)`,
                is_published: false,
                created_at: undefined
            };

            delete newScenario.scenario_skills;

            const created = await AdminDB.scenarios.create(newScenario);

            // Copy skills
            if (scenario.scenario_skills?.length > 0) {
                await AdminDB.scenarios.updateSkills(
                    created.id,
                    scenario.scenario_skills.map(ss => ss.skill.id)
                );
            }

            Toast.show('Escenario duplicado', 'success');
            window.location.hash = `#scenarios/${created.id}`;
        } catch (error) {
            console.error('Error duplicating scenario:', error);
            Toast.show('Error al duplicar el escenario', 'error');
        }
    }
};

console.log('scenarios-list.js loaded');

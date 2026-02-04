/**
 * Scenarios Catalog View
 * Displays available scenarios with filters
 */

const ScenariosCatalogView = {
    scenarios: [],
    currentFilter: 'all',

    /**
     * Render the scenarios catalog
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading-container"><div class="spinner spinner-lg"></div><p>Cargando escenarios...</p></div>';

        try {
            const userId = Auth.getUserId();

            // Fetch scenarios
            ScenariosCatalogView.scenarios = await db.scenarios.getAllScenarios();

            // Fetch user progress for each scenario
            const progressPromises = ScenariosCatalogView.scenarios.map(async (scenario) => {
                const progress = await db.scenarios.getUserScenarioProgress(userId, scenario.id);
                return { scenarioId: scenario.id, progress };
            });

            const progressResults = await Promise.all(progressPromises);
            const progressMap = {};
            progressResults.forEach(({ scenarioId, progress }) => {
                progressMap[scenarioId] = progress;
            });

            // Get unique skills for filters
            const allSkills = new Set();
            ScenariosCatalogView.scenarios.forEach(scenario => {
                scenario.scenario_skills?.forEach(ss => {
                    if (ss.skill?.name) {
                        allSkills.add(ss.skill.name);
                    }
                });
            });

            // Render
            container.innerHTML = `
                <div class="scenarios-catalog">
                    <div class="catalog-header">
                        <h1>Escenarios de Práctica</h1>
                        <div class="catalog-filters">
                            <button class="filter-btn active" data-filter="all">Todos</button>
                            <button class="filter-btn" data-filter="beginner">Principiante</button>
                            <button class="filter-btn" data-filter="intermediate">Intermedio</button>
                            <button class="filter-btn" data-filter="advanced">Avanzado</button>
                            <button class="filter-btn" data-filter="completed">Completados</button>
                        </div>
                    </div>

                    <div class="scenarios-grid" id="scenarios-grid">
                        ${ScenariosCatalogView.renderScenarios(ScenariosCatalogView.scenarios, progressMap)}
                    </div>
                </div>
            `;

            // Setup filter handlers
            ScenariosCatalogView.setupFilters(progressMap);

            // Setup card click handlers
            ScenariosCatalogView.setupCardHandlers();

        } catch (error) {
            console.error('Error loading scenarios:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <h3 class="empty-state-title">Error al cargar</h3>
                    <p class="empty-state-description">No pudimos cargar los escenarios. Intenta de nuevo.</p>
                    <button class="btn btn-primary" onclick="ScenariosCatalogView.render()">Reintentar</button>
                </div>
            `;
        }
    },

    /**
     * Render scenario cards
     */
    renderScenarios: (scenarios, progressMap) => {
        if (scenarios.length === 0) {
            return `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🎮</div>
                    <h3 class="empty-state-title">No hay escenarios</h3>
                    <p class="empty-state-description">No encontramos escenarios con ese filtro.</p>
                </div>
            `;
        }

        return scenarios.map(scenario => {
            const progress = progressMap[scenario.id];
            return ScenarioCard.render(scenario, progress);
        }).join('');
    },

    /**
     * Setup filter button handlers
     */
    setupFilters: (progressMap) => {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply filter
                const filter = btn.dataset.filter;
                ScenariosCatalogView.currentFilter = filter;

                let filtered = ScenariosCatalogView.scenarios;

                if (filter === 'completed') {
                    filtered = ScenariosCatalogView.scenarios.filter(s =>
                        progressMap[s.id]?.status === 'completed'
                    );
                } else if (filter !== 'all') {
                    filtered = ScenariosCatalogView.scenarios.filter(s =>
                        s.difficulty === filter
                    );
                }

                // Re-render grid
                const grid = document.getElementById('scenarios-grid');
                grid.innerHTML = ScenariosCatalogView.renderScenarios(filtered, progressMap);

                // Re-setup handlers
                ScenariosCatalogView.setupCardHandlers();
            });
        });
    },

    /**
     * Setup scenario card click handlers
     */
    setupCardHandlers: () => {
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                const scenarioId = card.dataset.scenarioId;
                const scenario = ScenariosCatalogView.scenarios.find(s => s.id === scenarioId);

                if (scenario?.is_premium) {
                    Toast.show('Este escenario es premium. Próximamente disponible.', 'warning');
                    return;
                }

                window.location.hash = `#play/${scenarioId}`;
            });
        });
    }
};

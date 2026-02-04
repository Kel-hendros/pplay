/**
 * Character Sheet View
 * Displays user's skills and progress
 */

const CharacterSheetView = {
    /**
     * Render the character sheet
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading-container"><div class="spinner spinner-lg"></div><p>Cargando tu personaje...</p></div>';

        try {
            const userId = Auth.getUserId();
            const username = Auth.getUsername();

            // Fetch user skills
            const userSkills = await db.skills.getUserSkills(userId);

            // Calculate totals
            const totalPoints = userSkills.reduce((sum, us) => sum + (us.current_points || 0), 0);
            const totalLevels = userSkills.reduce((sum, us) => sum + (us.current_level || 0), 0);
            const averageLevel = userSkills.length > 0 ? Math.round(totalLevels / userSkills.length) : 0;

            // Group skills by category
            const skillsByCategory = {};
            userSkills.forEach(us => {
                const category = us.skill?.category || 'General';
                if (!skillsByCategory[category]) {
                    skillsByCategory[category] = [];
                }
                skillsByCategory[category].push(us);
            });

            // Render
            container.innerHTML = `
                <div class="character-sheet">
                    <div class="character-header">
                        <div class="character-avatar">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div class="character-info">
                            <h1>${username}</h1>
                            <div class="character-level">
                                <span class="level-badge">Nivel ${averageLevel}</span>
                                <span>Aprendiz de Soft Skills</span>
                            </div>
                            <div class="character-stats">
                                <div class="stat-item">
                                    <div class="stat-value">${totalPoints}</div>
                                    <div class="stat-label">Puntos Totales</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${userSkills.length}</div>
                                    <div class="stat-label">Habilidades</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${CharacterSheetView.getCompletedScenarios()}</div>
                                    <div class="stat-label">Escenarios</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${Object.entries(skillsByCategory).map(([category, skills]) => `
                        <div class="skills-section">
                            <h2>🎯 ${category}</h2>
                            <div class="skills-grid">
                                ${skills.map(us => SkillCard.render(us)).join('')}
                            </div>
                        </div>
                    `).join('')}

                    <div class="cta-section" style="text-align: center; padding: var(--spacing-2xl) 0;">
                        <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-lg);">
                            Mejora tus habilidades completando escenarios
                        </p>
                        <a href="#scenarios" class="btn btn-primary btn-large">
                            Ver Escenarios Disponibles
                        </a>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading character sheet:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <h3 class="empty-state-title">Error al cargar</h3>
                    <p class="empty-state-description">No pudimos cargar tu hoja de personaje. Intenta de nuevo.</p>
                    <button class="btn btn-primary" onclick="CharacterSheetView.render()">Reintentar</button>
                </div>
            `;
        }
    },

    /**
     * Get completed scenarios count (mock for now)
     */
    getCompletedScenarios: () => {
        // This would typically come from the database
        return localStorage.getItem('completedScenarios') || '0';
    },

    /**
     * Update a specific skill card after earning points
     */
    updateSkillCard: async (skillId) => {
        const userId = Auth.getUserId();
        const userSkills = await db.skills.getUserSkills(userId);
        const userSkill = userSkills.find(us => us.skill_id === skillId);

        if (userSkill) {
            const card = document.querySelector(`.skill-card[data-skill-id="${skillId}"]`);
            if (card) {
                card.outerHTML = SkillCard.render(userSkill);
            }
        }
    }
};

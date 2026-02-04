/**
 * Scenario Card Component
 * Renders scenario cards for the catalog
 */

const ScenarioCard = {
    /**
     * Render a scenario card
     */
    render: (scenario, userProgress = null) => {
        const difficultyClass = scenario.difficulty || 'beginner';
        const difficultyLabels = {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado'
        };

        const skills = scenario.scenario_skills?.map(ss => ss.skill) || [];
        const isPremium = scenario.is_premium;
        const isCompleted = userProgress?.status === 'completed';
        const earnedPoints = userProgress?.points_earned || 0;

        // Emoji for scenario image based on title keywords
        const emoji = ScenarioCard.getScenarioEmoji(scenario.title);

        return `
            <div class="scenario-card ${isPremium ? 'premium' : ''}" data-scenario-id="${scenario.id}">
                <div class="scenario-card-image">
                    ${emoji}
                </div>
                <div class="scenario-card-content">
                    <div class="scenario-card-badges">
                        <span class="badge scenario-difficulty ${difficultyClass}">
                            ${difficultyLabels[difficultyClass]}
                        </span>
                        ${isPremium ? '<span class="badge badge-premium">⭐ Premium</span>' : ''}
                        ${isCompleted ? '<span class="badge badge-success">✓ Completado</span>' : ''}
                    </div>
                    <h3 class="scenario-card-title">${scenario.title}</h3>
                    <p class="scenario-card-description">${scenario.description}</p>
                    <div class="scenario-card-skills">
                        ${skills.map(s => `<span class="skill-tag">${s.icon || '⭐'} ${s.name}</span>`).join('')}
                    </div>
                    <div class="scenario-card-footer">
                        <span class="scenario-card-time">
                            🕐 ${scenario.estimated_time || 15} min
                        </span>
                        <div class="scenario-card-progress">
                            ${ScenarioCard.renderStars(earnedPoints, scenario.max_points || 3)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render star rating
     */
    renderStars: (earned, max) => {
        let stars = '';
        for (let i = 0; i < max; i++) {
            stars += `<span class="star ${i < earned ? 'filled' : ''}">★</span>`;
        }
        return `<div class="stars">${stars}</div>`;
    },

    /**
     * Get emoji for scenario based on title
     */
    getScenarioEmoji: (title) => {
        const lower = title.toLowerCase();
        if (lower.includes('budget') || lower.includes('presupuesto')) return '💰';
        if (lower.includes('feedback')) return '💬';
        if (lower.includes('presentación') || lower.includes('presentacion') || lower.includes('directorio')) return '📊';
        if (lower.includes('conflicto')) return '⚡';
        if (lower.includes('cliente')) return '🤝';
        if (lower.includes('equipo')) return '👥';
        if (lower.includes('negociación') || lower.includes('negociacion')) return '🤝';
        return '🎯';
    },

    /**
     * Render scenario list item (compact version)
     */
    renderListItem: (scenario, userProgress = null) => {
        const isCompleted = userProgress?.status === 'completed';
        const earnedPoints = userProgress?.points_earned || 0;

        return `
            <div class="history-item" data-scenario-id="${scenario.id}">
                <div class="history-item-info">
                    <h4>${scenario.title}</h4>
                    <span class="history-item-date">
                        ${userProgress?.completed_at ?
                            new Date(userProgress.completed_at).toLocaleDateString('es') :
                            'No completado'}
                    </span>
                </div>
                ${ScenarioCard.renderStars(earnedPoints, scenario.max_points || 3)}
            </div>
        `;
    }
};

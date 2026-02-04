/**
 * Skill Card Component
 * Renders individual skill cards for the character sheet
 */

const SkillCard = {
    /**
     * Render a skill card
     */
    render: (userSkill) => {
        const skill = userSkill.skill;
        const level = userSkill.current_level || 0;
        const points = userSkill.current_points || 0;
        const maxLevel = skill.max_level || 10;
        const pointsInLevel = points % 10;
        const progressPercent = (pointsInLevel / 10) * 100;

        // Determine skill type for styling
        const skillType = SkillCard.getSkillType(skill.name);

        return `
            <div class="skill-card" data-skill-id="${skill.id}">
                <div class="skill-card-header">
                    <div class="skill-card-icon ${skillType}">
                        ${skill.icon || '⭐'}
                    </div>
                    <div>
                        <div class="skill-card-title">${skill.name}</div>
                        <div class="skill-card-level">Nivel ${level} / ${maxLevel}</div>
                    </div>
                </div>
                <div class="skill-card-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill ${skillType}" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="skill-card-details">
                    <span>${pointsInLevel}/10 puntos para siguiente nivel</span>
                    <span>${points} pts total</span>
                </div>
            </div>
        `;
    },

    /**
     * Get skill type for styling
     */
    getSkillType: (skillName) => {
        const name = skillName.toLowerCase();
        if (name.includes('comunicación') || name.includes('comunicacion')) return 'communication';
        if (name.includes('negociación') || name.includes('negociacion')) return 'negotiation';
        if (name.includes('persuasión') || name.includes('persuasion')) return 'persuasion';
        if (name.includes('escucha')) return 'listening';
        return 'communication'; // default
    },

    /**
     * Render skill tag (small version)
     */
    renderTag: (skill) => {
        return `
            <span class="skill-tag">
                ${skill.icon || '⭐'} ${skill.name}
            </span>
        `;
    },

    /**
     * Render skill earned summary (for completion screen)
     */
    renderEarned: (skill, points) => {
        return `
            <div class="skill-earned">
                <div class="skill-earned-icon">${skill.icon || '⭐'}</div>
                <div class="skill-earned-name">${skill.name}</div>
                <div class="skill-earned-points">+${points} puntos</div>
            </div>
        `;
    }
};

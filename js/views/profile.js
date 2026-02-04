/**
 * Profile View
 * Displays user profile, history and certifications
 */

const ProfileView = {
    /**
     * Render the profile view
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading-container"><div class="spinner spinner-lg"></div><p>Cargando perfil...</p></div>';

        try {
            const userId = Auth.getUserId();
            const username = Auth.getUsername();
            const email = Auth.currentUser?.email || '';

            // Fetch user data
            const [userSkills, history] = await Promise.all([
                db.skills.getUserSkills(userId),
                db.sessions.getUserHistory(userId)
            ]);

            // Calculate stats
            const totalPoints = userSkills.reduce((sum, us) => sum + (us.current_points || 0), 0);
            const completedScenarios = history.length;
            const totalTime = history.reduce((sum, h) => sum + (h.scenario?.estimated_time || 15), 0);

            // Calculate certifications (skills at level 3+)
            const certifications = userSkills.filter(us => us.current_level >= 3);

            container.innerHTML = `
                <div class="profile-view">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div class="profile-info">
                            <h1>${username}</h1>
                            <p class="profile-email">${email}</p>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <div class="stat-value">${totalPoints}</div>
                                    <div class="stat-label">Puntos XP</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${completedScenarios}</div>
                                    <div class="stat-label">Escenarios</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${Math.round(totalTime / 60)}h</div>
                                    <div class="stat-label">Tiempo de Práctica</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h2>🏆 Certificaciones</h2>
                        ${certifications.length > 0 ? `
                            <div class="certifications-grid">
                                ${certifications.map(cert => ProfileView.renderCertification(cert)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">🎯</div>
                                <h3 class="empty-state-title">Sin certificaciones aún</h3>
                                <p class="empty-state-description">
                                    Alcanza nivel 3 en una habilidad para obtener tu primera certificación.
                                </p>
                            </div>
                        `}
                    </div>

                    <div class="profile-section">
                        <h2>📜 Historial de Escenarios</h2>
                        ${history.length > 0 ? `
                            <div class="history-list">
                                ${history.slice(0, 10).map(h => ProfileView.renderHistoryItem(h)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">🎮</div>
                                <h3 class="empty-state-title">Sin historial</h3>
                                <p class="empty-state-description">
                                    Completa tu primer escenario para ver tu historial aquí.
                                </p>
                                <a href="#scenarios" class="btn btn-primary">Ver Escenarios</a>
                            </div>
                        `}
                    </div>

                    <div class="profile-section">
                        <h2>⚙️ Configuración</h2>
                        <div class="card">
                            <div class="card-body">
                                <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-lg);">
                                    Gestiona tu cuenta y preferencias.
                                </p>
                                <button class="btn btn-secondary" onclick="ProfileView.handleLogout()">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading profile:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <h3 class="empty-state-title">Error al cargar</h3>
                    <p class="empty-state-description">No pudimos cargar tu perfil. Intenta de nuevo.</p>
                    <button class="btn btn-primary" onclick="ProfileView.render()">Reintentar</button>
                </div>
            `;
        }
    },

    /**
     * Render certification card
     */
    renderCertification: (userSkill) => {
        const skill = userSkill.skill;
        const level = userSkill.current_level;

        const levelTitles = {
            3: 'Competente',
            4: 'Hábil',
            5: 'Experto',
            6: 'Maestro',
            7: 'Gran Maestro',
            8: 'Virtuoso',
            9: 'Leyenda',
            10: 'Trascendente'
        };

        const title = levelTitles[Math.min(level, 10)] || 'Competente';

        return `
            <div class="certification-card">
                <div class="certification-badge">${skill.icon || '🏅'}</div>
                <h4 class="certification-name">${skill.name}</h4>
                <p class="certification-level">Nivel ${level} - ${title}</p>
                <button class="btn btn-small btn-ghost" onclick="ProfileView.downloadCertificate('${skill.id}', '${skill.name}', ${level})">
                    📄 Descargar Certificado
                </button>
            </div>
        `;
    },

    /**
     * Render history item
     */
    renderHistoryItem: (session) => {
        const date = session.completed_at ?
            new Date(session.completed_at).toLocaleDateString('es', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : 'Fecha desconocida';

        const stars = [];
        for (let i = 0; i < 3; i++) {
            stars.push(i < (session.points_earned || 0) ? 'filled' : '');
        }

        return `
            <div class="history-item">
                <div class="history-item-info">
                    <h4>${session.scenario?.title || 'Escenario'}</h4>
                    <span class="history-item-date">${date}</span>
                </div>
                <div class="stars">
                    ${stars.map(s => `<span class="star ${s}">★</span>`).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Download certificate (mock implementation)
     */
    downloadCertificate: (skillId, skillName, level) => {
        const username = Auth.getUsername();
        const date = new Date().toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Create simple certificate content
        const content = `
CERTIFICADO DE COMPETENCIA

Se certifica que

${username.toUpperCase()}

ha alcanzado el nivel ${level} en

${skillName}

a través de la plataforma Perspective Play.

Fecha: ${date}

---
Este certificado valida las habilidades demostradas
en escenarios prácticos de simulación.
        `.trim();

        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_${skillName.replace(/\s+/g, '_')}_${username}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.show('Certificado descargado', 'success');
    },

    /**
     * Handle logout
     */
    handleLogout: async () => {
        await Auth.signOut();
        window.location.hash = '#login';
    }
};

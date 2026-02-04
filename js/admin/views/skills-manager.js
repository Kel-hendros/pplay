/**
 * Skills Manager View
 * Admin view for managing skills
 */

const SkillsManager = {
    skills: [],

    /**
     * Render skills manager
     */
    render: async () => {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="skills-admin">
                <div class="page-header">
                    <h1>Habilidades</h1>
                    <button class="btn btn-primary" onclick="SkillsManager.showCreateModal()">
                        ➕ Nueva Habilidad
                    </button>
                </div>

                <div class="skills-grid-admin" id="skills-grid">
                    <div class="loading-container">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        `;

        await SkillsManager.loadSkills();
    },

    /**
     * Load skills
     */
    loadSkills: async () => {
        try {
            SkillsManager.skills = await AdminDB.skills.getAll();
            SkillsManager.renderGrid();
        } catch (error) {
            console.error('Error loading skills:', error);
            Toast.show('Error al cargar habilidades', 'error');
        }
    },

    /**
     * Render skills grid
     */
    renderGrid: () => {
        const grid = document.getElementById('skills-grid');

        if (SkillsManager.skills.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">⭐</div>
                    <h3>No hay habilidades</h3>
                    <p>Crea la primera habilidad</p>
                </div>
            `;
            return;
        }

        // Group by category
        const byCategory = {};
        SkillsManager.skills.forEach(skill => {
            const cat = skill.category || 'Sin categoría';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(skill);
        });

        grid.innerHTML = Object.entries(byCategory).map(([category, skills]) => `
            <div style="grid-column: 1 / -1; margin-top: var(--spacing-lg);">
                <h3 style="color: var(--color-text-muted); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em;">
                    ${category}
                </h3>
            </div>
            ${skills.map(skill => `
                <div class="skill-card-admin">
                    <div class="skill-card-admin-header">
                        <div>
                            <div class="skill-card-admin-icon">${skill.icon || '⭐'}</div>
                            <h4>${skill.name}</h4>
                        </div>
                        <div class="scenario-actions">
                            <button class="btn btn-sm btn-ghost" onclick="SkillsManager.edit('${skill.id}')">✏️</button>
                            <button class="btn btn-sm btn-ghost danger" onclick="SkillsManager.delete('${skill.id}')">🗑️</button>
                        </div>
                    </div>
                    <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                        ${skill.description || 'Sin descripción'}
                    </p>
                    <div style="margin-top: var(--spacing-md); font-size: var(--font-size-sm); color: var(--color-text-muted);">
                        Nivel máximo: ${skill.max_level || 10}
                    </div>
                </div>
            `).join('')}
        `).join('');
    },

    /**
     * Show create/edit modal
     */
    showCreateModal: (skill = null) => {
        const isEdit = !!skill;
        const s = skill || { name: '', category: '', description: '', icon: '⭐', max_level: 10 };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'skill-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? 'Editar' : 'Nueva'} Habilidad</h3>
                    <button class="modal-close" onclick="SkillsManager.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="skill-form">
                        <input type="hidden" name="id" value="${s.id || ''}">

                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Nombre *</label>
                                <input type="text" name="name" value="${s.name}" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Icono (emoji)</label>
                                <input type="text" name="icon" value="${s.icon || ''}" class="form-input" maxlength="4">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Categoría</label>
                            <input type="text" name="category" value="${s.category || ''}" class="form-input"
                                placeholder="Ej: Comunicación y Negociación">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Descripción</label>
                            <textarea name="description" class="form-input form-textarea" rows="3">${s.description || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Nivel máximo</label>
                            <input type="number" name="max_level" value="${s.max_level || 10}" class="form-input" min="1" max="100">
                        </div>

                        <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-lg);">
                            <button type="button" class="btn btn-ghost" onclick="SkillsManager.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        document.getElementById('skill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await SkillsManager.saveSkill();
        });
    },

    /**
     * Close modal
     */
    closeModal: () => {
        const modal = document.getElementById('skill-modal');
        if (modal) modal.remove();
    },

    /**
     * Save skill
     */
    saveSkill: async () => {
        try {
            const form = document.getElementById('skill-form');
            const data = FormBuilder.getData(form);

            if (data.id) {
                await AdminDB.skills.update(data.id, data);
                Toast.show('Habilidad actualizada', 'success');
            } else {
                delete data.id;
                await AdminDB.skills.create(data);
                Toast.show('Habilidad creada', 'success');
            }

            SkillsManager.closeModal();
            await SkillsManager.loadSkills();
        } catch (error) {
            console.error('Error saving skill:', error);
            Toast.show('Error al guardar', 'error');
        }
    },

    /**
     * Edit skill
     */
    edit: (id) => {
        const skill = SkillsManager.skills.find(s => s.id === id);
        if (skill) SkillsManager.showCreateModal(skill);
    },

    /**
     * Delete skill
     */
    delete: async (id) => {
        const skill = SkillsManager.skills.find(s => s.id === id);
        if (!confirm(`¿Eliminar la habilidad "${skill?.name}"?`)) return;

        try {
            await AdminDB.skills.delete(id);
            Toast.show('Habilidad eliminada', 'success');
            await SkillsManager.loadSkills();
        } catch (error) {
            console.error('Error deleting skill:', error);
            Toast.show('Error al eliminar', 'error');
        }
    }
};

console.log('skills-manager.js loaded');

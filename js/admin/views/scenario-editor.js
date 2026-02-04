/**
 * Scenario Editor View
 * Complete editor for scenarios with all related data
 */

const ScenarioEditor = {
    scenario: null,
    characters: [],
    environment: null,
    storyArc: null,
    criteria: [],
    skills: [],
    activeTab: 'basic',
    isNew: false,

    /**
     * Render editor
     */
    render: async (scenarioId) => {
        ScenarioEditor.isNew = scenarioId === 'new';
        const container = document.getElementById('view-container');

        container.innerHTML = `
            <div class="scenario-editor">
                <div class="editor-header">
                    <h1>${ScenarioEditor.isNew ? 'Nuevo Escenario' : 'Editar Escenario'}</h1>
                    <div>
                        <a href="#scenarios" class="btn btn-ghost">← Volver</a>
                        <button class="btn btn-primary" onclick="ScenarioEditor.save()">
                            💾 Guardar
                        </button>
                    </div>
                </div>

                <div class="loading-container" id="editor-loading">
                    <div class="spinner"></div>
                    <p>Cargando...</p>
                </div>

                <div id="editor-content" style="display: none;"></div>
            </div>
        `;

        await ScenarioEditor.loadData(scenarioId);
    },

    /**
     * Load all data
     */
    loadData: async (scenarioId) => {
        try {
            // Load skills first (needed for forms)
            ScenarioEditor.skills = await AdminDB.skills.getAll();

            if (!ScenarioEditor.isNew) {
                // Load existing scenario data
                ScenarioEditor.scenario = await AdminDB.scenarios.get(scenarioId);
                ScenarioEditor.characters = await AdminDB.characters.getByScenario(scenarioId);
                ScenarioEditor.environment = await AdminDB.environments.getByScenario(scenarioId);
                ScenarioEditor.storyArc = await AdminDB.storyArcs.getByScenario(scenarioId);
                ScenarioEditor.criteria = await AdminDB.criteria.getByScenario(scenarioId);
            } else {
                // Initialize empty scenario
                ScenarioEditor.scenario = ScenarioEditor.getDefaultScenario();
                ScenarioEditor.characters = [];
                ScenarioEditor.environment = null;
                ScenarioEditor.storyArc = null;
                ScenarioEditor.criteria = [];
            }

            document.getElementById('editor-loading').style.display = 'none';
            document.getElementById('editor-content').style.display = 'block';

            ScenarioEditor.renderContent();
        } catch (error) {
            console.error('Error loading scenario:', error);
            Toast.show('Error al cargar el escenario', 'error');
        }
    },

    /**
     * Get default empty scenario
     */
    getDefaultScenario: () => ({
        title: '',
        description: '',
        difficulty: 'beginner',
        is_premium: false,
        intro_story: '',
        objective: '',
        max_points: 3,
        estimated_time: 15,
        is_published: false,
        bibliography: []
    }),

    /**
     * Render editor content
     */
    renderContent: () => {
        const content = document.getElementById('editor-content');

        content.innerHTML = `
            <div class="editor-tabs">
                <button class="editor-tab ${ScenarioEditor.activeTab === 'basic' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('basic')">
                    📋 Básico
                </button>
                <button class="editor-tab ${ScenarioEditor.activeTab === 'environment' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('environment')">
                    🌍 Entorno
                </button>
                <button class="editor-tab ${ScenarioEditor.activeTab === 'characters' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('characters')">
                    👥 Personajes (${ScenarioEditor.characters.length})
                </button>
                <button class="editor-tab ${ScenarioEditor.activeTab === 'story' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('story')">
                    📖 Arco Argumental
                </button>
                <button class="editor-tab ${ScenarioEditor.activeTab === 'criteria' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('criteria')">
                    📊 Evaluación (${ScenarioEditor.criteria.length})
                </button>
                <button class="editor-tab ${ScenarioEditor.activeTab === 'prompt' ? 'active' : ''}"
                    onclick="ScenarioEditor.switchTab('prompt')">
                    🤖 Prompt
                </button>
            </div>

            <div id="tab-content"></div>
        `;

        ScenarioEditor.renderTab();
    },

    /**
     * Switch tab
     */
    switchTab: (tab) => {
        ScenarioEditor.activeTab = tab;
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.editor-tab:nth-child(${['basic', 'environment', 'characters', 'story', 'criteria', 'prompt'].indexOf(tab) + 1})`).classList.add('active');
        ScenarioEditor.renderTab();
    },

    /**
     * Render current tab
     */
    renderTab: () => {
        const tabContent = document.getElementById('tab-content');

        switch (ScenarioEditor.activeTab) {
            case 'basic':
                tabContent.innerHTML = ScenarioEditor.renderBasicTab();
                break;
            case 'environment':
                tabContent.innerHTML = ScenarioEditor.renderEnvironmentTab();
                break;
            case 'characters':
                tabContent.innerHTML = ScenarioEditor.renderCharactersTab();
                break;
            case 'story':
                tabContent.innerHTML = ScenarioEditor.renderStoryTab();
                break;
            case 'criteria':
                tabContent.innerHTML = ScenarioEditor.renderCriteriaTab();
                break;
            case 'prompt':
                tabContent.innerHTML = ScenarioEditor.renderPromptTab();
                break;
        }
    },

    /**
     * Render Basic tab
     */
    renderBasicTab: () => {
        const s = ScenarioEditor.scenario;
        const selectedSkills = s.scenario_skills?.map(ss => ss.skill?.id) || [];

        return `
            <form id="basic-form" class="editor-section">
                <h2>Información Básica</h2>

                <div class="form-grid">
                    <div class="form-group form-full">
                        <label class="form-label">Título *</label>
                        <input type="text" name="title" value="${s.title || ''}" class="form-input" required>
                    </div>

                    <div class="form-group form-full">
                        <label class="form-label">Descripción</label>
                        <textarea name="description" class="form-input form-textarea" rows="2">${s.description || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Dificultad</label>
                        <select name="difficulty" class="form-input">
                            <option value="beginner" ${s.difficulty === 'beginner' ? 'selected' : ''}>Principiante</option>
                            <option value="intermediate" ${s.difficulty === 'intermediate' ? 'selected' : ''}>Intermedio</option>
                            <option value="advanced" ${s.difficulty === 'advanced' ? 'selected' : ''}>Avanzado</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Tiempo estimado (min)</label>
                        <input type="number" name="estimated_time" value="${s.estimated_time || 15}" class="form-input" min="5" max="60">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Puntos máximos</label>
                        <input type="number" name="max_points" value="${s.max_points || 3}" class="form-input" min="1" max="5">
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="is_premium" ${s.is_premium ? 'checked' : ''}>
                            <span>Escenario Premium 👑</span>
                        </label>
                        <label class="form-checkbox">
                            <input type="checkbox" name="is_published" ${s.is_published !== false ? 'checked' : ''}>
                            <span>Publicado</span>
                        </label>
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">Habilidades Relacionadas</h3>
                <div class="form-group">
                    <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
                        ${ScenarioEditor.skills.map(skill => `
                            <label class="form-checkbox" style="background: var(--color-bg); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md);">
                                <input type="checkbox" name="skills" value="${skill.id}"
                                    ${selectedSkills.includes(skill.id) ? 'checked' : ''}>
                                <span>${skill.icon} ${skill.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">Objetivo del Usuario</h3>
                <div class="form-group">
                    <textarea name="objective" class="form-input form-textarea" rows="2"
                        placeholder="¿Qué debe lograr el usuario en este escenario?">${s.objective || ''}</textarea>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">Historia Introductoria</h3>
                <div class="form-group">
                    <textarea name="intro_story" class="form-input form-textarea large"
                        placeholder="Narra la escena inicial que verá el usuario...">${s.intro_story || ''}</textarea>
                </div>
            </form>
        `;
    },

    /**
     * Render Environment tab
     */
    renderEnvironmentTab: () => {
        const env = ScenarioEditor.environment || {};

        return `
            <form id="environment-form" class="editor-section">
                <h2>Entorno del Escenario</h2>

                <div class="form-group">
                    <label class="form-label">Descripción del entorno</label>
                    <textarea name="description" class="form-input form-textarea" rows="3"
                        placeholder="Describe el contexto general de la situación">${env.description || ''}</textarea>
                </div>

                <div class="form-grid cols-3">
                    <div class="form-group">
                        <label class="form-label">Ubicación</label>
                        <input type="text" name="location" value="${env.location || ''}" class="form-input"
                            placeholder="Ej: Sala de juntas, piso 12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Atmósfera</label>
                        <input type="text" name="atmosphere" value="${env.atmosphere || ''}" class="form-input"
                            placeholder="Ej: Tensa, formal">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contexto temporal</label>
                        <input type="text" name="time_context" value="${env.time_context || ''}" class="form-input"
                            placeholder="Ej: Lunes 9am, fin de trimestre">
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">Análisis del Entorno</h3>
                <div class="form-grid">
                    <div class="form-group">
                        ${JsonEditor.render('env-opportunities', env.opportunities || [], {
                            label: '🌟 Oportunidades',
                            placeholder: 'Agregar oportunidad...',
                            name: 'opportunities'
                        })}
                    </div>
                    <div class="form-group">
                        ${JsonEditor.render('env-threats', env.threats || [], {
                            label: '⚠️ Amenazas',
                            placeholder: 'Agregar amenaza...',
                            name: 'threats'
                        })}
                    </div>
                    <div class="form-group">
                        ${JsonEditor.render('env-possibilities', env.possibilities || [], {
                            label: '💡 Posibilidades',
                            placeholder: 'Agregar posibilidad...',
                            name: 'possibilities'
                        })}
                    </div>
                    <div class="form-group">
                        ${JsonEditor.render('env-restrictions', env.restrictions || [], {
                            label: '🚫 Restricciones',
                            placeholder: 'Agregar restricción...',
                            name: 'restrictions'
                        })}
                    </div>
                </div>
            </form>
        `;
    },

    /**
     * Render Characters tab
     */
    renderCharactersTab: () => {
        return `
            <div class="editor-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h2 style="margin: 0;">Personajes</h2>
                    <button type="button" class="btn btn-primary" onclick="ScenarioEditor.addCharacter()">
                        ➕ Agregar Personaje
                    </button>
                </div>

                <div class="characters-list" id="characters-list">
                    ${ScenarioEditor.characters.length === 0
                        ? '<p style="color: var(--color-text-muted); text-align: center; padding: var(--spacing-xl);">No hay personajes. Agrega el primer personaje.</p>'
                        : ScenarioEditor.characters.map(char => CharacterForm.render(char)).join('')
                    }
                </div>
            </div>
        `;
    },

    /**
     * Add new character
     */
    addCharacter: () => {
        const list = document.getElementById('characters-list');

        // Remove empty message if exists
        const emptyMsg = list.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const newChar = CharacterForm.getDefaultCharacter();
        newChar.id = 'new-' + Date.now();
        list.insertAdjacentHTML('beforeend', CharacterForm.render(newChar));
    },

    /**
     * Render Story Arc tab
     */
    renderStoryTab: () => {
        const arc = ScenarioEditor.storyArc || {};
        const pc = arc.player_character || {};
        const obj = arc.objectives || {};
        const af = arc.antagonistic_force || {};

        return `
            <form id="story-form" class="editor-section">
                <h2>Arco Argumental</h2>

                <h3>👤 Rol del Jugador</h3>
                <div class="form-grid">
                    <div class="form-group form-full">
                        <label class="form-label">Rol</label>
                        <input type="text" name="player_character.role" value="${pc.role || ''}" class="form-input"
                            placeholder="Ej: Mediador neutral, Gerente de proyecto">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contexto</label>
                        <textarea name="player_character.context" class="form-input form-textarea" rows="2"
                            placeholder="Contexto del rol del jugador">${pc.context || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Posición inicial</label>
                        <textarea name="player_character.initial_position" class="form-input form-textarea" rows="2"
                            placeholder="Desde dónde parte el jugador">${pc.initial_position || ''}</textarea>
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">🎯 Objetivos</h3>
                <div class="form-grid">
                    <div class="form-group">
                        ${JsonEditor.render('objectives-primary', obj.primary || [], {
                            label: 'Objetivos Primarios',
                            placeholder: 'Agregar objetivo primario...',
                            name: 'objectives.primary'
                        })}
                    </div>
                    <div class="form-group">
                        ${JsonEditor.render('objectives-secondary', obj.secondary || [], {
                            label: 'Objetivos Secundarios',
                            placeholder: 'Agregar objetivo secundario...',
                            name: 'objectives.secondary'
                        })}
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">⚔️ Fuerza Antagónica</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <input type="text" name="antagonistic_force.type" value="${af.type || ''}" class="form-input"
                            placeholder="Ej: Conflicto de intereses, Resistencia al cambio">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Manifestación</label>
                        <input type="text" name="antagonistic_force.manifestation" value="${af.manifestation || ''}" class="form-input"
                            placeholder="Cómo se manifiesta el conflicto">
                    </div>
                    <div class="form-group form-full">
                        <label class="form-label">Descripción</label>
                        <textarea name="antagonistic_force.description" class="form-input form-textarea" rows="2"
                            placeholder="Describe la fuerza que se opone al jugador">${af.description || ''}</textarea>
                    </div>
                </div>

                <h3 style="margin-top: var(--spacing-xl);">✅ Condiciones</h3>
                <div class="form-grid">
                    <div class="form-group">
                        ${JsonEditor.render('success-conditions', arc.success_conditions || [], {
                            label: 'Condiciones de Éxito',
                            placeholder: 'Agregar condición de éxito...',
                            name: 'success_conditions'
                        })}
                    </div>
                    <div class="form-group">
                        ${JsonEditor.render('failure-conditions', arc.failure_conditions || [], {
                            label: 'Condiciones de Fracaso',
                            placeholder: 'Agregar condición de fracaso...',
                            name: 'failure_conditions'
                        })}
                    </div>
                </div>
            </form>
        `;
    },

    /**
     * Render Criteria tab
     */
    renderCriteriaTab: () => {
        return `
            <div class="editor-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h2 style="margin: 0;">Criterios de Evaluación</h2>
                    <button type="button" class="btn btn-primary" onclick="ScenarioEditor.addCriterion()">
                        ➕ Agregar Criterio
                    </button>
                </div>

                <div class="criteria-list" id="criteria-list">
                    ${ScenarioEditor.criteria.length === 0
                        ? '<p style="color: var(--color-text-muted); text-align: center; padding: var(--spacing-xl);">No hay criterios de evaluación.</p>'
                        : ScenarioEditor.criteria.map(c => ScenarioEditor.renderCriterionCard(c)).join('')
                    }
                </div>
            </div>
        `;
    },

    /**
     * Render single criterion card
     */
    renderCriterionCard: (criterion) => {
        const levels = criterion.achievement_levels || [
            { level: 0, label: 'No demostrado', descriptor: '' },
            { level: 1, label: 'En desarrollo', descriptor: '' },
            { level: 2, label: 'Competente', descriptor: '' },
            { level: 3, label: 'Destacado', descriptor: '' }
        ];

        return `
            <div class="criteria-card" data-id="${criterion.id || 'new-' + Date.now()}">
                <div class="criteria-header">
                    <input type="text" name="name" value="${criterion.name || ''}" class="form-input"
                        placeholder="Nombre del criterio" style="flex: 1;">
                    <div class="criteria-weight">
                        <label>Peso:</label>
                        <input type="number" name="weight" value="${criterion.weight || 1}" class="form-input"
                            min="0.1" max="2" step="0.1" style="width: 70px;">
                    </div>
                    <button type="button" class="btn-icon danger" onclick="ScenarioEditor.removeCriterion(this)">🗑️</button>
                </div>

                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea name="description" class="form-input form-textarea" rows="2">${criterion.description || ''}</textarea>
                </div>

                <div class="form-group">
                    ${JsonEditor.render(`indicators-${criterion.id || 'new'}`, criterion.indicators || [], {
                        label: 'Indicadores',
                        placeholder: 'Agregar indicador...',
                        name: 'indicators'
                    })}
                </div>

                <label class="form-label">Niveles de Logro</label>
                <div class="achievement-levels">
                    ${levels.map(level => `
                        <div class="achievement-level">
                            <div class="achievement-level-number">${level.level}</div>
                            <div style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-xs);">${level.label}</div>
                            <textarea name="level_${level.level}" class="form-input" rows="2"
                                placeholder="Descriptor...">${level.descriptor || ''}</textarea>
                        </div>
                    `).join('')}
                </div>

                <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label class="form-label">Skill asociada</label>
                    <select name="skill_id" class="form-input">
                        <option value="">Sin skill asociada</option>
                        ${ScenarioEditor.skills.map(skill => `
                            <option value="${skill.id}" ${criterion.skill_id === skill.id ? 'selected' : ''}>
                                ${skill.icon} ${skill.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    },

    /**
     * Add new criterion
     */
    addCriterion: () => {
        const list = document.getElementById('criteria-list');
        const emptyMsg = list.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const newCriterion = {
            id: 'new-' + Date.now(),
            name: '',
            weight: 1,
            indicators: [],
            achievement_levels: [
                { level: 0, label: 'No demostrado', descriptor: '' },
                { level: 1, label: 'En desarrollo', descriptor: '' },
                { level: 2, label: 'Competente', descriptor: '' },
                { level: 3, label: 'Destacado', descriptor: '' }
            ]
        };

        list.insertAdjacentHTML('beforeend', ScenarioEditor.renderCriterionCard(newCriterion));
    },

    /**
     * Remove criterion
     */
    removeCriterion: (button) => {
        if (!confirm('¿Eliminar este criterio?')) return;
        button.closest('.criteria-card').remove();
    },

    /**
     * Render Prompt tab
     */
    renderPromptTab: () => {
        // Collect current data
        const currentData = ScenarioEditor.collectAllData();

        const prompt = PromptGenerator.generate(
            currentData.scenario,
            currentData.characters,
            currentData.environment,
            currentData.storyArc,
            currentData.criteria
        );

        return `
            <div class="editor-section">
                <h2>System Prompt Generado</h2>
                <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-lg);">
                    Este prompt se genera automáticamente a partir de los datos del escenario.
                    Se actualizará cuando guardes los cambios.
                </p>

                <div class="prompt-preview" id="prompt-preview">${PromptGenerator.escapeHtml(prompt)}</div>

                <div class="prompt-preview-actions">
                    <button type="button" class="btn btn-secondary" onclick="ScenarioEditor.copyPrompt()">
                        📋 Copiar al Portapapeles
                    </button>
                    <button type="button" class="btn btn-ghost" onclick="ScenarioEditor.switchTab('prompt')">
                        🔄 Regenerar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Copy prompt to clipboard
     */
    copyPrompt: async () => {
        const prompt = document.getElementById('prompt-preview')?.textContent;
        if (prompt) {
            await navigator.clipboard.writeText(prompt);
            Toast.show('Prompt copiado', 'success');
        }
    },

    /**
     * Collect all form data
     */
    collectAllData: () => {
        const data = {
            scenario: { ...ScenarioEditor.scenario },
            characters: [],
            environment: {},
            storyArc: {},
            criteria: []
        };

        // Basic form
        const basicForm = document.getElementById('basic-form');
        if (basicForm) {
            const formData = FormBuilder.getData(basicForm);
            Object.assign(data.scenario, formData);

            // Get selected skills
            const selectedSkills = Array.from(basicForm.querySelectorAll('input[name="skills"]:checked'))
                .map(cb => cb.value);
            data.scenario.selectedSkills = selectedSkills;
        }

        // Environment form
        const envForm = document.getElementById('environment-form');
        if (envForm) {
            data.environment = FormBuilder.getData(envForm);
            data.environment.opportunities = JsonEditor.getValues('env-opportunities');
            data.environment.threats = JsonEditor.getValues('env-threats');
            data.environment.possibilities = JsonEditor.getValues('env-possibilities');
            data.environment.restrictions = JsonEditor.getValues('env-restrictions');
        }

        // Characters
        const charactersList = document.getElementById('characters-list');
        if (charactersList) {
            data.characters = CharacterForm.getAllData('characters-list');
        }

        // Story arc form
        const storyForm = document.getElementById('story-form');
        if (storyForm) {
            data.storyArc = FormBuilder.getData(storyForm);
            data.storyArc.objectives = {
                primary: JsonEditor.getValues('objectives-primary'),
                secondary: JsonEditor.getValues('objectives-secondary')
            };
            data.storyArc.success_conditions = JsonEditor.getValues('success-conditions');
            data.storyArc.failure_conditions = JsonEditor.getValues('failure-conditions');
        }

        // Criteria
        const criteriaList = document.getElementById('criteria-list');
        if (criteriaList) {
            data.criteria = Array.from(criteriaList.querySelectorAll('.criteria-card')).map(card => {
                const id = card.dataset.id;
                return {
                    id: id.startsWith('new-') ? null : id,
                    name: card.querySelector('[name="name"]').value,
                    description: card.querySelector('[name="description"]').value,
                    weight: parseFloat(card.querySelector('[name="weight"]').value) || 1,
                    skill_id: card.querySelector('[name="skill_id"]').value || null,
                    indicators: JsonEditor.getValues(`indicators-${id.startsWith('new-') ? 'new' : id}`),
                    achievement_levels: [0, 1, 2, 3].map(level => ({
                        level,
                        label: ['No demostrado', 'En desarrollo', 'Competente', 'Destacado'][level],
                        descriptor: card.querySelector(`[name="level_${level}"]`)?.value || ''
                    }))
                };
            });
        }

        return data;
    },

    /**
     * Save all data
     */
    save: async () => {
        try {
            Toast.show('Guardando...', 'info');

            const data = ScenarioEditor.collectAllData();

            // Generate prompt
            const systemPrompt = PromptGenerator.generate(
                data.scenario,
                data.characters,
                data.environment,
                data.storyArc,
                data.criteria
            );

            // Prepare scenario data
            const scenarioData = {
                title: data.scenario.title,
                description: data.scenario.description,
                difficulty: data.scenario.difficulty,
                is_premium: data.scenario.is_premium,
                is_published: data.scenario.is_published,
                intro_story: data.scenario.intro_story,
                objective: data.scenario.objective,
                max_points: parseInt(data.scenario.max_points) || 3,
                estimated_time: parseInt(data.scenario.estimated_time) || 15,
                system_prompt: systemPrompt
            };

            let scenarioId;

            if (ScenarioEditor.isNew) {
                // Create new scenario
                const created = await AdminDB.scenarios.create(scenarioData);
                scenarioId = created.id;
                ScenarioEditor.scenario = created;
                ScenarioEditor.isNew = false;
            } else {
                // Update existing
                await AdminDB.scenarios.update(ScenarioEditor.scenario.id, scenarioData);
                scenarioId = ScenarioEditor.scenario.id;
            }

            // Update skills
            if (data.scenario.selectedSkills) {
                await AdminDB.scenarios.updateSkills(scenarioId, data.scenario.selectedSkills);
            }

            // Save environment
            if (Object.keys(data.environment).some(k => data.environment[k])) {
                await AdminDB.environments.upsert(scenarioId, data.environment);
            }

            // Save story arc
            if (data.storyArc.player_character?.role || data.storyArc.objectives?.primary?.length > 0) {
                await AdminDB.storyArcs.upsert(scenarioId, data.storyArc);
            }

            // Save characters
            for (const char of data.characters) {
                const charData = { ...char, scenario_id: scenarioId };
                delete charData.id;

                if (char.id && !char.id.startsWith('new-')) {
                    await AdminDB.characters.update(char.id, charData);
                } else {
                    await AdminDB.characters.create(charData);
                }
            }

            // Save criteria
            for (const criterion of data.criteria) {
                const criterionData = {
                    scenario_id: scenarioId,
                    name: criterion.name,
                    description: criterion.description,
                    weight: criterion.weight,
                    skill_id: criterion.skill_id || null,
                    indicators: criterion.indicators,
                    achievement_levels: criterion.achievement_levels
                };

                if (criterion.id) {
                    await AdminDB.criteria.update(criterion.id, criterionData);
                } else {
                    await AdminDB.criteria.create(criterionData);
                }
            }

            Toast.show('Escenario guardado correctamente', 'success');

            // Update URL if was new
            if (window.location.hash === '#scenarios/new') {
                window.location.hash = `#scenarios/${scenarioId}`;
            }

        } catch (error) {
            console.error('Error saving scenario:', error);
            Toast.show('Error al guardar: ' + error.message, 'error');
        }
    }
};

console.log('scenario-editor.js loaded');

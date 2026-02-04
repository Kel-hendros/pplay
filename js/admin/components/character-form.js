/**
 * Character Form Component
 * Complex form for editing character data
 */

const CharacterForm = {
    /**
     * Render character editor
     */
    render: (character = null) => {
        const isNew = !character;
        const c = character || CharacterForm.getDefaultCharacter();

        return `
            <div class="character-card-admin ${isNew ? 'expanded' : ''}" data-id="${c.id || 'new'}">
                <div class="character-card-header" onclick="CharacterForm.toggle(this)">
                    <div class="character-card-title">
                        <div class="avatar">${c.avatar || '👤'}</div>
                        <div>
                            <strong class="character-name-display">${c.name || 'Nuevo Personaje'}</strong>
                            <div style="font-size: var(--font-size-sm); color: var(--color-text-muted);">
                                ${c.role || 'Sin rol definido'}
                            </div>
                        </div>
                    </div>
                    <div class="character-card-actions">
                        <button type="button" class="btn-icon" onclick="event.stopPropagation(); CharacterForm.moveUp(this)">↑</button>
                        <button type="button" class="btn-icon" onclick="event.stopPropagation(); CharacterForm.moveDown(this)">↓</button>
                        <button type="button" class="btn-icon danger" onclick="event.stopPropagation(); CharacterForm.delete(this)">🗑️</button>
                    </div>
                </div>
                <div class="character-card-body">
                    <form class="character-form" data-id="${c.id || ''}">
                        <!-- Basic Info -->
                        <div class="character-section">
                            <h4>📋 Información Básica</h4>
                            <div class="form-grid cols-3">
                                <div class="form-group">
                                    <label class="form-label">Nombre *</label>
                                    <input type="text" name="name" value="${c.name || ''}" class="form-input" required
                                        oninput="CharacterForm.updateTitle(this)">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Rol *</label>
                                    <input type="text" name="role" value="${c.role || ''}" class="form-input" required
                                        placeholder="Ej: Director de Ventas">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Avatar (emoji)</label>
                                    <input type="text" name="avatar" value="${c.avatar || ''}" class="form-input"
                                        placeholder="👔" maxlength="4"
                                        oninput="CharacterForm.updateAvatar(this)">
                                </div>
                            </div>
                        </div>

                        <!-- Meta (Goals) -->
                        <div class="character-section">
                            <h4>🎯 Meta y Objetivos</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Objetivo Principal</label>
                                    <input type="text" name="meta.primary_goal" value="${c.meta?.primary_goal || ''}"
                                        class="form-input" placeholder="Lo que más quiere lograr">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Objetivo Secundario</label>
                                    <input type="text" name="meta.secondary_goal" value="${c.meta?.secondary_goal || ''}"
                                        class="form-input" placeholder="Objetivo alternativo">
                                </div>
                                <div class="form-group form-full">
                                    <label class="form-label">Miedo Profundo</label>
                                    <input type="text" name="meta.fear" value="${c.meta?.fear || ''}"
                                        class="form-input" placeholder="Lo que más teme que ocurra">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Motivación</label>
                                <textarea name="motivation" class="form-input form-textarea" rows="2"
                                    placeholder="¿Qué lo impulsa a actuar?">${c.motivation || ''}</textarea>
                            </div>
                        </div>

                        <!-- Personality -->
                        <div class="character-section">
                            <h4>🧠 Personalidad</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Personalidad Externa</label>
                                    <textarea name="personality.external" class="form-input form-textarea" rows="2"
                                        placeholder="Cómo se muestra ante los demás">${c.personality?.external || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Personalidad Interna</label>
                                    <textarea name="personality.internal" class="form-input form-textarea" rows="2"
                                        placeholder="Cómo es realmente por dentro">${c.personality?.internal || ''}</textarea>
                                </div>
                                <div class="form-group form-full">
                                    <label class="form-label">Punto de Vista</label>
                                    <textarea name="personality.point_of_view" class="form-input form-textarea" rows="2"
                                        placeholder="Cómo ve el mundo, sus creencias y sesgos">${c.personality?.point_of_view || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Strengths & Weaknesses -->
                        <div class="character-section">
                            <h4>💪 Fortalezas y Debilidades</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    ${JsonEditor.render(`strengths-${c.id || 'new'}`, c.strengths || [], {
                                        label: 'Fortalezas',
                                        placeholder: 'Agregar fortaleza...',
                                        name: 'strengths'
                                    })}
                                </div>
                                <div class="form-group">
                                    ${JsonEditor.render(`weaknesses-${c.id || 'new'}`, c.weaknesses || [], {
                                        label: 'Debilidades',
                                        placeholder: 'Agregar debilidad...',
                                        name: 'weaknesses'
                                    })}
                                </div>
                            </div>
                        </div>

                        <!-- Behavior -->
                        <div class="character-section">
                            <h4>🎭 Comportamiento en el Escenario</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    ${JsonEditor.render(`possibilities-${c.id || 'new'}`, c.possibilities || [], {
                                        label: 'Puede hacer (posibilidades)',
                                        placeholder: 'Qué puede aceptar o hacer...',
                                        name: 'possibilities'
                                    })}
                                </div>
                                <div class="form-group">
                                    ${JsonEditor.render(`restrictions-${c.id || 'new'}`, c.restrictions || [], {
                                        label: 'No puede hacer (restricciones)',
                                        placeholder: 'Qué no puede aceptar...',
                                        name: 'restrictions'
                                    })}
                                </div>
                            </div>
                        </div>

                        <!-- Speech Style -->
                        <div class="character-section">
                            <h4>🗣️ Forma de Hablar</h4>
                            <div class="form-grid cols-3">
                                <div class="form-group">
                                    <label class="form-label">Tono</label>
                                    <input type="text" name="speech_style.tone" value="${c.speech_style?.tone || ''}"
                                        class="form-input" placeholder="Ej: Directo, sarcástico">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Formalidad</label>
                                    <select name="speech_style.formality" class="form-input">
                                        <option value="formal" ${c.speech_style?.formality === 'formal' ? 'selected' : ''}>Formal</option>
                                        <option value="neutral" ${c.speech_style?.formality === 'neutral' || !c.speech_style?.formality ? 'selected' : ''}>Neutral</option>
                                        <option value="casual" ${c.speech_style?.formality === 'casual' ? 'selected' : ''}>Casual</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    ${JsonEditor.render(`expressions-${c.id || 'new'}`, c.speech_style?.expressions || [], {
                                        label: 'Expresiones típicas',
                                        placeholder: '"Seré directo..."',
                                        name: 'speech_style.expressions'
                                    })}
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Patrones de lenguaje</label>
                                <textarea name="speech_style.language_patterns" class="form-input form-textarea" rows="2"
                                    placeholder="Usa muchas métricas, habla en términos de ROI, etc.">${c.speech_style?.language_patterns || ''}</textarea>
                            </div>
                        </div>

                        <!-- Background -->
                        <div class="character-section">
                            <h4>📖 Trasfondo</h4>
                            <div class="form-group">
                                <label class="form-label">Biografía</label>
                                <textarea name="biography" class="form-input form-textarea" rows="3"
                                    placeholder="Historia y contexto del personaje">${c.biography || ''}</textarea>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Rasgo Único</label>
                                    <input type="text" name="uniqueness" value="${c.uniqueness || ''}"
                                        class="form-input" placeholder="Lo que lo hace memorable">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Agenda Oculta</label>
                                    <input type="text" name="hidden_agenda" value="${c.hidden_agenda || ''}"
                                        class="form-input" placeholder="Lo que no dice abiertamente">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Get default empty character
     */
    getDefaultCharacter: () => ({
        id: null,
        name: '',
        role: '',
        avatar: '👤',
        meta: { primary_goal: '', secondary_goal: '', fear: '' },
        motivation: '',
        personality: { internal: '', external: '', point_of_view: '' },
        strengths: [],
        weaknesses: [],
        possibilities: [],
        restrictions: [],
        speech_style: { tone: '', formality: 'neutral', expressions: [], language_patterns: '' },
        biography: '',
        uniqueness: '',
        hidden_agenda: '',
        display_order: 0
    }),

    /**
     * Toggle card expansion
     */
    toggle: (header) => {
        const card = header.closest('.character-card-admin');
        card.classList.toggle('expanded');
    },

    /**
     * Update title display when name changes
     */
    updateTitle: (input) => {
        const card = input.closest('.character-card-admin');
        const display = card.querySelector('.character-name-display');
        display.textContent = input.value || 'Nuevo Personaje';
    },

    /**
     * Update avatar display
     */
    updateAvatar: (input) => {
        const card = input.closest('.character-card-admin');
        const avatar = card.querySelector('.character-card-title .avatar');
        avatar.textContent = input.value || '👤';
    },

    /**
     * Move character up
     */
    moveUp: (button) => {
        const card = button.closest('.character-card-admin');
        const prev = card.previousElementSibling;
        if (prev && prev.classList.contains('character-card-admin')) {
            card.parentNode.insertBefore(card, prev);
        }
    },

    /**
     * Move character down
     */
    moveDown: (button) => {
        const card = button.closest('.character-card-admin');
        const next = card.nextElementSibling;
        if (next && next.classList.contains('character-card-admin')) {
            card.parentNode.insertBefore(next, card);
        }
    },

    /**
     * Delete character
     */
    delete: (button) => {
        if (!confirm('¿Eliminar este personaje?')) return;

        const card = button.closest('.character-card-admin');
        const id = card.dataset.id;

        card.remove();

        // Dispatch event for parent to handle
        document.dispatchEvent(new CustomEvent('character:delete', { detail: { id } }));
    },

    /**
     * Get character data from form
     */
    getData: (cardElement) => {
        const form = cardElement.querySelector('.character-form');
        const data = FormBuilder.getData(form);

        // Get JSON editor values
        const id = cardElement.dataset.id;
        data.strengths = JsonEditor.getValues(`strengths-${id}`);
        data.weaknesses = JsonEditor.getValues(`weaknesses-${id}`);
        data.possibilities = JsonEditor.getValues(`possibilities-${id}`);
        data.restrictions = JsonEditor.getValues(`restrictions-${id}`);

        if (!data.speech_style) data.speech_style = {};
        data.speech_style.expressions = JsonEditor.getValues(`expressions-${id}`);

        // Keep ID if exists
        if (id && id !== 'new') {
            data.id = id;
        }

        return data;
    },

    /**
     * Get all characters data from container
     */
    getAllData: (containerId) => {
        const container = document.getElementById(containerId);
        const cards = container.querySelectorAll('.character-card-admin');

        return Array.from(cards).map((card, index) => {
            const data = CharacterForm.getData(card);
            data.display_order = index;
            return data;
        });
    }
};

console.log('character-form.js loaded');

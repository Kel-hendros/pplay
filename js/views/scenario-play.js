/**
 * Scenario Play View
 * Handles the gameplay experience for scenarios
 */

const ScenarioPlayView = {
    scenario: null,
    session: null,
    phase: 'intro', // 'intro', 'chat', 'conclusion'
    messages: [],
    turnNumber: 0,
    feedbackHistory: [],

    /**
     * Render the scenario play view
     */
    render: async (scenarioId) => {
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading-container"><div class="spinner spinner-lg"></div><p>Cargando escenario...</p></div>';

        try {
            // Fetch scenario
            ScenarioPlayView.scenario = await db.scenarios.getScenario(scenarioId);

            if (!ScenarioPlayView.scenario) {
                throw new Error('Escenario no encontrado');
            }

            // Reset state
            ScenarioPlayView.phase = 'intro';
            ScenarioPlayView.messages = [];
            ScenarioPlayView.turnNumber = 0;
            ScenarioPlayView.feedbackHistory = [];
            ScenarioPlayView.session = null;

            // Render intro phase
            ScenarioPlayView.renderIntro();

        } catch (error) {
            console.error('Error loading scenario:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😕</div>
                    <h3 class="empty-state-title">Error al cargar</h3>
                    <p class="empty-state-description">No pudimos cargar el escenario. Intenta de nuevo.</p>
                    <a href="#scenarios" class="btn btn-primary">Volver al Catálogo</a>
                </div>
            `;
        }
    },

    /**
     * Render intro phase
     */
    renderIntro: () => {
        const scenario = ScenarioPlayView.scenario;
        const container = document.getElementById('view-container');

        const difficultyLabels = {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado'
        };

        container.innerHTML = `
            <div class="scenario-play">
                <div class="scenario-intro">
                    <div class="scenario-intro-header">
                        <h1>${scenario.title}</h1>
                        <div class="scenario-intro-badges">
                            <span class="badge scenario-difficulty ${scenario.difficulty}">
                                ${difficultyLabels[scenario.difficulty] || 'Principiante'}
                            </span>
                            <span class="badge badge-primary">
                                🕐 ${scenario.estimated_time || 15} minutos
                            </span>
                        </div>
                    </div>

                    <div class="scenario-story">
                        ${scenario.intro_story.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                    </div>

                    <div class="scenario-characters">
                        <h3>Personajes</h3>
                        <div class="characters-grid">
                            ${scenario.characters.map(char => `
                                <div class="character-card">
                                    <div class="character-card-avatar">${char.avatar || '👤'}</div>
                                    <div class="character-card-name">${char.name}</div>
                                    <div class="character-card-role">${char.role}</div>
                                </div>
                            `).join('')}
                            <div class="character-card">
                                <div class="character-card-avatar" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));">👤</div>
                                <div class="character-card-name">Tú</div>
                                <div class="character-card-role">Protagonista</div>
                            </div>
                        </div>
                    </div>

                    <div class="scenario-objective">
                        <h3>🎯 Tu Objetivo</h3>
                        <p>${scenario.objective}</p>
                    </div>

                    <div class="scenario-bibliography">
                        <h3>📚 Basado en</h3>
                        <div class="bibliography-list">
                            ${scenario.bibliography.map(b => `
                                <div class="bibliography-item">
                                    <strong>"${b.title}"</strong> - ${b.author}
                                    <br><small style="color: var(--color-text-muted)">${b.concept}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary scenario-start-btn" onclick="ScenarioPlayView.startScenario()">
                        Comenzar Escenario
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Start the scenario
     */
    startScenario: async () => {
        const scenario = ScenarioPlayView.scenario;
        const userId = Auth.getUserId();

        // Create session
        ScenarioPlayView.session = await db.sessions.createSession(userId, scenario.id);

        // Initialize OpenAI conversation
        OpenAI.initConversation(scenario);

        // Switch to chat phase
        ScenarioPlayView.phase = 'chat';
        ScenarioPlayView.renderChat();

        // Add initial system message
        ScenarioPlayView.addMessage({
            role: 'system',
            name: 'Narrador',
            avatar: '📖',
            content: 'La escena comienza...'
        });

        // Get first AI response
        await ScenarioPlayView.getAIResponse();
    },

    /**
     * Render chat phase
     */
    renderChat: () => {
        const scenario = ScenarioPlayView.scenario;
        const container = document.getElementById('view-container');

        container.innerHTML = `
            <div class="scenario-play">
                <div class="scenario-chat">
                    <div class="chat-header">
                        <span class="chat-scenario-title">${scenario.title}</span>
                        <div class="chat-progress">
                            <span>Turno ${ScenarioPlayView.turnNumber + 1}</span>
                        </div>
                    </div>

                    <div class="chat-messages" id="chat-messages">
                        <!-- Messages will be rendered here -->
                    </div>

                    <div class="chat-input-area" id="chat-input-area">
                        <div class="chat-options" id="chat-options">
                            <!-- Options will be rendered here -->
                        </div>
                        <div class="chat-input-row">
                            <textarea
                                class="chat-input"
                                id="chat-input"
                                placeholder="O escribe tu propia respuesta..."
                                rows="2"
                            ></textarea>
                            <button class="btn btn-primary chat-send-btn" id="chat-send-btn" onclick="ScenarioPlayView.sendMessage()">
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup input handlers
        ScenarioPlayView.setupInputHandlers();
    },

    /**
     * Setup input handlers
     */
    setupInputHandlers: () => {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ScenarioPlayView.sendMessage();
            }
        });
    },

    /**
     * Add a message to the chat
     */
    addMessage: (message) => {
        ScenarioPlayView.messages.push(message);

        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.role}`;

        messageEl.innerHTML = `
            <div class="chat-message-avatar">${message.avatar || (message.role === 'user' ? '👤' : '🤖')}</div>
            <div class="chat-message-content">
                <div class="chat-message-name">${message.name || (message.role === 'user' ? 'Tú' : 'Personaje')}</div>
                <div class="chat-message-text">${message.content}</div>
            </div>
        `;

        messagesContainer.appendChild(messageEl);

        // Add feedback card if present
        if (message.feedback) {
            ScenarioPlayView.addFeedbackCard(message.feedback);
        }

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    /**
     * Add feedback card
     */
    addFeedbackCard: (feedback) => {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        ScenarioPlayView.feedbackHistory.push(feedback);

        const feedbackEl = document.createElement('div');
        feedbackEl.className = `feedback-card ${feedback.type}`;

        const icons = {
            positive: '✓ Buena práctica',
            negative: '💡 Oportunidad de mejora',
            neutral: 'ℹ️ Información'
        };

        feedbackEl.innerHTML = `
            <div class="feedback-header ${feedback.type}">${icons[feedback.type]}</div>
            <div class="feedback-text">${feedback.text}</div>
            ${feedback.reference ? `<div class="feedback-reference">📚 ${feedback.reference}</div>` : ''}
        `;

        messagesContainer.appendChild(feedbackEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    /**
     * Send user message
     */
    sendMessage: async (optionText = null) => {
        const input = document.getElementById('chat-input');
        const message = optionText || input?.value?.trim();

        if (!message) return;

        // Clear input
        if (input) input.value = '';

        // Disable input while processing
        ScenarioPlayView.setInputEnabled(false);

        // Add user message
        ScenarioPlayView.addMessage({
            role: 'user',
            name: Auth.getUsername(),
            avatar: Auth.getUsername().charAt(0).toUpperCase(),
            content: message
        });

        // Increment turn
        ScenarioPlayView.turnNumber++;

        // Get AI response
        await ScenarioPlayView.getAIResponse();

        // Re-enable input
        ScenarioPlayView.setInputEnabled(true);
    },

    /**
     * Get AI response
     */
    getAIResponse: async () => {
        // Show typing indicator
        const messagesContainer = document.getElementById('chat-messages');
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-message assistant typing';
        typingEl.innerHTML = `
            <div class="chat-message-avatar">💭</div>
            <div class="chat-message-content">
                <div class="chat-message-text"><div class="spinner"></div> Escribiendo...</div>
            </div>
        `;
        messagesContainer?.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            // Get user's last message for context
            const lastUserMessage = ScenarioPlayView.messages
                .filter(m => m.role === 'user')
                .pop()?.content || '';

            const response = await OpenAI.sendMessage(lastUserMessage, {
                turn: ScenarioPlayView.turnNumber
            });

            // Remove typing indicator
            typingEl.remove();

            // Check for scenario completion
            if (response.message.includes('[SCENARIO_COMPLETE]') || response.isEnding) {
                response.message = response.message.replace('[SCENARIO_COMPLETE]', '');

                // Add final message
                ScenarioPlayView.addMessage({
                    role: 'assistant',
                    name: 'Narrador',
                    avatar: '📖',
                    content: response.message,
                    feedback: response.feedback
                });

                // Complete scenario
                setTimeout(() => {
                    ScenarioPlayView.completeScenario(response.points || 2);
                }, 2000);
                return;
            }

            // Determine which character is speaking
            const characters = ScenarioPlayView.scenario.characters;
            const speakingChar = characters[ScenarioPlayView.turnNumber % characters.length] || characters[0];

            // Add AI message
            ScenarioPlayView.addMessage({
                role: 'assistant',
                name: speakingChar.name,
                avatar: speakingChar.avatar,
                content: response.message,
                feedback: response.feedback
            });

            // Update options
            ScenarioPlayView.updateOptions();

        } catch (error) {
            console.error('Error getting AI response:', error);
            typingEl.remove();
            Toast.show('Error al comunicarse con la IA. Intenta de nuevo.', 'error');
            ScenarioPlayView.setInputEnabled(true);
        }
    },

    /**
     * Update response options
     */
    updateOptions: () => {
        const optionsContainer = document.getElementById('chat-options');
        if (!optionsContainer) return;

        const options = OpenAI.generateOptions(ScenarioPlayView.scenario, ScenarioPlayView.turnNumber);

        optionsContainer.innerHTML = options.map(opt => `
            <button class="chat-option" onclick="ScenarioPlayView.sendMessage('${opt.replace(/'/g, "\\'")}')">
                ${opt}
            </button>
        `).join('');
    },

    /**
     * Enable/disable input
     */
    setInputEnabled: (enabled) => {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const options = document.querySelectorAll('.chat-option');

        if (input) input.disabled = !enabled;
        if (sendBtn) sendBtn.disabled = !enabled;
        options.forEach(opt => opt.disabled = !enabled);
    },

    /**
     * Complete the scenario
     */
    completeScenario: async (points) => {
        const scenario = ScenarioPlayView.scenario;
        const userId = Auth.getUserId();

        // Evaluate performance
        const evaluation = OpenAI.evaluatePerformance();
        const finalPoints = points || evaluation.points;

        // Update session
        if (ScenarioPlayView.session) {
            await db.sessions.completeSession(
                ScenarioPlayView.session.id,
                finalPoints,
                ScenarioPlayView.messages,
                ScenarioPlayView.feedbackHistory
            );
        }

        // Update user skills
        const skills = scenario.scenario_skills?.map(ss => ss.skill) || [];
        for (const skill of skills) {
            await db.skills.updateUserSkill(userId, skill.id, finalPoints);
        }

        // Update completed count
        const completed = parseInt(localStorage.getItem('completedScenarios') || '0') + 1;
        localStorage.setItem('completedScenarios', completed.toString());

        // Switch to conclusion phase
        ScenarioPlayView.phase = 'conclusion';
        ScenarioPlayView.renderConclusion(finalPoints, evaluation);
    },

    /**
     * Render conclusion phase
     */
    renderConclusion: (points, evaluation) => {
        const scenario = ScenarioPlayView.scenario;
        const container = document.getElementById('view-container');

        const stars = [];
        for (let i = 0; i < (scenario.max_points || 3); i++) {
            stars.push(i < points ? 'filled' : '');
        }

        const skills = scenario.scenario_skills?.map(ss => ss.skill) || [];

        container.innerHTML = `
            <div class="scenario-play">
                <div class="scenario-conclusion">
                    <div class="conclusion-header">
                        <h2>🎉 ¡Escenario Completado!</h2>
                        <div class="conclusion-stars">
                            ${stars.map(s => `<span class="conclusion-star ${s}">★</span>`).join('')}
                        </div>
                        <p class="conclusion-points">${points} de ${scenario.max_points || 3} puntos obtenidos</p>
                    </div>

                    <div class="conclusion-summary">
                        <h3>Resumen de tu desempeño</h3>
                        <p>${evaluation.summary}</p>
                    </div>

                    <div class="conclusion-skills">
                        <h3>Habilidades mejoradas</h3>
                        <div class="skills-earned">
                            ${skills.map(skill => SkillCard.renderEarned(skill, points)).join('')}
                        </div>
                    </div>

                    <div class="conclusion-actions">
                        <button class="btn btn-secondary" onclick="ScenarioPlayView.render('${scenario.id}')">
                            Repetir Escenario
                        </button>
                        <a href="#scenarios" class="btn btn-primary">
                            Volver al Catálogo
                        </a>
                    </div>
                </div>
            </div>
        `;

        Toast.show('¡Has ganado puntos de experiencia!', 'success');
    }
};

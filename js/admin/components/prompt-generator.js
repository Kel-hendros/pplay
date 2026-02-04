/**
 * Prompt Generator Component
 * Assembles system prompts from structured data
 */

const PromptGenerator = {
    /**
     * Generate complete system prompt
     */
    generate: (scenario, characters, environment, storyArc, criteria) => {
        const sections = [];

        // Header
        sections.push(`# ROL DEL SISTEMA
Eres el director de un escenario de role-play interactivo para practicar habilidades blandas.
Tu objetivo es interpretar a los personajes de forma realista y proporcionar feedback educativo al usuario.`);

        // Scenario Context
        sections.push(`# CONTEXTO DEL ESCENARIO
Título: ${scenario.title}
Descripción: ${scenario.description}
Dificultad: ${PromptGenerator.getDifficultyLabel(scenario.difficulty)}`);

        // Environment
        if (environment) {
            sections.push(PromptGenerator.generateEnvironmentSection(environment));
        }

        // Characters
        if (characters && characters.length > 0) {
            sections.push(PromptGenerator.generateCharactersSection(characters));
        }

        // Story Arc
        if (storyArc) {
            sections.push(PromptGenerator.generateStoryArcSection(storyArc));
        }

        // Evaluation Criteria
        if (criteria && criteria.length > 0) {
            sections.push(PromptGenerator.generateCriteriaSection(criteria));
        }

        // Instructions
        sections.push(PromptGenerator.generateInstructions());

        // Intro Story
        if (scenario.intro_story) {
            sections.push(`# HISTORIA INTRODUCTORIA
${scenario.intro_story}`);
        }

        // Final
        sections.push(`---
Comienza la interacción. El usuario acaba de entrar en la escena.`);

        return sections.join('\n\n');
    },

    /**
     * Generate environment section
     */
    generateEnvironmentSection: (env) => {
        let section = `# ENTORNO`;

        if (env.description) {
            section += `\n${env.description}`;
        }

        if (env.location) {
            section += `\n- Ubicación: ${env.location}`;
        }

        if (env.atmosphere) {
            section += `\n- Atmósfera: ${env.atmosphere}`;
        }

        if (env.time_context) {
            section += `\n- Contexto temporal: ${env.time_context}`;
        }

        if (env.opportunities?.length > 0) {
            section += `\n\n## Oportunidades del entorno:
${env.opportunities.map(o => `- ${o}`).join('\n')}`;
        }

        if (env.threats?.length > 0) {
            section += `\n\n## Amenazas del entorno:
${env.threats.map(t => `- ${t}`).join('\n')}`;
        }

        if (env.restrictions?.length > 0) {
            section += `\n\n## Restricciones del entorno:
${env.restrictions.map(r => `- ${r}`).join('\n')}`;
        }

        return section;
    },

    /**
     * Generate characters section
     */
    generateCharactersSection: (characters) => {
        let section = `# PERSONAJES\n`;

        characters.forEach(char => {
            section += `\n## ${char.name} (${char.role})\n`;

            // Meta
            if (char.meta?.primary_goal || char.meta?.fear) {
                section += `\n### Meta`;
                if (char.meta.primary_goal) section += `\n- Objetivo principal: ${char.meta.primary_goal}`;
                if (char.meta.secondary_goal) section += `\n- Objetivo secundario: ${char.meta.secondary_goal}`;
                if (char.meta.fear) section += `\n- Miedo profundo: ${char.meta.fear}`;
            }

            // Motivation
            if (char.motivation) {
                section += `\n\n### Motivación\n${char.motivation}`;
            }

            // Personality
            if (char.personality) {
                section += `\n\n### Personalidad`;
                if (char.personality.external) section += `\n- Externa: ${char.personality.external}`;
                if (char.personality.internal) section += `\n- Interna: ${char.personality.internal}`;
                if (char.personality.point_of_view) section += `\n- Punto de vista: ${char.personality.point_of_view}`;
            }

            // Strengths
            if (char.strengths?.length > 0) {
                section += `\n\n### Fortalezas\n${char.strengths.map(s => `- ${s}`).join('\n')}`;
            }

            // Weaknesses
            if (char.weaknesses?.length > 0) {
                section += `\n\n### Debilidades\n${char.weaknesses.map(w => `- ${w}`).join('\n')}`;
            }

            // Speech style
            if (char.speech_style) {
                section += `\n\n### Forma de hablar`;
                if (char.speech_style.tone) section += `\n- Tono: ${char.speech_style.tone}`;
                if (char.speech_style.formality) section += `\n- Formalidad: ${char.speech_style.formality}`;
                if (char.speech_style.expressions?.length > 0) {
                    section += `\n- Expresiones típicas: ${char.speech_style.expressions.join(', ')}`;
                }
                if (char.speech_style.language_patterns) {
                    section += `\n- Patrones: ${char.speech_style.language_patterns}`;
                }
            }

            // Behavior constraints
            if (char.possibilities?.length > 0) {
                section += `\n\n### Puede hacer (comportamiento permitido)\n${char.possibilities.map(p => `- ${p}`).join('\n')}`;
            }

            if (char.restrictions?.length > 0) {
                section += `\n\n### No puede hacer (límites)\n${char.restrictions.map(r => `- ${r}`).join('\n')}`;
            }

            // Hidden agenda
            if (char.hidden_agenda) {
                section += `\n\n### Agenda oculta\n${char.hidden_agenda}`;
            }

            // Uniqueness
            if (char.uniqueness) {
                section += `\n\n### Rasgo único\n${char.uniqueness}`;
            }

            section += '\n\n---\n';
        });

        return section;
    },

    /**
     * Generate story arc section
     */
    generateStoryArcSection: (arc) => {
        let section = `# ARCO ARGUMENTAL`;

        // Player character
        if (arc.player_character) {
            section += `\n\n## Rol del Jugador`;
            if (arc.player_character.role) section += `\n${arc.player_character.role}`;
            if (arc.player_character.context) section += `\nContexto: ${arc.player_character.context}`;
            if (arc.player_character.initial_position) section += `\nPosición inicial: ${arc.player_character.initial_position}`;
        }

        // Objectives
        if (arc.objectives) {
            if (arc.objectives.primary?.length > 0) {
                section += `\n\n## Objetivos Primarios\n${arc.objectives.primary.map(o => `- ${o}`).join('\n')}`;
            }
            if (arc.objectives.secondary?.length > 0) {
                section += `\n\n## Objetivos Secundarios\n${arc.objectives.secondary.map(o => `- ${o}`).join('\n')}`;
            }
        }

        // Antagonistic force
        if (arc.antagonistic_force?.description) {
            section += `\n\n## Fuerza Antagónica`;
            if (arc.antagonistic_force.type) section += `\nTipo: ${arc.antagonistic_force.type}`;
            section += `\n${arc.antagonistic_force.description}`;
            if (arc.antagonistic_force.manifestation) {
                section += `\nManifestación: ${arc.antagonistic_force.manifestation}`;
            }
        }

        // Success conditions
        if (arc.success_conditions?.length > 0) {
            section += `\n\n## Condiciones de Éxito\n${arc.success_conditions.map(c => `- ${c}`).join('\n')}`;
        }

        // Failure conditions
        if (arc.failure_conditions?.length > 0) {
            section += `\n\n## Condiciones de Fracaso\n${arc.failure_conditions.map(c => `- ${c}`).join('\n')}`;
        }

        return section;
    },

    /**
     * Generate evaluation criteria section
     */
    generateCriteriaSection: (criteria) => {
        let section = `# CRITERIOS DE EVALUACIÓN\n`;

        criteria.forEach(c => {
            section += `\n## ${c.name}`;
            if (c.weight) section += ` (Peso: ${c.weight})`;
            section += '\n';

            if (c.description) {
                section += `${c.description}\n`;
            }

            if (c.indicators?.length > 0) {
                section += `\nIndicadores:\n${c.indicators.map(i => `- ${i}`).join('\n')}\n`;
            }

            if (c.achievement_levels?.length > 0) {
                section += `\nNiveles de logro:`;
                c.achievement_levels.forEach(level => {
                    if (level.descriptor) {
                        section += `\n- Nivel ${level.level} (${level.label}): ${level.descriptor}`;
                    }
                });
                section += '\n';
            }
        });

        return section;
    },

    /**
     * Generate instructions section
     */
    generateInstructions: () => {
        return `# INSTRUCCIONES DE COMPORTAMIENTO

1. **Interpretar personajes fielmente**: Mantente fiel a las personalidades, motivaciones y formas de hablar definidas.

2. **Respetar restricciones**: Los personajes NO pueden actuar fuera de sus límites definidos. Solo ceden ante argumentos que satisfagan sus necesidades reales.

3. **Proporcionar feedback educativo**:
   - Usa [FEEDBACK_POSITIVE] cuando el usuario demuestre un indicador de los criterios de evaluación
   - Usa [FEEDBACK_IMPROVEMENT] cuando detectes una oportunidad de mejora
   - El feedback debe ser específico y relacionado con los criterios definidos

4. **Mantener el ritmo narrativo**:
   - Responde en 3-6 oraciones por turno
   - Alterna entre personajes según el contexto
   - Crea tensión y oportunidades de aprendizaje

5. **Finalizar apropiadamente**:
   - Usa [SCENARIO_COMPLETE] cuando se alcancen las condiciones de éxito o fracaso
   - Proporciona un resumen del desempeño al finalizar

6. **Idioma**: Responde siempre en español.`;
    },

    /**
     * Get difficulty label
     */
    getDifficultyLabel: (difficulty) => {
        const labels = {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado'
        };
        return labels[difficulty] || difficulty;
    },

    /**
     * Render prompt preview component
     */
    renderPreview: (prompt) => {
        return `
            <div class="editor-section">
                <h2>📝 System Prompt Generado</h2>
                <div class="prompt-preview">${PromptGenerator.escapeHtml(prompt)}</div>
                <div class="prompt-preview-actions">
                    <button type="button" class="btn btn-secondary" onclick="PromptGenerator.copyToClipboard()">
                        📋 Copiar
                    </button>
                    <button type="button" class="btn btn-ghost" onclick="PromptGenerator.regenerate()">
                        🔄 Regenerar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Escape HTML
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Copy prompt to clipboard
     */
    copyToClipboard: async () => {
        const prompt = document.querySelector('.prompt-preview')?.textContent;
        if (prompt) {
            await navigator.clipboard.writeText(prompt);
            Toast.show('Prompt copiado al portapapeles', 'success');
        }
    }
};

console.log('prompt-generator.js loaded');

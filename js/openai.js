/**
 * OpenAI Integration Module
 * Handles AI-powered conversations for scenarios
 *
 * IMPORTANT: In production, API calls should go through a backend/edge function
 * to keep the API key secure. This module is designed to work with:
 * 1. Direct API calls (development only - NOT recommended for production)
 * 2. Supabase Edge Function proxy (recommended)
 * 3. Mock responses (for testing without API)
 */

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // Replace with your key for development
const USE_MOCK = true; // Set to false when you have a real API key or edge function

const OpenAI = {
    conversationHistory: [],
    systemPrompt: '',

    /**
     * Initialize a new conversation for a scenario
     */
    initConversation: (scenario) => {
        OpenAI.systemPrompt = scenario.system_prompt;
        OpenAI.conversationHistory = [];

        // Add initial context
        OpenAI.conversationHistory.push({
            role: 'system',
            content: scenario.system_prompt
        });

        // Add scenario context
        OpenAI.conversationHistory.push({
            role: 'system',
            content: `CONTEXTO DEL ESCENARIO:
Título: ${scenario.title}
Objetivo del usuario: ${scenario.objective}

PERSONAJES:
${scenario.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}

BIBLIOGRAFÍA DE REFERENCIA:
${scenario.bibliography.map(b => `- "${b.title}" de ${b.author}: ${b.concept}`).join('\n')}

Comienza la interacción. El usuario acaba de entrar en la escena.`
        });
    },

    /**
     * Send a message and get AI response
     */
    sendMessage: async (userMessage, options = {}) => {
        // Add user message to history
        OpenAI.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        try {
            let response;

            if (USE_MOCK) {
                response = await OpenAI.getMockResponse(userMessage, options);
            } else if (OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY') {
                response = await OpenAI.callOpenAI();
            } else {
                // Try Supabase Edge Function
                response = await OpenAI.callEdgeFunction();
            }

            // Add assistant response to history
            OpenAI.conversationHistory.push({
                role: 'assistant',
                content: response.message
            });

            return response;
        } catch (error) {
            console.error('OpenAI Error:', error);
            return {
                message: 'Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.',
                feedback: null,
                error: true
            };
        }
    },

    /**
     * Direct OpenAI API call (development only)
     */
    callOpenAI: async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: OpenAI.conversationHistory,
                temperature: 0.8,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API error');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return OpenAI.parseResponse(content);
    },

    /**
     * Call through Supabase Edge Function (recommended for production)
     */
    callEdgeFunction: async () => {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                messages: OpenAI.conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error('Edge function error');
        }

        const data = await response.json();
        return OpenAI.parseResponse(data.content);
    },

    /**
     * Parse AI response to extract feedback markers
     */
    parseResponse: (content) => {
        let message = content;
        let feedback = null;

        // Check for positive feedback
        const positiveMatch = content.match(/\[FEEDBACK_POSITIVE\](.*?)(?=\[|$)/s);
        if (positiveMatch) {
            feedback = {
                type: 'positive',
                text: positiveMatch[1].trim()
            };
            message = message.replace(/\[FEEDBACK_POSITIVE\].*?(?=\[|$)/s, '').trim();
        }

        // Check for improvement feedback
        const improvementMatch = content.match(/\[FEEDBACK_IMPROVEMENT\](.*?)(?=\[|$)/s);
        if (improvementMatch) {
            feedback = {
                type: 'negative',
                text: improvementMatch[1].trim()
            };
            message = message.replace(/\[FEEDBACK_IMPROVEMENT\].*?(?=\[|$)/s, '').trim();
        }

        return { message, feedback };
    },

    /**
     * Mock responses for development/testing
     */
    getMockResponse: async (userMessage, options = {}) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const turnNumber = Math.floor(OpenAI.conversationHistory.length / 2);
        const lowerMessage = userMessage.toLowerCase();

        // Define response patterns based on scenario context and turn
        const responses = OpenAI.getMockScenarioResponses(turnNumber, lowerMessage);

        return responses;
    },

    getMockScenarioResponses: (turn, message) => {
        // Detect keywords for smart responses
        const hasEmpathy = message.includes('entiendo') || message.includes('comprendo') || message.includes('veo tu punto');
        const hasQuestion = message.includes('?') || message.includes('qué') || message.includes('cómo') || message.includes('por qué');
        const hasProposal = message.includes('propongo') || message.includes('qué tal si') || message.includes('podríamos');
        const hasData = message.includes('datos') || message.includes('números') || message.includes('roi') || message.includes('resultados');

        // Character responses based on turn and user input
        const responses = {
            0: {
                message: `*Carlos cruza los brazos*

"Mira, seré directo. El equipo de ventas ha superado las metas tres trimestres seguidos. Necesitamos más presupuesto para comisiones o vamos a perder a nuestros mejores vendedores."

*María suspira*

"Carlos, ya hablamos de esto. Sin inversión en marca, ¿de dónde crees que vienen esos leads?"`,
                feedback: null
            },
            1: {
                message: hasEmpathy ?
                    `*Carlos se relaja un poco*

"Al menos alguien entiende la presión que tenemos. Mis vendedores están trabajando el doble por el mismo dinero."

*María asiente*

"Todos estamos bajo presión. La pregunta es cómo ser estratégicos con lo que tenemos."` :
                    `*Carlos frunce el ceño*

"No necesito que me expliquen cómo funciona el negocio. Lo que necesito son recursos."

*María interviene*

"Quizás deberíamos escuchar propuestas concretas en lugar de quejarnos."`,
                feedback: hasEmpathy ? {
                    type: 'positive',
                    text: 'Buen uso de la empatía. Según "Getting to Yes", reconocer las emociones del otro facilita el diálogo.'
                } : {
                    type: 'negative',
                    text: 'Oportunidad perdida: Antes de proponer soluciones, valida las preocupaciones de los demás. "Crucial Conversations" enfatiza crear seguridad psicológica.'
                }
            },
            2: {
                message: hasQuestion ?
                    `*María levanta una ceja, interesada*

"Buena pregunta. Los números del Q1 muestran que el 40% de nuestros leads vienen de campañas de marca, pero el costo por adquisición es 3x mayor que el de performance."

*Carlos añade*

"Y mi equipo cierra el 60% de los leads de marketing digital. Los de branding... apenas un 20%."` :
                    `*Carlos mira su reloj*

"Llevamos 20 minutos hablando en círculos. ¿Alguien tiene una propuesta concreta?"

*María asiente*

"Estoy de acuerdo. Necesitamos números sobre la mesa."`,
                feedback: hasQuestion ? {
                    type: 'positive',
                    text: 'Excelente técnica. Hacer preguntas para entender intereses (no posiciones) es clave en "Getting to Yes".'
                } : null
            },
            3: {
                message: hasProposal && hasData ?
                    `*Ambos se miran y luego a ti*

*María habla primero*
"Es... una propuesta interesante. Me gusta que esté basada en datos."

*Carlos asiente lentamente*
"Si podemos medir el ROI real, estoy dispuesto a considerar un modelo diferente. Pero necesito garantías de que mis vendedores no pierdan."` :
                    hasProposal ?
                    `*Carlos sacude la cabeza*

"Suena bonito, pero ¿dónde están los números? No puedo ir a mi equipo con buenas intenciones."

*María está de acuerdo*

"Necesitamos datos concretos para justificar cualquier cambio."` :
                    `*El ambiente se tensa*

*Carlos golpea la mesa suavemente*
"Esto no está avanzando. Alguien tiene que ceder algo."

*María responde*
"No se trata de ceder. Se trata de encontrar algo que funcione para todos."`,
                feedback: hasProposal ? {
                    type: hasData ? 'positive' : 'negative',
                    text: hasData ?
                        'Propuesta basada en datos + beneficio mutuo. Fisher y Ury llamarían a esto "inventar opciones para ganancia mutua".' :
                        'La propuesta es creativa, pero le faltan criterios objetivos. "Getting to Yes": usa estándares independientes para evaluar opciones.'
                } : null
            },
            4: {
                message: `*María mira sus notas*

"Mira, creo que estamos cerca de algo. Si pudieramos encontrar un modelo piloto que nos permita probar..."

*Carlos interrumpe*
"Un piloto. Tres meses. Si los números funcionan, revisamos. Si no, volvemos a lo tradicional."

*Ambos te miran*
"¿Qué dices? ¿Puedes trabajar con eso?"`,
                feedback: {
                    type: 'neutral',
                    text: 'Momento clave: Los dos están abiertos a una solución. Esta es tu oportunidad de cerrar el acuerdo.'
                }
            },
            5: {
                message: `*Carlos extiende la mano*

"De acuerdo. Tres meses, métricas claras, revisión mensual."

*María sonríe*
"Me parece justo. Envíame el plan por escrito y lo presentamos juntos a Finanzas."

*Carlos asiente hacia ti*
"Bien manejado. No esperaba llegar a un acuerdo hoy."

[SCENARIO_COMPLETE]`,
                feedback: {
                    type: 'positive',
                    text: 'Has logrado un acuerdo que satisface los intereses de ambas partes. Esto demuestra el poder de la negociación basada en principios.'
                },
                isEnding: true,
                points: 3
            }
        };

        // Get response for current turn, or use a default for later turns
        if (turn >= 5) {
            return responses[5];
        }

        return responses[turn] || {
            message: `*Ambos consideran tus palabras*

*María toma notas*
"Interesante perspectiva..."

*Carlos añade*
"Sigo sin estar convencido del todo, pero continúa."`,
            feedback: null
        };
    },

    /**
     * Generate response options for user
     */
    generateOptions: (scenario, turnNumber) => {
        const optionSets = {
            0: [
                "Entiendo la frustración de ambos. ¿Podríamos ver los números juntos antes de decidir?",
                "Carlos tiene razón, las ventas son prioridad.",
                "María, la marca es lo que nos diferencia. Debemos protegerla.",
                "Propongo dividir el presupuesto en partes iguales."
            ],
            1: [
                "¿Qué resultados específicos ha dado cada canal en los últimos 6 meses?",
                "Creo que ambos tienen puntos válidos. ¿Qué pasaría si medimos el ROI de cada iniciativa?",
                "Carlos, ¿cuánto presupuesto adicional necesitarías exactamente?",
                "María, ¿tienes datos sobre el impacto de la marca en las ventas?"
            ],
            2: [
                "Con esos datos, propongo un modelo híbrido: 40% ventas, 40% marca, 20% performance digital.",
                "¿Y si hacemos un piloto de 3 meses midiendo ROI por canal?",
                "Basándonos en estos números, tiene más sentido priorizar el marketing digital.",
                "Necesito más tiempo para analizar estos datos antes de proponer algo."
            ],
            3: [
                "Acepto el piloto. Propongo métricas claras: CAC, LTV y tasa de conversión por canal.",
                "Antes de aceptar, necesito que ambos se comprometan a apoyar el experimento.",
                "¿Qué garantías tienen ustedes de que el piloto será justo para todas las áreas?",
                "Me parece bien, pero agreguemos una revisión mensual de resultados."
            ],
            4: [
                "Perfecto. Me comprometo a presentar un plan detallado esta semana.",
                "Acepto, con una condición: reunión semanal de seguimiento los tres.",
                "Gracias por la apertura. Creo que esto puede funcionar para todos.",
                "Antes de cerrar, ¿hay algo más que necesiten de mi parte?"
            ]
        };

        return optionSets[turnNumber] || optionSets[4];
    },

    /**
     * Evaluate final performance
     */
    evaluatePerformance: () => {
        // In a real implementation, this would analyze the conversation
        // For now, return mock evaluation
        const positiveFeedback = OpenAI.conversationHistory.filter(m =>
            m.role === 'assistant' && m.content.includes('[FEEDBACK_POSITIVE]')
        ).length;

        const points = Math.min(3, Math.max(1, positiveFeedback + 1));

        return {
            points,
            summary: points === 3 ?
                'Excelente negociación. Lograste un acuerdo beneficioso para todas las partes usando técnicas de comunicación efectiva y negociación basada en principios.' :
                points === 2 ?
                'Buena negociación. Llegaste a un acuerdo, aunque hubo oportunidades de aplicar mejor algunas técnicas de comunicación.' :
                'Negociación completada. Considera practicar más las técnicas de escucha activa y generación de opciones para mejorar resultados.',
            skills: [
                { name: 'Comunicación Efectiva', points: points },
                { name: 'Negociación', points: points }
            ]
        };
    },

    /**
     * Reset conversation
     */
    reset: () => {
        OpenAI.conversationHistory = [];
        OpenAI.systemPrompt = '';
    }
};

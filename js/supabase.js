/**
 * Supabase Client Configuration
 *
 * IMPORTANT: Replace these values with your actual Supabase project credentials
 * You can find these in your Supabase project settings > API
 */

const SUPABASE_URL = 'https://idkmyquqqedjhwsemjwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlka215cXVxcWVkamh3c2VtandoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTE5MDMsImV4cCI6MjA4NTc4NzkwM30.pF1XJgUQx7tcCjTIVAy5fRcqRbHr-TS9ixBrZWLJ-F0';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// Initialize Supabase client
let supabaseClient = null;

const initSupabase = async () => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Using mock data.');
        return null;
    }

    // Check if Supabase SDK is loaded (v2 exports on window.supabase)
    const supabaseLib = window.supabase;
    if (!supabaseLib || !supabaseLib.createClient) {
        console.error('Supabase SDK not loaded properly. Check the CDN script.');
        console.log('window.supabase:', window.supabase);
        return null;
    }

    supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized successfully');
    return supabaseClient;
};

// Helper to load external scripts
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// ==================== AUTH QUERIES ====================

const authQueries = {
    signUp: async (email, password, username) => {
        if (!supabaseClient) return mockAuth.signUp(email, password, username);

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (error) throw error;

        // Create profile
        if (data.user) {
            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                username,
                created_at: new Date().toISOString()
            });
        }

        return data;
    },

    signIn: async (email, password) => {
        if (!supabaseClient) return mockAuth.signIn(email, password);

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    signOut: async () => {
        if (!supabaseClient) return mockAuth.signOut();

        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    getSession: async () => {
        if (!supabaseClient) return mockAuth.getSession();

        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    getUser: async () => {
        if (!supabaseClient) return mockAuth.getUser();

        const { data, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return data.user;
    },

    onAuthStateChange: (callback) => {
        if (!supabaseClient) return mockAuth.onAuthStateChange(callback);

        return supabaseClient.auth.onAuthStateChange(callback);
    }
};

// ==================== PROFILE QUERIES ====================

const profileQueries = {
    getProfile: async (userId) => {
        if (!supabaseClient) return mockData.getProfile(userId);

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    updateProfile: async (userId, updates) => {
        if (!supabaseClient) return mockData.updateProfile(userId, updates);

        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== SKILLS QUERIES ====================

const skillsQueries = {
    getAllSkills: async () => {
        if (!supabaseClient) return mockData.getAllSkills();

        const { data, error } = await supabaseClient
            .from('skills')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data;
    },

    getUserSkills: async (userId) => {
        if (!supabaseClient) return mockData.getUserSkills(userId);

        const { data, error } = await supabaseClient
            .from('user_skills')
            .select(`
                *,
                skill:skills(*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    updateUserSkill: async (userId, skillId, points) => {
        if (!supabaseClient) return mockData.updateUserSkill(userId, skillId, points);

        // Get current skill data
        const { data: existing } = await supabaseClient
            .from('user_skills')
            .select('*')
            .eq('user_id', userId)
            .eq('skill_id', skillId)
            .single();

        const newPoints = (existing?.current_points || 0) + points;
        const newLevel = Math.floor(newPoints / 10); // 10 points per level

        if (existing) {
            const { data, error } = await supabaseClient
                .from('user_skills')
                .update({
                    current_points: newPoints,
                    current_level: newLevel
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabaseClient
                .from('user_skills')
                .insert({
                    user_id: userId,
                    skill_id: skillId,
                    current_points: newPoints,
                    current_level: newLevel
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    }
};

// ==================== SCENARIOS QUERIES ====================

const scenariosQueries = {
    getAllScenarios: async () => {
        if (!supabaseClient) return mockData.getAllScenarios();

        const { data, error } = await supabaseClient
            .from('scenarios')
            .select(`
                *,
                scenario_skills(
                    skill:skills(*)
                )
            `)
            .order('difficulty', { ascending: true });

        if (error) throw error;
        return data;
    },

    getScenario: async (scenarioId) => {
        if (!supabaseClient) return mockData.getScenario(scenarioId);

        const { data, error } = await supabaseClient
            .from('scenarios')
            .select(`
                *,
                scenario_skills(
                    skill:skills(*)
                )
            `)
            .eq('id', scenarioId)
            .single();

        if (error) throw error;
        return data;
    },

    getUserScenarioProgress: async (userId, scenarioId) => {
        if (!supabaseClient) return mockData.getUserScenarioProgress(userId, scenarioId);

        const { data, error } = await supabaseClient
            .from('play_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('scenario_id', scenarioId)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data;
    }
};

// ==================== PLAY SESSION QUERIES ====================

const sessionQueries = {
    createSession: async (userId, scenarioId) => {
        if (!supabaseClient) return mockData.createSession(userId, scenarioId);

        const { data, error } = await supabaseClient
            .from('play_sessions')
            .insert({
                user_id: userId,
                scenario_id: scenarioId,
                status: 'in_progress',
                conversation: [],
                feedback_history: [],
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateSession: async (sessionId, updates) => {
        if (!supabaseClient) return mockData.updateSession(sessionId, updates);

        const { data, error } = await supabaseClient
            .from('play_sessions')
            .update(updates)
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    completeSession: async (sessionId, pointsEarned, conversation, feedbackHistory) => {
        if (!supabaseClient) return mockData.completeSession(sessionId, pointsEarned);

        const { data, error } = await supabaseClient
            .from('play_sessions')
            .update({
                status: 'completed',
                points_earned: pointsEarned,
                conversation,
                feedback_history: feedbackHistory,
                completed_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getUserHistory: async (userId) => {
        if (!supabaseClient) return mockData.getUserHistory(userId);

        const { data, error } = await supabaseClient
            .from('play_sessions')
            .select(`
                *,
                scenario:scenarios(title, difficulty)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};

// ==================== MOCK DATA (for development without Supabase) ====================

const mockAuth = {
    currentUser: null,
    listeners: [],

    signUp: async (email, password, username) => {
        const user = {
            id: 'mock-user-' + Date.now(),
            email,
            user_metadata: { username }
        };
        mockAuth.currentUser = user;
        localStorage.setItem('mockUser', JSON.stringify(user));
        mockAuth.notifyListeners('SIGNED_IN', { user });
        return { user };
    },

    signIn: async (email, password) => {
        // For demo, accept any credentials
        const stored = localStorage.getItem('mockUser');
        if (stored) {
            const user = JSON.parse(stored);
            mockAuth.currentUser = user;
            mockAuth.notifyListeners('SIGNED_IN', { user });
            return { user };
        }
        // Create new user on first login
        return mockAuth.signUp(email, password, email.split('@')[0]);
    },

    signOut: async () => {
        mockAuth.currentUser = null;
        localStorage.removeItem('mockUser');
        mockAuth.notifyListeners('SIGNED_OUT', null);
    },

    getSession: async () => {
        const stored = localStorage.getItem('mockUser');
        if (stored) {
            mockAuth.currentUser = JSON.parse(stored);
            return { user: mockAuth.currentUser };
        }
        return null;
    },

    getUser: async () => {
        return mockAuth.currentUser;
    },

    onAuthStateChange: (callback) => {
        mockAuth.listeners.push(callback);
        // Check initial state
        const stored = localStorage.getItem('mockUser');
        if (stored) {
            const user = JSON.parse(stored);
            mockAuth.currentUser = user;
            setTimeout(() => callback('SIGNED_IN', { user }), 0);
        }
        return { data: { subscription: { unsubscribe: () => {} } } };
    },

    notifyListeners: (event, session) => {
        mockAuth.listeners.forEach(cb => cb(event, session));
    }
};

const mockData = {
    skills: [
        { id: 'skill-1', name: 'Comunicación Efectiva', category: 'Comunicación y Negociación', description: 'Capacidad de expresar ideas de forma clara y persuasiva', icon: '💬', max_level: 10 },
        { id: 'skill-2', name: 'Negociación', category: 'Comunicación y Negociación', description: 'Habilidad para llegar a acuerdos beneficiosos', icon: '🤝', max_level: 10 },
        { id: 'skill-3', name: 'Persuasión', category: 'Comunicación y Negociación', description: 'Arte de influir en las decisiones de otros', icon: '🎯', max_level: 10 },
        { id: 'skill-4', name: 'Escucha Activa', category: 'Comunicación y Negociación', description: 'Capacidad de comprender completamente el mensaje del otro', icon: '👂', max_level: 10 }
    ],

    userSkills: {},

    scenarios: [
        {
            id: 'scenario-1',
            title: 'El Dilema del Budget de Marketing',
            description: 'Negocia la distribución del presupuesto Q2 con el Director de Ventas y la CMO. Cada uno tiene intereses diferentes y el ambiente está tenso.',
            difficulty: 'beginner',
            is_premium: false,
            intro_story: `Es lunes por la mañana y has sido convocado a una reunión urgente en la sala de juntas del piso 12. La tensión se percibe en el aire desde que entras.

El Director de Ventas, Carlos, ya está allí, revisando unos números en su tablet con el ceño fruncido. María, la CMO, entra justo detrás de ti con una carpeta llena de informes de marca.

"Gracias por venir", dice María mientras cierra la puerta. "Tenemos que decidir hoy cómo distribuir el presupuesto de marketing del Q2. Finanzas nos ha dado un recorte del 15% y necesitamos priorizar."

Carlos interrumpe: "Lo que necesitamos es más inversión en el equipo de ventas. Los leads no se cierran solos."

María le lanza una mirada. "Y sin marca, no hay leads de calidad."

Ambos te miran, esperando que tomes partido...`,
            objective: 'Llegar a un acuerdo sobre la distribución del presupuesto Q2 sin dañar las relaciones entre departamentos.',
            characters: [
                { name: 'Carlos', role: 'Director de Ventas', avatar: '👔', personality: 'Directo, orientado a resultados, algo impaciente', hidden_agenda: 'Quiere más presupuesto para comisiones de vendedores' },
                { name: 'María', role: 'CMO', avatar: '👩‍💼', personality: 'Estratégica, defensiva de la marca, data-driven', hidden_agenda: 'Proteger la inversión en branding a largo plazo' }
            ],
            bibliography: [
                { title: 'Getting to Yes', author: 'Roger Fisher & William Ury', concept: 'Negociación basada en principios' },
                { title: 'Crucial Conversations', author: 'Patterson, Grenny, McMillan & Switzler', concept: 'Diálogo en situaciones de alto riesgo' }
            ],
            system_prompt: `Eres el moderador de un escenario de role-play donde el usuario practica habilidades de negociación y comunicación.

PERSONAJES:
- Carlos (Director de Ventas): Directo, orientado a resultados, algo impaciente. Quiere más presupuesto para comisiones.
- María (CMO): Estratégica, defensiva de la marca, data-driven. Quiere proteger el branding.

REGLAS:
1. Alterna entre los personajes según el contexto de la conversación
2. Los personajes deben mantener sus posiciones iniciales y ceder gradualmente solo ante buenos argumentos
3. Evalúa cada respuesta del usuario según las técnicas de "Getting to Yes" y "Crucial Conversations"
4. Cuando detectes una buena práctica, incluye [FEEDBACK_POSITIVE] con explicación breve
5. Cuando detectes una oportunidad de mejora, incluye [FEEDBACK_IMPROVEMENT] con sugerencia
6. Después de 6-8 intercambios, guía hacia una conclusión
7. Responde siempre en español

CRITERIOS DE EVALUACIÓN:
- Separar personas del problema
- Enfocarse en intereses, no posiciones
- Generar opciones de beneficio mutuo
- Usar criterios objetivos
- Escucha activa
- Manejo de emociones`,
            max_points: 3,
            estimated_time: 15,
            scenario_skills: [
                { skill: { id: 'skill-1', name: 'Comunicación Efectiva', icon: '💬' } },
                { skill: { id: 'skill-2', name: 'Negociación', icon: '🤝' } }
            ]
        },
        {
            id: 'scenario-2',
            title: 'Feedback Difícil',
            description: 'Debes dar retroalimentación a un colega talentoso pero con problemas de actitud. Su trabajo es excelente pero está afectando al equipo.',
            difficulty: 'intermediate',
            is_premium: false,
            intro_story: `Tu colega Andrés es brillante. Sus entregas siempre superan las expectativas y sus ideas han salvado varios proyectos. Pero hay un problema.

En las últimas semanas, varios miembros del equipo se han quejado. Andrés interrumpe constantemente en las reuniones, descarta las ideas de otros con comentarios sarcásticos, y ayer hizo llorar a una nueva integrante del equipo con una crítica especialmente dura.

Tu jefe te ha pedido que hables con él. "Eres el único con quien tiene buena relación", te dijo. "Si no mejora su actitud, tendré que tomar medidas."

Andrés acaba de entrar a tu oficina con una sonrisa. "¿Querías verme? Espero que sea rápido, tengo mil cosas pendientes."`,
            objective: 'Comunicar el feedback de manera que Andrés entienda el impacto de su comportamiento y se comprometa a mejorar.',
            characters: [
                { name: 'Andrés', role: 'Desarrollador Senior', avatar: '🧑‍💻', personality: 'Brillante, directo, impaciente con la mediocridad', hidden_agenda: 'No se da cuenta del impacto de sus palabras, cree que solo está siendo honesto' }
            ],
            bibliography: [
                { title: 'Radical Candor', author: 'Kim Scott', concept: 'Feedback directo con empatía' },
                { title: 'Nonviolent Communication', author: 'Marshall Rosenberg', concept: 'Comunicación basada en necesidades' }
            ],
            system_prompt: `Eres Andrés, un desarrollador senior brillante pero con problemas de actitud en el equipo.

PERSONALIDAD:
- Muy inteligente y consciente de ello
- Impaciente con lo que considera mediocridad
- Cree genuinamente que solo está siendo "honesto"
- En el fondo, respeta a quienes le enfrentan con argumentos sólidos

COMPORTAMIENTO:
1. Inicialmente defensivo: "¿De qué estás hablando? Yo solo digo las cosas como son"
2. Si el usuario usa acusaciones genéricas, contra-ataca con ejemplos de sus logros
3. Si el usuario da ejemplos específicos y muestra empatía, empieza a reflexionar
4. Si el usuario conecta el comportamiento con el impacto en el equipo, baja la guardia

EVALUACIÓN según Radical Candor:
- [FEEDBACK_POSITIVE] si el usuario cuida la relación Y es directo
- [FEEDBACK_IMPROVEMENT] si es solo directo (brutal) o solo amable (evade el tema)

Responde siempre en español. Mantén respuestas conversacionales (2-4 oraciones).`,
            max_points: 3,
            estimated_time: 12,
            scenario_skills: [
                { skill: { id: 'skill-1', name: 'Comunicación Efectiva', icon: '💬' } },
                { skill: { id: 'skill-4', name: 'Escucha Activa', icon: '👂' } }
            ]
        },
        {
            id: 'scenario-3',
            title: 'La Presentación al Directorio',
            description: 'Tienes 10 minutos para convencer al directorio de aprobar tu proyecto. Hay resistencia y preguntas difíciles.',
            difficulty: 'advanced',
            is_premium: true,
            intro_story: `Has trabajado tres meses en esta propuesta. Un nuevo sistema que podría transformar la operación de la empresa, pero requiere una inversión significativa.

El directorio te ha dado 10 minutos. Diez minutos para presentar, responder preguntas y convencer a cinco ejecutivos con agendas muy diferentes.

La Directora Financiera ya te ha dicho en privado que ve "números optimistas". El CEO está interesado pero distraído con la fusión en proceso. Y el Director de Operaciones, cuyo equipo sería el más afectado, ha sido abiertamente escéptico.

Las puertas de la sala de juntas se abren. Cinco pares de ojos te miran expectantes.

"Adelante", dice el CEO revisando su reloj. "Tienes diez minutos."`,
            objective: 'Obtener la aprobación del directorio para tu proyecto, manejando objeciones y ganando aliados.',
            characters: [
                { name: 'Elena', role: 'CEO', avatar: '👩‍💼', personality: 'Visionaria pero pragmática, poco tiempo', hidden_agenda: 'Busca proyectos que complementen la fusión en proceso' },
                { name: 'Roberto', role: 'Director Financiero', avatar: '📊', personality: 'Escéptico, enfocado en ROI', hidden_agenda: 'Presionado por reducir costos este trimestre' },
                { name: 'Patricia', role: 'Directora de Operaciones', avatar: '⚙️', personality: 'Práctica, preocupada por su equipo', hidden_agenda: 'Teme que el proyecto implique despidos en su área' }
            ],
            bibliography: [
                { title: 'Influence', author: 'Robert Cialdini', concept: 'Principios de persuasión' },
                { title: 'Made to Stick', author: 'Chip & Dan Heath', concept: 'Ideas que perduran' },
                { title: 'Never Split the Difference', author: 'Chris Voss', concept: 'Técnicas de negociación del FBI' }
            ],
            system_prompt: `Simulas una presentación al directorio donde el usuario debe convencer a los ejecutivos.

PERSONAJES (rota según el contexto):
- Elena (CEO): Poco tiempo, busca conexión con la fusión, pregunta "¿Cómo encaja esto en nuestra estrategia?"
- Roberto (CFO): Escéptico del ROI, pregunta por números y riesgos, "¿Y si no funciona?"
- Patricia (COO): Preocupada por su equipo, pregunta sobre implementación e impacto en empleados

FLUJO:
1. Turno 1-2: Presentación inicial, interrupciones ocasionales
2. Turno 3-4: Preguntas difíciles, objeciones
3. Turno 5-6: Negociación, ajustes a la propuesta
4. Turno 7+: Decisión final

EVALUACIÓN según principios de Cialdini y técnicas de presentación:
- [FEEDBACK_POSITIVE] uso de reciprocidad, prueba social, escasez, autoridad, o storytelling efectivo
- [FEEDBACK_IMPROVEMENT] datos sin contexto emocional, ignorar objeciones, respuestas defensivas

Responde en español. Mantén la presión del tiempo ("Nos quedan 5 minutos...").`,
            max_points: 3,
            estimated_time: 20,
            scenario_skills: [
                { skill: { id: 'skill-3', name: 'Persuasión', icon: '🎯' } },
                { skill: { id: 'skill-1', name: 'Comunicación Efectiva', icon: '💬' } }
            ]
        }
    ],

    sessions: {},

    getProfile: async (userId) => {
        const stored = localStorage.getItem('mockUser');
        if (stored) {
            const user = JSON.parse(stored);
            return {
                id: user.id,
                username: user.user_metadata?.username || user.email?.split('@')[0],
                avatar_url: null,
                created_at: new Date().toISOString()
            };
        }
        return null;
    },

    updateProfile: async (userId, updates) => {
        return { id: userId, ...updates };
    },

    getAllSkills: async () => {
        return mockData.skills;
    },

    getUserSkills: async (userId) => {
        if (!mockData.userSkills[userId]) {
            // Initialize with 0 points for all skills
            mockData.userSkills[userId] = mockData.skills.map(skill => ({
                id: `us-${skill.id}`,
                user_id: userId,
                skill_id: skill.id,
                current_points: Math.floor(Math.random() * 30), // Random starting points for demo
                current_level: 0,
                skill
            }));
            // Recalculate levels
            mockData.userSkills[userId].forEach(us => {
                us.current_level = Math.floor(us.current_points / 10);
            });
        }
        return mockData.userSkills[userId];
    },

    updateUserSkill: async (userId, skillId, points) => {
        const userSkills = await mockData.getUserSkills(userId);
        const skill = userSkills.find(us => us.skill_id === skillId);
        if (skill) {
            skill.current_points += points;
            skill.current_level = Math.floor(skill.current_points / 10);
        }
        return skill;
    },

    getAllScenarios: async () => {
        return mockData.scenarios;
    },

    getScenario: async (scenarioId) => {
        return mockData.scenarios.find(s => s.id === scenarioId);
    },

    getUserScenarioProgress: async (userId, scenarioId) => {
        const key = `${userId}-${scenarioId}`;
        return mockData.sessions[key]?.find(s => s.status === 'completed') || null;
    },

    createSession: async (userId, scenarioId) => {
        const session = {
            id: 'session-' + Date.now(),
            user_id: userId,
            scenario_id: scenarioId,
            status: 'in_progress',
            conversation: [],
            feedback_history: [],
            points_earned: 0,
            started_at: new Date().toISOString()
        };
        const key = `${userId}-${scenarioId}`;
        if (!mockData.sessions[key]) mockData.sessions[key] = [];
        mockData.sessions[key].push(session);
        return session;
    },

    updateSession: async (sessionId, updates) => {
        // Find and update session
        for (const key in mockData.sessions) {
            const session = mockData.sessions[key].find(s => s.id === sessionId);
            if (session) {
                Object.assign(session, updates);
                return session;
            }
        }
        return null;
    },

    completeSession: async (sessionId, pointsEarned) => {
        for (const key in mockData.sessions) {
            const session = mockData.sessions[key].find(s => s.id === sessionId);
            if (session) {
                session.status = 'completed';
                session.points_earned = pointsEarned;
                session.completed_at = new Date().toISOString();
                return session;
            }
        }
        return null;
    },

    getUserHistory: async (userId) => {
        const history = [];
        for (const key in mockData.sessions) {
            if (key.startsWith(userId)) {
                const completed = mockData.sessions[key].filter(s => s.status === 'completed');
                completed.forEach(session => {
                    const scenario = mockData.scenarios.find(s => s.id === session.scenario_id);
                    history.push({
                        ...session,
                        scenario: { title: scenario?.title, difficulty: scenario?.difficulty }
                    });
                });
            }
        }
        return history.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    }
};

// Export for use in other modules
window.db = {
    init: initSupabase,
    isConfigured: isSupabaseConfigured,
    auth: authQueries,
    profiles: profileQueries,
    skills: skillsQueries,
    scenarios: scenariosQueries,
    sessions: sessionQueries
};

console.log('supabase.js loaded, window.db defined:', typeof window.db);

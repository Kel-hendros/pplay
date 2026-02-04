-- =============================================
-- Perspective Play - Database Schema
-- =============================================
-- Run this script in your Supabase SQL Editor
-- to create all necessary tables and seed data.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills available in the system
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    max_level INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User skill progress
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    current_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_premium BOOLEAN DEFAULT FALSE,
    intro_story TEXT,
    objective TEXT,
    characters JSONB DEFAULT '[]',
    bibliography JSONB DEFAULT '[]',
    system_prompt TEXT,
    max_points INTEGER DEFAULT 3,
    estimated_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenario-Skill relationship
CREATE TABLE IF NOT EXISTS scenario_skills (
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (scenario_id, skill_id)
);

-- Play sessions
CREATE TABLE IF NOT EXISTS play_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    conversation JSONB DEFAULT '[]',
    feedback_history JSONB DEFAULT '[]',
    points_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level_achieved INTEGER NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    certificate_url TEXT
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Skills policies (public read)
CREATE POLICY "Anyone can view skills"
    ON skills FOR SELECT
    TO authenticated
    USING (true);

-- User skills policies
CREATE POLICY "Users can view own skills"
    ON user_skills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
    ON user_skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
    ON user_skills FOR UPDATE
    USING (auth.uid() = user_id);

-- Scenarios policies (public read)
CREATE POLICY "Anyone can view scenarios"
    ON scenarios FOR SELECT
    TO authenticated
    USING (true);

-- Scenario skills policies (public read)
CREATE POLICY "Anyone can view scenario skills"
    ON scenario_skills FOR SELECT
    TO authenticated
    USING (true);

-- Play sessions policies
CREATE POLICY "Users can view own sessions"
    ON play_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON play_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON play_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can view own certifications"
    ON certifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certifications"
    ON certifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_skills updated_at
CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DATA - Skills
-- =============================================

INSERT INTO skills (id, name, category, description, icon, max_level) VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'Comunicación Efectiva', 'Comunicación y Negociación', 'Capacidad de expresar ideas de forma clara, concisa y persuasiva, adaptando el mensaje al público.', '💬', 10),
    ('a1b2c3d4-0001-0001-0001-000000000002', 'Negociación', 'Comunicación y Negociación', 'Habilidad para llegar a acuerdos beneficiosos para todas las partes, encontrando soluciones creativas.', '🤝', 10),
    ('a1b2c3d4-0001-0001-0001-000000000003', 'Persuasión', 'Comunicación y Negociación', 'Arte de influir en las decisiones y opiniones de otros de manera ética y efectiva.', '🎯', 10),
    ('a1b2c3d4-0001-0001-0001-000000000004', 'Escucha Activa', 'Comunicación y Negociación', 'Capacidad de comprender completamente el mensaje del interlocutor, incluyendo el contenido emocional.', '👂', 10)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED DATA - Scenarios
-- =============================================

-- Scenario 1: Budget Negotiation
INSERT INTO scenarios (id, title, description, difficulty, is_premium, intro_story, objective, characters, bibliography, system_prompt, max_points, estimated_time) VALUES
(
    'b1c2d3e4-0001-0001-0001-000000000001',
    'El Dilema del Budget de Marketing',
    'Negocia la distribución del presupuesto Q2 con el Director de Ventas y la CMO. Cada uno tiene intereses diferentes y el ambiente está tenso.',
    'beginner',
    false,
    'Es lunes por la mañana y has sido convocado a una reunión urgente en la sala de juntas del piso 12. La tensión se percibe en el aire desde que entras.

El Director de Ventas, Carlos, ya está allí, revisando unos números en su tablet con el ceño fruncido. María, la CMO, entra justo detrás de ti con una carpeta llena de informes de marca.

"Gracias por venir", dice María mientras cierra la puerta. "Tenemos que decidir hoy cómo distribuir el presupuesto de marketing del Q2. Finanzas nos ha dado un recorte del 15% y necesitamos priorizar."

Carlos interrumpe: "Lo que necesitamos es más inversión en el equipo de ventas. Los leads no se cierran solos."

María le lanza una mirada. "Y sin marca, no hay leads de calidad."

Ambos te miran, esperando que tomes partido...',
    'Llegar a un acuerdo sobre la distribución del presupuesto Q2 sin dañar las relaciones entre departamentos.',
    '[
        {"name": "Carlos", "role": "Director de Ventas", "avatar": "👔", "personality": "Directo, orientado a resultados, algo impaciente", "hidden_agenda": "Quiere más presupuesto para comisiones de vendedores"},
        {"name": "María", "role": "CMO", "avatar": "👩‍💼", "personality": "Estratégica, defensiva de la marca, data-driven", "hidden_agenda": "Proteger la inversión en branding a largo plazo"}
    ]'::jsonb,
    '[
        {"title": "Getting to Yes", "author": "Roger Fisher & William Ury", "concept": "Negociación basada en principios"},
        {"title": "Crucial Conversations", "author": "Patterson, Grenny, McMillan & Switzler", "concept": "Diálogo en situaciones de alto riesgo"}
    ]'::jsonb,
    'Eres el moderador de un escenario de role-play donde el usuario practica habilidades de negociación y comunicación.',
    3,
    15
)
ON CONFLICT (id) DO NOTHING;

-- Scenario 2: Difficult Feedback
INSERT INTO scenarios (id, title, description, difficulty, is_premium, intro_story, objective, characters, bibliography, system_prompt, max_points, estimated_time) VALUES
(
    'b1c2d3e4-0001-0001-0001-000000000002',
    'Feedback Difícil',
    'Debes dar retroalimentación a un colega talentoso pero con problemas de actitud. Su trabajo es excelente pero está afectando al equipo.',
    'intermediate',
    false,
    'Tu colega Andrés es brillante. Sus entregas siempre superan las expectativas y sus ideas han salvado varios proyectos. Pero hay un problema.

En las últimas semanas, varios miembros del equipo se han quejado. Andrés interrumpe constantemente en las reuniones, descarta las ideas de otros con comentarios sarcásticos, y ayer hizo llorar a una nueva integrante del equipo con una crítica especialmente dura.

Tu jefe te ha pedido que hables con él. "Eres el único con quien tiene buena relación", te dijo. "Si no mejora su actitud, tendré que tomar medidas."

Andrés acaba de entrar a tu oficina con una sonrisa. "¿Querías verme? Espero que sea rápido, tengo mil cosas pendientes."',
    'Comunicar el feedback de manera que Andrés entienda el impacto de su comportamiento y se comprometa a mejorar.',
    '[
        {"name": "Andrés", "role": "Desarrollador Senior", "avatar": "🧑‍💻", "personality": "Brillante, directo, impaciente con la mediocridad", "hidden_agenda": "No se da cuenta del impacto de sus palabras, cree que solo está siendo honesto"}
    ]'::jsonb,
    '[
        {"title": "Radical Candor", "author": "Kim Scott", "concept": "Feedback directo con empatía"},
        {"title": "Nonviolent Communication", "author": "Marshall Rosenberg", "concept": "Comunicación basada en necesidades"}
    ]'::jsonb,
    'Eres Andrés, un desarrollador senior brillante pero con problemas de actitud en el equipo.',
    3,
    12
)
ON CONFLICT (id) DO NOTHING;

-- Scenario 3: Board Presentation (Premium)
INSERT INTO scenarios (id, title, description, difficulty, is_premium, intro_story, objective, characters, bibliography, system_prompt, max_points, estimated_time) VALUES
(
    'b1c2d3e4-0001-0001-0001-000000000003',
    'La Presentación al Directorio',
    'Tienes 10 minutos para convencer al directorio de aprobar tu proyecto. Hay resistencia y preguntas difíciles.',
    'advanced',
    true,
    'Has trabajado tres meses en esta propuesta. Un nuevo sistema que podría transformar la operación de la empresa, pero requiere una inversión significativa.

El directorio te ha dado 10 minutos. Diez minutos para presentar, responder preguntas y convencer a cinco ejecutivos con agendas muy diferentes.

La Directora Financiera ya te ha dicho en privado que ve "números optimistas". El CEO está interesado pero distraído con la fusión en proceso. Y el Director de Operaciones, cuyo equipo sería el más afectado, ha sido abiertamente escéptico.

Las puertas de la sala de juntas se abren. Cinco pares de ojos te miran expectantes.

"Adelante", dice el CEO revisando su reloj. "Tienes diez minutos."',
    'Obtener la aprobación del directorio para tu proyecto, manejando objeciones y ganando aliados.',
    '[
        {"name": "Elena", "role": "CEO", "avatar": "👩‍💼", "personality": "Visionaria pero pragmática, poco tiempo", "hidden_agenda": "Busca proyectos que complementen la fusión en proceso"},
        {"name": "Roberto", "role": "Director Financiero", "avatar": "📊", "personality": "Escéptico, enfocado en ROI", "hidden_agenda": "Presionado por reducir costos este trimestre"},
        {"name": "Patricia", "role": "Directora de Operaciones", "avatar": "⚙️", "personality": "Práctica, preocupada por su equipo", "hidden_agenda": "Teme que el proyecto implique despidos en su área"}
    ]'::jsonb,
    '[
        {"title": "Influence", "author": "Robert Cialdini", "concept": "Principios de persuasión"},
        {"title": "Made to Stick", "author": "Chip & Dan Heath", "concept": "Ideas que perduran"},
        {"title": "Never Split the Difference", "author": "Chris Voss", "concept": "Técnicas de negociación del FBI"}
    ]'::jsonb,
    'Simulas una presentación al directorio donde el usuario debe convencer a los ejecutivos.',
    3,
    20
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED DATA - Scenario-Skill Relationships
-- =============================================

INSERT INTO scenario_skills (scenario_id, skill_id) VALUES
    ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001'), -- Budget -> Comunicación
    ('b1c2d3e4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002'), -- Budget -> Negociación
    ('b1c2d3e4-0001-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001'), -- Feedback -> Comunicación
    ('b1c2d3e4-0001-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000004'), -- Feedback -> Escucha Activa
    ('b1c2d3e4-0001-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000003'), -- Presentación -> Persuasión
    ('b1c2d3e4-0001-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000001')  -- Presentación -> Comunicación
ON CONFLICT DO NOTHING;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_user_id ON play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_scenario_id ON play_sessions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- =============================================
-- Migration 002: Content Model — Programs / Seasons / Chapters
-- =============================================
-- Implementa la parte de CONTENIDO de la jerarquía del Play Brief
-- (sección 2): Program → Season → Chapter. Las Scenes, transitions,
-- objectives y NPC templates quedan para la migración 003.
--
-- También se incluyen las entidades de soporte que el catálogo necesita:
-- endorsers, bibliography_entries y la taxonomía mínima de power_skills
-- (con domains y N:M).
--
-- Esta migración NO toca las tablas viejas (scenarios, characters, etc.).
-- =============================================

-- Asume: update_updated_at() y is_admin() ya existen (schema.sql + migration 001).

-- =============================================
-- 1. ENDORSERS  (Brief §9)
-- =============================================
CREATE TABLE IF NOT EXISTS endorsers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    title        TEXT,
    institution  TEXT,
    photo_url    TEXT,
    bio          TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. BIBLIOGRAPHY  (Brief §9)
-- =============================================
CREATE TABLE IF NOT EXISTS bibliography_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    authors     TEXT[] NOT NULL DEFAULT '{}',
    year        INTEGER,
    type        TEXT CHECK (type IN ('book', 'paper', 'article', 'course')),
    url         TEXT,
    isbn        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. SKILL TAXONOMY  (Brief §10) — versión mínima
-- =============================================
-- Nombre `power_skills` para no chocar con la tabla `skills` legacy del
-- schema viejo (que sigue viva en paralelo).
CREATE TABLE IF NOT EXISTS skill_domains (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL UNIQUE,
    description  TEXT,
    icon         TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by  TEXT DEFAULT 'platform' CHECK (created_by IN ('platform', 'custom')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_skill_domains (
    skill_id   UUID REFERENCES power_skills(id) ON DELETE CASCADE,
    domain_id  UUID REFERENCES skill_domains(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, domain_id)
);

-- =============================================
-- 4. PROGRAMS  (Brief §2.1 — "Serie")
-- =============================================
CREATE TABLE IF NOT EXISTS programs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               TEXT UNIQUE,                 -- para URLs / refs estables
    title              TEXT NOT NULL,
    tagline            TEXT,                        -- bajada corta del catálogo
    description        TEXT,                        -- descripción extendida
    difficulty         TEXT DEFAULT 'beginner'
                       CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER,                     -- minutos totales
    thumbnail_url      TEXT,
    tags               TEXT[] DEFAULT '{}',
    endorser_id        UUID REFERENCES endorsers(id) ON DELETE SET NULL,
    is_featured        BOOLEAN DEFAULT FALSE,       -- "Recomendada" del catálogo
    is_published       BOOLEAN DEFAULT FALSE,
    display_order      INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_skills (
    program_id  UUID REFERENCES programs(id) ON DELETE CASCADE,
    skill_id    UUID REFERENCES power_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (program_id, skill_id)
);

CREATE TABLE IF NOT EXISTS program_bibliography (
    program_id       UUID REFERENCES programs(id) ON DELETE CASCADE,
    bibliography_id  UUID REFERENCES bibliography_entries(id) ON DELETE CASCADE,
    PRIMARY KEY (program_id, bibliography_id)
);

-- =============================================
-- 5. SEASONS  (Brief §2.2 — "Temporada")
-- =============================================
CREATE TABLE IF NOT EXISTS seasons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    slug                TEXT,
    title               TEXT NOT NULL,
    description         TEXT,
    "order"             INTEGER NOT NULL DEFAULT 1,
    prerequisite_id     UUID REFERENCES seasons(id) ON DELETE SET NULL,
    narrative_context   TEXT,
    estimated_duration  INTEGER,
    completion_badge    JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (program_id, "order"),
    UNIQUE (program_id, slug)
);

CREATE TABLE IF NOT EXISTS season_bibliography (
    season_id        UUID REFERENCES seasons(id) ON DELETE CASCADE,
    bibliography_id  UUID REFERENCES bibliography_entries(id) ON DELETE CASCADE,
    PRIMARY KEY (season_id, bibliography_id)
);

-- =============================================
-- 6. CHAPTERS  (Brief §2.3 — "Capítulo")
-- =============================================
CREATE TABLE IF NOT EXISTS chapters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id           UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    slug                TEXT,
    title               TEXT NOT NULL,
    subtitle            TEXT,                       -- "La oferta hostil" (estilo del catálogo)
    description         TEXT,                       -- sinopsis larga
    tagline             TEXT,                       -- bajada corta para catálogo / hero
    "order"             INTEGER NOT NULL DEFAULT 1,
    learning_objectives TEXT[] DEFAULT '{}',
    framework_label     TEXT,                       -- "Game Theory" — etiqueta visual
    estimated_duration  INTEGER,                    -- minutos
    npc_count           INTEGER DEFAULT 0,          -- visible en la ficha
    status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'available', 'soon', 'archived')),
    feedback_config     JSONB DEFAULT '{
        "ai_persona": "",
        "feedback_style": "coaching",
        "evaluation_dimensions": []
    }',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (season_id, "order"),
    UNIQUE (season_id, slug)
);

CREATE TABLE IF NOT EXISTS chapter_bibliography (
    chapter_id       UUID REFERENCES chapters(id) ON DELETE CASCADE,
    bibliography_id  UUID REFERENCES bibliography_entries(id) ON DELETE CASCADE,
    PRIMARY KEY (chapter_id, bibliography_id)
);

-- =============================================
-- 7. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_programs_featured   ON programs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_programs_published  ON programs(is_published);
CREATE INDEX IF NOT EXISTS idx_programs_order      ON programs(display_order);
CREATE INDEX IF NOT EXISTS idx_seasons_program     ON seasons(program_id, "order");
CREATE INDEX IF NOT EXISTS idx_chapters_season     ON chapters(season_id, "order");
CREATE INDEX IF NOT EXISTS idx_chapters_status     ON chapters(status);

-- =============================================
-- 8. UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER trg_endorsers_updated_at BEFORE UPDATE ON endorsers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bibliography_entries_updated_at BEFORE UPDATE ON bibliography_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_skill_domains_updated_at BEFORE UPDATE ON skill_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_power_skills_updated_at BEFORE UPDATE ON power_skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 9. ROW LEVEL SECURITY
-- =============================================
ALTER TABLE endorsers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliography_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_skill_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_bibliography ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_bibliography ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_bibliography ENABLE ROW LEVEL SECURITY;

-- Read público (anon + authenticated). El cliente hoy no tiene login real,
-- pero el catálogo siempre es público. Las writes quedan limitadas a admins.
DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'endorsers', 'bibliography_entries',
        'skill_domains', 'power_skills', 'power_skill_domains',
        'programs', 'program_skills', 'program_bibliography',
        'seasons', 'season_bibliography',
        'chapters', 'chapter_bibliography'
    ]) LOOP
        EXECUTE format(
            'CREATE POLICY "Public read %I" ON %I FOR SELECT TO anon, authenticated USING (true);',
            t, t
        );
        EXECUTE format(
            'CREATE POLICY "Admins manage %I" ON %I FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());',
            t, t
        );
    END LOOP;
END $$;

-- =============================================
-- 10. SEED — Catálogo de demo (4 series)
-- =============================================

-- Endorser (Drama Theory)
INSERT INTO endorsers (id, name, title, institution, bio) VALUES
    ('e1000000-0000-0000-0000-000000000001',
     'Dr. Peter Bryant',
     'Profesor Emérito',
     'University of Oxford · Drama Theory',
     'Padre de la Drama Theory; framework de dilemas de confianza y persuasión usado en este programa.')
ON CONFLICT (id) DO NOTHING;

-- Bibliografía base
INSERT INTO bibliography_entries (id, title, authors, year, type) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Getting to Yes', ARRAY['Roger Fisher', 'William Ury'], 1981, 'book'),
    ('b1000000-0000-0000-0000-000000000002', 'The Strategy of Conflict', ARRAY['Thomas Schelling'], 1960, 'book'),
    ('b1000000-0000-0000-0000-000000000003', 'Drama Theory: From Conflict to Resolution', ARRAY['Peter Bryant'], 2003, 'book'),
    ('b1000000-0000-0000-0000-000000000004', 'Game Theory for Applied Economists', ARRAY['Robert Gibbons'], 1992, 'book')
ON CONFLICT (id) DO NOTHING;

-- Skills + domains
INSERT INTO skill_domains (id, name, description, icon) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Negociación', 'Llegar a acuerdos cuando las partes tienen intereses divergentes.', '🤝'),
    ('d1000000-0000-0000-0000-000000000002', 'Pensamiento Estratégico', 'Anticipar movimientos y decidir bajo incertidumbre.', '🧠'),
    ('d1000000-0000-0000-0000-000000000003', 'Lectura de Stakeholders', 'Entender qué motiva a cada actor y cómo se posiciona.', '👁️'),
    ('d1000000-0000-0000-0000-000000000004', 'Comunicación', 'Hablar y escuchar para que el mensaje aterrice.', '💬')
ON CONFLICT (name) DO NOTHING;

INSERT INTO power_skills (id, name, description) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Negociación bajo presión', 'Llegar a acuerdos con deadlines duros y stakes altos.'),
    ('a1000000-0000-0000-0000-000000000002', 'Lectura de stakeholders', 'Identificar intereses, miedos y agendas de cada actor.'),
    ('a1000000-0000-0000-0000-000000000003', 'Pensamiento estratégico', 'Decidir bajo incertidumbre, anticipando respuestas del otro lado.'),
    ('a1000000-0000-0000-0000-000000000004', 'Conversaciones difíciles', 'Sostener temas incómodos sin esquivar ni atacar.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO power_skill_domains (skill_id, domain_id) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001'),
    ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003'),
    ('a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002'),
    ('a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- ── Serie 1 — Crisis Ejecutiva (Recomendada) ──────────────────────
INSERT INTO programs (id, slug, title, tagline, description, difficulty, estimated_duration, endorser_id, is_featured, is_published, display_order, tags) VALUES
    ('c1000000-0000-0000-0000-000000000001',
     'crisis-ejecutiva',
     'Crisis ejecutiva',
     'Decisiones bajo presión en la sala del Board.',
     'Una serie sobre cómo se decide cuando el tiempo no alcanza, los stakeholders empujan en direcciones opuestas y la información que tienes nunca es suficiente. Cada temporada te pone al frente de una crisis distinta para entrenar la cabeza fría.',
     'intermediate', 25,
     'e1000000-0000-0000-0000-000000000001',
     TRUE, TRUE, 1,
     ARRAY['game-theory', 'drama-theory', 'crisis', 'board', 'negociación'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_skills (program_id, skill_id) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
    ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002'),
    ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO program_bibliography (program_id, bibliography_id) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002'),
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003'),
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO seasons (id, program_id, slug, title, description, "order", narrative_context, estimated_duration) VALUES
    ('c2000000-0000-0000-0000-000000000001',
     'c1000000-0000-0000-0000-000000000001',
     'la-oferta-hostil',
     'La oferta hostil',
     'Defender (o vender) una compañía de tecnología bajo una oferta de adquisición que amenaza con quebrarla por dentro.',
     1,
     'Eres el CEO interino de una compañía de fusión que acaba de recibir una oferta hostil. En 48 horas la Junta vota.',
     25)
ON CONFLICT DO NOTHING;

INSERT INTO chapters (id, season_id, slug, title, subtitle, description, tagline, "order", learning_objectives, framework_label, estimated_duration, npc_count, status) VALUES
    ('c3000000-0000-0000-0000-000000000001',
     'c2000000-0000-0000-0000-000000000001',
     'aethelgard',
     'Aethelgard',
     'La oferta hostil',
     'Tienes 48 horas. Una oferta de Titan Energy en la mesa, una fundadora a punto de irse, un Board que mira al voto decisivo. Mueve las piezas.',
     'Eres el CEO interino de una empresa de fusión. En 48 horas, la Junta vota. Tienes que llegar preparado.',
     1,
     ARRAY['Lectura de intereses ocultos', 'Construcción de credibilidad', 'Manejo de información asimétrica'],
     'Game Theory',
     25, 2,
     'available')
ON CONFLICT DO NOTHING;

INSERT INTO chapter_bibliography (chapter_id, bibliography_id) VALUES
    ('c3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
    ('c3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ── Serie 2 — El otro lado de la mesa ──────────────────────────────
INSERT INTO programs (id, slug, title, tagline, description, difficulty, is_published, display_order, tags) VALUES
    ('c1000000-0000-0000-0000-000000000002',
     'el-otro-lado',
     'El otro lado de la mesa',
     'Negociar con clientes, proveedores y sindicatos.',
     'Las negociaciones que no son hacia adentro de la empresa: cuando el contrato lo pelea otro, y vos defendes tu posición sin romper la relación.',
     'beginner', TRUE, 2,
     ARRAY['negociación', 'clientes', 'proveedores'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO seasons (id, program_id, slug, title, "order") VALUES
    ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'temp-1', 'Temporada 1', 1)
ON CONFLICT DO NOTHING;

INSERT INTO chapters (id, season_id, slug, title, "order", status) VALUES
    ('c3000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'cliente-que-quiere-irse', 'El cliente que quiere irse', 1, 'soon'),
    ('c3000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'huelga-logistica', 'La huelga de logística', 2, 'soon'),
    ('c3000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000002', 'proveedor-estrategico', 'El proveedor estratégico', 3, 'soon')
ON CONFLICT DO NOTHING;

-- ── Serie 3 — Días difíciles ───────────────────────────────────────
INSERT INTO programs (id, slug, title, tagline, description, difficulty, is_published, display_order, tags) VALUES
    ('c1000000-0000-0000-0000-000000000003',
     'dias-dificiles',
     'Días difíciles',
     'Las conversaciones que nadie quiere tener.',
     'Feedback duro, despidos, malas noticias. Cómo sostener temas incómodos sin esquivar ni endurecerse.',
     'intermediate', TRUE, 3,
     ARRAY['feedback', 'liderazgo', 'comunicación'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_skills (program_id, skill_id) VALUES
    ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO seasons (id, program_id, slug, title, "order") VALUES
    ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'temp-1', 'Temporada 1', 1)
ON CONFLICT DO NOTHING;

INSERT INTO chapters (id, season_id, slug, title, "order", status) VALUES
    ('c3000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000003', 'feedback-no-querido', 'Feedback que no se quiere oír', 1, 'soon'),
    ('c3000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000003', 'el-despido', 'El despido', 2, 'soon')
ON CONFLICT DO NOTHING;

-- ── Serie 4 — Heredar el cargo ─────────────────────────────────────
INSERT INTO programs (id, slug, title, tagline, description, difficulty, is_published, display_order, tags) VALUES
    ('c1000000-0000-0000-0000-000000000004',
     'heredar-el-cargo',
     'Heredar el cargo',
     'Los primeros 90 días en un puesto nuevo.',
     'Asumir un puesto con equipo armado, expectativas mixtas y un predecesor con sombra. Cómo construir autoridad sin barrer con lo que funciona.',
     'advanced', TRUE, 4,
     ARRAY['onboarding', 'liderazgo', '90-días'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO seasons (id, program_id, slug, title, "order") VALUES
    ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'temp-1', 'Temporada 1', 1)
ON CONFLICT DO NOTHING;

INSERT INTO chapters (id, season_id, slug, title, "order", status) VALUES
    ('c3000000-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000004', 'reunion-bienvenida', 'La reunión de bienvenida', 1, 'soon'),
    ('c3000000-0000-0000-0000-000000000008', 'c2000000-0000-0000-0000-000000000004', 'predecesor-que-no-se-va', 'El predecesor que no se va', 2, 'soon')
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE
-- =============================================

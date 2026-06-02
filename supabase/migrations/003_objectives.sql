-- =============================================
-- Migration 003: Objectives (Brief §2.5)
-- =============================================
-- Una "Objective" es la unidad de scoring del Play Brief:
--   primary   → narrativo y binario; determina si Season/Chapter se completó.
--   secondary → estrellas extra opcionales (puntos extra al rejugar).
--
-- Un objetivo pertenece a UN Chapter O a UNA Season (CHECK exclusivo),
-- nunca a ambos. Sigue una "rúbrica" interna `success_criteria` que la IA
-- usa para evaluar al cierre del run.
-- =============================================

CREATE TABLE IF NOT EXISTS objectives (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id             UUID REFERENCES chapters(id) ON DELETE CASCADE,
    season_id              UUID REFERENCES seasons(id) ON DELETE CASCADE,
    type                   TEXT NOT NULL CHECK (type IN ('primary', 'secondary')),
    narrative_description  TEXT NOT NULL,            -- visible al usuario
    success_criteria       TEXT NOT NULL,            -- interno para la IA evaluadora
    failure_feedback_hint  TEXT,                     -- guía si no se cumplió
    points_value           INTEGER DEFAULT 0,
    evaluation_method      TEXT DEFAULT 'ai-assessed'
                           CHECK (evaluation_method IN ('ai-assessed', 'state-based', 'hybrid')),
    visible_to_user        BOOLEAN DEFAULT TRUE,     -- secundarios pueden ser sorpresa
    display_order          INTEGER DEFAULT 0,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW(),
    -- Exclusivo: chapter XOR season
    CHECK (
        (chapter_id IS NOT NULL AND season_id IS NULL) OR
        (chapter_id IS NULL AND season_id IS NOT NULL)
    )
);

-- N:M con power_skills (Brief §2.5 — skill_refs[])
CREATE TABLE IF NOT EXISTS objective_skills (
    objective_id  UUID REFERENCES objectives(id) ON DELETE CASCADE,
    skill_id      UUID REFERENCES power_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (objective_id, skill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_objectives_chapter
    ON objectives(chapter_id) WHERE chapter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_objectives_season
    ON objectives(season_id) WHERE season_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_objectives_type
    ON objectives(type);

-- updated_at trigger
CREATE TRIGGER trg_objectives_updated_at BEFORE UPDATE ON objectives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS — patrón del catálogo: read público + write admins
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_skills ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['objectives', 'objective_skills']) LOOP
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

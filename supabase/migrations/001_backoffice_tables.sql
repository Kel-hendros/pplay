-- =============================================
-- Migration 001: Backoffice Tables
-- =============================================
-- Run this migration to add admin capabilities,
-- expanded character structure, environments,
-- story arcs, and evaluation criteria.
-- =============================================

-- =============================================
-- 1. ADD ROLE TO PROFILES
-- =============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'editor'));

-- =============================================
-- 2. ADMIN HELPER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CHARACTERS TABLE (replaces JSONB)
-- =============================================

CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,

    -- Meta (objectives)
    meta JSONB DEFAULT '{
        "primary_goal": "",
        "secondary_goal": "",
        "fear": ""
    }',

    -- Motivation
    motivation TEXT,

    -- Personality
    personality JSONB DEFAULT '{
        "internal": "",
        "external": "",
        "point_of_view": ""
    }',

    -- Characteristics
    weaknesses JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    possibilities JSONB DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',

    -- Background
    biography TEXT,

    -- Speech style
    speech_style JSONB DEFAULT '{
        "tone": "",
        "formality": "neutral",
        "expressions": [],
        "language_patterns": ""
    }',

    -- Unique trait
    uniqueness TEXT,

    -- Hidden agenda (from original model)
    hidden_agenda TEXT,

    -- Display order
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. SCENARIO ENVIRONMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS scenario_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,

    -- Description
    description TEXT,

    -- SWOT-like analysis
    opportunities JSONB DEFAULT '[]',
    threats JSONB DEFAULT '[]',
    possibilities JSONB DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',

    -- Context
    location TEXT,
    atmosphere TEXT,
    time_context TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. SCENARIO STORY ARCS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS scenario_story_arcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,

    -- Player character
    player_character JSONB DEFAULT '{
        "role": "",
        "context": "",
        "initial_position": ""
    }',

    -- Objectives
    objectives JSONB DEFAULT '{
        "primary": [],
        "secondary": []
    }',

    -- Antagonistic force
    antagonistic_force JSONB DEFAULT '{
        "type": "",
        "description": "",
        "manifestation": ""
    }',

    -- Success/failure conditions
    success_conditions JSONB DEFAULT '[]',
    failure_conditions JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. SCENARIO EVALUATION CRITERIA TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS scenario_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,

    -- Criteria info
    name TEXT NOT NULL,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,

    -- Indicators
    indicators JSONB DEFAULT '[]',

    -- Achievement levels (0-3)
    achievement_levels JSONB DEFAULT '[
        {"level": 0, "label": "No demostrado", "descriptor": ""},
        {"level": 1, "label": "En desarrollo", "descriptor": ""},
        {"level": 2, "label": "Competente", "descriptor": ""},
        {"level": 3, "label": "Destacado", "descriptor": ""}
    ]',

    -- Learning outcomes
    learning_outcomes JSONB DEFAULT '[]',

    -- Display order
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. ADD is_published TO SCENARIOS
-- =============================================

ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- =============================================
-- 8. ROW LEVEL SECURITY FOR NEW TABLES
-- =============================================

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_story_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- Characters policies
CREATE POLICY "Admins can manage characters"
    ON characters FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can read characters"
    ON characters FOR SELECT
    TO authenticated
    USING (true);

-- Scenario environments policies
CREATE POLICY "Admins can manage environments"
    ON scenario_environments FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can read environments"
    ON scenario_environments FOR SELECT
    TO authenticated
    USING (true);

-- Scenario story arcs policies
CREATE POLICY "Admins can manage story arcs"
    ON scenario_story_arcs FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can read story arcs"
    ON scenario_story_arcs FOR SELECT
    TO authenticated
    USING (true);

-- Evaluation criteria policies
CREATE POLICY "Admins can manage evaluation criteria"
    ON scenario_evaluation_criteria FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Users can read evaluation criteria"
    ON scenario_evaluation_criteria FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- 9. ADMIN POLICIES FOR EXISTING TABLES
-- =============================================

-- Allow admins to manage scenarios
CREATE POLICY "Admins can manage scenarios"
    ON scenarios FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Allow admins to manage skills
CREATE POLICY "Admins can manage skills"
    ON skills FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Allow admins to manage scenario_skills
CREATE POLICY "Admins can manage scenario_skills"
    ON scenario_skills FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_characters_scenario_id ON characters(scenario_id);
CREATE INDEX IF NOT EXISTS idx_characters_display_order ON characters(scenario_id, display_order);
CREATE INDEX IF NOT EXISTS idx_scenario_environments_scenario_id ON scenario_environments(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_story_arcs_scenario_id ON scenario_story_arcs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_scenario_id ON scenario_evaluation_criteria(scenario_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_skill_id ON scenario_evaluation_criteria(skill_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =============================================
-- 11. UPDATE TRIGGERS
-- =============================================

-- Trigger for characters updated_at
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for scenario_environments updated_at
CREATE TRIGGER update_scenario_environments_updated_at
    BEFORE UPDATE ON scenario_environments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for scenario_story_arcs updated_at
CREATE TRIGGER update_scenario_story_arcs_updated_at
    BEFORE UPDATE ON scenario_story_arcs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for scenario_evaluation_criteria updated_at
CREATE TRIGGER update_evaluation_criteria_updated_at
    BEFORE UPDATE ON scenario_evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 12. MIGRATION FUNCTION: CONVERT EXISTING CHARACTERS
-- =============================================

CREATE OR REPLACE FUNCTION migrate_characters_from_jsonb()
RETURNS void AS $$
DECLARE
    scenario_row RECORD;
    char_item JSONB;
    char_order INTEGER;
BEGIN
    FOR scenario_row IN SELECT id, characters FROM scenarios WHERE characters IS NOT NULL AND characters != '[]'::jsonb LOOP
        char_order := 0;
        FOR char_item IN SELECT * FROM jsonb_array_elements(scenario_row.characters) LOOP
            INSERT INTO characters (
                scenario_id,
                name,
                role,
                avatar,
                personality,
                hidden_agenda,
                display_order
            ) VALUES (
                scenario_row.id,
                char_item->>'name',
                char_item->>'role',
                char_item->>'avatar',
                jsonb_build_object(
                    'internal', COALESCE(char_item->>'personality', ''),
                    'external', COALESCE(char_item->>'personality', ''),
                    'point_of_view', ''
                ),
                char_item->>'hidden_agenda',
                char_order
            )
            ON CONFLICT DO NOTHING;
            char_order := char_order + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration (comment out if you want to run manually)
-- SELECT migrate_characters_from_jsonb();

-- =============================================
-- DONE
-- =============================================

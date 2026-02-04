/**
 * Admin Supabase Queries
 * CRUD operations for admin panel
 */

const AdminDB = {
    // ==================== AUTH ====================

    /**
     * Check if current user is admin
     */
    isAdmin: async () => {
        try {
            const user = await db.auth.getUser();
            if (!user) return false;

            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            return profile?.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    },

    // ==================== SCENARIOS ====================

    scenarios: {
        /**
         * Get all scenarios with related data
         */
        getAll: async () => {
            const { data, error } = await supabaseClient
                .from('scenarios')
                .select(`
                    *,
                    scenario_skills(
                        skill:skills(*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        /**
         * Get single scenario with all related data
         */
        get: async (id) => {
            const { data, error } = await supabaseClient
                .from('scenarios')
                .select(`
                    *,
                    scenario_skills(
                        skill:skills(*)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Create new scenario
         */
        create: async (scenario) => {
            const { data, error } = await supabaseClient
                .from('scenarios')
                .insert(scenario)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Update scenario
         */
        update: async (id, updates) => {
            const { data, error } = await supabaseClient
                .from('scenarios')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Delete scenario
         */
        delete: async (id) => {
            const { error } = await supabaseClient
                .from('scenarios')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },

        /**
         * Update scenario skills
         */
        updateSkills: async (scenarioId, skillIds) => {
            // Remove existing
            await supabaseClient
                .from('scenario_skills')
                .delete()
                .eq('scenario_id', scenarioId);

            // Add new
            if (skillIds.length > 0) {
                const { error } = await supabaseClient
                    .from('scenario_skills')
                    .insert(skillIds.map(skillId => ({
                        scenario_id: scenarioId,
                        skill_id: skillId
                    })));

                if (error) throw error;
            }
        }
    },

    // ==================== CHARACTERS ====================

    characters: {
        /**
         * Get characters for a scenario
         */
        getByScenario: async (scenarioId) => {
            const { data, error } = await supabaseClient
                .from('characters')
                .select('*')
                .eq('scenario_id', scenarioId)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data || [];
        },

        /**
         * Create character
         */
        create: async (character) => {
            const { data, error } = await supabaseClient
                .from('characters')
                .insert(character)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Update character
         */
        update: async (id, updates) => {
            const { data, error } = await supabaseClient
                .from('characters')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Delete character
         */
        delete: async (id) => {
            const { error } = await supabaseClient
                .from('characters')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },

        /**
         * Reorder characters
         */
        reorder: async (scenarioId, orderedIds) => {
            const updates = orderedIds.map((id, index) => ({
                id,
                display_order: index
            }));

            for (const update of updates) {
                await supabaseClient
                    .from('characters')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id);
            }
        }
    },

    // ==================== ENVIRONMENTS ====================

    environments: {
        /**
         * Get environment for a scenario
         */
        getByScenario: async (scenarioId) => {
            const { data, error } = await supabaseClient
                .from('scenario_environments')
                .select('*')
                .eq('scenario_id', scenarioId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },

        /**
         * Create or update environment
         */
        upsert: async (scenarioId, environment) => {
            const { data, error } = await supabaseClient
                .from('scenario_environments')
                .upsert({
                    scenario_id: scenarioId,
                    ...environment
                }, {
                    onConflict: 'scenario_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    // ==================== STORY ARCS ====================

    storyArcs: {
        /**
         * Get story arc for a scenario
         */
        getByScenario: async (scenarioId) => {
            const { data, error } = await supabaseClient
                .from('scenario_story_arcs')
                .select('*')
                .eq('scenario_id', scenarioId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },

        /**
         * Create or update story arc
         */
        upsert: async (scenarioId, storyArc) => {
            const { data, error } = await supabaseClient
                .from('scenario_story_arcs')
                .upsert({
                    scenario_id: scenarioId,
                    ...storyArc
                }, {
                    onConflict: 'scenario_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    // ==================== EVALUATION CRITERIA ====================

    criteria: {
        /**
         * Get criteria for a scenario
         */
        getByScenario: async (scenarioId) => {
            const { data, error } = await supabaseClient
                .from('scenario_evaluation_criteria')
                .select(`
                    *,
                    skill:skills(id, name, icon)
                `)
                .eq('scenario_id', scenarioId)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data || [];
        },

        /**
         * Create criterion
         */
        create: async (criterion) => {
            const { data, error } = await supabaseClient
                .from('scenario_evaluation_criteria')
                .insert(criterion)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Update criterion
         */
        update: async (id, updates) => {
            const { data, error } = await supabaseClient
                .from('scenario_evaluation_criteria')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Delete criterion
         */
        delete: async (id) => {
            const { error } = await supabaseClient
                .from('scenario_evaluation_criteria')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }
    },

    // ==================== SKILLS ====================

    skills: {
        /**
         * Get all skills
         */
        getAll: async () => {
            const { data, error } = await supabaseClient
                .from('skills')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            return data;
        },

        /**
         * Create skill
         */
        create: async (skill) => {
            const { data, error } = await supabaseClient
                .from('skills')
                .insert(skill)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Update skill
         */
        update: async (id, updates) => {
            const { data, error } = await supabaseClient
                .from('skills')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Delete skill
         */
        delete: async (id) => {
            const { error } = await supabaseClient
                .from('skills')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }
    },

    // ==================== STATS ====================

    stats: {
        /**
         * Get dashboard stats
         */
        getDashboard: async () => {
            const [scenarios, skills, users, sessions] = await Promise.all([
                supabaseClient.from('scenarios').select('id', { count: 'exact' }),
                supabaseClient.from('skills').select('id', { count: 'exact' }),
                supabaseClient.from('profiles').select('id', { count: 'exact' }),
                supabaseClient.from('play_sessions').select('id', { count: 'exact' }).eq('status', 'completed')
            ]);

            return {
                totalScenarios: scenarios.count || 0,
                totalSkills: skills.count || 0,
                totalUsers: users.count || 0,
                completedSessions: sessions.count || 0
            };
        }
    }
};

console.log('admin-supabase.js loaded');

import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/templates
 * Fetch all templates with full behavioral mapping
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*, courses(name)');

        if (error) throw error;

        const mappedData = data.map(t => ({
            ...t,
            id: t.id,
            name: t.name,
            courseId: t.course_id,
            courseName: t.courses?.name || 'N/A',
            type: t.template_type,
            totalQuestions: t.total_questions,
            duration: t.duration_minutes,
            passingPercentage: t.passing_percentage,
            marksPerQuestion: t.marks_per_question,
            negativeMarking: t.negative_marking_enabled,
            negativeMarkingPenalty: t.negative_marking_penalty,
            hasSections: t.has_sections,
            sections: t.sections_config,
            allowedPlatform: t.allowed_platform || 'both',
            behavior: {
                shuffleQs: t.shuffle_questions,
                shuffleOpts: t.shuffle_options,
                allowReview: t.allow_review,
                showResults: t.show_results_immediately ? 'Immediately' : 'Later',
                lockNav: t.lock_section_navigation,
                maxAttempts: t.max_attempts,
                strictProctoring: t.strict_proctoring,
                preventTabSwitch: t.prevent_tab_switch
            }
        }));

        res.json(mappedData);
    } catch (error) {
        console.error('Fetch templates error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            templateName, name,
            testCategory, type,
            duration,
            totalQuestions,
            courseId,
            passingPercentage,
            marksPerQuestion,
            hasNegativeMarking,
            penalty,
            allowedPlatform,
            behavior,
            hasSections,
            sections
        } = req.body;

        const { data, error } = await supabase
            .from('templates')
            .insert({
                name: templateName || name,
                template_type: testCategory || type,
                duration_minutes: duration,
                total_questions: totalQuestions,
                course_id: courseId === "all" ? null : courseId,
                passing_percentage: passingPercentage,
                marks_per_question: marksPerQuestion,
                negative_marking_enabled: hasNegativeMarking,
                negative_marking_penalty: penalty,
                allowed_platform: allowedPlatform || 'both',
                shuffle_questions: behavior?.shuffleQs,
                shuffle_options: behavior?.shuffleOpts,
                allow_review: behavior?.allowReview,
                show_results_immediately: behavior?.showResults === 'Immediately',
                lock_section_navigation: behavior?.lockNav,
                max_attempts: behavior?.maxAttempts,
                strict_proctoring: behavior?.strictProctoring,
                prevent_tab_switch: behavior?.preventTabSwitch,
                has_sections: hasSections,
                sections_config: sections,
                created_by: req.user.id,
                created_at: new Date().toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/templates/active/list
 * Fetch all active templates with behavioral mapping
 */
router.get('/active/list', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*, courses(name)')
            .eq('is_active', true);

        if (error) throw error;

        const mappedData = data.map(t => ({
            ...t,
            id: t.id,
            name: t.name,
            courseId: t.course_id,
            courseName: t.courses?.name || 'N/A',
            type: t.template_type,
            totalQuestions: t.total_questions,
            duration: t.duration_minutes,
            passingPercentage: t.passing_percentage,
            marksPerQuestion: t.marks_per_question,
            negativeMarking: t.negative_marking_enabled,
            negativeMarkingPenalty: t.negative_marking_penalty,
            hasSections: t.has_sections,
            sections: t.sections_config,
            allowedPlatform: t.allowed_platform || 'both',
            behavior: {
                shuffleQs: t.shuffle_questions,
                shuffleOpts: t.shuffle_options,
                allowReview: t.allow_review,
                showResults: t.show_results_immediately ? 'Immediately' : 'Later',
                lockNav: t.lock_section_navigation,
                maxAttempts: t.max_attempts,
                strictProctoring: t.strict_proctoring,
                preventTabSwitch: t.prevent_tab_switch
            }
        }));

        res.json(mappedData);
    } catch (error) {
        console.error('Fetch active templates error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/:id
 * Fetch a single template by ID with behavioral mapping
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*, courses(name)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({
            ...data,
            id: data.id,
            name: data.name,
            courseId: data.course_id,
            courseName: data.courses?.name || 'N/A',
            type: data.template_type,
            totalQuestions: data.total_questions,
            duration: data.duration_minutes,
            passingPercentage: data.passing_percentage,
            marksPerQuestion: data.marks_per_question,
            negativeMarking: data.negative_marking_enabled,
            negativeMarkingPenalty: data.negative_marking_penalty,
            hasSections: data.has_sections,
            sections: data.sections_config,
            allowedPlatform: data.allowed_platform || 'both',
            behavior: {
                shuffleQs: data.shuffle_questions,
                shuffleOpts: data.shuffle_options,
                allowReview: data.allow_review,
                showResults: data.show_results_immediately ? 'Immediately' : 'Later',
                lockNav: data.lock_section_navigation,
                maxAttempts: data.max_attempts,
                strictProctoring: data.strict_proctoring,
                preventTabSwitch: data.prevent_tab_switch
            }
        });
    } catch (error) {
        console.error('Fetch template by ID error:', error);
        res.status(404).json({ error: 'Template not found' });
    }
});

/**
 * PUT /api/templates/:id
 * Update template with all behavioral fields
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const behavior = updates.behavior || {};

        const { data, error } = await supabase
            .from('templates')
            .update({
                name: updates.templateName || updates.name,
                template_type: updates.testCategory || updates.type,
                duration_minutes: updates.duration,
                total_questions: updates.totalQuestions,
                course_id: updates.courseId === "all" ? null : updates.courseId,
                passing_percentage: updates.passingPercentage,
                marks_per_question: updates.marksPerQuestion,
                negative_marking_enabled: updates.hasNegativeMarking ?? updates.negativeMarking,
                negative_marking_penalty: updates.penalty ?? updates.negativeMarkingPenalty,
                allowed_platform: updates.allowedPlatform || updates.allowed_platform || 'both',
                shuffle_questions: behavior.shuffleQs,
                shuffle_options: behavior.shuffleOpts,
                allow_review: behavior.allowReview,
                show_results_immediately: behavior.showResults === 'Immediately',
                lock_section_navigation: behavior.lockNav,
                max_attempts: behavior.maxAttempts,
                strict_proctoring: behavior.strictProctoring,
                prevent_tab_switch: behavior.preventTabSwitch,
                has_sections: updates.hasSections,
                sections_config: updates.sections,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/templates/:id
 * Delete template
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/templates/presets/:type
 * Create template from preset
 */
router.post('/presets/:type', authenticateToken, async (req, res) => {
    try {
        const { type } = req.params;
        // Mocking the builder logic for now since we want to persist to Supabase
        const presets = {
            quiz: { name: 'Quiz Preset', duration_minutes: 30, total_questions: 10, template_type: 'quiz' },
            midterm: { name: 'Midterm Preset', duration_minutes: 90, total_questions: 40, template_type: 'midterm' },
            final: { name: 'Final Preset', duration_minutes: 120, total_questions: 50, template_type: 'final' }
        };

        const preset = presets[type.toLowerCase()];
        if (!preset) return res.status(404).json({ error: 'Preset not found' });

        const { data, error } = await supabase
            .from('templates')
            .insert({
                ...preset,
                created_by: req.user.id,
                created_at: new Date().toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Create preset error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;

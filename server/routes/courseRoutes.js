import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/courses
 * Fetch all courses
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*, departments(name)');

        if (error) throw error;

        // Map department index to name for the frontend
        const mappedData = data.map(course => ({
            ...course,
            department: course.departments?.name || 'Unknown'
        }));

        res.json(mappedData);
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

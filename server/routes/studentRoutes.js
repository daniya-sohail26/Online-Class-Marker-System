import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/students
 * Fetch all students with their courses
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*, users(name), courses(name)');

        if (error) throw error;

        const mappedData = data.map(s => ({
            id: s.id,
            name: s.users?.name || 'Unknown Student',
            enrollmentNumber: s.enrollment_number,
            courseId: s.course_id,
            courseName: s.courses?.name || 'N/A'
        }));

        res.json(mappedData);
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

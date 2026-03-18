import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/questions/save
 * Save generated questions to database with course association
 */
router.post('/save', authenticateToken, async (req, res) => {
  const { courseId, questions, sourceType } = req.body;
  const userId = req.user.id;

  try {
    if (!courseId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        error: 'Missing required fields: courseId, questions (array)' 
      });
    }

    const savedQuestions = [];

    for (const q of questions) {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          course_id: courseId,
          created_by: userId,
          question_text: q.text,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_option: ['A', 'B', 'C', 'D'][q.correct],
          difficulty: q.difficulty || 'Medium',
          explanation: q.explanation || '',
          is_ai_generated: q.isAiGenerated || false,
          source_type: sourceType || 'MANUAL',
          topic: q.topic || null
        })
        .select();

      if (error) {
        console.error('Error saving question:', error);
        throw error;
      }

      savedQuestions.push(data[0]);
    }

    res.json({ 
      success: true, 
      count: savedQuestions.length,
      questions: savedQuestions 
    });
  } catch (error) {
    console.error('Save questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/questions/course/:courseId
 * Fetch all questions for a specific course with optional filters
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  const { courseId } = req.params;
  const { sourceType, difficulty, limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('course_id', courseId);

    // Apply optional filters
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      questions: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Fetch course questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/questions/:questionId
 * Fetch a single question by ID
 */
router.get('/:questionId', authenticateToken, async (req, res) => {
  const { questionId } = req.params;

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Question not found' });

    res.json(data);
  } catch (error) {
    console.error('Fetch question error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/questions/:questionId
 * Update a question (only by creator or admin)
 */
router.put('/:questionId', authenticateToken, async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  try {
    // Verify ownership
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('created_by')
      .eq('id', questionId)
      .single();

    if (fetchError) throw fetchError;
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.created_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update question
    const { data, error } = await supabase
      .from('questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/questions/:questionId
 * Delete a question (only by creator or admin)
 */
router.delete('/:questionId', authenticateToken, async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.id;

  try {
    // Verify ownership
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('created_by')
      .eq('id', questionId)
      .single();

    if (fetchError) throw fetchError;
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.created_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/questions/teacher/:teacherId
 * Fetch all questions created by a specific teacher
 */
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
  const { teacherId } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  try {
    const { data, error, count } = await supabase
      .from('questions')
      .select('*')
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      questions: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Fetch teacher questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

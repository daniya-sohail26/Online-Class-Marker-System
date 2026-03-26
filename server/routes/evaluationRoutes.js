import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import TestEvaluator from '../services/TestEvaluator.js';
const router = express.Router();

/**
 * GET /api/teacher/evaluation
 * Fetch all test attempts for tests created by the logged-in teacher
 */
router.get('/evaluation', authenticateToken, async (req, res) => {
  const userId = req.user.id; // This MUST be a valid UUID string

  try {
    // We fetch tests where the teacher is the creator
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select(`
        id,
        score,
        violations,
        submitted_at,
        tests!inner(
          id,
          created_by,
          templates(name)
        ),
        students(enrollment_number)
      `)
      .eq('tests.created_by', userId) // Filter attempts via the joined tests table
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Map the nested data to the flat format your React component expects
    const formatted = attempts.map(att => ({
      attempt_id: att.id,
      test_name: att.tests?.templates?.name || 'Untitled Test',
      enrollment_number: att.students?.enrollment_number || 'N/A',
      total_score: att.score,
      submitted_at: att.submitted_at,
      violations: att.violations
    }));

    res.json({ attempts: formatted });

  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/teacher/evaluation/:attemptId
 * Fetch specific attempt details and all associated evaluated answers
 */
router.get('/evaluation/:attemptId', authenticateToken, async (req, res) => {
  const { attemptId } = req.params;

  try {
    // Query 1: Get Attempt Summary and join Test/Template and Student data
    const { data: attemptData, error: attemptError } = await supabase
      .from('attempts')
      .select(`
        id,
        test_id,
        score,
        submitted_at,
        violations,
        tests!inner(
          template_id,
          templates(name)
        ),
        students!inner(
          enrollment_number
        )
      `)
      .eq('id', attemptId)
      .single();

    if (attemptError) {
      if (attemptError.code === 'PGRST116') { // Supabase "Row not found" error
        return res.status(404).json({ error: 'Attempt not found' });
      }
      throw attemptError;
    }

    // Query 2: Get Answers and join Question data
    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select(`
        id,
        question_id,
        selected_option,
        is_correct,
        marks_awarded,
        answered_at,
        questions!inner(
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option
        )
      `)
      .eq('attempt_id', attemptId)
      .order('answered_at', { ascending: true });

    if (answersError) throw answersError;

    // Format the response to match what the React frontend expects
    const summary = {
      attempt_id: attemptData.id,
      test_name: attemptData.tests?.templates?.name || 'Unknown Test',
      enrollment_number: attemptData.students?.enrollment_number || 'Unknown',
      total_score: attemptData.score,
      submitted_at: attemptData.submitted_at,
      violations: attemptData.violations
    };

    const evaluated_answers = answersData.map(ans => ({
      answer_id: ans.id,
      question_id: ans.question_id,
      question_text: ans.questions?.question_text,
      option_a: ans.questions?.option_a,
      option_b: ans.questions?.option_b,
      option_c: ans.questions?.option_c,
      option_d: ans.questions?.option_d,
      expected_answer: ans.questions?.correct_option,
      student_answer: ans.selected_option,
      is_correct: ans.is_correct,
      marks_awarded: ans.marks_awarded,
      answered_at: ans.answered_at
    }));

    res.json({
      summary,
      evaluated_answers
    });

  } catch (error) {
    console.error('Fetch attempt details error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/evaluate-attempt', authenticateToken, async (req, res) => {
    const { attemptId } = req.body;

    try {
        // 1. Fetch Attempt, Template, and Answers
        const { data: attempt, error: attErr } = await supabase
            .from('attempts')
            .select('*, tests(template_id, templates(*))')
            .eq('id', attemptId)
            .single();

        const { data: answers, error: ansErr } = await supabase
            .from('answers')
            .select('*, questions(correct_option)')
            .eq('attempt_id', attemptId);

        if (attErr || ansErr) throw new Error("Data fetching failed");

        const templateConfig = attempt.tests.templates;

        // 2. Use Strategy Pattern
        TestEvaluator.setStrategyByTemplate(templateConfig);
        const { totalScore, evaluatedAnswers } = TestEvaluator.evaluate(answers, templateConfig);

        // 3. Update DB with results
        await supabase.from('attempts').update({ score: totalScore }).eq('id', attemptId);
        
        for (const ans of evaluatedAnswers) {
            await supabase.from('answers')
                .update({ is_correct: ans.is_correct, marks_awarded: ans.marks_awarded })
                .eq('id', ans.id);
        }

        res.json({ success: true, score: totalScore });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
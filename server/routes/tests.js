import express from 'express';
import multer from 'multer';
import { TestCreationService } from '../services/TestCreationService.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();
const testService = new TestCreationService();

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/tests/generate-questions
 * Generate questions using Factory Pattern
 * Supports: AI, MANUAL, HYBRID
 */
router.post('/generate-questions', upload.array('files'), async (req, res) => {
  try {
    const { sourceType, prompt, count, difficulty } = req.body;

    const questions = await testService.generateQuestions(sourceType, {
      prompt,
      count: parseInt(count, 10),
      difficulty,
      files: req.files
    });

    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/template/preset
 * Create template from preset using Builder Pattern
 */
router.post('/template/preset', (req, res) => {
  try {
    const { presetType } = req.body;
    const template = testService.createTemplateFromPreset(presetType);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/template/custom
 * Create custom template using Builder Pattern
 */
router.post('/template/custom', (req, res) => {
  try {
    const template = testService.createCustomTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests
 * Create a new test and persist to Supabase
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      courseId,
      course_id,
      templateId,
      template_id,
      questionIds,
      startTime,
      start_time,
      endTime,
      end_time,
      isPublished,
      is_published,
      createdBy
    } = req.body;

    const normalizedData = {
      name,
      course_id: course_id || courseId,
      template_id: template_id || templateId,
      start_time: start_time || startTime,
      end_time: end_time || endTime,
      total_marks: 0,
      // Default to true if not provided as per user requirements
      is_published: isPublished !== undefined ? isPublished : (is_published !== undefined ? is_published : true),
      created_by: createdBy || 'teacher-123',
      created_at: new Date().toISOString()
    };

    console.log(`[POST] Creating new test: ${name}. Payload:`, {
      ...normalizedData,
      questionCount: questionIds?.length
    });

    const { data: testData, error: insertError } = await supabase
      .from('tests')
      .insert(normalizedData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error creating test:', insertError);
      throw insertError;
    }

    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      console.log(`Saving ${questionIds.length} questions for new test: ${testData.id}`);
      const associations = questionIds.map(qId => ({
        test_id: testData.id,
        question_id: qId
      }));

      const { error: assocError } = await supabase
        .from('test_questions')
        .insert(associations);

      if (assocError) {
        console.error('Error creating question associations:', assocError);
        throw assocError;
      }
    }

    res.status(201).json(testData);
  } catch (error) {
    console.error('Create test error:', error);
    res.status(400).json({ error: error.message });
  }
});



/**
 * GET /api/tests
 * Get all tests from Supabase with question and student counts
 */
router.get('/', async (req, res) => {
  console.log('--- FETCHING ALL TESTS WITH COUNTS ---');
  try {
    // Fetch tests with course details and question counts in one query
    const { data: tests, error: testError } = await supabase
      .from('tests')
      .select(`
        *,
        courses(name),
        test_questions(count)
      `);

    if (testError) throw testError;

    // Fetch student enrollment counts separately
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('course_id');

    if (studentError) throw studentError;

    const studentCountMap = students.reduce((acc, s) => {
      if (s.course_id) {
        acc[s.course_id] = (acc[s.course_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Fetch all test question counts in one go for efficiency and reliability
    const { data: qBank, error: qBankError } = await supabase
      .from('test_questions')
      .select('test_id');

    if (qBankError) console.error('Error fetching question counts:', qBankError);

    const qCountMap = (qBank || []).reduce((acc, q) => {
      if (q.test_id) {
        acc[q.test_id] = (acc[q.test_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Map the data for the frontend
    const mappedData = tests.map(test => {
      let status = 'draft';
      const now = new Date();
      if (test.is_published) {
        if (test.start_time && new Date(test.start_time) > now) {
          status = 'scheduled';
        } else if (test.end_time && new Date(test.end_time) < now) {
          status = 'completed';
        } else {
          status = 'published';
        }
      }

      return {
        ...test,
        id: test.id,
        courseId: test.course_id,
        courseName: test.courses?.name || 'N/A',
        status: status,
        totalQuestions: qCountMap[test.id] || 0,
        studentCount: studentCountMap[test.course_id] || 0
      };
    });

    res.json(mappedData);
  } catch (error) {
    console.error('Fetch tests error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('*, courses(name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Test not found' });

    // Fetch counts
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', data.course_id);

    const { count: totalQuestions } = await supabase
      .from('test_questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', data.id);

    // Calculate status
    let status = 'draft';
    const now = new Date();
    if (data.is_published) {
      if (data.start_time && new Date(data.start_time) > now) {
        status = 'scheduled';
      } else if (data.end_time && new Date(data.end_time) < now) {
        status = 'completed';
      } else {
        status = 'published';
      }
    }

    // Fetch question IDs
    const { data: questionData, error: qError } = await supabase
      .from('test_questions')
      .select('question_id')
      .eq('test_id', data.id);

    const questionIds = (questionData || []).map(q => q.question_id);

    res.json({
      ...data,
      id: data.id,
      courseId: data.course_id,
      courseName: data.courses?.name || 'N/A',
      templateId: data.template_id,
      status: status,
      totalQuestions: totalQuestions || 0,
      studentCount: studentCount || 0,
      questionIds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      is_published,
      isPublished,
      courseId,
      course_id,
      templateId,
      template_id,
      questionIds
    } = req.body;

    // Use either case format to be resilient
    const normalizedData = {
      name,
      is_published: isPublished !== undefined ? isPublished : is_published,
      course_id: course_id || courseId,
      template_id: template_id || templateId,
      start_time: startTime,
      end_time: endTime
    };

    console.log(`[PUT] Updating test ${req.params.id}. Payload:`, {
      ...normalizedData,
      questionCount: questionIds?.length
    });

    const { data: testData, error: updateError } = await supabase
      .from('tests')
      .update(normalizedData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update questions if provided
    if (questionIds && Array.isArray(questionIds)) {
      console.log(`Updating questions for test ${req.params.id}. New count: ${questionIds.length}`);
      // 1. Remove existing associations
      const { error: delError } = await supabase.from('test_questions').delete().eq('test_id', req.params.id);
      if (delError) console.error('Error deleting old questions:', delError);

      // 2. Add new associations
      if (questionIds.length > 0) {
        const associations = questionIds.map(qId => ({
          test_id: req.params.id,
          question_id: qId
        }));
        const { error: assocError } = await supabase.from('test_questions').insert(associations);
        if (assocError) {
          console.error('Error inserting new questions:', assocError);
          throw assocError;
        }
      }
    }

    res.json(testData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/questions
 * Add questions to a test
 */
router.post('/:id/questions', (req, res) => {
  try {
    const { questionIds } = req.body;
    const test = testService.addQuestionsToTest(req.params.id, questionIds);
    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/tests/:id/questions
 * Remove questions from a test
 */
router.delete('/:id/questions', (req, res) => {
  try {
    const { questionIds } = req.body;
    const test = testService.removeQuestionsFromTest(req.params.id, questionIds);
    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/schedule
 * Schedule a test
 */
router.post('/:id/schedule', (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const test = testService.scheduleTest(
      req.params.id,
      new Date(startTime),
      new Date(endTime)
    );
    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/publish
 * Publish a test
 */
router.post('/:id/publish', (req, res) => {
  try {
    const test = testService.publishTest(req.params.id);
    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/unpublish
 * Unpublish a test
 */
router.post('/:id/unpublish', (req, res) => {
  try {
    const test = testService.unpublishTest(req.params.id);
    res.json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/tests/course/:courseId
 * Get tests by course
 */
router.get('/course/:courseId', (req, res) => {
  try {
    const tests = testService.getTestsByCourse(req.params.courseId);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/teacher/:teacherId
 * Get tests by teacher
 */
router.get('/teacher/:teacherId', (req, res) => {
  try {
    const tests = testService.getTestsByTeacher(req.params.teacherId);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/published/list
 * Get published tests
 */
router.get('/published/list', (req, res) => {
  try {
    const tests = testService.getPublishedTests();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/upcoming/list
 * Get upcoming tests
 */
router.get('/upcoming/list', (req, res) => {
  try {
    const tests = testService.getUpcomingTests();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/active/list
 * Get active tests
 */
router.get('/active/list', (req, res) => {
  try {
    const tests = testService.getActiveTests();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/completed/list
 * Get completed tests
 */
router.get('/completed/list', (req, res) => {
  try {
    const tests = testService.getCompletedTests();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tests/:id/stats
 * Get test statistics
 */
router.get('/:id/stats', (req, res) => {
  try {
    const stats = testService.getTestStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/duplicate
 * Duplicate a test
 */
router.post('/:id/duplicate', (req, res) => {
  try {
    const { newName } = req.body;
    const test = testService.duplicateTest(req.params.id, newName);
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

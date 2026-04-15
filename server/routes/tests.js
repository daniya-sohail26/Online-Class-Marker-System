import express from 'express';
import multer from 'multer';
import { TestCreationService } from '../services/TestCreationService.js';
import { supabase } from '../config/supabaseClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const testService = new TestCreationService();

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

async function syncTestSchedule(testId, startTime, endTime) {
  const hasSchedule = Boolean(startTime) && Boolean(endTime);

  const { error: clearError } = await supabase
    .from('test_schedules')
    .delete()
    .eq('test_id', testId);

  if (clearError) throw clearError;

  if (!hasSchedule) return;

  // Ensure times are ISO strings (not Date objects)
  // This prevents Supabase from applying timezone conversions
  const startIso = typeof startTime === 'string' ? startTime : new Date(startTime).toISOString();
  const endIso = typeof endTime === 'string' ? endTime : new Date(endTime).toISOString();

  const { error: insertError } = await supabase
    .from('test_schedules')
    .insert({
      test_id: testId,
      availability_start: startIso,
      availability_end: endIso,
      time_zone: 'UTC',
      is_active: true,
    });

  if (insertError) throw insertError;
}

async function getTemplateConstraints(templateId) {
  if (!templateId) return null;

  const { data, error } = await supabase
    .from('templates')
    .select('id, total_questions, marks_per_question, duration_minutes')
    .eq('id', templateId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

function normalizeScheduleWindow(startLike, endLike, durationMinutes) {
  const start = startLike ? new Date(startLike) : null;
  const end = endLike ? new Date(endLike) : null;
  const duration = Math.max(Number(durationMinutes ?? 0), 0);

  if (!start || Number.isNaN(start.getTime())) {
    return {
      startIso: null,
      endIso: null,
    };
  }

  if (end && !Number.isNaN(end.getTime()) && end > start) {
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  if (duration > 0) {
    const derivedEnd = new Date(start.getTime() + duration * 60 * 1000);
    return {
      startIso: start.toISOString(),
      endIso: derivedEnd.toISOString(),
    };
  }

  return {
    startIso: start.toISOString(),
    endIso: null,
  };
}

async function recalculateTotalMarks(testId) {
  const { data: rows, error } = await supabase
    .from('test_questions')
    .select('marks')
    .eq('test_id', testId);

  if (error) throw error;

  const totalMarks = (rows || []).reduce((sum, row) => sum + Number(row.marks ?? 0), 0);

  const { error: updateError } = await supabase
    .from('tests')
    .update({ total_marks: totalMarks })
    .eq('id', testId);

  if (updateError) throw updateError;

  return totalMarks;
}

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
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
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
    } = req.body;

    const normalizedData = {
      name,
      course_id: course_id || courseId,
      template_id: template_id || templateId,
      start_time: start_time || startTime,
      end_time: end_time || endTime,
      // Default to true if not provided as per user requirements
      is_published: isPublished !== undefined ? isPublished : (is_published !== undefined ? is_published : true),
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    const templateConstraints = await getTemplateConstraints(normalizedData.template_id);
    if (templateConstraints?.total_questions && Array.isArray(questionIds) && questionIds.length > templateConstraints.total_questions) {
      return res.status(400).json({
        error: `Template allows only ${templateConstraints.total_questions} questions, but ${questionIds.length} were provided.`,
      });
    }

    const normalizedWindow = normalizeScheduleWindow(
      normalizedData.start_time,
      normalizedData.end_time,
      templateConstraints?.duration_minutes,
    );
    normalizedData.start_time = normalizedWindow.startIso;
    normalizedData.end_time = normalizedWindow.endIso;

    const questionMarkValue = Number(templateConstraints?.marks_per_question ?? 1);
    normalizedData.total_marks = Array.isArray(questionIds) ? questionIds.length * questionMarkValue : 0;

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
        question_id: qId,
        marks: questionMarkValue,
      }));

      const { error: assocError } = await supabase
        .from('test_questions')
        .insert(associations);

      if (assocError) {
        console.error('Error creating question associations:', assocError);
        throw assocError;
      }
    }

    await recalculateTotalMarks(testData.id);

    await syncTestSchedule(testData.id, normalizedData.start_time, normalizedData.end_time);

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

    const testIds = (tests || []).map((t) => t.id);
    const { data: schedules, error: schedulesError } = await supabase
      .from('test_schedules')
      .select('test_id, availability_start, availability_end, is_active')
      .in('test_id', testIds)
      .eq('is_active', true);

    if (schedulesError) throw schedulesError;

    const scheduleMap = (schedules || []).reduce((acc, row) => {
      const existing = acc[row.test_id];
      if (!existing) {
        acc[row.test_id] = row;
        return acc;
      }

      const existingStart = existing.availability_start ? new Date(existing.availability_start).getTime() : 0;
      const rowStart = row.availability_start ? new Date(row.availability_start).getTime() : 0;
      if (rowStart >= existingStart) {
        acc[row.test_id] = row;
      }
      return acc;
    }, {});

    // Map the data for the frontend
    const mappedData = tests.map(test => {
      let status = 'draft';
      const now = new Date();
      const schedule = scheduleMap[test.id];
      const effectiveStart = schedule ? schedule.availability_start : test.start_time;
      const effectiveEnd = schedule ? schedule.availability_end : test.end_time;
      const startDate = effectiveStart ? new Date(effectiveStart) : null;
      const endDate = effectiveEnd ? new Date(effectiveEnd) : null;
      const hasValidWindow =
        startDate &&
        endDate &&
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        endDate > startDate;

      if (test.is_published) {
        if (!hasValidWindow) {
          status = 'scheduled';
        } else if (startDate > now) {
          status = 'scheduled';
        } else if (endDate < now) {
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

    const { data: scheduleRow } = await supabase
      .from('test_schedules')
      .select('availability_start, availability_end')
      .eq('test_id', data.id)
      .eq('is_active', true)
      .order('availability_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate status
    let status = 'draft';
    const now = new Date();
    const effectiveStart = scheduleRow ? scheduleRow.availability_start : data.start_time;
    const effectiveEnd = scheduleRow ? scheduleRow.availability_end : data.end_time;
    const startDate = effectiveStart ? new Date(effectiveStart) : null;
    const endDate = effectiveEnd ? new Date(effectiveEnd) : null;
    const hasValidWindow =
      startDate &&
      endDate &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      endDate > startDate;

    if (data.is_published) {
      if (!hasValidWindow) {
        status = 'scheduled';
      } else if (startDate > now) {
        status = 'scheduled';
      } else if (endDate < now) {
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

    const { data: existingTest, error: existingErr } = await supabase
      .from('tests')
      .select('id, name, is_published, course_id, template_id, start_time, end_time')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr || !existingTest) {
      return res.status(404).json({ error: existingErr?.message || 'Test not found' });
    }

    const hasName = name !== undefined;
    const hasPublish = isPublished !== undefined || is_published !== undefined;
    const hasCourse = course_id !== undefined || courseId !== undefined;
    const hasTemplate = template_id !== undefined || templateId !== undefined;
    const hasStart = startTime !== undefined || req.body.start_time !== undefined;
    const hasEnd = endTime !== undefined || req.body.end_time !== undefined;

    const resolvedTemplateId = hasTemplate
      ? (template_id ?? templateId)
      : existingTest.template_id;
    const resolvedStart = hasStart
      ? (startTime ?? req.body.start_time)
      : existingTest.start_time;
    const resolvedEnd = hasEnd
      ? (endTime ?? req.body.end_time)
      : existingTest.end_time;

    const normalizedData = {};
    if (hasName) normalizedData.name = name;
    if (hasPublish) normalizedData.is_published = isPublished !== undefined ? isPublished : is_published;
    if (hasCourse) normalizedData.course_id = course_id ?? courseId;
    if (hasTemplate) normalizedData.template_id = template_id ?? templateId;
    if (hasStart) normalizedData.start_time = startTime ?? req.body.start_time;
    if (hasEnd) normalizedData.end_time = endTime ?? req.body.end_time;

    const templateConstraints = await getTemplateConstraints(resolvedTemplateId);
    if (templateConstraints?.total_questions && Array.isArray(questionIds) && questionIds.length > templateConstraints.total_questions) {
      return res.status(400).json({
        error: `Template allows only ${templateConstraints.total_questions} questions, but ${questionIds.length} were provided.`,
      });
    }

    let finalStart = resolvedStart;
    let finalEnd = resolvedEnd;
    if (hasStart || hasEnd || hasTemplate || hasPublish) {
      const resolvedWindow = normalizeScheduleWindow(
        resolvedStart,
        resolvedEnd,
        templateConstraints?.duration_minutes,
      );
      finalStart = resolvedWindow.startIso;
      finalEnd = resolvedWindow.endIso;

      if (hasStart || hasTemplate || hasPublish) {
        normalizedData.start_time = finalStart;
      }
      if (hasEnd || hasTemplate || hasPublish) {
        normalizedData.end_time = finalEnd;
      }
    }

    const targetPublishedState = hasPublish
      ? Boolean(isPublished !== undefined ? isPublished : is_published)
      : Boolean(existingTest.is_published);

    if (targetPublishedState && (!finalStart || !finalEnd)) {
      return res.status(400).json({
        error: 'Published tests must have both start and end time. Set schedule in UTC before publishing.',
      });
    }

    const questionMarkValue = Number(templateConstraints?.marks_per_question ?? 1);

    console.log(`[PUT] Updating test ${req.params.id}. Payload:`, {
      ...normalizedData,
      questionCount: questionIds?.length
    });

    let testData = existingTest;
    if (Object.keys(normalizedData).length > 0) {
      const { data: updatedTest, error: updateError } = await supabase
        .from('tests')
        .update(normalizedData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateError) throw updateError;
      testData = updatedTest;
    }

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
          question_id: qId,
          marks: questionMarkValue,
        }));
        const { error: assocError } = await supabase.from('test_questions').insert(associations);
        if (assocError) {
          console.error('Error inserting new questions:', assocError);
          throw assocError;
        }
      }
    } else if (resolvedTemplateId) {
      // Keep per-question marks consistent with the active template configuration.
      await supabase
        .from('test_questions')
        .update({ marks: questionMarkValue })
        .eq('test_id', req.params.id);
    }

    await recalculateTotalMarks(req.params.id);

    await syncTestSchedule(req.params.id, finalStart, finalEnd);

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
router.post('/:id/schedule', async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const { data: existing, error: existingErr } = await supabase
      .from('tests')
      .select('id, template_id, start_time, end_time')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr || !existing) {
      return res.status(404).json({ error: existingErr?.message || 'Test not found' });
    }

    const templateConstraints = await getTemplateConstraints(existing.template_id);
    const normalized = normalizeScheduleWindow(
      startTime ?? existing.start_time,
      endTime ?? existing.end_time,
      templateConstraints?.duration_minutes,
    );

    if (!normalized.startIso || !normalized.endIso) {
      return res.status(400).json({
        error: 'Schedule requires valid start and end times (UTC).',
      });
    }

    const { data: updatedTest, error: updateError } = await supabase
      .from('tests')
      .update({ start_time: normalized.startIso, end_time: normalized.endIso })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await syncTestSchedule(req.params.id, normalized.startIso, normalized.endIso);
    await recalculateTotalMarks(req.params.id);

    res.json(updatedTest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/publish
 * Publish a test
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const { data: existing, error: existingErr } = await supabase
      .from('tests')
      .select('id, template_id, start_time, end_time')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr || !existing) {
      return res.status(404).json({ error: existingErr?.message || 'Test not found' });
    }

    const templateConstraints = await getTemplateConstraints(existing.template_id);
    const normalized = normalizeScheduleWindow(
      existing.start_time,
      existing.end_time,
      templateConstraints?.duration_minutes,
    );

    if (!normalized.startIso || !normalized.endIso) {
      return res.status(400).json({
        error: 'Cannot publish without schedule. Set start/end UTC in wizard first.',
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('tests')
      .update({
        is_published: true,
        start_time: normalized.startIso,
        end_time: normalized.endIso,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await syncTestSchedule(req.params.id, normalized.startIso, normalized.endIso);

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/tests/:id/unpublish
 * Unpublish a test
 */
router.post('/:id/unpublish', async (req, res) => {
  try {
    const { data: updated, error: updateErr } = await supabase
      .from('tests')
      .update({ is_published: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await supabase
      .from('test_schedules')
      .update({ is_active: false })
      .eq('test_id', req.params.id);

    res.json(updated);
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

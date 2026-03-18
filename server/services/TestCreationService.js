/**
 * Test Creation Service
 * Handles creation, scheduling, and publishing of tests
 * Integrates with templates and question banks
 * Uses Factory Pattern for question generation
 * Uses Builder Pattern for template creation
 */

import { QuestionGeneratorFactory } from './QuestionFactory.js';
import { TestTemplateBuilder, TemplatePresets } from './TestTemplateBuilder.js';

class TestCreationService {
  constructor() {
    this.tests = new Map();
    this.testSchedules = new Map();
  }

  /**
   * Generate questions using Factory Pattern
   * @param {string} sourceType - 'AI', 'MANUAL', or 'HYBRID'
   * @param {Object} params - Generation parameters
   * @returns {Promise<Array>} Generated questions
   */
  async generateQuestions(sourceType, params) {
    try {
      const generator = QuestionGeneratorFactory.create(sourceType);
      return await generator.generate(params);
    } catch (error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Create template from preset using Builder Pattern
   * @param {string} presetType - 'quiz', 'midterm', 'final'
   * @returns {Object} Created template
   */
  createTemplateFromPreset(presetType) {
    try {
      let builder;

      switch (presetType?.toLowerCase()) {
        case 'quiz':
          builder = TemplatePresets.createQuizTemplate();
          break;
        case 'midterm':
          builder = TemplatePresets.createMidtermTemplate();
          break;
        case 'final':
          builder = TemplatePresets.createFinalTemplate();
          break;
        default:
          builder = new TestTemplateBuilder();
      }

      return builder.build();
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Create custom template using Builder Pattern
   * @param {Object} config - Template configuration
   * @returns {Object} Created template
   */
  createCustomTemplate(config) {
    try {
      const builder = new TestTemplateBuilder();

      builder.setName(config.name);
      if (config.description) builder.setDescription(config.description);
      if (config.type) builder.setType(config.type);

      // Configure scoring
      if (config.scoring) {
        const scoring = builder.getScoringConfig();
        if (config.scoring.marksPerQuestion) scoring.setMarksPerQuestion(config.scoring.marksPerQuestion);
        if (config.scoring.negativeMarking !== undefined) {
          scoring.setNegativeMarking(config.scoring.negativeMarking, config.scoring.negativeMarkingType);
        }
        if (config.scoring.totalMarks) scoring.setTotalMarks(config.scoring.totalMarks);
        if (config.scoring.passingMarks) scoring.setPassingMarks(config.scoring.passingMarks);
      }

      // Configure behavior
      if (config.behavior) {
        const behavior = builder.getBehaviorConfig();
        if (config.behavior.shuffleQuestions !== undefined) behavior.setShuffleQuestions(config.behavior.shuffleQuestions);
        if (config.behavior.shuffleOptions !== undefined) behavior.setShuffleOptions(config.behavior.shuffleOptions);
        if (config.behavior.allowReview !== undefined) behavior.setAllowReview(config.behavior.allowReview);
        if (config.behavior.showResultsImmediately !== undefined) behavior.setShowResultsImmediately(config.behavior.showResultsImmediately);
      }

      // Configure structure
      if (config.structure) {
        const structure = builder.getStructureConfig();
        if (config.structure.totalQuestions) structure.setTotalQuestions(config.structure.totalQuestions);
        if (config.structure.duration) structure.setDuration(config.structure.duration);
        if (config.structure.sections) {
          config.structure.sections.forEach(section => structure.addSection(section));
        }
      }

      return builder.build();
    } catch (error) {
      throw new Error(`Failed to create custom template: ${error.message}`);
    }
  }

  /**
   * Create a new test from a template
   * @param {Object} params - Test creation parameters
   * @returns {Object} Created test object
   */
  createTest(params) {
    const {
      templateId,
      name,
      courseId,
      createdBy,
      questionIds = [],
      customSettings = {},
    } = params;

    if (!templateId || !name || !courseId || !createdBy) {
      throw new Error("Missing required parameters: templateId, name, courseId, createdBy");
    }

    const testId = `test-${Date.now()}`;
    const test = {
      id: testId,
      templateId,
      name,
      courseId,
      createdBy,
      questionIds,
      customSettings,
      status: "draft", // draft, scheduled, published, completed
      startTime: null,
      endTime: null,
      totalMarks: 0,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Add questions to a test
   * @param {string} testId - Test ID
   * @param {Array} questionIds - Array of question IDs
   * @returns {Object} Updated test
   */
  addQuestionsToTest(testId, questionIds) {
    const test = this.getTest(testId);

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      throw new Error("Invalid question IDs array");
    }

    test.questionIds = [...new Set([...test.questionIds, ...questionIds])];
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Remove questions from a test
   * @param {string} testId - Test ID
   * @param {Array} questionIds - Array of question IDs to remove
   * @returns {Object} Updated test
   */
  removeQuestionsFromTest(testId, questionIds) {
    const test = this.getTest(testId);

    if (!Array.isArray(questionIds)) {
      throw new Error("Invalid question IDs array");
    }

    test.questionIds = test.questionIds.filter((id) => !questionIds.includes(id));
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Schedule a test
   * @param {string} testId - Test ID
   * @param {Date} startTime - Test start time
   * @param {Date} endTime - Test end time
   * @returns {Object} Updated test
   */
  scheduleTest(testId, startTime, endTime) {
    const test = this.getTest(testId);

    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw new Error("Invalid date format");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    test.startTime = startTime;
    test.endTime = endTime;
    test.status = "scheduled";
    test.updatedAt = new Date();

    this.tests.set(testId, test);

    // Store schedule for easy lookup
    this.testSchedules.set(testId, {
      testId,
      startTime,
      endTime,
      createdAt: new Date(),
    });

    return test;
  }

  /**
   * Publish a test
   * @param {string} testId - Test ID
   * @returns {Object} Updated test
   */
  publishTest(testId) {
    const test = this.getTest(testId);

    if (test.questionIds.length === 0) {
      throw new Error("Cannot publish test without questions");
    }

    if (!test.startTime || !test.endTime) {
      throw new Error("Test must be scheduled before publishing");
    }

    test.isPublished = true;
    test.status = "published";
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Unpublish a test
   * @param {string} testId - Test ID
   * @returns {Object} Updated test
   */
  unpublishTest(testId) {
    const test = this.getTest(testId);

    test.isPublished = false;
    test.status = "draft";
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Update test settings
   * @param {string} testId - Test ID
   * @param {Object} settings - Settings to update
   * @returns {Object} Updated test
   */
  updateTestSettings(testId, settings) {
    const test = this.getTest(testId);

    if (test.isPublished) {
      throw new Error("Cannot modify published test");
    }

    test.customSettings = { ...test.customSettings, ...settings };
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Get a test by ID
   * @param {string} testId - Test ID
   * @returns {Object} Test object
   */
  getTest(testId) {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test with ID ${testId} not found`);
    }
    return test;
  }

  /**
   * Get all tests for a course
   * @param {string} courseId - Course ID
   * @returns {Array} Array of tests
   */
  getTestsByCourse(courseId) {
    return Array.from(this.tests.values()).filter((t) => t.courseId === courseId);
  }

  /**
   * Get all tests created by a teacher
   * @param {string} createdBy - Teacher ID
   * @returns {Array} Array of tests
   */
  getTestsByTeacher(createdBy) {
    return Array.from(this.tests.values()).filter((t) => t.createdBy === createdBy);
  }

  /**
   * Get published tests
   * @returns {Array} Array of published tests
   */
  getPublishedTests() {
    return Array.from(this.tests.values()).filter((t) => t.isPublished);
  }

  /**
   * Get upcoming tests (scheduled but not started)
   * @returns {Array} Array of upcoming tests
   */
  getUpcomingTests() {
    const now = new Date();
    return Array.from(this.tests.values()).filter(
      (t) => t.startTime && t.startTime > now && t.isPublished
    );
  }

  /**
   * Get active tests (currently running)
   * @returns {Array} Array of active tests
   */
  getActiveTests() {
    const now = new Date();
    return Array.from(this.tests.values()).filter(
      (t) =>
        t.startTime &&
        t.endTime &&
        t.startTime <= now &&
        now <= t.endTime &&
        t.isPublished
    );
  }

  /**
   * Get completed tests
   * @returns {Array} Array of completed tests
   */
  getCompletedTests() {
    const now = new Date();
    return Array.from(this.tests.values()).filter(
      (t) => t.endTime && t.endTime < now && t.isPublished
    );
  }

  /**
   * Delete a test
   * @param {string} testId - Test ID
   * @returns {boolean} Success status
   */
  deleteTest(testId) {
    const test = this.getTest(testId);

    if (test.isPublished) {
      throw new Error("Cannot delete published test");
    }

    this.tests.delete(testId);
    this.testSchedules.delete(testId);
    return true;
  }

  /**
   * Get test statistics
   * @param {string} testId - Test ID
   * @returns {Object} Test statistics
   */
  getTestStats(testId) {
    const test = this.getTest(testId);

    return {
      testId,
      name: test.name,
      totalQuestions: test.questionIds.length,
      status: test.status,
      isPublished: test.isPublished,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      scheduledFor: {
        startTime: test.startTime,
        endTime: test.endTime,
      },
    };
  }

  /**
   * Duplicate a test
   * @param {string} testId - Test ID to duplicate
   * @param {string} newName - Name for the new test
   * @returns {Object} New test object
   */
  duplicateTest(testId, newName) {
    const originalTest = this.getTest(testId);

    const newTest = this.createTest({
      templateId: originalTest.templateId,
      name: newName || `${originalTest.name} (Copy)`,
      courseId: originalTest.courseId,
      createdBy: originalTest.createdBy,
      questionIds: [...originalTest.questionIds],
      customSettings: { ...originalTest.customSettings },
    });

    return newTest;
  }

  /**
   * Get all tests
   * @returns {Array} Array of all tests
   */
  getAllTests() {
    return Array.from(this.tests.values());
  }
}

export { TestCreationService };

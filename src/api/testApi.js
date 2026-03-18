import apiClient from './apiClient.js';

/**
 * Create a new test
 * @param {Object} testData - Test data
 * @returns {Promise} Created test
 */
export const createTest = async (testData) => {
  const response = await apiClient.post('/api/tests', testData);
  return response.data;
};

/**
 * Get all tests
 * @returns {Promise} List of tests
 */
export const getAllTests = async () => {
  const response = await apiClient.get('/api/tests');
  return response.data;
};

/**
 * Get test by ID
 * @param {string} testId - Test ID
 * @returns {Promise} Test data
 */
export const getTestById = async (testId) => {
  const response = await apiClient.get(`/api/tests/${testId}`);
  return response.data;
};

/**
 * Update test
 * @param {string} testId - Test ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise} Updated test
 */
export const updateTest = async (testId, updates) => {
  const response = await apiClient.put(`/api/tests/${testId}`, updates);
  return response.data;
};

/**
 * Delete test
 * @param {string} testId - Test ID
 * @returns {Promise} Deletion result
 */
export const deleteTest = async (testId) => {
  const response = await apiClient.delete(`/api/tests/${testId}`);
  return response.data;
};

/**
 * Get tests by course
 * @param {string} courseId - Course ID
 * @returns {Promise} List of tests
 */
export const getTestsByCourse = async (courseId) => {
  const response = await apiClient.get(`/api/tests/course/${courseId}`);
  return response.data;
};

/**
 * Get tests by teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise} List of tests
 */
export const getTestsByTeacher = async (teacherId) => {
  const response = await apiClient.get(`/api/tests/teacher/${teacherId}`);
  return response.data;
};

/**
 * Generate questions for test (uses Factory pattern)
 * @param {string} sourceType - 'AI', 'MANUAL', or 'HYBRID'
 * @param {Object} params - Generation parameters
 * @returns {Promise} Generated questions
 */
export const generateQuestions = async (sourceType, params) => {
  const response = await apiClient.post('/api/tests/generate-questions', {
    sourceType,
    ...params
  });
  return response.data;
};

/**
 * Add questions to test
 * @param {string} testId - Test ID
 * @param {Array} questionIds - Question IDs to add
 * @returns {Promise} Result
 */
export const addQuestionsToTest = async (testId, questionIds) => {
  const response = await apiClient.post(`/api/tests/${testId}/questions`, {
    questionIds
  });
  return response.data;
};

/**
 * Remove questions from test
 * @param {string} testId - Test ID
 * @param {Array} questionIds - Question IDs to remove
 * @returns {Promise} Result
 */
export const removeQuestionsFromTest = async (testId, questionIds) => {
  const response = await apiClient.delete(`/api/tests/${testId}/questions`, {
    data: { questionIds }
  });
  return response.data;
};

/**
 * Schedule test
 * @param {string} testId - Test ID
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise} Updated test
 */
export const scheduleTest = async (testId, scheduleData) => {
  const response = await apiClient.post(`/api/tests/${testId}/schedule`, scheduleData);
  return response.data;
};

/**
 * Publish test
 * @param {string} testId - Test ID
 * @returns {Promise} Updated test
 */
export const publishTest = async (testId) => {
  const response = await apiClient.post(`/api/tests/${testId}/publish`);
  return response.data;
};

/**
 * Unpublish test
 * @param {string} testId - Test ID
 * @returns {Promise} Updated test
 */
export const unpublishTest = async (testId) => {
  const response = await apiClient.post(`/api/tests/${testId}/unpublish`);
  return response.data;
};

/**
 * Get published tests
 * @returns {Promise} List of published tests
 */
export const getPublishedTests = async () => {
  const response = await apiClient.get('/api/tests/published/list');
  return response.data;
};

/**
 * Get upcoming tests
 * @returns {Promise} List of upcoming tests
 */
export const getUpcomingTests = async () => {
  const response = await apiClient.get('/api/tests/upcoming/list');
  return response.data;
};

/**
 * Get active tests
 * @returns {Promise} List of active tests
 */
export const getActiveTests = async () => {
  const response = await apiClient.get('/api/tests/active/list');
  return response.data;
};

/**
 * Get completed tests
 * @returns {Promise} List of completed tests
 */
export const getCompletedTests = async () => {
  const response = await apiClient.get('/api/tests/completed/list');
  return response.data;
};

/**
 * Get test statistics
 * @param {string} testId - Test ID
 * @returns {Promise} Test statistics
 */
export const getTestStats = async (testId) => {
  const response = await apiClient.get(`/api/tests/${testId}/stats`);
  return response.data;
};

/**
 * Duplicate test
 * @param {string} testId - Test ID to duplicate
 * @returns {Promise} Duplicated test
 */
export const duplicateTest = async (testId) => {
  const response = await apiClient.post(`/api/tests/${testId}/duplicate`);
  return response.data;
};

export default {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  getTestsByCourse,
  getTestsByTeacher,
  generateQuestions,
  addQuestionsToTest,
  removeQuestionsFromTest,
  scheduleTest,
  publishTest,
  unpublishTest,
  getPublishedTests,
  getUpcomingTests,
  getActiveTests,
  getCompletedTests,
  getTestStats,
  duplicateTest
};

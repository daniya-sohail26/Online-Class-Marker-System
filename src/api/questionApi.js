import apiClient from './apiClient.js';

/**
 * Save generated questions to database
 * @param {string} courseId - Course ID
 * @param {Array} questions - Array of question objects
 * @param {string} sourceType - 'AI', 'MANUAL', or 'HYBRID'
 * @returns {Promise<Object>} Saved questions with DB IDs
 */
export const saveQuestions = async (courseId, questions, sourceType = 'AI') => {
  try {
    const response = await apiClient.post('/api/questions/save', {
      courseId,
      questions,
      sourceType
    });
    return response.data;
  } catch (error) {
    console.error('Error saving questions:', error);
    throw error;
  }
};

/**
 * Fetch all questions for a specific course
 * @param {string} courseId - Course ID
 * @param {Object} filters - Optional filters { sourceType, difficulty }
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} Questions array and metadata
 */
export const getCourseQuestions = async (
  courseId,
  filters = {},
  limit = 100,
  offset = 0
) => {
  try {
    const params = new URLSearchParams({
      limit,
      offset,
      ...filters
    });

    const response = await apiClient.get(
      `/api/questions/course/${courseId}?${params}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course questions:', error);
    throw error;
  }
};

/**
 * Fetch a single question by ID
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} Question object
 */
export const getQuestion = async (questionId) => {
  try {
    const response = await apiClient.get(`/api/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
};

/**
 * Update a question
 * @param {string} questionId - Question ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated question
 */
export const updateQuestion = async (questionId, updates) => {
  try {
    const response = await apiClient.put(`/api/questions/${questionId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

/**
 * Delete a question
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} Success response
 */
export const deleteQuestion = async (questionId) => {
  try {
    const response = await apiClient.delete(`/api/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

/**
 * Fetch all questions created by a teacher
 * @param {string} teacherId - Teacher ID
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} Questions array and metadata
 */
export const getTeacherQuestions = async (teacherId, limit = 100, offset = 0) => {
  try {
    const params = new URLSearchParams({ limit, offset });
    const response = await apiClient.get(
      `/api/questions/teacher/${teacherId}?${params}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher questions:', error);
    throw error;
  }
};

/**
 * Fetch questions by source type for a course
 * @param {string} courseId - Course ID
 * @param {string} sourceType - 'AI', 'MANUAL', or 'HYBRID'
 * @returns {Promise<Object>} Filtered questions
 */
export const getCourseQuestionsBySource = async (courseId, sourceType) => {
  return getCourseQuestions(courseId, { sourceType });
};

/**
 * Fetch questions by difficulty for a course
 * @param {string} courseId - Course ID
 * @param {string} difficulty - 'Easy', 'Medium', or 'Hard'
 * @returns {Promise<Object>} Filtered questions
 */
export const getCourseQuestionsByDifficulty = async (courseId, difficulty) => {
  return getCourseQuestions(courseId, { difficulty });
};

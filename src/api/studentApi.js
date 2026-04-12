import apiClient from './apiClient.js';

export const getAllStudents = async () => {
  try {
    const response = await apiClient.get('/api/students');
    return response.data;
  } catch (error) {
    console.error('[getAllStudents] error:', error);
    throw error;
  }
};

export const fetchAttemptResults = async (attemptId) => {
  try {
    const response = await apiClient.get(`/api/students/results/${attemptId}`);
    return response.data;
  } catch (error) {
    console.error('[fetchAttemptResults] error:', error);
    throw error;
  }
};

export default { getAllStudents, fetchAttemptResults };
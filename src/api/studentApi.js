import apiClient from './apiClient.js';

/**
 * Fetch all students
 * @returns {Promise<Array>} List of students
 */
export const getAllStudents = async () => {
    try {
        const response = await apiClient.get('/api/students');
        return response.data;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
};

export default {
    getAllStudents
};

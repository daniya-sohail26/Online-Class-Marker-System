import apiClient from './apiClient.js';

/**
 * Fetch all courses
 * @returns {Promise<Array>} List of courses
 */
export const getAllCourses = async () => {
    try {
        const response = await apiClient.get('/api/courses');
        return response.data;
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

export default {
    getAllCourses
};

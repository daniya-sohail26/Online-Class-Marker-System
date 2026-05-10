import apiClient from './apiClient.js';

export const getLabs = async () => {
  const response = await apiClient.get('/api/labs');
  return response.data;
};

export const createLab = async (labData) => {
  const response = await apiClient.post('/api/labs', labData);
  return response.data;
};

export const getTestIpAssignments = async (testId) => {
  const response = await apiClient.get(`/api/labs/test/${testId}/assignments`);
  return response.data;
};

export default { getLabs, createLab, getTestIpAssignments };

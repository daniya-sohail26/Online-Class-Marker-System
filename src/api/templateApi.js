import apiClient from './apiClient.js';

/**
 * Create a new template
 * @param {Object} templateData - Template data
 * @returns {Promise} Created template
 */
export const createTemplate = async (templateData) => {
  const response = await apiClient.post('/api/templates', templateData);
  return response.data;
};

/**
 * Get all templates
 * @returns {Promise} List of templates
 */
export const getAllTemplates = async () => {
  const response = await apiClient.get('/api/templates');
  return response.data;
};

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise} Template data
 */
export const getTemplateById = async (templateId) => {
  const response = await apiClient.get(`/api/templates/${templateId}`);
  return response.data;
};

/**
 * Update template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise} Updated template
 */
export const updateTemplate = async (templateId, updates) => {
  const response = await apiClient.put(`/api/templates/${templateId}`, updates);
  return response.data;
};

/**
 * Delete template
 * @param {string} templateId - Template ID
 * @returns {Promise} Deletion result
 */
export const deleteTemplate = async (templateId) => {
  const response = await apiClient.delete(`/api/templates/${templateId}`);
  return response.data;
};

/**
 * Get templates by type
 * @param {string} type - Template type (quiz, midterm, final, custom)
 * @returns {Promise} List of templates
 */
export const getTemplatesByType = async (type) => {
  const response = await apiClient.get(`/api/templates/type/${type}`);
  return response.data;
};

/**
 * Get active templates
 * @returns {Promise} List of active templates
 */
export const getActiveTemplates = async () => {
  const response = await apiClient.get('/api/templates/active/list');
  return response.data;
};

/**
 * Create quiz preset template (uses Builder pattern)
 * @returns {Promise} Created quiz template
 */
export const createQuizPreset = async () => {
  const response = await apiClient.post('/api/templates/presets/quiz');
  return response.data;
};

/**
 * Create midterm preset template (uses Builder pattern)
 * @returns {Promise} Created midterm template
 */
export const createMidtermPreset = async () => {
  const response = await apiClient.post('/api/templates/presets/midterm');
  return response.data;
};

/**
 * Create final preset template (uses Builder pattern)
 * @returns {Promise} Created final template
 */
export const createFinalPreset = async () => {
  const response = await apiClient.post('/api/templates/presets/final');
  return response.data;
};

export default {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplatesByType,
  getActiveTemplates,
  createQuizPreset,
  createMidtermPreset,
  createFinalPreset
};

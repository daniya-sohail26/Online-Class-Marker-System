/**
 * Validation utilities for forms and data
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTestName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Test name is required' };
  }
  if (name.trim().length < 3) {
    return { isValid: false, error: 'Test name must be at least 3 characters' };
  }
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Test name must not exceed 100 characters' };
  }
  return { isValid: true };
};

export const validateTemplateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Template name is required' };
  }
  if (name.trim().length < 3) {
    return { isValid: false, error: 'Template name must be at least 3 characters' };
  }
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Template name must not exceed 100 characters' };
  }
  return { isValid: true };
};

export const validateDuration = (duration) => {
  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }
  if (durationNum > 480) {
    return { isValid: false, error: 'Duration cannot exceed 8 hours (480 minutes)' };
  }
  return { isValid: true };
};

export const validateMarksPerQuestion = (marks) => {
  if (marks === undefined || marks === null) return { isValid: false, error: 'Marks per question is required' };
  const marksNum = typeof marks === 'number' ? marks : parseFloat(marks);
  if (isNaN(marksNum) || marksNum <= 0) {
    return { isValid: false, error: 'Marks per question must be greater than 0' };
  }
  if (marksNum > 100) {
    return { isValid: false, error: 'Marks per question cannot exceed 100' };
  }
  return { isValid: true };
};

export const validatePassingPercentage = (percentage) => {
  const percentNum = parseInt(percentage);
  if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
    return { isValid: false, error: 'Passing percentage must be between 0 and 100' };
  }
  return { isValid: true };
};

export const validateDateTime = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Both start and end times are required' };
  }
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return { isValid: false, error: 'Start time must be before end time' };
  }

  const now = new Date();
  if (start < now) {
    return { isValid: false, error: 'Start time cannot be in the past' };
  }

  return { isValid: true };
};

export const validateQuestionCount = (count) => {
  const countNum = parseInt(count);
  if (isNaN(countNum) || countNum <= 0) {
    return { isValid: false, error: 'Question count must be greater than 0' };
  }
  if (countNum > 500) {
    return { isValid: false, error: 'Question count cannot exceed 500' };
  }
  return { isValid: true };
};

export const validateNegativeMarking = (value) => {
  const valueNum = parseFloat(value);
  if (isNaN(valueNum) || valueNum < 0) {
    return { isValid: false, error: 'Negative marking cannot be negative' };
  }
  if (valueNum > 100) {
    return { isValid: false, error: 'Negative marking cannot exceed 100' };
  }
  return { isValid: true };
};

export const validateTestData = (testData) => {
  const errors = [];

  // Validate test name
  const nameValidation = validateTestName(testData.name);
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  // Validate course selection
  if (!testData.courseId) {
    errors.push('Course selection is required');
  }

  // Validate template selection
  if (!testData.templateId) {
    errors.push('Template selection is required');
  }

  // Validate questions
  if (!testData.questions || testData.questions.length === 0) {
    errors.push('At least one question is required');
  }

  // Validate date/time
  const dateValidation = validateDateTime(testData.startTime, testData.endTime);
  if (!dateValidation.isValid) errors.push(dateValidation.error);

  // Validate students
  if (!testData.studentIds || testData.studentIds.length === 0) {
    errors.push('At least one student must be assigned');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTemplateData = (templateData) => {
  const errors = [];

  // Validate template name
  const nameValidation = validateTemplateName(templateData.templateName);
  if (!nameValidation.isValid) errors.push(nameValidation.error);

  // Validate duration
  const durationValidation = validateDuration(templateData.duration);
  if (!durationValidation.isValid) errors.push(durationValidation.error);

  // Validate passing percentage
  const passingValidation = validatePassingPercentage(templateData.passingPercentage);
  if (!passingValidation.isValid) errors.push(passingValidation.error);

  // Validate marks per question
  const marksValidation = validateMarksPerQuestion(templateData.marksPerQuestion);
  if (!marksValidation.isValid) errors.push(marksValidation.error);

  // Validate sections if enabled
  if (templateData.hasSections && templateData.sections) {
    if (templateData.sections.length === 0) {
      errors.push('At least one section is required');
    }
    templateData.sections.forEach((section, index) => {
      if (!section.name || section.name.trim().length === 0) {
        errors.push(`Section ${index + 1}: Name is required`);
      }
      if (!section.count || parseInt(section.count) <= 0) {
        errors.push(`Section ${index + 1}: Question count must be greater than 0`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  validateEmail,
  validateTestName,
  validateTemplateName,
  validateDuration,
  validateMarksPerQuestion,
  validatePassingPercentage,
  validateDateTime,
  validateQuestionCount,
  validateNegativeMarking,
  validateTestData,
  validateTemplateData
};

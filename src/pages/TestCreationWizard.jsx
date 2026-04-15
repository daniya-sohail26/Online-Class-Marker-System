import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2, Eye, Filter, Save } from 'lucide-react';
import { getCourseQuestions } from '../api/questionApi.js';
import { createTest, deleteTest, getTestById, updateTest } from '../api/testApi.js';
import { getAllCourses } from '../api/courseApi.js';
import { getActiveTemplates } from '../api/templateApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const PK_TIMEZONE = 'Asia/Karachi';

function toUtcInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function utcInputToIso(inputValue) {
  if (!inputValue) return '';
  const d = new Date(`${inputValue}:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function formatUtcDisplay(inputValue) {
  if (!inputValue) return '';
  const d = new Date(`${inputValue}:00Z`);
  if (Number.isNaN(d.getTime())) return inputValue;
  return d.toLocaleString('en-GB', { timeZone: 'UTC', hour12: false }) + ' UTC';
}

function formatPktFromUtcInput(inputValue) {
  if (!inputValue) return '';
  const d = new Date(`${inputValue}:00Z`);
  if (Number.isNaN(d.getTime())) return inputValue;
  return d.toLocaleString('en-PK', { timeZone: PK_TIMEZONE, hour12: false });
}

function addMinutesToUtcInput(inputValue, minutes) {
  if (!inputValue) return '';
  const parsed = new Date(`${inputValue}:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const duration = Math.max(Number(minutes ?? 0), 0);
  const next = new Date(parsed.getTime() + duration * 60 * 1000);

  return toUtcInputValue(next.toISOString());
}

export default function TestCreationWizard() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isEditing = !!testId;
  const prefill = location.state?.prefill || null;
  // Track if we're editing a draft (unpublished test) vs. published test
  const [isDraftBeingPublished, setIsDraftBeingPublished] = useState(false);
  const [skipQuestionStep, setSkipQuestionStep] = useState(false);
  // --- STEPPER STATE ---
  const [activeStep, setActiveStep] = useState(0);
  const steps = skipQuestionStep
    ? ['Basic Info', 'Schedule', isEditing ? 'Review & Update' : 'Review & Publish']
    : ['Basic Info', 'Select Questions', 'Schedule', isEditing ? 'Review & Update' : 'Review & Publish'];

  // --- FORM STATE ---
  const [testName, setTestName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isCourseLocked, setIsCourseLocked] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // --- QUESTIONS STATE ---
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionFilters, setQuestionFilters] = useState({
    sourceType: '', // 'AI', 'MANUAL', 'HYBRID', or ''
    difficulty: '', // 'Easy', 'Medium', 'Hard', or ''
  });

  // --- SCHEDULE STATE ---
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(60); // minutes

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewQuestion, setPreviewQuestion] = useState(null);

  const selectedTemplateObject = templates.find(template => template.id === selectedTemplate);
  const templateQuestionLimit = Number(selectedTemplateObject?.total_questions || 0);
  const templateDurationMinutes = Math.max(
    Number(selectedTemplateObject?.duration ?? selectedTemplateObject?.duration_minutes ?? duration ?? 60),
    1,
  );

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingCourses(true);
      setLoadingTemplates(true);
      try {
        const [coursesData, templatesData] = await Promise.all([
          getAllCourses(),
          getActiveTemplates()
        ]);
        setCourses(coursesData);
        setTemplates(templatesData);

        if (isEditing) {
          setLoading(true);
          const testData = await getTestById(testId);
          console.log("Loaded test data for edit:", testData);
          setTestName(testData.name || '');
          setSelectedCourse(testData.courseId || '');
          setSelectedTemplate(testData.templateId || '');
          setSelectedQuestions(testData.questionIds || []);
          console.log("Set selectedQuestions to:", testData.questionIds);

          // Track if this is a draft being published (unpublished test)
          setIsDraftBeingPublished(testData.is_published === false);

          if (testData.startTime || testData.start_time) {
            setStartTime(toUtcInputValue(testData.startTime || testData.start_time));
          }
          if (testData.endTime || testData.end_time) {
            setEndTime(toUtcInputValue(testData.endTime || testData.end_time));
          }

          if (testData.is_published === false && Array.isArray(testData.questionIds) && testData.questionIds.length > 0) {
            setSkipQuestionStep(true);
            setActiveStep(0);
          }
        } else {
          const mappedCourseId = profile?.course_id || '';
          const prefillCourseId = prefill?.courseId || '';
          const resolvedCourseId = prefillCourseId || mappedCourseId;

          if (resolvedCourseId && coursesData.some((c) => String(c.id) === String(resolvedCourseId))) {
            setSelectedCourse(resolvedCourseId);
            setIsCourseLocked(true);
          }

          if (prefill?.name) setTestName(prefill.name);
          if (prefill?.templateId) setSelectedTemplate(prefill.templateId);
          if (Array.isArray(prefill?.questionIds) && prefill.questionIds.length > 0) {
            setSelectedQuestions(prefill.questionIds);
            if (prefill?.source === 'question-bank') {
              setSkipQuestionStep(true);
            }
          }
          if (prefill?.startTime) setStartTime(toUtcInputValue(prefill.startTime));
          if (prefill?.endTime) setEndTime(toUtcInputValue(prefill.endTime));
          if (prefill?.duration) setDuration(prefill.duration);
        }
      } catch (err) {
        setError('Failed to load initial data');
        console.error(err);
      } finally {
        setLoadingCourses(false);
        setLoadingTemplates(false);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [testId, isEditing, prefill, profile?.course_id]);

  // --- FETCH QUESTIONS WHEN COURSE CHANGES ---
  useEffect(() => {
    if (!selectedCourse) {
      setAvailableQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setError('');
      try {
        const response = await getCourseQuestions(selectedCourse, questionFilters);
        setAvailableQuestions(response.questions || []);
      } catch (err) {
        setError(`Failed to load questions: ${err.message}`);
        console.error(err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedCourse, questionFilters]);

  useEffect(() => {
    if (!selectedTemplateObject) return;
    setDuration(templateDurationMinutes);
  }, [selectedTemplateObject?.id, templateDurationMinutes]);

  useEffect(() => {
    if (!startTime) {
      setEndTime('');
      return;
    }

    const computedEnd = addMinutesToUtcInput(startTime, templateDurationMinutes);
    if (computedEnd) {
      setEndTime(computedEnd);
    }
  }, [startTime, templateDurationMinutes]);

  // --- HANDLERS ---
  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      const isAlreadySelected = prev.some(id => String(id) === String(questionId));
      if (isAlreadySelected) {
        return prev.filter(id => String(id) !== String(questionId));
      }

      if (templateQuestionLimit > 0 && prev.length >= templateQuestionLimit) {
        setError(`Template allows only ${templateQuestionLimit} questions.`);
        return prev;
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAllQuestions = () => {
    const allAvailableIds = availableQuestions.map(q => q.id);
    const areAllSelected = allAvailableIds.every(id =>
      selectedQuestions.some(sqId => String(sqId) === String(id))
    );

    if (areAllSelected) {
      // Unselect only those from the current available list
      setSelectedQuestions(prev =>
        prev.filter(sqId => !allAvailableIds.some(id => String(id) === String(sqId)))
      );
    } else {
      // Select all in current list (avoid duplicates)
      setSelectedQuestions(prev => {
        const newSelections = [...prev];
        allAvailableIds.forEach(id => {
          if (!newSelections.some(sqId => String(sqId) === String(id))) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(prev => prev.filter(id => String(id) !== String(questionId)));
  };

  const handleNext = () => {
    setError('');

    if (activeStep === 0) {
      // Basic Info validation
      if (!testName || !selectedCourse || !selectedTemplate) {
        setError('Please fill in Name, Course, and Template');
        return;
      }
    } else if (skipQuestionStep) {
      // When skipping questions: step 1 = Schedule
      if (activeStep === 1) {
        if (!startTime || !endTime) {
          setError('Please set start and end times');
          return;
        }
      }
    } else {
      // Normal flow: step 1 = Questions, step 2 = Schedule
      if (activeStep === 1) {
        // Select Questions validation
        if (selectedQuestions.length === 0) {
          setError('Please select at least one question');
          return;
        }
        if (templateQuestionLimit > 0 && selectedQuestions.length > templateQuestionLimit) {
          setError(`Template allows only ${templateQuestionLimit} questions.`);
          return;
        }
      } else if (activeStep === 2) {
        // Schedule validation
        if (!startTime || !endTime) {
          setError('Please set start and end times');
          return;
        }
      }
    }

    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      if (!testName || !selectedCourse || !selectedTemplate) {
        setError('Please fill in Name, Course, and Template');
        return;
      }

      if (selectedQuestions.length === 0) {
        setError('Please select at least one question');
        return;
      }

      if (templateQuestionLimit > 0 && selectedQuestions.length > templateQuestionLimit) {
        setError(`Template allows only ${templateQuestionLimit} questions.`);
        return;
      }

      if (!startTime || !endTime) {
        setError('Please set start and end times');
        return;
      }

      const payload = {
        name: testName,
        courseId: selectedCourse,
        templateId: selectedTemplate,
        questionIds: selectedQuestions,
        startTime: utcInputToIso(startTime),
        endTime: utcInputToIso(endTime),
        isPublished: true,
      };

      // Only update if editing a published test (not a draft)
      // Drafts should create a NEW separate test entry
      if (isEditing && !isDraftBeingPublished) {
        await updateTest(testId, payload);
        setSuccess('Test updated successfully');
      } else {
        // Always create a new test (whether it's new or publishing a draft)
        await createTest(payload);
        setSuccess('Test created successfully');
      }

      // If this is a draft being published, remove the old draft row so it cannot reappear.
      if (isEditing && isDraftBeingPublished) {
        try {
          await deleteTest(testId);
        } catch (err) {
          console.log('Note: Could not delete old draft, but new scheduled test was created');
        }
      }
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 1200);
    } catch (err) {
      console.error('Failed to save test:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Basic Test Information
      </Typography>

      <TextField
        fullWidth
        label="Test Name"
        value={testName}
        onChange={e => setTestName(e.target.value)}
        placeholder="e.g., React Fundamentals Quiz"
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Select Course</InputLabel>
        <Select
          value={selectedCourse}
          label="Select Course"
          onChange={e => setSelectedCourse(e.target.value)}
          disabled={isCourseLocked}
          sx={{ color: "#fff" }}
        >
          {courses.map(course => (
            <MenuItem key={course.id} value={course.id}>
              {course.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Select Template</InputLabel>
        <Select
          value={selectedTemplate}
          label="Select Template"
          onChange={e => setSelectedTemplate(e.target.value)}
          sx={{ color: "#fff" }}
        >
          {templates.map(template => (
            <MenuItem key={template.id} value={template.id}>
              {template.name} ({template.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedCourse && (
        <Alert
          severity="info"
          sx={{
            bgcolor: "rgba(6, 182, 212, 0.05)",
            color: "#06B6D4",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            borderRadius: "12px"
          }}
        >
          Questions will be filtered to show only those from{' '}
          <strong>{courses.find(c => c.id === selectedCourse)?.name}</strong>
        </Alert>
      )}
      {isCourseLocked && (
        <Alert
          severity="info"
          sx={{
            mt: 2,
            bgcolor: "rgba(0, 221, 179, 0.05)",
            color: "#00DDB3",
            border: "1px solid rgba(0, 221, 179, 0.2)",
            borderRadius: "12px"
          }}
        >
          Course is locked to your mapped teacher course for consistent test-course assignment.
        </Alert>
      )}
    </Box>
  );

  const renderSelectQuestions = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Select Questions for Test
      </Typography>

            {/* Questions continuing... */}
      {/* Filters */}
      <Box sx={{
        p: 3,
        mb: 4,
        bgcolor: "rgba(255, 255, 255, 0.03)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(10px)"
      }}>
        <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.5)", mb: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.75rem" }}>
          Refine Question Bank
        </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="filled" sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}>
                    <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Source Type</InputLabel>
                    <Select
                      value={questionFilters.sourceType}
                      label="Source Type"
                      disableUnderline
                      sx={{ color: "#fff", fontWeight: 600 }}
                      onChange={e =>
                        setQuestionFilters(prev => ({
                          ...prev,
                          sourceType: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="">All Sources</MenuItem>
                      <MenuItem value="AI">AI Generated</MenuItem>
                      <MenuItem value="MANUAL">Manual</MenuItem>
                      <MenuItem value="HYBRID">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="filled" sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}>
                    <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Difficulty</InputLabel>
                    <Select
                      value={questionFilters.difficulty}
                      label="Difficulty"
                      disableUnderline
                      sx={{ color: "#fff", fontWeight: 600 }}
                      onChange={e =>
                        setQuestionFilters(prev => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="">All Difficulties</MenuItem>
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Select All Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={availableQuestions.length > 0 && availableQuestions.every(q => selectedQuestions.some(sqId => String(sqId) === String(q.id)))}
                  onChange={handleSelectAllQuestions}
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    '&.Mui-checked': { color: "#00DDB3" },
                    '&.MuiCheckbox-indeterminate': { color: "#00DDB3" }
                  }}
                />
              }
              label={
                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  Select All Questions ({availableQuestions.length} available)
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {/* Questions List */}
            {loadingQuestions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : availableQuestions.length === 0 ? (
              <Alert
                severity="warning"
                sx={{
                  bgcolor: "rgba(255, 152, 0, 0.05)",
                  color: "#ff9800",
                  border: "1px solid rgba(255, 152, 0, 0.2)",
                  borderRadius: "12px",
                  "& .MuiAlert-icon": { color: "#ff9800" }
                }}
              >
                No questions found with the current filters. Try changing filters or adding questions to this course.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {availableQuestions.map(question => {
                  const isSelected = selectedQuestions.some(sqId => String(sqId) === String(question.id));
                  const selectionLocked = !isSelected && templateQuestionLimit > 0 && selectedQuestions.length >= templateQuestionLimit;
                  return (
                    <Card
                      key={question.id}
                      onClick={() => handleSelectQuestion(question.id)}
                      sx={{
                        p: 3,
                        cursor: selectionLocked ? 'not-allowed' : 'pointer',
                        border: isSelected
                          ? '2px solid #00DDB3'
                          : '1px solid rgba(255,255,255,0.05)',
                        bgcolor: isSelected
                          ? 'rgba(0, 221, 179, 0.05)'
                          : selectionLocked
                            ? 'rgba(255,255,255,0.01)'
                            : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: "16px",
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: "rgba(255,255,255,0.04)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={isSelected}
                          disabled={selectionLocked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleSelectQuestion(question.id)}
                          sx={{
                            color: "rgba(255,255,255,0.3)",
                            '&.Mui-checked': { color: "#00DDB3" }
                          }}
                        />

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ mb: 2, color: "#fff", fontWeight: 500 }}>
                            {question.question_text}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1)}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.7)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                textTransform: "uppercase"
                              }}
                            />
                            <Chip
                              label={question.source_type}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.7)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                fontWeight: 700,
                                fontSize: "0.7rem"
                              }}
                            />
                          </Box>
                        </Box>

                        <Button
                          size="small"
                          startIcon={<Eye size={16} />}
                          disabled={selectionLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewQuestion(question);
                          }}
                          sx={{
                            color: "#00DDB3",
                            textTransform: "none",
                            fontWeight: 700,
                            '&:hover': { bgcolor: "rgba(0, 221, 179, 0.1)" }
                          }}
                        >
                          Preview
                        </Button>
                      </Box>
                    </Card>
                  )
                })}
              </Box>
            )}

            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Selected: {selectedQuestions.length} questions{templateQuestionLimit > 0 ? ` / ${templateQuestionLimit} allowed by template` : ''}
            </Typography>
          </Box>
  );

  const renderSchedule = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Schedule Test
      </Typography>

      <TextField
        fullWidth
        label="Start Date & Time (UTC)"
        type="datetime-local"
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="End Date & Time (UTC, auto)"
        type="datetime-local"
        value={endTime}
        onChange={() => {}}
        disabled
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Duration (minutes, from template)"
        type="number"
        value={duration}
        onChange={() => {}}
        disabled
        sx={{ mb: 2 }}
      />

      <Alert severity="info">
        End time is auto-calculated from template duration in UTC: {formatUtcDisplay(startTime) || 'start time'} to{' '}
        {formatUtcDisplay(endTime) || 'end time'}.
        {' '}Pakistan view: {formatPktFromUtcInput(startTime) || 'start time'} to {formatPktFromUtcInput(endTime) || 'end time'} ({PK_TIMEZONE})
      </Alert>
    </Box>
  );

  const renderReview = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Review & Publish
      </Typography>

      <Box sx={{
        p: 4,
        bgcolor: "rgba(0,0,0,0.3)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.05)",
        mb: 4
      }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "1px" }}>TEST NAME</Typography>
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>{testName}</Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "1px" }}>COURSE</Typography>
              <Typography variant="body1" sx={{ color: "#06B6D4", fontWeight: 700 }}>{courses.find(c => c.id === selectedCourse)?.name}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "1px" }}>TEMPLATE</Typography>
              <Typography variant="body1" sx={{ color: "#00DDB3", fontWeight: 700 }}>{templates.find(t => t.id === selectedTemplate)?.name || 'None Selected'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "1px" }}>QUESTIONS</Typography>
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>{selectedQuestions.length} questions selected</Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "1px" }}>SCHEDULE</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {formatUtcDisplay(startTime)} to {formatUtcDisplay(endTime)}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", mt: 0.5 }}>
                Pakistan view: {formatPktFromUtcInput(startTime)} to {formatPktFromUtcInput(endTime)} ({PK_TIMEZONE})
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Alert
        severity="success"
        icon={<Plus size={20} />}
        sx={{
          bgcolor: "rgba(0, 221, 179, 0.05)",
          color: "#00DDB3",
          border: "1px solid rgba(0, 221, 179, 0.2)",
          borderRadius: "16px",
          "& .MuiAlert-icon": { color: "#00DDB3" }
        }}
      >
        Ready to publish! Click "Publish Test" to make it available to students.
      </Alert>
    </Box>
  );

  const renderStepContent = () => {
    if (skipQuestionStep) {
      // When skipping questions: Basic Info → Schedule → Review
      if (activeStep === 0) return renderBasicInfo();
      if (activeStep === 1) return renderSchedule();
      if (activeStep === 2) return renderReview();
    } else {
      // Normal flow: Basic Info → Select Questions → Schedule → Review
      if (activeStep === 0) return renderBasicInfo();
      if (activeStep === 1) return renderSelectQuestions();
      if (activeStep === 2) return renderSchedule();
      if (activeStep === 3) return renderReview();
    }
    return null;
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{
          p: 5,
          bgcolor: "rgba(22, 31, 61, 0.6)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          borderRadius: "32px",
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <Typography variant="h3" sx={{ mb: 4, fontWeight: 800, textAlign: "center", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {isDraftBeingPublished ? 'Publish Draft Test' : isEditing ? 'Edit Published Test' : 'Create New Test'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Stepper activeStep={activeStep} sx={{
            mb: 5,
            "& .MuiStepLabel-label": { color: "rgba(255,255,255,0.3)", fontWeight: 600 },
            "& .MuiStepLabel-label.Mui-active": { color: "#00DDB3" },
            "& .MuiStepLabel-label.Mui-completed": { color: "rgba(255,255,255,0.7)" },
            "& .MuiStepIcon-root": { color: "rgba(255,255,255,0.1)" },
            "& .MuiStepIcon-root.Mui-active": { color: "#00DDB3" },
            "& .MuiStepIcon-root.Mui-completed": { color: "#00DDB3" }
          }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back

            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handlePublish}
                disabled={loading}
                sx={{
                  background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
                  color: "#000",
                  fontWeight: 800,
                  borderRadius: "12px",
                  px: 4,
                  textTransform: "none",
                  '&:hover': { transform: "scale(1.02)", boxShadow: "0 0 20px rgba(0, 221, 179, 0.4)" }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Publish Test'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
                  color: "#000",
                  fontWeight: 800,
                  borderRadius: "12px",
                  px: 4,
                  textTransform: "none",
                  '&:hover': { transform: "scale(1.02)", boxShadow: "0 0 20px rgba(0, 221, 179, 0.4)" }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Card>
      </motion.div>

      {/* Question Preview Dialog */}
      <Dialog
        open={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#161F3D", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          Question Preview
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#161F3D", color: "#fff", p: 4 }}>
          {previewQuestion && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {previewQuestion.question_text}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Options:</Typography>
                {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, idx) => (
                  <Typography
                    key={opt}
                    sx={{
                      p: 1,
                      bgcolor: previewQuestion.correct_option === ['A', 'B', 'C', 'D'][idx]
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'transparent',
                      borderRadius: 1,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}) {previewQuestion[opt]}
                  </Typography>
                ))}
              </Box>

              <Typography variant="subtitle2">Explanation:</Typography>
              <Typography variant="body2">{previewQuestion.explanation}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#161F3D", p: 3, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Button
            onClick={() => setPreviewQuestion(null)}
            sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

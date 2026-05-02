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
import { createTest, getTestById, updateTest } from '../api/testApi.js';
import { getAllCourses } from '../api/courseApi.js';
import { getActiveTemplates } from '../api/templateApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toPKTDisplay, toPKTInputValue, pktInputToUTC } from '../utils/pktTime.js';

export default function TestCreationWizard() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isEditing = !!testId;
  const prefill = location.state?.prefill || null;
  // --- STEPPER STATE ---
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Info', 'Schedule', isEditing ? 'Review & Update' : 'Review & Publish'];

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

          if (testData.startTime || testData.start_time) {
            setStartTime(toPKTInputValue(testData.startTime || testData.start_time));
          }
          if (testData.endTime || testData.end_time) {
            setEndTime(toPKTInputValue(testData.endTime || testData.end_time));
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
          }
          if (prefill?.startTime) setStartTime(prefill.startTime);
          if (prefill?.endTime) setEndTime(prefill.endTime);
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

  // --- AUTO-SELECT ALL QUESTIONS WHEN COURSE CHANGES ---
  useEffect(() => {
    if (!selectedCourse) {
      setAvailableQuestions([]);
      setSelectedQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setError('');
      try {
        const response = await getCourseQuestions(selectedCourse, questionFilters);
        const qs = response.questions || [];
        setAvailableQuestions(qs);
        // Auto-select all questions (skip if editing and already has selections)
        if (!isEditing || selectedQuestions.length === 0) {
          setSelectedQuestions(qs.map(q => q.id));
        }
      } catch (err) {
        setError(`Failed to load questions: ${err.message}`);
        console.error(err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedCourse, questionFilters]);

  // --- AUTO-COMPUTE END TIME FROM START + DURATION ---
  useEffect(() => {
    if (!startTime) return;
    // Get duration from selected template, fallback to manual duration state
    const tmpl = templates.find(t => t.id === selectedTemplate);
    const mins = tmpl?.duration || tmpl?.duration_minutes || duration || 60;
    // startTime is a datetime-local string like "2026-05-02T11:15"
    const [datePart, timePart] = startTime.split('T');
    if (!datePart || !timePart) return;
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min] = timePart.split(':').map(Number);
    // Add duration in minutes
    const startMs = Date.UTC(y, m - 1, d, h, min);
    const endMs = startMs + mins * 60 * 1000;
    const endDate = new Date(endMs);
    const ey = endDate.getUTCFullYear();
    const em = String(endDate.getUTCMonth() + 1).padStart(2, '0');
    const ed = String(endDate.getUTCDate()).padStart(2, '0');
    const eh = String(endDate.getUTCHours()).padStart(2, '0');
    const emin = String(endDate.getUTCMinutes()).padStart(2, '0');
    setEndTime(`${ey}-${em}-${ed}T${eh}:${emin}`);
  }, [startTime, selectedTemplate, templates, duration]);

  // --- HANDLERS ---
  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      const isAlreadySelected = prev.some(id => String(id) === String(questionId));
      if (isAlreadySelected) {
        return prev.filter(id => String(id) !== String(questionId));
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
    // Validate current step
    if (activeStep === 0) {
      if (!testName || !selectedCourse || !selectedTemplate) {
        setError('Please fill in Name, Course, and Template');
        return;
      }
      if (selectedQuestions.length === 0) {
        setError('No questions available for this course. Please add questions first.');
        return;
      }
    } else if (activeStep === 1) {
      if (!startTime || !endTime) {
        setError('Please set the start time');
        return;
      }
    }

    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const testData = {
        name: testName,
        courseId: selectedCourse,
        templateId: selectedTemplate,
        questionIds: selectedQuestions,
        startTime: pktInputToUTC(startTime),
        endTime: pktInputToUTC(endTime),
        isPublished: true,
      };

      if (isEditing) {
        await updateTest(testId, testData);
        setSuccess('Test updated successfully!');
      } else {
        await createTest(testData);
        setSuccess('Test created and published successfully!');
      }

      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 2000);
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} test: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEP CONTENT ---
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
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

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Schedule Test
            </Typography>

            <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
              {selectedQuestions.length} questions auto-selected from course question bank
            </Alert>

            <TextField
              fullWidth
              label="Start Date & Time (Pakistan Standard Time)"
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Enter time in PKT (UTC+5). Stored as UTC."
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="End Date & Time (auto-calculated from duration)"
              type="datetime-local"
              value={endTime}
              InputLabelProps={{ shrink: true }}
              helperText={`Auto-filled: start time + ${(() => { const tmpl = templates.find(t => t.id === selectedTemplate); return tmpl?.duration || tmpl?.duration_minutes || duration || 60; })()} min duration from template`}
              disabled
              sx={{ mb: 3, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(255,255,255,0.5)' } }}
            />

            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              Test will be available from {startTime ? toPKTDisplay(pktInputToUTC(startTime)) : 'start time'} to{' '}
              {endTime ? toPKTDisplay(pktInputToUTC(endTime)) : 'end time'}
            </Alert>
          </Box>
        );

      case 2:
        return (
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
                      {startTime ? toPKTDisplay(pktInputToUTC(startTime)) : '—'} to {endTime ? toPKTDisplay(pktInputToUTC(endTime)) : '—'}
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

      default:
        return null;
    }
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
            {isEditing ? 'Edit Existing Test' : 'Create New Test'}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Publish Test' : '')}
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

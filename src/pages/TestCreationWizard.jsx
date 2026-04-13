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
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Filter, Save } from 'lucide-react';
import { getCourseQuestions } from '../api/questionApi.js';
import { createTest, getTestById, updateTest } from '../api/testApi.js';
import { getAllCourses } from '../api/courseApi.js';
import { getActiveTemplates } from '../api/templateApi.js';

export default function TestCreationWizard() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!testId;
  // --- STEPPER STATE ---
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Info', 'Select Questions', 'Schedule', isEditing ? 'Review & Update' : 'Review & Publish'];

  // --- FORM STATE ---
  const [testName, setTestName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
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
            const date = new Date(testData.startTime || testData.start_time);
            setStartTime(date.toISOString().slice(0, 16));
          }
          if (testData.endTime || testData.end_time) {
            const date = new Date(testData.endTime || testData.end_time);
            setEndTime(date.toISOString().slice(0, 16));
          }
        } else if (coursesData.length > 0) {
          // Only auto-select first course if NOT editing
          // setSelectedCourse(coursesData[0].id); 
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
  }, [testId, isEditing]);

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
    } else if (activeStep === 1) {
      if (selectedQuestions.length === 0) {
        setError('Please select at least one question');
        return;
      }
    } else if (activeStep === 2) {
      if (!startTime || !endTime) {
        setError('Please set start and end times');
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
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
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
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select Questions for Test
            </Typography>

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
                  return (
                    <Card
                      key={question.id}
                      onClick={() => handleSelectQuestion(question.id)}
                      sx={{
                        p: 3,
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid #00DDB3'
                          : '1px solid rgba(255,255,255,0.05)',
                        bgcolor: isSelected
                          ? 'rgba(0, 221, 179, 0.05)'
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
              Selected: {selectedQuestions.length} questions
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Schedule Test
            </Typography>

            <TextField
              fullWidth
              label="Start Date & Time"
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="End Date & Time"
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
              sx={{ mb: 2 }}
            />

            <Alert severity="info">
              Test will be available from {startTime || 'start time'} to{' '}
              {endTime || 'end time'}
            </Alert>
          </Box>
        );

      case 3:
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
                      {new Date(startTime).toLocaleString()} to {new Date(endTime).toLocaleString()}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Update Test' : 'Publish Test')}
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

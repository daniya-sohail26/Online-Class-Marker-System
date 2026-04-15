import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  ArrowBack as ArrowBackIcon,
  Group as PeopleIcon,
  ListAlt as QuestionsIcon,
  Quiz as TestsIcon,
} from "@mui/icons-material";
import StatCard from "../components/StatCard";
import { getCourseQuestions } from "../api/questionApi";
import {
  getAllTests,
  getTestsByTeacher,
  publishTest,
  unpublishTest,
  createTest
} from "../api/testApi";
import {
  getAllTemplates,
  getActiveTemplates,
  createTemplate
} from "../api/templateApi";
import { getAllCourses } from "../api/courseApi";
import { getAllStudents } from "../api/studentApi";
import { useAuth } from "../contexts/AuthContext";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [formData, setFormData] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeCard, setActiveCard] = useState("courses");
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [courseQuestions, setCourseQuestions] = useState([]);
  const [courseDrillDownLoading, setCourseDrillDownLoading] = useState(false);

  const normalizeCourseId = (value) => (value == null ? "" : String(value));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignedCourseId = normalizeCourseId(profile?.course_id);
        if (!assignedCourseId) {
          setCourses([]);
          setTests([]);
          setTemplates([]);
          setStudents([]);
          setSelectedCourse("");
          setSelectedCourseForDetails(null);
          setError("No assigned course found for your teacher profile.");
          return;
        }

        // Get all data from database
        const [testsData, templatesData, coursesData, studentsData] = await Promise.all([
          getAllTests(),
          getAllTemplates(),
          getAllCourses(),
          getAllStudents()
        ]);

        const scopedCourses = (coursesData || []).filter(
          (course) => normalizeCourseId(course.id) === assignedCourseId
        );
        const scopedPublishedTests = (testsData || [])
          .filter((test) => normalizeCourseId(test.courseId || test.course_id) === assignedCourseId)
          .filter((test) => {
            const status = String(test.status || "").toLowerCase();
            const isPublished =
              test.is_published === true ||
              test.isPublished === true ||
              status === "published" ||
              status === "scheduled";
            return isPublished;
          });

        // Keep only one row per test title to avoid draft/publish duplicates in UI.
        const byName = new Map();
        scopedPublishedTests.forEach((test) => {
          const key = String(test.name || test.title || test.id).trim().toLowerCase();
          const existing = byName.get(key);
          if (!existing) {
            byName.set(key, test);
            return;
          }

          const testTs = new Date(test.updated_at || test.created_at || 0).getTime();
          const existingTs = new Date(existing.updated_at || existing.created_at || 0).getTime();
          if (testTs >= existingTs) {
            byName.set(key, test);
          }
        });

        const scopedTests = Array.from(byName.values());
        const scopedTemplates = (templatesData || []).filter(
          (template) => normalizeCourseId(template.courseId || template.course_id) === assignedCourseId
        );
        const scopedStudents = (studentsData || []).filter(
          (student) => normalizeCourseId(student.courseId || student.course_id) === assignedCourseId
        );

        setTests(scopedTests);
        setTemplates(scopedTemplates);
        setCourses(scopedCourses);
        setStudents(scopedStudents);
        setSelectedCourse(assignedCourseId);
        setSelectedCourseForDetails(null);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.course_id]);

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({});
    setError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTest = async () => {
    if (!formData.name || !formData.name.trim()) {
      setError("Test name is required");
      return;
    }
    if (!selectedCourse) {
      setError("Please select a course");
      return;
    }

    try {
      await createTest({ name: formData.name, courseId: selectedCourse });

      // Refresh data
      const testsData = await getAllTests();
      setTests(testsData);

      setSuccess("Test created successfully!");
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const errorMessage = error.message || error.error || "Failed to create test";
      setError(errorMessage);
      console.error('Create test error:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.name.trim()) {
      setError("Template name is required");
      return;
    }
    if (!formData.type) {
      setError("Template type is required");
      return;
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      setError("Duration must be greater than 0");
      return;
    }

    try {
      await createTemplate({
        name: formData.name,
        type: formData.type,
        totalQuestions: parseInt(formData.totalQuestions) || 0,
        duration: parseInt(formData.duration) || 0
      });

      // Refresh data
      const templatesData = await getAllTemplates();
      setTemplates(templatesData);

      setSuccess("Template created successfully!");
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const errorMessage = error.message || error.error || "Failed to create template";
      setError(errorMessage);
      console.error('Create template error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "success";
      case "scheduled":
        return "warning";
      case "completed":
        return "default";
      case "draft":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "scheduled":
        return <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "completed":
        return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return <ClockIcon sx={{ fontSize: 16, mr: 0.5 }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        gap: 3
      }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          Synchronizing Dashboard...
        </Typography>
      </Box>
    );
  }

  const tabs = [
    { id: "courses", label: "Courses", count: courses.length },
    { id: "tests", label: "Tests", count: tests.length },
    { id: "templates", label: "Templates", count: templates.length },
    { id: "students", label: "Students", count: students.length },
  ];

  return (
    <Box sx={{
      animation: "fadeIn 0.8s ease-out",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      {/* Header & Quick Stats */}
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", lg: "flex-end" },
        mb: 8,
        gap: 4
      }}>
        <Box>
          <Typography variant="h2" sx={{
            fontWeight: 900,
            mb: 1,
            color: "#fff"
          }}>
            Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
            Welcome back <span style={{ color: "#00DDB3", fontWeight: 700 }}></span>
          </Typography>
        </Box>

        <Box sx={{
          display: "flex",
          gap: 2,
          bgcolor: "rgba(255,255,255,0.03)",
          p: 1.5,
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)"
        }}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveCard(tab.id)}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: "18px",
                color: activeCard === tab.id ? "#fff" : "rgba(255,255,255,0.4)",
                bgcolor: activeCard === tab.id ? "rgba(0, 221, 179, 0.15)" : "transparent",
                border: activeCard === tab.id ? "1px solid rgba(0, 221, 179, 0.3)" : "1px solid transparent",
                fontWeight: 700,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: activeCard === tab.id ? "rgba(0, 221, 179, 0.2)" : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {tab.label}
              <Box component="span" sx={{
                ml: 1.5,
                px: 1,
                py: 0.2,
                borderRadius: "8px",
                bgcolor: activeCard === tab.id ? "rgba(0,221,179,0.3)" : "rgba(255,255,255,0.1)",
                fontSize: "10px"
              }}>
                {tab.count}
              </Box>
            </Button>
          ))}
        </Box>
      </Box>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {/* Courses View */}
          {activeCard === "courses" && (
            <Box>
              <AnimatePresence mode="wait">
                {!selectedCourseForDetails ? (
                  <motion.div
                    key="course-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                      Your Academic Courses
                      <Box sx={{ height: "1px", flexGrow: 1, bgcolor: "rgba(255,255,255,0.05)" }} />
                    </Typography>
                    <Grid container spacing={3}>
                      {courses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                          <Card
                            onClick={async () => {
                              setSelectedCourseForDetails(course.id);
                              setCourseDrillDownLoading(true);
                              try {
                                const qData = await getCourseQuestions(course.id);
                                setCourseQuestions(qData.questions || []);
                              } catch (err) {
                                console.error("Error fetching questions:", err);
                              } finally {
                                setCourseDrillDownLoading(false);
                              }
                            }}
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              position: "relative",
                              overflow: "visible",
                              backgroundColor: "rgba(255, 255, 255, 0.02)",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                              borderRadius: "32px",
                              cursor: "pointer",
                              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                              minHeight: "340px",
                              "&:hover": {
                                backgroundColor: "rgba(0, 221, 179, 0.05)",
                                borderColor: "rgba(0, 221, 179, 0.4)",
                                transform: "rotate(1deg) scale(1.02)",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                              },
                            }}
                          >
                            <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                              <Box sx={{
                                width: 60, height: 60,
                                borderRadius: "20px",
                                background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                mb: 3, boxShadow: "0 10px 20px rgba(0,221,179,0.2)"
                              }}>
                                <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
                                  {course.name.charAt(0)}
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#fff" }}>
                                {course.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, fontWeight: 500, flexGrow: 1 }}>
                                {course.department || "General Department"}
                              </Typography>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 'auto' }}>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Chip
                                    label={`${students.filter(s => s.courseId === course.id).length} Students`}
                                    size="small"
                                    sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}
                                  />
                                </Box>
                                <Box sx={{ color: "#00DDB3", display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 900 }}>DRILL DOWN</Typography>
                                  <PlayArrowIcon sx={{ fontSize: 16 }} />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </motion.div>
                ) : (
                  <motion.div
                    key="course-drilldown"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 5 }}>
                      <Button
                        onClick={() => setSelectedCourseForDetails(null)}
                        startIcon={<ArrowBackIcon />}
                        sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}
                      >
                        COURSES
                      </Button>
                      <Box sx={{ width: "2px", height: "24px", bgcolor: "rgba(255,255,255,0.1)" }} />
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>
                        {courses.find(c => c.id === selectedCourseForDetails)?.name}
                      </Typography>
                    </Box>

                    <Grid container spacing={4}>
                      {/* Left: Detailed Tables */}
                      <Grid item xs={12} lg={8}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {/* Course Tests */}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                              <TestsIcon sx={{ color: "#00DDB3" }} />
                              Allocated Tests
                            </Typography>
                            <TableContainer sx={{ bgcolor: "rgba(255,255,255,0.01)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 2 }}>NAME</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 800, textAlign: "center" }}>QS</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tests.filter(t => t.courseId === selectedCourseForDetails).map(test => (
                                    <TableRow key={test.id} hover>
                                      <TableCell sx={{ py: 2, fontWeight: 600 }}>{test.name}</TableCell>
                                      <TableCell>
                                        <Chip label={test.status.toUpperCase()} size="small" color={getStatusColor(test.status)} sx={{ fontSize: "10px", fontWeight: 900 }} />
                                      </TableCell>
                                      <TableCell sx={{ textAlign: "center", fontWeight: 700 }}>{test.totalQuestions}</TableCell>
                                    </TableRow>
                                  ))}
                                  {tests.filter(t => t.courseId === selectedCourseForDetails).length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={3} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>No tests found for this course</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>

                          {/* Enrolled Students */}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                              <PeopleIcon sx={{ color: "#06B6D4" }} />
                              Enrolled Students
                            </Typography>
                            <TableContainer sx={{ bgcolor: "rgba(255,255,255,0.01)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 2 }}>STUDENT NAME</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>ENROLLMENT #</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {students.filter(s => s.courseId === selectedCourseForDetails).map(student => (
                                    <TableRow key={student.id} hover>
                                      <TableCell sx={{ py: 2, fontWeight: 600 }}>{student.name}</TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.4)" }}>{student.enrollmentNumber}</TableCell>
                                    </TableRow>
                                  ))}
                                  {students.filter(s => s.courseId === selectedCourseForDetails).length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={2} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>No students enrolled</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Right: Question Bank Snippet */}
                      <Grid item xs={12} lg={4}>
                        <Box sx={{ p: 4, borderRadius: "32px", bgcolor: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.1)" }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                            <QuestionsIcon sx={{ color: "#00DDB3" }} />
                            Course Repository
                          </Typography>

                          {courseDrillDownLoading ? (
                            <CircularProgress size={24} sx={{ color: "#00DDB3", display: "block", mx: "auto", my: 4 }} />
                          ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <Box sx={{ p: 3, borderRadius: "20px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Typography variant="h4" sx={{ fontWeight: 900 }}>{courseQuestions.length}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>AVAILABLE QUESTIONS</Typography>
                              </Box>

                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, color: "rgba(255,255,255,0.4)" }}>TOPICS COVERED</Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {[...new Set(courseQuestions.map(q => q.topic).filter(Boolean))].slice(0, 5).map((topic, i) => (
                                  <Chip key={i} label={topic} size="small" sx={{ bgcolor: "rgba(0,221,179,0.1)", color: "#00DDB3", border: "1px solid rgba(0,221,179,0.2)" }} />
                                ))}
                                {courseQuestions.length === 0 && <Typography variant="caption">Store empty</Typography>}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          )}

          {/* Tests View */}
          {activeCard === "tests" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>Manage Tests</Typography>
              </Box>

              <TableContainer sx={{
                bgcolor: "rgba(255,255,255,0.01)",
                borderRadius: "32px",
                border: "1px solid rgba(255,255,255,0.05)",
                overflow: "hidden"
              }}>
                <Table>
                  <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, py: 3, borderBottom: "none" }}>TEST IDENTIFIER</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none" }}>ALLOCATED COURSE</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none" }}>LITMUS STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none", textAlign: "center" }}>METRICS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id} hover sx={{
                        "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" },
                        borderBottom: "1px solid rgba(255,255,255,0.03)"
                      }}>
                        <TableCell sx={{ py: 4, borderBottom: "none" }}>
                          <Typography sx={{ fontWeight: 700 }}>{test.name}</Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>ID: {test.id.slice(0, 8)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none" }}>
                          <Chip
                            label={courses.find(c => c.id === test.courseId)?.name || 'N/A'}
                            variant="outlined"
                            size="small"
                            sx={{ color: "#06B6D4", borderColor: "rgba(6, 182, 212, 0.3)", fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none" }}>
                          <Chip
                            icon={getStatusIcon(test.status)}
                            label={test.status.toUpperCase()}
                            color={getStatusColor(test.status)}
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: "8px", px: 1 }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", textAlign: "center" }}>
                          <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
                            <Box>
                              <Typography sx={{ fontWeight: 900 }}>{test.totalQuestions}</Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>QS</Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 900 }}>{test.studentCount || 0}</Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>ST</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Templates View */}
          {activeCard === "templates" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>Prototypes</Typography>
              </Box>
              <Grid container spacing={3}>
                {templates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "32px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      bgcolor: "rgba(255,255,255,0.01)",
                      minHeight: "340px",
                      transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": { transform: "translateY(-5px)", borderColor: "rgba(0,221,179,0.3)" }
                    }}>
                      <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <Chip
                          label={template.type.toUpperCase()}
                          size="small"
                          sx={{ mb: 2, width: 'fit-content', bgcolor: "rgba(0, 221, 179, 0.1)", color: "#00DDB3", fontWeight: 800 }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>{template.name}</Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, flexGrow: 1 }}>
                          A high-fidelity evaluation structural model for efficient testing.
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 4 }}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontWeight: 900 }}>{template.totalQuestions}</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>QUESTIONS</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontWeight: 900 }}>{template.duration}m</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>TIME</Typography>
                          </Grid>
                        </Grid>

                        <Typography variant="caption" sx={{ mt: 'auto', color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                          Read-only template view
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Students View */}
          {activeCard === "students" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 5 }}>Roster</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {courses.map(course => (
                  <Box key={course.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#00DDB3" }}>{course.name}</Typography>
                      <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "rgba(255,255,255,0.05)" }} />
                      <Chip
                        label={`${students.filter(s => s.courseId === course.id).length} ENROLLED`}
                        size="small"
                        sx={{ bgcolor: "rgba(0,221,179,0.1)", color: "#00DDB3", fontWeight: 900, fontSize: "10px" }}
                      />
                    </Box>

                    <TableContainer sx={{
                      bgcolor: "rgba(255,255,255,0.01)",
                      borderRadius: "24px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      overflow: "hidden"
                    }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 900, py: 2 }}>STUDENT NAME</TableCell>
                            <TableCell sx={{ fontWeight: 900 }}>ENROLLMENT NUMBER</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.filter(s => s.courseId === course.id).map((student) => (
                            <TableRow key={student.id} hover sx={{
                              "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" },
                              borderBottom: "1px solid rgba(255,255,255,0.03)"
                            }}>
                              <TableCell sx={{ py: 2, fontWeight: 700 }}>{student.name}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>#{student.enrollmentNumber}</TableCell>
                            </TableRow>
                          ))}
                          {students.filter(s => s.courseId === course.id).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>No students enrolled in this course</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Styled Dialogs */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0C1221",
            backgroundImage: "none",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pt: 4, px: 4, fontSize: "1.5rem" }}>
          {dialogType === "test" ? "Initialize Test" : "Build Prototype"}
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          {dialogType === "test" ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Identifier"
                name="name"
                value={formData.name || ""}
                onChange={handleFormChange}
                variant="filled"
                sx={{ mb: 3 }}
                InputProps={{ sx: { borderRadius: "12px" } }}
              />
              <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
                <InputLabel>Target Course</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  sx={{ borderRadius: "12px" }}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth label="Prototype Name" name="name"
                value={formData.name || ""} onChange={handleFormChange}
                variant="filled" sx={{ mb: 3 }}
              />
              <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
                <InputLabel>Evaluation Type</InputLabel>
                <Select name="type" value={formData.type || ""} onChange={handleFormChange}>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Question Count" name="totalQuestions" type="number" value={formData.totalQuestions || ""} onChange={handleFormChange} variant="filled" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Duration (m)" name="duration" type="number" value={formData.duration || ""} onChange={handleFormChange} variant="filled" />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "rgba(255,255,255,0.4)" }}>ABORT</Button>
          <Button
            onClick={dialogType === "test" ? handleCreateTest : handleCreateTemplate}
            variant="contained"
            sx={{
              px: 4,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
              fontWeight: 900
            }}
          >
            CONFIRM
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

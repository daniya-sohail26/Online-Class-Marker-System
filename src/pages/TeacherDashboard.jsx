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
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  ArrowBack as ArrowBackIcon,
  Group as PeopleIcon,
  ListAlt as QuestionsIcon,
  Quiz as TestsIcon,
  TrendingUp as TrendingUpIcon,
  Laptop as LaptopIcon,
  PhoneAndroid as PhoneIcon,
  Devices as DevicesIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { getCourseQuestions } from "../api/questionApi";
import {
  getAllTests,
  deleteTest,
  createTest,
} from "../api/testApi";
import {
  getAllTemplates,
  deleteTemplate,
  createTemplate,
} from "../api/templateApi";
import { getAllCourses } from "../api/courseApi";
import { getAllStudents } from "../api/studentApi";

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
  const [activeCard, setActiveCard] = useState("overview");
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [courseQuestions, setCourseQuestions] = useState([]);
  const [courseDrillDownLoading, setCourseDrillDownLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsData, templatesData, coursesData, studentsData] = await Promise.all([
          getAllTests(),
          getAllTemplates(),
          getAllCourses(),
          getAllStudents(),
        ]);
        setTests(testsData);
        setTemplates(templatesData);
        setCourses(coursesData);
        setStudents(studentsData);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    if (!formData.name || !formData.name.trim()) { setError("Test name is required"); return; }
    if (!selectedCourse) { setError("Please select a course"); return; }
    try {
      await createTest({ name: formData.name, courseId: selectedCourse });
      const testsData = await getAllTests();
      setTests(testsData);
      setSuccess("Test created successfully!");
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.error || "Failed to create test");
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.name.trim()) { setError("Template name is required"); return; }
    if (!formData.type) { setError("Template type is required"); return; }
    if (!formData.duration || parseInt(formData.duration) <= 0) { setError("Duration must be > 0"); return; }
    try {
      await createTemplate({ name: formData.name, type: formData.type, totalQuestions: parseInt(formData.totalQuestions) || 0, duration: parseInt(formData.duration) || 0 });
      const templatesData = await getAllTemplates();
      setTemplates(templatesData);
      setSuccess("Template created successfully!");
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.error || "Failed to create template");
    }
  };

  const handleDeleteTest = async (testId) => {
    try {
      await deleteTest(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      setSuccess("Test deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.error || "Failed to delete test");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setSuccess("Template deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.error || "Failed to delete template");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "success";
      case "scheduled": return "warning";
      case "completed": return "default";
      case "draft": return "info";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "published": return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "scheduled": return <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "completed": return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default: return <ClockIcon sx={{ fontSize: 16, mr: 0.5 }} />;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "web": return <LaptopIcon sx={{ fontSize: 16 }} />;
      case "mobile": return <PhoneIcon sx={{ fontSize: 16 }} />;
      default: return <DevicesIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case "web": return "Web Only";
      case "mobile": return "Mobile Only";
      default: return "Web & Mobile";
    }
  };

  const getTypeColor = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "quiz") return { bg: "rgba(0,221,179,0.1)", color: "#00DDB3" };
    if (t === "midterm") return { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" };
    if (t === "final") return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
    if (t === "assignment") return { bg: "rgba(99,102,241,0.1)", color: "#818cf8" };
    if (t === "practice") return { bg: "rgba(6,182,212,0.1)", color: "#06B6D4" };
    return { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" };
  };

  // Derived stats
  const publishedTests = tests.filter((t) => t.status === "published").length;
  const draftTests = tests.filter((t) => t.status === "draft").length;
  const totalQuestionBank = tests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
  const teacherName = profile?.name || profile?.email?.split("@")[0] || "";

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: 3 }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Courses", count: courses.length },
    { id: "tests", label: "Tests", count: tests.length },
    { id: "templates", label: "Templates", count: templates.length },
    { id: "students", label: "Students", count: students.length },
  ];

  const glassCard = {
    bgcolor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "24px",
    backdropFilter: "blur(12px)",
  };

  return (
    <Box sx={{ animation: "fadeIn 0.8s ease-out", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setError("")}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setSuccess("")}>{success}</Alert>
      )}

      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", lg: "flex-end" }, mb: 6, gap: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, background: "linear-gradient(to right, #fff 30%, rgba(255,255,255,0.4) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
            Welcome back{teacherName ? ", " : ""}<span style={{ color: "#00DDB3", fontWeight: 700 }}>{teacherName}</span>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, bgcolor: "rgba(255,255,255,0.03)", p: 1.5, borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveCard(tab.id)}
              sx={{
                px: 3, py: 1.5, borderRadius: "18px",
                color: activeCard === tab.id ? "#fff" : "rgba(255,255,255,0.4)",
                bgcolor: activeCard === tab.id ? "rgba(0,221,179,0.15)" : "transparent",
                border: activeCard === tab.id ? "1px solid rgba(0,221,179,0.3)" : "1px solid transparent",
                fontWeight: 700, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": { bgcolor: activeCard === tab.id ? "rgba(0,221,179,0.2)" : "rgba(255,255,255,0.05)" },
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Box component="span" sx={{ ml: 1.5, px: 1, py: 0.2, borderRadius: "8px", bgcolor: activeCard === tab.id ? "rgba(0,221,179,0.3)" : "rgba(255,255,255,0.1)", fontSize: "10px" }}>
                  {tab.count}
                </Box>
              )}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>

          {/* ===== OVERVIEW ===== */}
          {activeCard === "overview" && (
            <Box>
              {/* Stat Cards Row */}
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {[
                  { label: "Courses", value: courses.length, gradient: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)", sub: `${students.length} total students` },
                  { label: "Tests", value: tests.length, gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", sub: `${publishedTests} published, ${draftTests} drafts` },
                  { label: "Templates", value: templates.length, gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", sub: `${templates.filter(t => (t.type || "").toLowerCase() === "quiz").length} quizzes, ${templates.filter(t => (t.type || "").toLowerCase() !== "quiz").length} other` },
                  { label: "Questions", value: totalQuestionBank, gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)", sub: `across ${tests.filter(t => t.totalQuestions > 0).length} tests` },
                ].map((stat, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Card sx={{ position: "relative", overflow: "hidden", background: stat.gradient, border: "none", borderRadius: "24px" }}>
                        <CardContent sx={{ p: 3.5, position: "relative", zIndex: 1 }}>
                          <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "1px" }}>{stat.label}</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", mt: 1 }}>{stat.value}</Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5, display: "block" }}>{stat.sub}</Typography>
                        </CardContent>
                        <Box sx={{ position: "absolute", right: -20, bottom: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                        <Box sx={{ position: "absolute", right: 20, top: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* Two-column: Recent Tests + Template Highlights */}
              <Grid container spacing={4}>
                {/* Recent Tests */}
                <Grid item xs={12} lg={7}>
                  <Card sx={{ ...glassCard, p: 0, overflow: "hidden" }}>
                    <Box sx={{ px: 4, pt: 4, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <TestsIcon sx={{ color: "#00DDB3" }} /> Recent Tests
                      </Typography>
                      <Button onClick={() => setActiveCard("tests")} sx={{ color: "#00DDB3", fontWeight: 700, textTransform: "none" }}>View All</Button>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: "rgba(255,255,255,0.4)", py: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>NAME</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>COURSE</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>QS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tests.slice(0, 5).map((test) => (
                            <TableRow key={test.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                              <TableCell sx={{ py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{test.name}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>{test.id?.slice(0, 8)}</Typography>
                              </TableCell>
                              <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <Chip label={test.courseName || courses.find(c => c.id === test.courseId)?.name || "N/A"} size="small" variant="outlined" sx={{ color: "#06B6D4", borderColor: "rgba(6,182,212,0.3)", fontWeight: 600, fontSize: "0.7rem" }} />
                              </TableCell>
                              <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <Chip icon={getStatusIcon(test.status)} label={(test.status || "draft").toUpperCase()} color={getStatusColor(test.status)} size="small" sx={{ fontWeight: 800, borderRadius: "8px", fontSize: "0.65rem" }} />
                              </TableCell>
                              <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "center", fontWeight: 800 }}>
                                {test.totalQuestions || 0}
                              </TableCell>
                            </TableRow>
                          ))}
                          {tests.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.25)", borderBottom: "none" }}>No tests created yet</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>

                {/* Template Highlights */}
                <Grid item xs={12} lg={5}>
                  <Card sx={{ ...glassCard, p: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <TrendingUpIcon sx={{ color: "#f59e0b" }} /> Templates
                      </Typography>
                      <Button onClick={() => setActiveCard("templates")} sx={{ color: "#00DDB3", fontWeight: 700, textTransform: "none" }}>View All</Button>
                    </Box>

                    {templates.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
                        <Typography>No templates created yet</Typography>
                        <Button onClick={() => navigate("/teacher/template-builder")} startIcon={<AddIcon />} sx={{ mt: 2, color: "#00DDB3", textTransform: "none" }}>Create Template</Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {templates.slice(0, 4).map((t) => {
                          const tc = getTypeColor(t.type);
                          return (
                            <Box key={t.id} sx={{ p: 2.5, borderRadius: "16px", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s", "&:hover": { borderColor: "rgba(0,221,179,0.3)" } }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{t.name}</Typography>
                                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>{t.courseName || "No course"}</Typography>
                                </Box>
                                <Chip label={(t.type || "custom").toUpperCase()} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 800, fontSize: "0.65rem" }} />
                              </Box>
                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                <Chip icon={<ClockIcon sx={{ fontSize: "14px !important" }} />} label={`${t.duration || 0}m`} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.7rem" }} />
                                <Chip label={`${t.totalQuestions || 0} Qs`} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.7rem" }} />
                                <Chip label={`Pass: ${t.passingPercentage || 50}%`} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.7rem" }} />
                                {t.allowedPlatform && (
                                  <Chip icon={getPlatformIcon(t.allowedPlatform)} label={getPlatformLabel(t.allowedPlatform)} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.7rem" }} />
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Card>
                </Grid>
              </Grid>

              {/* Course-Student Breakdown */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PeopleIcon sx={{ color: "#06B6D4" }} /> Enrollment by Course
                </Typography>
                <Grid container spacing={3}>
                  {courses.map((course) => {
                    const courseStudents = students.filter((s) => s.courseId === course.id);
                    const courseTests = tests.filter((t) => t.courseId === course.id);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <Card sx={{ ...glassCard, p: 3, transition: "all 0.3s", "&:hover": { borderColor: "rgba(0,221,179,0.3)", transform: "translateY(-3px)" } }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: "14px", background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{course.name?.charAt(0)}</Typography>
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.name}</Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>{course.department || "General"}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ flex: 1, p: 1.5, borderRadius: "12px", bgcolor: "rgba(0,221,179,0.05)", textAlign: "center" }}>
                              <Typography sx={{ fontWeight: 900, color: "#00DDB3" }}>{courseStudents.length}</Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: "0.65rem" }}>STUDENTS</Typography>
                            </Box>
                            <Box sx={{ flex: 1, p: 1.5, borderRadius: "12px", bgcolor: "rgba(6,182,212,0.05)", textAlign: "center" }}>
                              <Typography sx={{ fontWeight: 900, color: "#06B6D4" }}>{courseTests.length}</Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: "0.65rem" }}>TESTS</Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                  {courses.length === 0 && (
                    <Grid item xs={12}>
                      <Typography sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>No courses found</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}

          {/* ===== COURSES ===== */}
          {activeCard === "courses" && (
            <Box>
              <AnimatePresence mode="wait">
                {!selectedCourseForDetails ? (
                  <motion.div key="course-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                      Your Academic Courses
                      <Box sx={{ height: "1px", flexGrow: 1, bgcolor: "rgba(255,255,255,0.05)" }} />
                    </Typography>
                    <Grid container spacing={3}>
                      {courses.map((course) => {
                        const courseStudents = students.filter((s) => s.courseId === course.id);
                        const courseTests = tests.filter((t) => t.courseId === course.id);
                        return (
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
                                height: "100%", display: "flex", flexDirection: "column",
                                position: "relative", overflow: "visible",
                                backgroundColor: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "32px", cursor: "pointer",
                                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                minHeight: "340px",
                                "&:hover": {
                                  backgroundColor: "rgba(0,221,179,0.05)",
                                  borderColor: "rgba(0,221,179,0.4)",
                                  transform: "rotate(1deg) scale(1.02)",
                                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                                },
                              }}
                            >
                              <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                <Box sx={{ width: 60, height: 60, borderRadius: "20px", background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3, boxShadow: "0 10px 20px rgba(0,221,179,0.2)" }}>
                                  <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{course.name?.charAt(0)}</Typography>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#fff" }}>{course.name}</Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, fontWeight: 500, flexGrow: 1 }}>{course.department || "General Department"}</Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Chip label={`${courseStudents.length} Students`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontWeight: 700 }} />
                                    <Chip label={`${courseTests.length} Tests`} size="small" sx={{ bgcolor: "rgba(6,182,212,0.1)", color: "#06B6D4", fontWeight: 700 }} />
                                  </Box>
                                  <Box sx={{ color: "#00DDB3", display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900 }}>DRILL DOWN</Typography>
                                    <PlayArrowIcon sx={{ fontSize: 16 }} />
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                      {courses.length === 0 && (
                        <Grid item xs={12}>
                          <Typography sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>No courses assigned</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </motion.div>
                ) : (
                  <motion.div key="course-drilldown" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 5 }}>
                      <Button onClick={() => setSelectedCourseForDetails(null)} startIcon={<ArrowBackIcon />} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>COURSES</Button>
                      <Box sx={{ width: "2px", height: "24px", bgcolor: "rgba(255,255,255,0.1)" }} />
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>{courses.find((c) => c.id === selectedCourseForDetails)?.name}</Typography>
                    </Box>

                    <Grid container spacing={4}>
                      <Grid item xs={12} lg={8}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {/* Course Tests */}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                              <TestsIcon sx={{ color: "#00DDB3" }} /> Allocated Tests
                            </Typography>
                            <TableContainer sx={{ ...glassCard, overflow: "hidden" }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>NAME</TableCell>
                                    <TableCell sx={{ fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 800, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>QUESTIONS</TableCell>
                                    <TableCell sx={{ fontWeight: 800, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>STUDENTS</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tests.filter((t) => t.courseId === selectedCourseForDetails).map((test) => (
                                    <TableRow key={test.id} hover>
                                      <TableCell sx={{ py: 2, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{test.name}</TableCell>
                                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                        <Chip label={(test.status || "draft").toUpperCase()} size="small" color={getStatusColor(test.status)} sx={{ fontSize: "10px", fontWeight: 900 }} />
                                      </TableCell>
                                      <TableCell sx={{ textAlign: "center", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{test.totalQuestions || 0}</TableCell>
                                      <TableCell sx={{ textAlign: "center", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{test.studentCount || 0}</TableCell>
                                    </TableRow>
                                  ))}
                                  {tests.filter((t) => t.courseId === selectedCourseForDetails).length === 0 && (
                                    <TableRow><TableCell colSpan={4} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)", borderBottom: "none" }}>No tests for this course</TableCell></TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>

                          {/* Enrolled Students */}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                              <PeopleIcon sx={{ color: "#06B6D4" }} /> Enrolled Students
                            </Typography>
                            <TableContainer sx={{ ...glassCard, overflow: "hidden" }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>STUDENT NAME</TableCell>
                                    <TableCell sx={{ fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>EMAIL</TableCell>
                                    <TableCell sx={{ fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>ENROLLMENT #</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {students.filter((s) => s.courseId === selectedCourseForDetails).map((student) => (
                                    <TableRow key={student.id} hover>
                                      <TableCell sx={{ py: 2, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{student.name}</TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{student.email}</TableCell>
                                      <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>#{student.enrollmentNumber}</TableCell>
                                    </TableRow>
                                  ))}
                                  {students.filter((s) => s.courseId === selectedCourseForDetails).length === 0 && (
                                    <TableRow><TableCell colSpan={3} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)", borderBottom: "none" }}>No students enrolled</TableCell></TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Right: Question Bank */}
                      <Grid item xs={12} lg={4}>
                        <Box sx={{ p: 4, borderRadius: "32px", bgcolor: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.1)" }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                            <QuestionsIcon sx={{ color: "#00DDB3" }} /> Question Bank
                          </Typography>
                          {courseDrillDownLoading ? (
                            <CircularProgress size={24} sx={{ color: "#00DDB3", display: "block", mx: "auto", my: 4 }} />
                          ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <Box sx={{ p: 3, borderRadius: "20px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: "#00DDB3" }}>{courseQuestions.length}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>AVAILABLE QUESTIONS</Typography>
                              </Box>
                              {courseQuestions.length > 0 && (
                                <>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, color: "rgba(255,255,255,0.4)" }}>DIFFICULTY SPREAD</Typography>
                                  {["easy", "medium", "hard"].map((diff) => {
                                    const count = courseQuestions.filter((q) => q.difficulty === diff).length;
                                    const pct = courseQuestions.length > 0 ? (count / courseQuestions.length) * 100 : 0;
                                    const colors = { easy: "#00DDB3", medium: "#f59e0b", hard: "#ef4444" };
                                    return (
                                      <Box key={diff}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "capitalize" }}>{diff}</Typography>
                                          <Typography variant="caption" sx={{ color: colors[diff], fontWeight: 800 }}>{count}</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: colors[diff], borderRadius: 3 } }} />
                                      </Box>
                                    );
                                  })}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, color: "rgba(255,255,255,0.4)" }}>TOPICS</Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {[...new Set(courseQuestions.map((q) => q.topic).filter(Boolean))].slice(0, 8).map((topic, i) => (
                                      <Chip key={i} label={topic} size="small" sx={{ bgcolor: "rgba(0,221,179,0.1)", color: "#00DDB3", border: "1px solid rgba(0,221,179,0.2)", fontSize: "0.7rem" }} />
                                    ))}
                                  </Box>
                                </>
                              )}
                              {courseQuestions.length === 0 && (
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>No questions in this course yet</Typography>
                              )}
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

          {/* ===== TESTS ===== */}
          {activeCard === "tests" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>Manage Tests</Typography>
              </Box>

              <TableContainer sx={{ ...glassCard, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, py: 3, borderBottom: "none" }}>TEST NAME</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none" }}>COURSE</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none" }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none", textAlign: "center" }}>QUESTIONS</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none", textAlign: "center" }}>STUDENTS</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none" }}>SCHEDULE</TableCell>
                      <TableCell sx={{ fontWeight: 900, borderBottom: "none", textAlign: "right" }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id} hover sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" }, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <TableCell sx={{ py: 3.5, borderBottom: "none" }}>
                          <Typography sx={{ fontWeight: 700 }}>{test.name}</Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>ID: {test.id?.slice(0, 8)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none" }}>
                          <Chip label={test.courseName || courses.find((c) => c.id === test.courseId)?.name || "N/A"} variant="outlined" size="small" sx={{ color: "#06B6D4", borderColor: "rgba(6,182,212,0.3)", fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none" }}>
                          <Chip icon={getStatusIcon(test.status)} label={(test.status || "draft").toUpperCase()} color={getStatusColor(test.status)} size="small" sx={{ fontWeight: 800, borderRadius: "8px", px: 1 }} />
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", textAlign: "center" }}>
                          <Typography sx={{ fontWeight: 900 }}>{test.totalQuestions || 0}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", textAlign: "center" }}>
                          <Typography sx={{ fontWeight: 900 }}>{test.studentCount || 0}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none" }}>
                          {test.start_time ? (
                            <Box>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                                {new Date(test.start_time).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>
                                {new Date(test.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                {test.end_time && ` - ${new Date(test.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.25)" }}>Not scheduled</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", textAlign: "right" }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button onClick={() => navigate(`/teacher/test-creation/${test.id}`)} sx={{ minWidth: 40, width: 40, height: 40, borderRadius: "12px", p: 0, color: "#00DDB3", "&:hover": { bgcolor: "rgba(0,221,179,0.1)" } }}>
                              <EditIcon fontSize="small" />
                            </Button>
                            <Button onClick={() => handleDeleteTest(test.id)} sx={{ minWidth: 40, width: 40, height: 40, borderRadius: "12px", p: 0, color: "#F59E0B", "&:hover": { bgcolor: "rgba(245,158,11,0.1)" } }}>
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tests.length === 0 && (
                      <TableRow><TableCell colSpan={7} sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.25)", borderBottom: "none" }}>No tests created yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ===== TEMPLATES ===== */}
          {activeCard === "templates" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>Templates</Typography>
                <Button onClick={() => navigate("/teacher/template-builder")} startIcon={<AddIcon />} variant="contained" sx={{ borderRadius: "14px", background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)", color: "#000", fontWeight: 800, textTransform: "none" }}>
                  New Template
                </Button>
              </Box>
              <Grid container spacing={3}>
                {templates.map((template) => {
                  const tc = getTypeColor(template.type);
                  const totalMarks = (template.totalQuestions || 0) * (template.marksPerQuestion || 0);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                      <Card sx={{
                        height: "100%", display: "flex", flexDirection: "column",
                        borderRadius: "28px", border: "1px solid rgba(255,255,255,0.06)",
                        bgcolor: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)",
                        transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": { transform: "translateY(-5px)", borderColor: "rgba(0,221,179,0.3)", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" },
                      }}>
                        <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          {/* Type badge + Platform */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Chip label={(template.type || "custom").toUpperCase()} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 800, fontSize: "0.7rem" }} />
                            {template.allowedPlatform && (
                              <Chip icon={getPlatformIcon(template.allowedPlatform)} label={getPlatformLabel(template.allowedPlatform)} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "0.65rem" }} />
                            )}
                          </Box>

                          {/* Name + Course */}
                          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, lineHeight: 1.2 }}>{template.name}</Typography>
                          <Typography variant="body2" sx={{ color: "#06B6D4", mb: 3, fontWeight: 600 }}>{template.courseName || "No course assigned"}</Typography>

                          {/* Stats Grid */}
                          <Grid container spacing={1.5} sx={{ mb: 3 }}>
                            <Grid item xs={4}>
                              <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "rgba(0,221,179,0.05)", textAlign: "center" }}>
                                <Typography sx={{ fontWeight: 900, color: "#00DDB3", fontSize: "1.1rem" }}>{template.totalQuestions || 0}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "0.6rem" }}>QUESTIONS</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "rgba(6,182,212,0.05)", textAlign: "center" }}>
                                <Typography sx={{ fontWeight: 900, color: "#06B6D4", fontSize: "1.1rem" }}>{template.duration || 0}m</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "0.6rem" }}>DURATION</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "rgba(251,191,36,0.05)", textAlign: "center" }}>
                                <Typography sx={{ fontWeight: 900, color: "#fbbf24", fontSize: "1.1rem" }}>{totalMarks}</Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "0.6rem" }}>MARKS</Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {/* Config Tags */}
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 3, flexGrow: 1 }}>
                            <Chip label={`Pass: ${template.passingPercentage || 50}%`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            {template.negativeMarking && (
                              <Chip label={`-${template.negativeMarkingPenalty || 0} penalty`} size="small" sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            )}
                            {template.behavior?.shuffleQs && (
                              <Chip label="Shuffle" size="small" sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            )}
                            {template.behavior?.preventTabSwitch && (
                              <Chip label="Tab Lock" size="small" sx={{ bgcolor: "rgba(245,158,11,0.08)", color: "#fbbf24", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            )}
                            {template.behavior?.maxAttempts && (
                              <Chip label={template.behavior.maxAttempts === 999 ? "Unlimited" : `${template.behavior.maxAttempts} attempt${template.behavior.maxAttempts > 1 ? "s" : ""}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            )}
                            {template.behavior?.showResults === "Immediately" && (
                              <Chip label="Instant Results" size="small" sx={{ bgcolor: "rgba(0,221,179,0.08)", color: "#00DDB3", fontWeight: 600, fontSize: "0.65rem", height: 24 }} />
                            )}
                          </Box>

                          {/* Actions */}
                          <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                            <Button fullWidth variant="outlined" onClick={() => navigate(`/teacher/template-builder/${template.id}`)} sx={{ borderRadius: "12px", color: "#00DDB3", borderColor: "rgba(0,221,179,0.3)", fontWeight: 700, textTransform: "none" }}>
                              Edit
                            </Button>
                            <Button onClick={() => handleDeleteTemplate(template.id)} sx={{ minWidth: 48, borderRadius: "12px", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.15)" }}>
                              <DeleteIcon />
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                {templates.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ py: 10, textAlign: "center" }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.25)", mb: 2 }}>No templates created yet</Typography>
                      <Button onClick={() => navigate("/teacher/template-builder")} startIcon={<AddIcon />} sx={{ color: "#00DDB3", textTransform: "none", fontWeight: 700 }}>Create Your First Template</Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* ===== STUDENTS ===== */}
          {activeCard === "students" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 5 }}>Student Roster</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {courses.map((course) => {
                  const courseStudents = students.filter((s) => s.courseId === course.id);
                  return (
                    <Box key={course.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#00DDB3" }}>{course.name}</Typography>
                        <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "rgba(255,255,255,0.05)" }} />
                        <Chip label={`${courseStudents.length} ENROLLED`} size="small" sx={{ bgcolor: "rgba(0,221,179,0.1)", color: "#00DDB3", fontWeight: 900, fontSize: "10px" }} />
                      </Box>
                      <TableContainer sx={{ ...glassCard, overflow: "hidden" }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 900, py: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>STUDENT NAME</TableCell>
                              <TableCell sx={{ fontWeight: 900, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>EMAIL</TableCell>
                              <TableCell sx={{ fontWeight: 900, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>ENROLLMENT #</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {courseStudents.map((student) => (
                              <TableRow key={student.id} hover sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" }, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <TableCell sx={{ py: 2, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{student.name}</TableCell>
                                <TableCell sx={{ color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{student.email}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>#{student.enrollmentNumber}</TableCell>
                              </TableRow>
                            ))}
                            {courseStudents.length === 0 && (
                              <TableRow><TableCell colSpan={3} sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.2)", borderBottom: "none" }}>No students enrolled in this course</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}
                {courses.length === 0 && (
                  <Typography sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>No courses found</Typography>
                )}
              </Box>
            </Box>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "#0C1221", backgroundImage: "none", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" } }}>
        <DialogTitle sx={{ fontWeight: 900, pt: 4, px: 4, fontSize: "1.5rem" }}>
          {dialogType === "test" ? "Create Test" : "Create Template"}
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          {dialogType === "test" ? (
            <Box sx={{ mt: 2 }}>
              <TextField fullWidth label="Test Name" name="name" value={formData.name || ""} onChange={handleFormChange} variant="filled" sx={{ mb: 3 }} InputProps={{ sx: { borderRadius: "12px" } }} />
              <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
                <InputLabel>Course</InputLabel>
                <Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} sx={{ borderRadius: "12px" }}>
                  {courses.map((course) => (<MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField fullWidth label="Template Name" name="name" value={formData.name || ""} onChange={handleFormChange} variant="filled" sx={{ mb: 3 }} />
              <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
                <InputLabel>Type</InputLabel>
                <Select name="type" value={formData.type || ""} onChange={handleFormChange}>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth label="Questions" name="totalQuestions" type="number" value={formData.totalQuestions || ""} onChange={handleFormChange} variant="filled" /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Duration (m)" name="duration" type="number" value={formData.duration || ""} onChange={handleFormChange} variant="filled" /></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "rgba(255,255,255,0.4)" }}>Cancel</Button>
          <Button onClick={dialogType === "test" ? handleCreateTest : handleCreateTemplate} variant="contained" sx={{ px: 4, borderRadius: "14px", background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)", fontWeight: 900 }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

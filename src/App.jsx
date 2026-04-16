import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, Box, CssBaseline, GlobalStyles } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute, TeacherRoute, StudentRoute } from "./components/ProtectedRoute";

// Components
import Sidebar from "./components/Sidebar";
import AdminSidebar from "./components/AdminSidebar";
import StudentSidebar from "./components/StudentSidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import QuestionBank from "./pages/QuestionBank";
import LiveMonitoring from "./components/LiveMonitoring";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TestTemplateBuilder from "./pages/TestTemplateBuilder";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBulkUpload from "./pages/admin/AdminBulkUpload";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherEvaluationPanel from "./pages/EvaluationDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentResults from "./pages/StudentResults";
import ResultsPage from "./pages/ResultsPage";
import StudentExamResults from "./pages/StudentExamResults";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "#root": {
            width: "100%",
            maxWidth: "100%",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
          },
          body: { backgroundColor: "#070B14", overflowX: "hidden" },
        }}
      />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/exam-results/:attemptId" element={<StudentExamResults />} />

            {/* Protected Teacher Routes */}
            <Route
              path="/teacher/*"
              element={
                <TeacherRoute>
                  <Box
                    sx={{ display: "flex", minHeight: "100vh", width: "100%" }}
                  >
                    <Sidebar />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 5 },
                        overflowX: "hidden",
                      }}
                    >
                      <Routes>
                        <Route path="dashboard" element={<TeacherDashboard />} />
                        <Route
                          path="question-bank"
                          element={<QuestionBank />}
                        />
                        <Route
                          path="live-monitoring"
                          element={<LiveMonitoring />}
                        />
                        <Route
                          path="template-builder"
                          element={<TestTemplateBuilder />}
                        />
                        <Route
                          path="evaluation"
                          element={<TeacherEvaluationPanel />}
                        />
                        <Route
                          path=""
                          element={<Navigate to="dashboard" replace />}
                        />
                      </Routes>
                    </Box>
                  </Box>
                </TeacherRoute>
              }
            />

            {/* Admin Portal Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <Box
                    sx={{ display: "flex", minHeight: "100vh", width: "100%" }}
                  >
                    <AdminSidebar />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 5 },
                        overflowX: "hidden",
                      }}
                    >
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route
                          path="departments"
                          element={<AdminDepartments />}
                        />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="sessions" element={<AdminSessions />} />
                        <Route path="teachers" element={<AdminTeachers />} />
                        <Route path="students" element={<AdminStudents />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route
                          path="bulk-upload"
                          element={<AdminBulkUpload />}
                        />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route
                          path=""
                          element={<Navigate to="dashboard" replace />}
                        />
                      </Routes>
                    </Box>
                  </Box>
                </AdminRoute>
              }
            />

            {/* Protected Student Routes */}
            <Route
              path="/student/*"
              element={
                <StudentRoute>
                  <Box sx={{ display: "flex", minHeight: "100vh" }}>
                    <StudentSidebar />
                    <Box
                      component="main"
                      sx={{
                        flex: 1,
                        minWidth: 0,        // ← prevents flex overflow
                        p: 3,
                        // NO overflowY: "auto" — let the PAGE scroll, not this box
                        // NO minHeight: "100vh" — not needed, flex handles it
                      }}
                    >
                      <Routes>
                        <Route path="dashboard" element={<StudentDashboard />} />

                        <Route path="results" element={<StudentResults />} />
                        <Route path="results/:attemptId" element={<ResultsPage />} />
                        <Route path="" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </Box>
                  </Box>
                </StudentRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

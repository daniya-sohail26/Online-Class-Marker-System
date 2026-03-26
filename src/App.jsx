import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, Box, CssBaseline, GlobalStyles } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute, TeacherRoute } from "./components/ProtectedRoute";

// Components
import Sidebar from "./components/Sidebar";
import AdminSidebar from "./components/AdminSidebar";

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
import TeacherEvaluationPanel from "./pages/EvaluationDashboard";
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
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route
                          path="question-bank"
                          element={<QuestionBank />}
                        />
                        <Route
                          path="live-monitoring"
                          element={<LiveMonitoring />}
                        />
                        <Route
                          path="/template-builder"
                          element={<TestTemplateBuilder />}
                        />
                        <Route
                          path="/evaluation"
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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

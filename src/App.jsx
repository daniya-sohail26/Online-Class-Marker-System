import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, Box, CssBaseline, GlobalStyles } from "@mui/material";
import theme from "./theme";

// Components
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import QuestionBank from "./pages/QuestionBank";
import LiveMonitoring from "./components/LiveMonitoring";
import LandingPage from "./pages/LandingPage";
import TestTemplateBuilder from './pages/TestTemplateBuilder';
import TestCreationWizard from './pages/TestCreationWizard';
import TeacherDashboard from "./pages/TeacherDashboard";
import TestEditor from "./pages/TestEditor";
import TemplateEditor from "./pages/TemplateEditor";

// Auth
import { USER_ROLES } from "./services/authService";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        "#root": { width: "100%", maxWidth: "100%", margin: 0, padding: 0, overflowX: "hidden" },
        "body": { backgroundColor: "#070B14", overflowX: "hidden" }
      }} />

      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Teacher Routes */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute requiredRoles={[USER_ROLES.TEACHER]}>
                <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, overflowX: "hidden", position: "relative" }}>
                    <Routes>
                      <Route path="dashboard" element={<TeacherDashboard />} />
                      <Route path="question-bank" element={<QuestionBank />} />
                      <Route path="live-monitoring" element={<LiveMonitoring />} />
                      <Route path="template-builder/:templateId?" element={<TestTemplateBuilder />} />
                      <Route path="test-creation/:testId?" element={<TestCreationWizard />} />
                      <Route path="test-editor/:testId" element={<TestEditor />} />
                      <Route path="template-editor/:templateId" element={<TemplateEditor />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, overflowX: "hidden", position: "relative" }}>
                    <Routes>
                      <Route path="dashboard" element={<TeacherDashboard />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />

          {/* Protected Student Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute requiredRoles={[USER_ROLES.STUDENT]}>
                <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, overflowX: "hidden", position: "relative" }}>
                    <Routes>
                      <Route path="dashboard" element={<TeacherDashboard />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
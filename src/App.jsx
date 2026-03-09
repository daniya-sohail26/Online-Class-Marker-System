import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, Box, CssBaseline, GlobalStyles } from "@mui/material";
import theme from "./theme";

// Components
import Sidebar from "./components/Sidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import QuestionBank from "./pages/QuestionBank";
import LiveMonitoring from "./components/LiveMonitoring";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login"; // Make sure to import the login page
import Signup from "./pages/Signup";

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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Teacher Routes */}
          <Route 
            path="/teacher/*" 
            element={
              <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
                <Sidebar />
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, overflowX: "hidden" }}>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="question-bank" element={<QuestionBank />} />
                    <Route path="live-monitoring" element={<LiveMonitoring />} />
                    <Route path="" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Box>
              </Box>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
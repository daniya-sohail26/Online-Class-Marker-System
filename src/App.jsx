import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, Box, CssBaseline } from "@mui/material";
import theme from "./theme";

// Import Components
import Sidebar from "./components/Sidebar";

// Import Pages (Make sure AdminDashboard is spelled correctly in your files!)
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDasHboard";
import LandingPage from "./pages/LandingPage";

/**
 * PortalLayout: A wrapper that provides the Sidebar and the main content area.
 * This keeps our App component clean and handles the flexbox layout properly.
 */
const PortalLayout = ({ children }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, md: 5 },
          width: { sm: `calc(100% - 280px)` }, // Accounts for the Sidebar width
          overflowX: "hidden",
          // Subtle glow at the top center of the content area for depth
          background: "radial-gradient(circle at 50% 0%, rgba(0, 221, 179, 0.04), transparent 50%)"
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* TEACHER PORTAL ROUTES */}
          <Route 
            path="/teacher/*" 
            element={
              <PortalLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  {/* You can add more specific teacher routes here later */}
                </Routes>
              </PortalLayout>
            } 
          />

          {/* ADMIN PORTAL ROUTES */}
          <Route 
            path="/admin/*" 
            element={
              <PortalLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  {/* Add Admin specific routes here */}
                </Routes>
              </PortalLayout>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
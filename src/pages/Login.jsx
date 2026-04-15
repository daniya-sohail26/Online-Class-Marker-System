import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Button, TextField, Card, Container, 
  Link, Stack, ToggleButton, ToggleButtonGroup, GlobalStyles, Alert 
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../server/config/supabaseClient";
import { useAuth } from "../contexts/AuthContext"; 

const ClassMarkerLogo = ({ size = 48, transparent = false }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#00DDB3" stopOpacity="0.0" />
      </linearGradient>
      <linearGradient id="leftLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="rightLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#00DDB3" />
      </linearGradient>
    </defs>
    {!transparent && <rect width="256" height="256" rx="60" fill="url(#bgGrad)" />}
    <circle cx="128" cy="128" r="96" fill="none" stroke="url(#gridGrad)" strokeWidth="2" />
    <circle cx="128" cy="128" r="64" fill="none" stroke="url(#gridGrad)" strokeWidth="1" strokeDasharray="4 6" />
    <path d="M 56 180 L 92 108 L 140 172 L 200 76" fill="none" stroke="#00DDB3" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
    <path d="M 56 180 L 92 108 L 128 156" fill="none" stroke="url(#leftLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 104 124 L 140 172 L 200 76" fill="none" stroke="url(#rightLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="200" cy="76" r="6" fill="#FFFFFF" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth(); 
  
  const [role, setRole] = useState("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message || "";

  useEffect(() => {
    if (!profile || location.pathname !== "/login") return;

    if (profile.adminPortalDenied) {
      return;
    }

    const fromPath = location.state?.from?.pathname;
    const role = profile.role;

    if (role === "admin") {
      const target =
        fromPath && fromPath.startsWith("/admin")
          ? fromPath
          : "/admin/dashboard";
      navigate(target, { replace: true });
      return;
    }
    if (role === "teacher") {
      const target =
        fromPath && fromPath.startsWith("/teacher")
          ? fromPath
          : "/teacher/dashboard";
      navigate(target, { replace: true });
      return;
    }
    if (role === "student") {
      const target =
        fromPath && fromPath.startsWith("/student")
          ? fromPath
          : "/student/dashboard";
      navigate(target, { replace: true });
      return;
    }
    // unknown role: keep user on login
  }, [profile?.id, profile?.role, profile?.adminPortalDenied, navigate, location.pathname, location.state?.from?.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (loading) return; 
    setError("");
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!supabase) {
      setError("Database not configured. Check your .env.");
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem("portal_role", role);

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;
    } catch (err) {
      console.error("Login Error:", err);
      let message = err.message;
      if (message.includes("Invalid login credentials")) message = "Incorrect email or password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#030712", position: "relative", overflow: "hidden" }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#030712" } }} />
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(0, 221, 179, 0.15) 0%, transparent 60%)", top: "-10%", left: "-10%", filter: "blur(100px)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 60%)", bottom: "-20%", right: "-10%", filter: "blur(120px)", pointerEvents: "none" }} />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, type: "spring" }}>
          
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 4 }}>
            <ClassMarkerLogo size={42} transparent={true} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
              Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box>
            </Typography>
          </Box>

          <Card sx={{ p: { xs: 4, md: 5 }, bgcolor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "32px", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>Welcome back</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Sign in to access your portal</Typography>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: "12px" }}>{successMessage}</Alert>}
            {profile?.adminPortalDenied && (
              <Alert
                severity="warning"
                sx={{ mb: 2, borderRadius: "12px" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      localStorage.setItem("portal_role", "teacher");
                      window.location.reload();
                    }}
                  >
                    Continue to Teacher portal
                  </Button>
                }
              >
                You chose <strong>Admin</strong>, but this account is a <strong>teacher</strong> in the database. The Admin portal only opens for users with{" "}
                <code style={{ color: "inherit" }}>role = &apos;admin&apos;</code> in <code style={{ color: "inherit" }}>public.users</code>. Ask a database admin to update your row, or use the button to open the Teacher portal.
              </Alert>
            )}
            {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>}

            <ToggleButtonGroup
              value={role} exclusive onChange={(e, val) => val && setRole(val)} fullWidth
              sx={{ mb: 4, bgcolor: "rgba(0,0,0,0.4)", p: 0.5, borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", "& .MuiToggleButton-root": { border: "none", borderRadius: "12px", color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 600, py: 1.5 } }}
            >
              <ToggleButton value="teacher" sx={{ "&.Mui-selected": { bgcolor: "#00DDB3", color: "#000", fontWeight: 800, "&:hover": { bgcolor: "#00DDB3" } } }}>Teacher</ToggleButton>
              <ToggleButton value="student" sx={{ "&.Mui-selected": { bgcolor: "#06B6D4", color: "#000", fontWeight: 800, "&:hover": { bgcolor: "#06B6D4" } } }}>Student</ToggleButton>
              <ToggleButton value="admin" sx={{ "&.Mui-selected": { bgcolor: "#06B6D4", color: "#000", fontWeight: 800, "&:hover": { bgcolor: "#06B6D4" } } }}>Admin</ToggleButton>
            </ToggleButtonGroup>

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mb: 1, display: "block", ml: 1, fontWeight: 600 }}>Email Address</Typography>
                  <TextField fullWidth variant="filled" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" disabled={loading} InputProps={{ disableUnderline: true, sx: { borderRadius: "16px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" }}} />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Password</Typography>
                    <Link sx={{ color: "#00DDB3", cursor: "pointer", fontSize: "0.75rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>Forgot?</Link>
                  </Box>
                  <TextField fullWidth type="password" variant="filled" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={loading} InputProps={{ disableUnderline: true, sx: { borderRadius: "16px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" }}} />
                </Box>
                
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 2, mt: 2, borderRadius: "50px", fontWeight: 800, fontSize: "1.1rem", textTransform: "none", background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", boxShadow: "0 10px 30px rgba(0,221,179,0.3)", "&:hover": { filter: "brightness(1.1)", boxShadow: "0 10px 40px rgba(0,221,179,0.5)" } }}>
                  {loading ? "Authenticating…" : "Enter Portal"}
                </Button>
              </Stack>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
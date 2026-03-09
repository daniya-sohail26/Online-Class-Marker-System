import React, { useState } from "react";
import { 
  Box, Typography, Button, TextField, Card, Container, 
  Link, Stack, ToggleButton, ToggleButtonGroup, GlobalStyles 
} from "@mui/material";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("teacher");

  const handleLogin = () => {
    if (role === "admin") navigate("/admin/dashboard");
    else navigate("/teacher/dashboard");
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
      bgcolor: "#042F2E", // Deepest teal base
      backgroundImage: `radial-gradient(circle at 50% 50%, #0D9488 0%, #042F2E 100%)`,
      position: "relative", overflow: "hidden" 
    }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#042F2E" } }} />

      {/* Funky Glowing Orbs - Matching Landing Page */}
      <Box sx={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, #2DD4BF 0%, transparent 70%)", top: "-10%", left: "-10%", filter: "blur(80px)", opacity: 0.3 }} />
      <Box sx={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, #00DDB3 0%, transparent 70%)", bottom: "-10%", right: "-10%", filter: "blur(80px)", opacity: 0.2 }} />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card sx={{ 
            p: 4, bgcolor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", 
            border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8,
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", mb: 1 }}>Sign In</Typography>
              <Typography variant="body2" sx={{ color: "#2DD4BF" }}>Access your ClassMarker portal</Typography>
            </Box>

            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, val) => val && setRole(val)}
              fullWidth
              sx={{ 
                mb: 4, bgcolor: "rgba(0,0,0,0.3)", p: 0.5, borderRadius: 4,
                "& .MuiToggleButton-root": { border: "none", borderRadius: 3, color: "rgba(255,255,255,0.5)" }
              }}
            >
              <ToggleButton value="teacher" sx={{ "&.Mui-selected": { bgcolor: "#00DDB3", color: "#000", fontWeight: 700 } }}>
                Teacher
              </ToggleButton>
              <ToggleButton value="admin" sx={{ "&.Mui-selected": { bgcolor: "#2DD4BF", color: "#000", fontWeight: 700 } }}>
                Admin
              </ToggleButton>
            </ToggleButtonGroup>

            <Stack spacing={2.5}>
              <TextField 
                fullWidth label="Email Address" variant="filled" 
                InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}}
                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}}
              />
              <TextField 
                fullWidth label="Password" type="password" variant="filled" 
                InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}}
                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}}
              />
              
              <Button
                fullWidth variant="contained" size="large" onClick={handleLogin}
                sx={{ 
                  py: 2, borderRadius: 4, fontWeight: 800, 
                  background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000",
                  "&:hover": { filter: "brightness(1.1)" }
                }}
              >
                Enter Portal
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ mt: 4, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
              New user? <Link onClick={() => navigate("/signup")} sx={{ color: "#00DDB3", cursor: "pointer", fontWeight: 700, textDecoration: "none" }}>Create account</Link>
            </Typography>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
import React, { useState } from "react";
import { 
  Box, Typography, Button, TextField, Card, Container, 
  Link, Stack, ToggleButton, ToggleButtonGroup, GlobalStyles 
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

// --- REUSABLE LOGO COMPONENT ---
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
      <filter id="foldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-2" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {!transparent && <rect width="256" height="256" rx="60" fill="url(#bgGrad)" />}
    <circle cx="128" cy="128" r="96" fill="none" stroke="url(#gridGrad)" strokeWidth="2" />
    <circle cx="128" cy="128" r="64" fill="none" stroke="url(#gridGrad)" strokeWidth="1" strokeDasharray="4 6" />
    <path d="M 56 180 L 92 108 L 140 172 L 200 76" fill="none" stroke="#00DDB3" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" filter="url(#glow)" />
    <path d="M 56 180 L 92 108 L 128 156" fill="none" stroke="url(#leftLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 104 124 L 140 172 L 200 76" fill="none" stroke="url(#rightLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" filter="url(#foldShadow)" />
    <circle cx="200" cy="76" r="6" fill="#FFFFFF" filter="url(#glow)" />
  </svg>
);

// --- DYNAMIC BACKGROUND FOR SIGNUP ---
const SignupBackground = () => {
  const particles = Array.from({ length: 20 });
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Tech Grid */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,221,179,0.3) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
      
      {/* Massive Ambient Glowing Orbs */}
      <Box sx={{ position: "absolute", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(0, 221, 179, 0.2) 0%, transparent 60%)", top: "-20%", right: "-20%", filter: "blur(100px)", animation: "pulse 6s infinite alternate" }} />
      <Box sx={{ position: "absolute", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, transparent 60%)", bottom: "-10%", left: "-10%", filter: "blur(120px)" }} />

      {/* Floating Particles */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -80, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: Math.random() * 8 + 8, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 5 }}
          style={{ position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: Math.random() * 4 + 2, height: Math.random() * 4 + 2, backgroundColor: "#06B6D4", borderRadius: "50%", filter: "blur(1px)" }}
        />
      ))}

      {/* Sweeping Laser Line */}
      <motion.div animate={{ y: ["-100%", "200%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", right: "10%", width: "2px", height: "60vh", background: "linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.6), transparent)", boxShadow: "0 0 20px #06B6D4" }} />
    </Box>
  );
};

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("teacher");

  const handleSignup = () => {
    // In a real app, form validation and API call happens here
    if (role === "admin") navigate("/admin/dashboard");
    else navigate("/teacher/dashboard");
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
      bgcolor: "#030712", position: "relative", overflow: "hidden" 
    }}>
      <GlobalStyles styles={{ 
        body: { backgroundColor: "#030712" },
        "@keyframes pulse": { "0%": { transform: "scale(1)", opacity: 0.8 }, "100%": { transform: "scale(1.1)", opacity: 1 } },
        "@keyframes float": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } }
      }} />

      <SignupBackground />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 10, py: 6 }}>
        
        {/* Floating Asymmetric Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} style={{ position: "absolute", top: 10, right: -40, zIndex: 20, animation: "float 4s ease-in-out infinite" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, px: 2, bgcolor: "rgba(0, 221, 179, 0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(0, 221, 179, 0.4)", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0, 221, 179, 0.2)" }}>
            <Lock size={16} color="#00DDB3" />
            <Typography variant="caption" sx={{ color: "#00DDB3", fontWeight: 800, letterSpacing: 1 }}>ENCRYPTED</Typography>
          </Box>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }}>
          
          {/* Logo Heading */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 4 }}>
            <ClassMarkerLogo size={52} transparent={true} />
            <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>
              Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box>
            </Typography>
          </Box>

          <Card sx={{ 
            p: { xs: 4, md: 5 }, 
            bgcolor: "rgba(15, 23, 42, 0.7)", 
            backdropFilter: "blur(24px)", 
            border: "1px solid rgba(0, 221, 179, 0.2)", 
            borderTop: "2px solid rgba(0, 221, 179, 0.6)", 
            borderRadius: "32px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(0, 221, 179, 0.1)" 
          }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>Create Account</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Setup your academic workspace</Typography>
            </Box>

            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, val) => val && setRole(val)}
              fullWidth
              sx={{ 
                mb: 4, bgcolor: "rgba(0,0,0,0.5)", p: 0.5, borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.05)",
                "& .MuiToggleButton-root": { border: "none", borderRadius: "12px", color: "rgba(255,255,255,0.5)", textTransform: "none", fontWeight: 600, py: 1.5 }
              }}
            >
              <ToggleButton value="teacher" sx={{ "&.Mui-selected": { bgcolor: "rgba(0, 221, 179, 0.15)", color: "#00DDB3", fontWeight: 800, border: "1px solid rgba(0, 221, 179, 0.4) !important", "&:hover": { bgcolor: "rgba(0, 221, 179, 0.25)" } } }}>
                Teacher
              </ToggleButton>
              <ToggleButton value="admin" sx={{ "&.Mui-selected": { bgcolor: "rgba(6, 182, 212, 0.15)", color: "#06B6D4", fontWeight: 800, border: "1px solid rgba(6, 182, 212, 0.4) !important", "&:hover": { bgcolor: "rgba(6, 182, 212, 0.25)" } } }}>
                Admin
              </ToggleButton>
            </ToggleButtonGroup>

            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mb: 1, display: "block", ml: 1, fontWeight: 600 }}>Full Name</Typography>
                <TextField 
                  fullWidth variant="outlined" 
                  placeholder="Dr. John Doe"
                  InputProps={{ 
                    sx: { 
                      borderRadius: "16px", bgcolor: "rgba(0,0,0,0.4)", color: "#fff",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                      "&:hover fieldset": { borderColor: "rgba(0, 221, 179, 0.4)" },
                      "&.Mui-focused fieldset": { borderColor: "#00DDB3", borderWidth: "2px" } 
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mb: 1, display: "block", ml: 1, fontWeight: 600 }}>Institutional Email</Typography>
                <TextField 
                  fullWidth variant="outlined" 
                  placeholder="john@university.edu"
                  InputProps={{ 
                    sx: { 
                      borderRadius: "16px", bgcolor: "rgba(0,0,0,0.4)", color: "#fff",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                      "&:hover fieldset": { borderColor: "rgba(0, 221, 179, 0.4)" },
                      "&.Mui-focused fieldset": { borderColor: "#00DDB3", borderWidth: "2px" } 
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mb: 1, display: "block", ml: 1, fontWeight: 600 }}>Create Password</Typography>
                <TextField 
                  fullWidth type="password" variant="outlined" 
                  placeholder="••••••••"
                  InputProps={{ 
                    sx: { 
                      borderRadius: "16px", bgcolor: "rgba(0,0,0,0.4)", color: "#fff",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                      "&:hover fieldset": { borderColor: "rgba(0, 221, 179, 0.4)" },
                      "&.Mui-focused fieldset": { borderColor: "#00DDB3", borderWidth: "2px" } 
                    }
                  }}
                />
              </Box>
              
              <Button
                fullWidth variant="contained" size="large" onClick={handleSignup}
                sx={{ 
                  py: 2, mt: 2, borderRadius: "50px", fontWeight: 900, fontSize: "1.1rem", textTransform: "none",
                  background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000",
                  boxShadow: "0 10px 30px rgba(0,221,179,0.3)",
                  transition: "all 0.2s ease",
                  "&:hover": { filter: "brightness(1.2)", transform: "translateY(-2px)", boxShadow: "0 15px 40px rgba(0,221,179,0.6)" }
                }}
              >
                Create Workspace
              </Button>
            </Stack>

            <Box sx={{ mt: 5, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                Already have an account?
              </Typography>
              <Link onClick={() => navigate("/login")} sx={{ color: "#00DDB3", cursor: "pointer", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Sign in here
              </Link>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
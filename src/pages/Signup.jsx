import React, { useState } from "react";
import { Box, Typography, Button, TextField, Card, Container, ToggleButton, ToggleButtonGroup, Link, Grid, GlobalStyles } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("teacher");

  return (
    <Box sx={{ 
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
      bgcolor: "#042F2E",
      backgroundImage: `radial-gradient(at 0% 0%, #115E59 0px, transparent 50%), 
                        radial-gradient(at 100% 100%, #0D9488 0px, transparent 50%)`,
      position: "relative", overflow: "hidden" 
    }}>
      <GlobalStyles styles={{ body: { backgroundColor: "#042F2E" } }} />
      
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card sx={{ 
            p: { xs: 4, md: 6 }, bgcolor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(30px)", 
            border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 10,
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)"
          }}>
            <Box sx={{ textAlign: "center", mb: 5 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", mb: 1, letterSpacing: -1 }}>Create Account</Typography>
              <Typography variant="body1" sx={{ color: "#2DD4BF" }}>Join the ClassMarker network</Typography>
            </Box>

            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, val) => val && setRole(val)}
              fullWidth
              sx={{ mb: 5, bgcolor: "rgba(0,0,0,0.3)", p: 0.5, borderRadius: 4 }}
            >
              <ToggleButton value="teacher" sx={{ color: "#fff", py: 1.5, "&.Mui-selected": { bgcolor: "#00DDB3", color: "#000", fontWeight: 800 } }}>Teacher</ToggleButton>
              <ToggleButton value="admin" sx={{ color: "#fff", py: 1.5, "&.Mui-selected": { bgcolor: "#2DD4BF", color: "#000", fontWeight: 800 } }}>Admin</ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}} />
              </Grid>
              {role === "admin" && (
                <Grid item xs={12}>
                  <TextField fullWidth label="Institution Code" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}} />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField fullWidth label="Password" type="password" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }}} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.4)" }}} />
              </Grid>
            </Grid>

            <Button
              fullWidth variant="contained" size="large"
              sx={{ 
                mt: 5, py: 2.2, borderRadius: 4, fontWeight: 900, fontSize: "1.1rem",
                background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000",
                boxShadow: "0 15px 30px rgba(0, 221, 179, 0.3)"
              }}
            >
              Get Started
            </Button>

            <Typography variant="body2" sx={{ mt: 4, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
              Already have an account?{" "}
              <Link onClick={() => navigate("/login")} sx={{ color: "#00DDB3", cursor: "pointer", fontWeight: 700, textDecoration: "none" }}>
                Sign In
              </Link>
            </Typography>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
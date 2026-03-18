import React from "react";
import { Box, Typography, Button, Container, Grid, Card, Avatar, GlobalStyles, AvatarGroup, TextField, IconButton, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Activity, BrainCircuit, Zap, ChevronRight, 
  ShieldCheck, BarChart3, Clock, CheckCircle2, Star, 
  TerminalSquare, Fingerprint, Layers, Quote, Github, 
  Twitter, Linkedin, Lock, LayoutTemplate, PieChart, FileText, Check
} from "lucide-react";

// --- CUSTOM SVG LOGO COMPONENT ---
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

// --- DYNAMIC BACKGROUND COMPONENT ---
const DeepBackground = () => (
  <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
    {/* Global Tech Grid */}
    <Box sx={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />
    
    {/* Massive Ambient Orbs */}
    <Box sx={{ position: "absolute", top: "-10%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(0, 221, 179, 0.12) 0%, transparent 60%)", filter: "blur(100px)" }} />
    <Box sx={{ position: "absolute", top: "30%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 60%)", filter: "blur(120px)" }} />
    <Box sx={{ position: "absolute", bottom: "-20%", left: "20%", width: "70vw", height: "40vw", background: "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)", filter: "blur(120px)" }} />

    {/* Sweeping Laser Lines */}
    <motion.div animate={{ y: ["-100%", "200%"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", left: "15%", width: "1px", height: "50vh", background: "linear-gradient(180deg, transparent, rgba(0, 221, 179, 0.5), transparent)" }} />
    <motion.div animate={{ y: ["-100%", "200%"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }} style={{ position: "absolute", right: "20%", width: "1px", height: "70vh", background: "linear-gradient(180deg, transparent, rgba(138, 43, 226, 0.5), transparent)" }} />
  </Box>
);

// --- PROCEDURAL GRAPHIC 1: Funky Hero Graphics ---
const FunkyHeroGraphics = () => {
  return (
    <Box sx={{ position: "relative", width: "100%", height: { xs: 450, md: 600 }, display: "flex", alignItems: "center", justifyContent: "center", perspective: "1000px" }}>
      
      <Box sx={{ position: "absolute", width: { xs: 300, md: 550 }, height: { xs: 300, md: 550 }, background: "conic-gradient(from 180deg at 50% 50%, #00DDB3 0deg, #06B6D4 90deg, #8A2BE2 180deg, #EC4899 270deg, #00DDB3 360deg)", filter: "blur(120px)", opacity: 0.5, animation: "spin 20s linear infinite", borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%", zIndex: 0 }} />

      <motion.div initial={{ y: 50, opacity: 0, rotateX: 10 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }} style={{ position: "relative", zIndex: 5, width: "100%", maxWidth: 450 }}>
        <Box sx={{ p: 4, borderRadius: "24px", background: "rgba(10, 15, 30, 0.7)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, alignItems: "center" }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#00DDB3", letterSpacing: 2, fontWeight: 800 }}>LIVE ENGINE</Typography>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>Data Structures Midterm</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6,182,212,0.4)", boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}>
              <Activity color="#06B6D4" size={24} />
            </Box>
          </Box>
          <Box sx={{ position: "relative", height: 8, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", mb: 3 }}>
            <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "linear-gradient(90deg, transparent, #00DDB3, #06B6D4)" }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Auto-grading submissions...</Typography>
            <Typography variant="body2" sx={{ color: "#00DDB3", fontWeight: 700, fontFamily: "monospace", textShadow: "0 0 10px rgba(0,221,179,0.5)" }}>84% Complete</Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Floating UI Elements breaking boundaries */}
      <motion.div initial={{ x: -100, opacity: 0, rotate: -40 }} animate={{ x: 0, opacity: 1, rotate: -15, y: [-10, 15, -10] }} transition={{ duration: 1, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }} style={{ position: "absolute", top: "15%", left: { xs: "0%", md: "-10%" }, zIndex: 6 }}>
        <Box sx={{ p: 2, px: 3, borderRadius: "16px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))", backdropFilter: "blur(12px)", border: "2px solid rgba(16, 185, 129, 0.6)", boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: 1 }}>
          <Star color="#10B981" fill="#10B981" size={24} />
          <Typography variant="h4" sx={{ color: "#10B981", fontWeight: 900, textShadow: "0 0 15px rgba(16,185,129,0.5)" }}>A+</Typography>
        </Box>
      </motion.div>

      <motion.div initial={{ x: 100, opacity: 0, rotate: 40 }} animate={{ x: 0, opacity: 1, rotate: 12, y: [15, -15, 15] }} transition={{ duration: 1, delay: 0.2, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }} style={{ position: "absolute", bottom: "10%", right: { xs: "-5%", md: "-15%" }, zIndex: 7 }}>
        <Box sx={{ p: 2.5, borderRadius: "20px", background: "rgba(22, 31, 61, 0.8)", backdropFilter: "blur(16px)", border: "1px solid rgba(236, 72, 153, 0.4)", boxShadow: "0 20px 40px rgba(236,72,153,0.2)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ p: 1, bgcolor: "rgba(236, 72, 153, 0.2)", borderRadius: "12px" }}><ShieldCheck color="#ec4899" size={20} /></Box>
            <Typography variant="body1" sx={{ color: "#fff", fontWeight: 700 }}>Proctoring Active</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>1 Tab Switch Detected</Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

// --- PROCEDURAL GRAPHICS FOR CARDS ---
const SecurityRadarGraphic = () => (
  <Box sx={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "20px", bgcolor: "rgba(0,0,0,0.6)", border: "1px solid rgba(6, 182, 212, 0.2)", boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)" }}>
    {[1, 2, 3].map((ring) => (<Box key={ring} sx={{ position: "absolute", width: ring * 40, height: ring * 40, borderRadius: "50%", border: "1px solid rgba(6, 182, 212, 0.3)", opacity: 0.6 }} />))}
    <Box sx={{ position: "absolute", width: "50%", height: 2, background: "linear-gradient(90deg, transparent, #06B6D4)", top: "50%", left: "50%", transformOrigin: "left center", animation: "spin 3s linear infinite", boxShadow: "0 0 20px #06B6D4" }} />
    <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(6, 182, 212, 0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(6, 182, 212, 0.6)", zIndex: 2 }}><Lock color="#06B6D4" size={20} /></Box>
    <Box sx={{ position: "absolute", top: "25%", left: "65%", width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981", animation: "pulse 1.5s infinite", boxShadow: "0 0 10px #10B981" }} />
    <Box sx={{ position: "absolute", bottom: "35%", left: "25%", width: 6, height: 6, borderRadius: "50%", bgcolor: "#F59E0B", animation: "pulse 2s infinite", boxShadow: "0 0 10px #F59E0B" }} />
  </Box>
);

const ChartGraphic = () => (
  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 80, p: 2, bgcolor: "rgba(0,0,0,0.4)", borderRadius: "16px", border: "1px solid rgba(138,43,226,0.3)" }}>
    {[40, 70, 45, 90, 60].map((h, i) => (
      <Box key={i} sx={{ width: 14, height: `${h}%`, bgcolor: i === 3 ? "#00DDB3" : "rgba(138, 43, 226, 0.6)", borderRadius: "4px", transition: "0.3s", "&:hover": { filter: "brightness(1.5)", transform: "scaleY(1.1)" } }} />
    ))}
  </Box>
);

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring" } } };

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", overflowX: "hidden", position: "relative", bgcolor: "#050810" }}>
      <GlobalStyles styles={{ 
        "#root": { width: "100%", maxWidth: "100%", margin: 0, padding: 0, overflowX: "hidden" }, 
        body: { overflowX: "hidden", backgroundColor: "#050810" },
        "@keyframes spin": { "100%": { transform: "rotate(360deg)" } },
        "@keyframes marquee": { "0%": { transform: "translateX(0%)" }, "100%": { transform: "translateX(-50%)" } },
        "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
        "@keyframes float": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } }
      }} />

      <DeepBackground />
      
      {/* NAVBAR */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 20, pt: 3, mb: { xs: 5, md: 8 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: "50px", bgcolor: "rgba(20, 25, 40, 0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
            <ClassMarkerLogo size={38} transparent={true} />
            <Typography variant="h5" sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box></Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Typography onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })} sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", "&:hover": { color: "#00DDB3" }, transition: "color 0.3s" }}>Features</Typography>
            <Typography onClick={() => document.getElementById("testimonials-section")?.scrollIntoView({ behavior: "smooth" })} sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", "&:hover": { color: "#00DDB3" }, transition: "color 0.3s" }}>Testimonials</Typography>
            <Button variant="contained" onClick={() => navigate("/teacher/dashboard")} sx={{ borderRadius: "50px", px: 4, py: 1.2, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, background: "#fff", color: "#000", boxShadow: "0 0 20px rgba(255,255,255,0.2)", "&:hover": { background: "#00DDB3", boxShadow: "0 0 30px rgba(0,221,179,0.4)" } }}>
              Portal Access
            </Button>
          </Box>
        </Box>
      </Container>

      {/* HERO SECTION */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: { xs: 10, md: 15 } }}>
        <Grid container spacing={{ xs: 6, lg: 4 }} alignItems="center">
          <Grid item xs={12} lg={6}>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1, borderRadius: "50px", bgcolor: "rgba(0, 221, 179, 0.1)", border: "1px solid rgba(0, 221, 179, 0.4)", mb: 4, boxShadow: "0 0 30px rgba(0,221,179,0.15)" }}>
                  <Zap size={16} color="#00DDB3" fill="#00DDB3" />
                  <Typography variant="caption" sx={{ color: "#00DDB3", fontWeight: 800, letterSpacing: 1.5 }}>ONLINE CLASS MARKER SYSTEM</Typography>
                </Box>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="h1" sx={{ fontSize: { xs: "3.5rem", md: "5.5rem", lg: "6.5rem" }, lineHeight: 1.05, mb: 3, color: "#fff", letterSpacing: "-0.04em", fontWeight: 900 }}>
                  Grade faster.<br />
                  <Box component="span" sx={{ background: "linear-gradient(to right, #00DDB3, #06B6D4, #8A2BE2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic", display: "inline-block" }}>
                    Teach better.
                  </Box>
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 5, fontWeight: 400, lineHeight: 1.6, maxWidth: 600, fontSize: { xs: "1.1rem", md: "1.3rem" } }}>
                  Stop wasting weekends grading papers. The definitive platform for AI-generated exams, strict live monitoring, and instant automated marking.
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
                  <Button variant="contained" size="large" onClick={() => navigate("/teacher/dashboard")} endIcon={<ChevronRight size={20} />} sx={{ px: 5, py: 2.5, borderRadius: "50px", fontSize: "1.1rem", boxShadow: "0 10px 40px rgba(0, 221, 179, 0.4)", fontWeight: 800, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", textTransform: "none" }}>
                    Start Building Free
                  </Button>
                </Box>
              </motion.div>
            </motion.div>
          </Grid>
          <Grid item xs={12} lg={6}><FunkyHeroGraphics /></Grid>
        </Grid>
      </Container>

      {/* HOW IT WORKS PIPELINE - FEATURES SECTION */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: 20 }} id="features-section">
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 2, letterSpacing: "-0.03em", fontWeight: 900 }}>The assessment pipeline.</Typography>
          <Typography variant="h6" color="text.secondary">From generation to grading in three automated steps.</Typography>
        </Box>

        <Grid container spacing={4} sx={{ position: "relative" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", top: "50%", left: "10%", width: "80%", height: "2px", background: "linear-gradient(90deg, #00DDB3, #06B6D4, #8A2BE2)", zIndex: 0, opacity: 0.5, boxShadow: "0 0 20px #06B6D4" }} />
          {[
            { step: "01", title: "Generate", text: "AI crafts the perfect exam from your syllabus.", icon: <BrainCircuit size={40} color="#00DDB3" />, color: "#00DDB3" },
            { step: "02", title: "Monitor", text: "Secure browser locks down copy-pasting & tabs.", icon: <ShieldCheck size={40} color="#06B6D4" />, color: "#06B6D4" },
            { step: "03", title: "Evaluate", text: "Results, scores, and analytics calculated instantly.", icon: <TerminalSquare size={40} color="#8A2BE2" />, color: "#8A2BE2" }
          ].map((item, i) => (
            <Grid item xs={12} md={4} key={i}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}>
                <Card sx={{ p: 5, bgcolor: "rgba(20, 25, 40, 0.8)", border: `1px solid ${item.color}40`, borderRadius: "24px", position: "relative", zIndex: 1, textAlign: "center", backdropFilter: "blur(20px)", "&:hover": { transform: "translateY(-10px)", boxShadow: `0 20px 60px ${item.color}30`, borderColor: item.color }, transition: "all 0.3s ease" }}>
                  <Typography variant="h1" sx={{ position: "absolute", top: 10, right: 20, color: "rgba(255,255,255,0.03)", fontSize: "6rem", fontWeight: 900 }}>{item.step}</Typography>
                  <Box sx={{ width: 80, height: 80, mx: "auto", mb: 3, borderRadius: "50%", bgcolor: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${item.color}50`, boxShadow: `inset 0 0 20px ${item.color}20` }}>{item.icon}</Box>
                  <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800, mb: 2 }}>{item.title}</Typography>
                  <Typography variant="body1" color="text.secondary">{item.text}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* EXTENDED BENTO BOX FEATURES GRID - TESTIMONIALS SECTION */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: 20 }} id="testimonials-section">
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 2, letterSpacing: "-0.03em", fontWeight: 900 }}>
            The Ultimate <Box component="span" sx={{ color: "#00DDB3" }}>Grading Toolkit.</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary">Everything connected. Everything automated.</Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          
          {/* Row 1: AI Bank (Tall) + Right Stack (Proctoring & Scoring) */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: { xs: 4, md: 5 }, height: "100%", bgcolor: "rgba(20, 25, 40, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", display: "flex", flexDirection: "column", position: "relative", overflow: "visible", transition: "all 0.4s ease", "&:hover": { borderColor: "rgba(0, 221, 179, 0.6)", transform: "translateY(-5px)", boxShadow: "0 20px 60px rgba(0,221,179,0.2)" } }}>
              <Box sx={{ position: "absolute", top: -100, right: -100, width: 350, height: 350, background: "radial-gradient(circle, rgba(0, 221, 179, 0.25) 0%, transparent 70%)", filter: "blur(50px)", zIndex: 0 }} />
              
              {/* Floating Widget breaking the boundary */}
              <Box sx={{ position: "absolute", top: -20, right: -20, p: 1.5, px: 2, bgcolor: "#00DDB3", borderRadius: "16px", display: "flex", alignItems: "center", gap: 1, boxShadow: "0 10px 30px rgba(0,221,179,0.4)", zIndex: 10, animation: "float 4s ease-in-out infinite" }}>
                <FileText size={18} color="#000" />
                <Typography variant="caption" sx={{ color: "#000", fontWeight: 900 }}>PDF Parsed</Typography>
              </Box>

              <Layers color="#00DDB3" size={48} style={{ marginBottom: 24, position: "relative", zIndex: 2 }} />
              <Typography variant="h3" sx={{ color: "#fff", mb: 2, fontWeight: 800, position: "relative", zIndex: 2 }}>AI Question Bank</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 1.7, mb: 4, position: "relative", zIndex: 2 }}>
                Input a topic, paste a syllabus, or upload a PDF. The AI engine constructs balanced exams with varying difficulties and custom negative marking rules in seconds.
              </Typography>
              
              <Box sx={{ mt: "auto", p: 3, borderRadius: "20px", bgcolor: "rgba(0,0,0,0.6)", border: "1px dashed rgba(0,221,179,0.5)", position: "relative", zIndex: 2 }}>
                 <Typography variant="caption" sx={{ color: "#00DDB3", fontFamily: "monospace", display: "block", mb: 1 }}>&gt; Generating React.js MCQs [50/50]</Typography>
                 <Box sx={{ width: "100%", height: 8, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div animate={{ width: ["0%", "100%", "100%"] }} transition={{ duration: 3, repeat: Infinity }} style={{ height: "100%", background: "linear-gradient(90deg, #00DDB3, #06B6D4)", boxShadow: "0 0 10px #00DDB3" }} />
                 </Box>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Stack spacing={3} height="100%">
              {/* Feature 2: Strict Proctoring */}
              <Card sx={{ p: { xs: 3, md: 4 }, bgcolor: "rgba(20, 25, 40, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", transition: "all 0.4s ease", overflow: "visible", position: "relative", "&:hover": { borderColor: "rgba(6, 182, 212, 0.6)", transform: "translateY(-5px)", boxShadow: "0 20px 60px rgba(6,182,212,0.2)" } }}>
                {/* Boundary breaking widget */}
                <Box sx={{ position: "absolute", bottom: -15, left: 30, p: 1, px: 2, bgcolor: "#10B981", borderRadius: "12px", display: "flex", alignItems: "center", gap: 1, boxShadow: "0 10px 20px rgba(16,185,129,0.3)", zIndex: 10 }}>
                  <Check size={16} color="#fff" />
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800 }}>Browser Locked</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: { xs: 3, md: 4 }, alignItems: "center", flexDirection: { xs: "column", sm: "row" } }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "rgba(6, 182, 212, 0.15)", display: "inline-block", mb: 2, border: "1px solid rgba(6, 182, 212, 0.3)" }}><ShieldCheck color="#06B6D4" size={28} /></Box>
                    <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>Strict Live Monitoring</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>Real-time dashboard showing active students. Detects tab-switching and prevents copy-pasting instantly.</Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}><SecurityRadarGraphic /></Box>
                </Box>
              </Card>

              {/* Feature 3: Auto Eval */}
              <Card sx={{ p: { xs: 3, md: 4 }, flexGrow: 1, bgcolor: "rgba(20, 25, 40, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", transition: "all 0.4s ease", overflow: "hidden", position: "relative", "&:hover": { borderColor: "rgba(138, 43, 226, 0.6)", transform: "translateY(-5px)", boxShadow: "0 20px 60px rgba(138,43,226,0.2)" } }}>
                <Box sx={{ position: "absolute", bottom: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)", filter: "blur(40px)", zIndex: 0 }} />
                <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexDirection: { xs: "column", sm: "row" }, position: "relative", zIndex: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "rgba(138, 43, 226, 0.15)", display: "inline-block", mb: 2, border: "1px solid rgba(138, 43, 226, 0.3)" }}><BarChart3 color="#8A2BE2" size={28} /></Box>
                    <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>Instant Evaluation</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>The moment the timer hits zero, the system grades every submission and applies negative marking rules automatically.</Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}><ChartGraphic /></Box>
                </Box>
              </Card>
            </Stack>
          </Grid>

          {/* Row 2: Test Templates & Analytics */}
          <Grid item xs={12} md={7}>
             <Card sx={{ p: { xs: 3, md: 4 }, height: "100%", bgcolor: "rgba(20, 25, 40, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", display: "flex", alignItems: "center", gap: 4, transition: "all 0.4s ease", "&:hover": { borderColor: "rgba(236, 72, 153, 0.6)", transform: "translateY(-5px)", boxShadow: "0 20px 60px rgba(236, 72, 153, 0.2)" } }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: "rgba(236, 72, 153, 0.15)", display: "inline-block", mb: 2, border: "1px solid rgba(236, 72, 153, 0.3)" }}><LayoutTemplate color="#ec4899" size={28} /></Box>
                  <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>Reusable Templates</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>Build structural blueprints for your Midterms or Quizzes once, and spawn endless variations with a single click.</Typography>
                </Box>
                {/* Decorative Mini-Receipt UI */}
                <Box sx={{ flexShrink: 0, p: 2, bgcolor: "rgba(0,0,0,0.5)", border: "1px dashed rgba(236,72,153,0.4)", borderRadius: "16px", display: { xs: "none", sm: "block" } }}>
                  <Box sx={{ width: 100, height: 8, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 2, mb: 1.5 }} />
                  <Box sx={{ width: 140, height: 8, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, mb: 3 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Marks</Typography>
                    <Typography variant="caption" sx={{ color: "#ec4899", fontWeight: 800 }}>100</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">Time</Typography>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800 }}>60m</Typography>
                  </Box>
                </Box>
             </Card>
          </Grid>

          <Grid item xs={12} md={5}>
             <Card sx={{ p: { xs: 3, md: 4 }, height: "100%", bgcolor: "rgba(20, 25, 40, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", position: "relative", overflow: "hidden", transition: "all 0.4s ease", "&:hover": { borderColor: "rgba(0, 221, 179, 0.6)", transform: "translateY(-5px)", boxShadow: "0 20px 60px rgba(0, 221, 179, 0.2)" } }}>
               <PieChart color="#00DDB3" size={36} style={{ marginBottom: 16 }} />
               <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800 }}>Deep Insights</Typography>
               <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>Track class performance, pinpoint weak topics, and download beautiful result sheets instantly.</Typography>
               
               <Box sx={{ position: "absolute", bottom: -20, right: -20, opacity: 0.1, transform: "rotate(-15deg)" }}>
                  <PieChart size={180} />
               </Box>
             </Card>
          </Grid>
        </Grid>
      </Container>

      {/* NEON CTA  */}
      <Box sx={{ position: "relative", zIndex: 5, py: { xs: 12, md: 15 }, bgcolor: "#02040A", textAlign: "center", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", mt: 20 }}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120vw", height: "100%", background: "conic-gradient(from 90deg at 50% 50%, #00DDB3 0deg, transparent 180deg, #06B6D4 360deg)", filter: "blur(140px)", opacity: 0.3, pointerEvents: "none", animation: "spin 25s linear infinite" }} />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h1" sx={{ color: "#fff", mb: 3, fontSize: { xs: "3rem", md: "5.5rem" }, letterSpacing: "-0.04em", fontWeight: 900 }}>Ditch the red pen.</Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)", mb: 6, fontWeight: 500, fontSize: "1.2rem", maxWidth: "80%", mx: "auto" }}>
            The Online Class Marker System handles the heavy lifting so you can focus on what actually matters—teaching.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/admin/dashboard")} sx={{ px: 8, py: 3, borderRadius: "50px", fontSize: "1.2rem", fontWeight: 800, color: "#000", background: "linear-gradient(135deg, #00DDB3, #06B6D4)", "&:hover": { filter: "brightness(1.2)", boxShadow: "0 10px 50px rgba(0,221,179,0.6)" }, boxShadow: "0 10px 40px rgba(0,221,179,0.4)", transition: "all 0.3s ease", textTransform: "none" }}>
            Setup Your Institution
          </Button>
        </Container>
      </Box>

      {/* FULL SAAS FOOTER */}
      <Box component="footer" sx={{ bgcolor: "#000", pt: 10, pb: 4, position: "relative", zIndex: 10 }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
               <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <ClassMarkerLogo size={32} transparent={true} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box></Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 300, lineHeight: 1.7 }}>
                The intelligent assessment infrastructure for modern academic institutions. Build, monitor, and grade in seconds.
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#00DDB3", bgcolor: "rgba(0,221,179,0.1)" } }}><Twitter size={20} /></IconButton>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}><Github size={20} /></IconButton>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#06B6D4", bgcolor: "rgba(6,182,212,0.1)" } }}><Linkedin size={20} /></IconButton>
              </Box>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>Product</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {["AI Generator", "Live Monitoring", "Auto-Evaluation", "Question Bank", "Pricing"].map(link => (
                  <Typography key={link} variant="body2" color="text.secondary" sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { color: "#00DDB3" } }}>{link}</Typography>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>Resources</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {["Documentation", "API Reference", "Help Center", "Case Studies", "Blog"].map(link => (
                  <Typography key={link} variant="body2" color="text.secondary" sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { color: "#00DDB3" } }}>{link}</Typography>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>Stay Updated</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>Subscribe to our newsletter for the latest AI education features and updates.</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField variant="outlined" placeholder="Enter your email" size="small" fullWidth sx={{ "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderRadius: "12px", "& fieldset": { borderColor: "rgba(255,255,255,0.1)" }, "&:hover fieldset": { borderColor: "#00DDB3" } } }} />
                <Button variant="contained" sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, px: 3, borderRadius: "12px", textTransform: "none", "&:hover": { bgcolor: "#fff" } }}>Subscribe</Button>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", pt: 4, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>© 2026 Online Class Marker System. All rights reserved.</Typography>
            <Box sx={{ display: "flex", gap: 4 }}>
               <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { color: "#fff" } }}>Privacy Policy</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { color: "#fff" } }}>Terms of Service</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
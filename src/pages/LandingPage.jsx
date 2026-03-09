import { Box, Typography, Button, Container, Grid, Card, Avatar, GlobalStyles, AvatarGroup, TextField, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Activity, BrainCircuit, Zap, ChevronRight, 
  ShieldCheck, BarChart3, Clock, CheckCircle2, Star, 
  TerminalSquare, Fingerprint, Layers, Quote, Github, Twitter, Linkedin, Lock
} from "lucide-react";

// --- PROCEDURAL GRAPHIC 1: Funky Hero Graphics ---
const FunkyHeroGraphics = () => {
  return (
    <Box sx={{ position: "relative", width: "100%", height: { xs: 450, md: 600 }, display: "flex", alignItems: "center", justifyContent: "center", perspective: "1000px" }}>
      
      {/* Dynamic Background Blob */}
      <Box sx={{ 
        position: "absolute", width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 }, 
        background: "conic-gradient(from 180deg at 50% 50%, #00DDB3 0deg, #06B6D4 120deg, #8A2BE2 240deg, #00DDB3 360deg)", 
        filter: "blur(90px)", opacity: 0.5, animation: "spin 15s linear infinite", 
        borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%", zIndex: 0 
      }} />

      {/* Main Core Widget - Evaluation Engine */}
      <motion.div
        initial={{ y: 50, opacity: 0, rotateX: 10 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        style={{ position: "relative", zIndex: 5, width: "100%", maxWidth: 450 }}
      >
        <Box sx={{ p: 4, borderRadius: 6, background: "rgba(10, 15, 30, 0.6)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, alignItems: "center" }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#00DDB3", letterSpacing: 2, fontWeight: 800 }}>LIVE ENGINE</Typography>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>Data Structures Midterm</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <Activity color="#06B6D4" size={24} />
            </Box>
          </Box>
          <Box sx={{ position: "relative", height: 8, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", mb: 3 }}>
            <motion.div animate={{ width: ["0%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "linear-gradient(90deg, transparent, #00DDB3, #06B6D4)" }}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Auto-grading submissions...</Typography>
            <Typography variant="body2" sx={{ color: "#00DDB3", fontWeight: 700, fontFamily: "monospace" }}>84% Complete</Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Floating Widget 1: A+ Grade */}
      <motion.div
        initial={{ x: -100, opacity: 0, rotate: -40 }} animate={{ x: 0, opacity: 1, rotate: -15, y: [-10, 15, -10] }} transition={{ duration: 1, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        style={{ position: "absolute", top: "15%", left: { xs: "0%", md: "-10%" }, zIndex: 6 }}
      >
        <Box sx={{ p: 2, px: 3, borderRadius: 4, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))", backdropFilter: "blur(12px)", border: "2px solid rgba(16, 185, 129, 0.5)", boxShadow: "0 20px 40px rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", gap: 1 }}>
          <Star color="#10B981" fill="#10B981" size={24} />
          <Typography variant="h4" sx={{ color: "#10B981", fontWeight: 900 }}>A+</Typography>
        </Box>
      </motion.div>

      {/* Floating Widget 2: Security Alert */}
      <motion.div
        initial={{ x: 100, opacity: 0, rotate: 40 }} animate={{ x: 0, opacity: 1, rotate: 12, y: [15, -15, 15] }} transition={{ duration: 1, delay: 0.2, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
        style={{ position: "absolute", bottom: "10%", right: { xs: "-5%", md: "-15%" }, zIndex: 7 }}
      >
        <Box sx={{ p: 2.5, borderRadius: 5, background: "rgba(22, 31, 61, 0.8)", backdropFilter: "blur(16px)", border: "1px solid rgba(6, 182, 212, 0.4)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ p: 1, bgcolor: "rgba(6, 182, 212, 0.2)", borderRadius: 2 }}><ShieldCheck color="#06B6D4" size={20} /></Box>
            <Typography variant="body1" sx={{ color: "#fff", fontWeight: 700 }}>Proctoring Active</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>1 Tab Switch Detected</Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

// --- PROCEDURAL GRAPHIC 2: Anti-Cheat Radar (FIXED LAYOUT) ---
const SecurityRadarGraphic = () => {
  return (
    // Scaled down to 160px width/height to give text more breathing room
    <Box sx={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 4, bgcolor: "rgba(0,0,0,0.4)", border: "1px solid rgba(6, 182, 212, 0.15)", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)", mx: "auto" }}>
      {/* Radar Rings */}
      {[1, 2, 3].map((ring) => (
        <Box key={ring} sx={{ position: "absolute", width: ring * 45, height: ring * 45, borderRadius: "50%", border: "1px solid rgba(6, 182, 212, 0.25)", opacity: 0.5 }} />
      ))}
      {/* Scanning Line */}
      <Box sx={{ position: "absolute", width: "50%", height: 2, background: "linear-gradient(90deg, transparent, #06B6D4)", top: "50%", left: "50%", transformOrigin: "left center", animation: "spin 3s linear infinite", boxShadow: "0 0 15px #06B6D4" }} />
      {/* Center Lock */}
      <Box sx={{ p: 1.5, borderRadius: "50%", bgcolor: "rgba(6, 182, 212, 0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(6, 182, 212, 0.5)", zIndex: 2 }}>
        <Lock color="#06B6D4" size={20} />
      </Box>
      {/* Blinking Nodes */}
      <Box sx={{ position: "absolute", top: "25%", left: "65%", width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981", animation: "pulse 1.5s infinite" }} />
      <Box sx={{ position: "absolute", bottom: "35%", left: "25%", width: 6, height: 6, borderRadius: "50%", bgcolor: "#F59E0B", animation: "pulse 2s infinite" }} />
    </Box>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring" } } };

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", overflowX: "hidden", position: "relative", bgcolor: "#070B14" }}>
      
      {/* Global CSS Reset & Animations */}
      <GlobalStyles styles={{ 
        "#root": { width: "100%", maxWidth: "100%", margin: 0, padding: 0, overflowX: "hidden" }, 
        body: { overflowX: "hidden", backgroundColor: "#070B14" },
        "@keyframes spin": { "100%": { transform: "rotate(360deg)" } },
        "@keyframes marquee": { "0%": { transform: "translateX(0%)" }, "100%": { transform: "translateX(-50%)" } },
        "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.3 } }
      }} />

      {/* Background Tech Grid */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      
      {/* NAVBAR */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 20, pt: 3, mb: { xs: 5, md: 8 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 10, bgcolor: "rgba(255, 255, 255, 0.02)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
            <Avatar sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", fontWeight: 900, width: 36, height: 36, color: "#000" }}>CM</Avatar>
            <Typography variant="h5" sx={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Typography sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", "&:hover": { color: "#fff" } }}>Features</Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", "&:hover": { color: "#fff" } }}>Testimonials</Typography>
            <Button variant="contained" size="medium" onClick={() => navigate("/teacher/dashboard")} sx={{ borderRadius: 8, px: 4, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, background: "#fff", color: "#000", "&:hover": { background: "#00DDB3" } }}>
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
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1, borderRadius: 10, bgcolor: "rgba(0, 221, 179, 0.1)", border: "1px solid rgba(0, 221, 179, 0.4)", mb: 4, boxShadow: "0 0 30px rgba(0,221,179,0.15)" }}>
                  <Zap size={16} color="#00DDB3" fill="#00DDB3" />
                  <Typography variant="caption" sx={{ color: "#00DDB3", fontWeight: 800, letterSpacing: 1.5 }}>ONLINE CLASS MARKER SYSTEM</Typography>
                </Box>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="h1" sx={{ fontSize: { xs: "3.5rem", md: "5.5rem", lg: "6rem" }, lineHeight: 1.05, mb: 3, color: "#fff", letterSpacing: "-0.04em", fontWeight: 900 }}>
                  Grade faster.<br />
                  
                  {/* FIXED BUG: Removed textShadow completely to stop WebKit ghosting */}
                  <Box component="span" sx={{ 
                    background: "linear-gradient(to right, #00DDB3, #06B6D4)", 
                    WebkitBackgroundClip: "text", 
                    WebkitTextFillColor: "transparent",
                    fontWeight: 900,
                    fontStyle: "italic",
                    display: "inline-block" // Ensures cleaner rendering
                  }}>
                    Teach better.
                  </Box>

                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 5, fontWeight: 400, lineHeight: 1.6, maxWidth: 600, fontSize: { xs: "1.1rem", md: "1.25rem" } }}>
                  Stop wasting weekends grading papers. The definitive platform for AI-generated exams, strict live monitoring, and instant automated marking.
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
                  <Button variant="contained" size="large" onClick={() => navigate("/teacher/dashboard")} endIcon={<ChevronRight size={20} />} sx={{ px: 5, py: 2.5, borderRadius: 8, fontSize: "1.1rem", boxShadow: "0 10px 30px rgba(0, 221, 179, 0.4)", fontWeight: 800, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000" }}>
                    Start Building Free
                  </Button>
                  <Button variant="outlined" size="large" sx={{ px: 5, py: 2.5, borderRadius: 8, borderColor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, "&:hover": { borderColor: "#06B6D4", bgcolor: "rgba(6,182,212,0.1)" } }}>
                    Book a Demo
                  </Button>
                </Box>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div variants={itemVariants}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, borderColor: '#070B14' } }}>
                    <Avatar src="https://i.pravatar.cc/150?img=1" />
                    <Avatar src="https://i.pravatar.cc/150?img=2" />
                    <Avatar src="https://i.pravatar.cc/150?img=3" />
                    <Avatar src="https://i.pravatar.cc/150?img=4" />
                  </AvatarGroup>
                  <Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}><Star size={14} fill="#F59E0B" color="#F59E0B"/><Star size={14} fill="#F59E0B" color="#F59E0B"/><Star size={14} fill="#F59E0B" color="#F59E0B"/><Star size={14} fill="#F59E0B" color="#F59E0B"/><Star size={14} fill="#F59E0B" color="#F59E0B"/></Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Loved by 10,000+ Educators</Typography>
                  </Box>
                </Box>
              </motion.div>

            </motion.div>
          </Grid>

          <Grid item xs={12} lg={6}>
            <FunkyHeroGraphics />
          </Grid>
        </Grid>
      </Container>

      {/* DOUBLE SCROLLING MARQUEE */}
      <Box sx={{ width: "100%", position: "relative", zIndex: 10, mb: 20 }}>
        <Box sx={{ py: 2.5, bgcolor: "#00DDB3", transform: "rotate(-2deg) scale(1.05)", borderTop: "2px solid #000", borderBottom: "2px solid #000", overflow: "hidden", position: "relative", zIndex: 2 }}>
          <Box sx={{ display: "flex", width: "200%", animation: "marquee 25s linear infinite" }}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 4, width: "33.33%", justifyContent: "space-around" }}>
                <Typography variant="h5" sx={{ color: "#000", fontWeight: 900, textTransform: "uppercase" }}>AI Question Generation</Typography>
                <Star color="#000" fill="#000" size={20} />
                <Typography variant="h5" sx={{ color: "#000", fontWeight: 900, textTransform: "uppercase" }}>Strict Live Monitoring</Typography>
                <Star color="#000" fill="#000" size={20} />
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ py: 2, bgcolor: "#8A2BE2", transform: "rotate(1deg) scale(1.05) translateY(-20px)", borderBottom: "2px solid #000", overflow: "hidden", position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", width: "200%", animation: "marquee 35s linear infinite reverse", opacity: 0.8 }}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 4, width: "33.33%", justifyContent: "space-around" }}>
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, textTransform: "uppercase" }}>Instant Auto-Evaluation</Typography>
                <Fingerprint color="#fff" size={20} />
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, textTransform: "uppercase" }}>Deep Analytics Dashboard</Typography>
                <Fingerprint color="#fff" size={20} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* HOW IT WORKS PIPELINE */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: 20 }}>
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 2, letterSpacing: "-0.03em", fontWeight: 900 }}>The complete assessment pipeline.</Typography>
          <Typography variant="h6" color="text.secondary">From generation to grading in three automated steps.</Typography>
        </Box>

        <Grid container spacing={4} sx={{ position: "relative" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", top: "50%", left: "10%", width: "80%", height: "2px", background: "linear-gradient(90deg, #00DDB3, #06B6D4, #8A2BE2)", zIndex: 0, opacity: 0.5 }} />

          {[
            { step: "01", title: "Generate", text: "AI crafts the perfect exam from your syllabus.", icon: <BrainCircuit size={40} color="#00DDB3" />, color: "#00DDB3" },
            { step: "02", title: "Monitor", text: "Secure browser locks down copy-pasting & tabs.", icon: <ShieldCheck size={40} color="#06B6D4" />, color: "#06B6D4" },
            { step: "03", title: "Evaluate", text: "Results, scores, and analytics calculated instantly.", icon: <TerminalSquare size={40} color="#8A2BE2" />, color: "#8A2BE2" }
          ].map((item, i) => (
            <Grid item xs={12} md={4} key={i}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}>
                <Card sx={{ p: 5, bgcolor: "rgba(22, 31, 61, 0.6)", border: `1px solid ${item.color}40`, borderRadius: 6, position: "relative", zIndex: 1, textAlign: "center", backdropFilter: "blur(20px)", "&:hover": { transform: "translateY(-10px)", boxShadow: `0 20px 40px ${item.color}20` }, transition: "all 0.3s ease" }}>
                  <Typography variant="h1" sx={{ position: "absolute", top: 10, right: 20, color: "rgba(255,255,255,0.03)", fontSize: "6rem", fontWeight: 900 }}>{item.step}</Typography>
                  <Box sx={{ width: 80, height: 80, mx: "auto", mb: 3, borderRadius: "50%", bgcolor: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${item.color}40` }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800, mb: 2 }}>{item.title}</Typography>
                  <Typography variant="body1" color="text.secondary">{item.text}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ASYMMETRIC BENTO BOX FEATURES GRID */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: 20 }}>
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 2, letterSpacing: "-0.03em", fontWeight: 900 }}>The Ultimate Grading Toolkit.</Typography>
          <Typography variant="h6" color="text.secondary">Everything connected. Everything automated.</Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          {/* Feature 1: The Tall Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: { xs: 4, md: 5 }, height: "100%", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "all 0.4s ease", "&:hover": { borderColor: "rgba(0, 221, 179, 0.5)", transform: "translateY(-5px)", boxShadow: "0 20px 50px rgba(0,221,179,0.15)" } }}>
              <Box sx={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(0, 221, 179, 0.2) 0%, transparent 70%)", filter: "blur(50px)" }} />
              <Layers color="#00DDB3" size={40} style={{ marginBottom: 24 }} />
              <Typography variant="h3" sx={{ color: "#fff", mb: 2, fontWeight: 800 }}>AI Question Bank</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 1.7, mb: 4 }}>
                Input a topic, paste a syllabus, or upload a PDF. The AI engine constructs balanced exams with varying difficulties and custom negative marking rules in seconds.
              </Typography>
              <Box sx={{ mt: "auto", p: 3, borderRadius: 4, bgcolor: "rgba(0,0,0,0.4)", border: "1px dashed rgba(0,221,179,0.4)" }}>
                 <Typography variant="caption" sx={{ color: "#00DDB3", fontFamily: "monospace", display: "block", mb: 1 }}>&gt; Generating React.js MCQs [50/50]</Typography>
                 <Box sx={{ width: "100%", height: 6, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div animate={{ width: ["0%", "100%", "100%"] }} transition={{ duration: 3, repeat: Infinity }} style={{ height: "100%", bgcolor: "#00DDB3" }} />
                 </Box>
              </Box>
            </Card>
          </Grid>

          {/* Right Side Stack */}
          {/* FIXED: Removed flex: 1 and height restrictions to stop clipping text */}
          <Grid item xs={12} md={7} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            {/* Feature 2: Strict Proctoring */}
            <Card sx={{ p: { xs: 3, md: 4 }, bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, transition: "all 0.4s ease", overflow: "hidden", "&:hover": { borderColor: "rgba(6, 182, 212, 0.5)", transform: "translateY(-5px)", boxShadow: "0 20px 50px rgba(6,182,212,0.15)" } }}>
              <Box sx={{ display: "flex", gap: { xs: 3, md: 4 }, alignItems: "center", flexDirection: { xs: "column", sm: "row" } }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: "rgba(6, 182, 212, 0.1)", display: "inline-block", mb: 2 }}>
                    <ShieldCheck color="#06B6D4" size={28} />
                  </Box>
                  <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                    Strict Live Monitoring
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Real-time dashboard showing active students. Detects tab-switching, prevents copy-pasting, and allows examiners to force-submit suspicious exams instantly.
                  </Typography>
                </Box>
                {/* FIXED: Graphics scaled down slightly, strict box width to prevent crushing text */}
                <Box sx={{ flexShrink: 0 }}>
                  <SecurityRadarGraphic />
                </Box>
              </Box>
            </Card>

            {/* Feature 3: Auto Eval */}
            <Card sx={{ p: { xs: 3, md: 4 }, flexGrow: 1, bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, transition: "all 0.4s ease", "&:hover": { borderColor: "rgba(138, 43, 226, 0.5)", transform: "translateY(-5px)", boxShadow: "0 20px 50px rgba(138,43,226,0.15)" } }}>
               <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexDirection: { xs: "column", sm: "row" } }}>
                <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: "rgba(138, 43, 226, 0.1)", display: "inline-block" }}>
                  <BarChart3 color="#8A2BE2" size={28} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: "#fff", mb: 1.5, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                    Instant Auto-Evaluation
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    The moment the timer hits zero, the system grades every submission, applies complex negative marking rules, and generates detailed student feedback reports automatically.
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* WALL OF LOVE / TESTIMONIALS */}
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 5, mb: 20 }}>
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <Typography variant="h2" sx={{ color: "#fff", mb: 2, letterSpacing: "-0.03em", fontWeight: 900 }}>Loved by educators.</Typography>
          <Typography variant="h6" color="text.secondary">Don't just take our word for it.</Typography>
        </Box>

        <Grid container spacing={3}>
          {[
            { name: "Dr. Sarah Jenkins", role: "Head of Computer Science", text: "ClassMarker cut my weekend grading from 8 hours to literally 0. The AI generator perfectly matches my syllabus difficulty.", color: "#00DDB3" },
            { name: "Prof. Ahmed Raza", role: "Physics Dept. Lead", text: "The live monitoring is incredible. I can see exactly when a student tabs out to search for an answer. Academic integrity secured.", color: "#06B6D4" },
            { name: "Emily Chen", role: "High School Teacher", text: "I used to dread creating finals. Now I just drop in my PDF notes, and the AI builds a 50-question test in 30 seconds. Magic.", color: "#8A2BE2" }
          ].map((test, i) => (
            <Grid item xs={12} md={4} key={i}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }}>
                <Card sx={{ p: 4, height: "100%", bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", borderTop: `2px solid ${test.color}`, borderRadius: 4, "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                  <Quote color={test.color} size={30} style={{ opacity: 0.5, marginBottom: 16 }} />
                  <Typography variant="body1" sx={{ color: "#fff", mb: 4, fontSize: "1.1rem", fontStyle: "italic" }}>"{test.text}"</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: `${test.color}20`, color: test.color, fontWeight: 700 }}>{test.name[0]}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>{test.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{test.role}</Typography>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* NEON CTA  */}
      <Box sx={{ position: "relative", zIndex: 5, py: { xs: 12, md: 15 }, bgcolor: "#05080F", textAlign: "center", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120vw", height: "100%", background: "conic-gradient(from 90deg at 50% 50%, #00DDB3 0deg, transparent 180deg, #06B6D4 360deg)", filter: "blur(140px)", opacity: 0.25, pointerEvents: "none", animation: "spin 25s linear infinite" }} />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h1" sx={{ color: "#fff", mb: 3, fontSize: { xs: "3rem", md: "5rem" }, letterSpacing: "-0.04em", fontWeight: 900 }}>Ditch the red pen.</Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)", mb: 6, fontWeight: 500, fontSize: "1.2rem", maxWidth: "80%", mx: "auto" }}>
            The Online Class Marker System handles the heavy lifting so you can focus on what actually matters—teaching.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/admin/dashboard")} sx={{ px: 8, py: 3, borderRadius: 8, fontSize: "1.2rem", fontWeight: 800, color: "#000", background: "linear-gradient(135deg, #00DDB3, #06B6D4)", "&:hover": { filter: "brightness(1.2)" }, boxShadow: "0 10px 40px rgba(0,221,179,0.5)", transition: "all 0.3s ease" }}>
            Setup Your Institution
          </Button>
        </Container>
      </Box>

      {/* FULL SAAS FOOTER */}
      <Box component="footer" sx={{ bgcolor: "#02040A", pt: 10, pb: 4, borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 10 }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} sx={{ mb: 8 }}>
            {/* Brand Column */}
            <Grid item xs={12} md={4}>
               <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Avatar sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", fontWeight: 900, width: 32, height: 32, color: "#000" }}>CM</Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                  Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 300 }}>
                The intelligent assessment infrastructure for modern academic institutions. Build, monitor, and grade in seconds.
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#00DDB3", bgcolor: "rgba(0,221,179,0.1)" } }}><Twitter size={20} /></IconButton>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}><Github size={20} /></IconButton>
                <IconButton sx={{ color: "text.secondary", "&:hover": { color: "#06B6D4", bgcolor: "rgba(6,182,212,0.1)" } }}><Linkedin size={20} /></IconButton>
              </Box>
            </Grid>

            {/* Links Columns */}
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 3 }}>Product</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {["AI Generator", "Live Monitoring", "Auto-Evaluation", "Question Bank", "Pricing"].map(link => (
                  <Typography key={link} variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#00DDB3" } }}>{link}</Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 3 }}>Resources</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {["Documentation", "API Reference", "Help Center", "Case Studies", "Blog"].map(link => (
                  <Typography key={link} variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#00DDB3" } }}>{link}</Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 3 }}>Stay Updated</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Subscribe to our newsletter for the latest AI education features.</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField 
                  variant="outlined" 
                  placeholder="Enter your email" 
                  size="small" 
                  fullWidth 
                  sx={{ 
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.1)" }, "&:hover fieldset": { borderColor: "#00DDB3" } } 
                  }} 
                />
                <Button variant="contained" sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#fff" } }}>Subscribe</Button>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", pt: 4, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
            <Typography variant="body2" color="text.secondary">© 2026 Online Class Marker System. All rights reserved.</Typography>
            <Box sx={{ display: "flex", gap: 3 }}>
               <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#fff" } }}>Privacy Policy</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#fff" } }}>Terms of Service</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
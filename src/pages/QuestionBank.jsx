import React, { useState } from "react";
import { 
  Box, Typography, Grid, Card, TextField, Button, Tabs, Tab, 
  Divider, Chip, Stack, IconButton, Paper, Avatar, Switch, 
  FormControlLabel, Select, MenuItem, Tooltip, Badge, CircularProgress,
  List, ListItem, ListItemText
} from "@mui/material";
import { 
  Sparkles, Save, Plus, FileUp, History, Calendar, 
  Trash2, Database, Bot, RefreshCcw, ArrowRight, X, 
  Wand2, Target, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestionBank() {
  // --- CORE STATE ---
  const [activeTab, setActiveTab] = useState(0); 
  const [workspaceMode, setWorkspaceMode] = useState("sandbox"); // 'sandbox' or 'official'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [files, setFiles] = useState([]); // Stores multiple File objects
  
  // Track regenerating questions
  const [regeneratingIds, setRegeneratingIds] = useState([]);
  
  // --- AI SETTINGS STATE ---
  const [prompt, setPrompt] = useState("");
  const [aiSettings, setAiSettings] = useState({
    count: 5,
    difficulty: "Medium"
  });

  // --- STAGES OF EXAM LIFECYCLE ---
  const [aiDrafts, setAiDrafts] = useState([]); // Stage 1: Sandbox
  const [officialBank, setOfficialBank] = useState([]); // Stage 2: Official Bank (Starts empty!)
  const [pastExams, setPastExams] = useState([ // Stage 3: Archives
    { title: "Midterm 2025 - Data Structures", date: "Oct 12, 2025", qs: 24 },
    { title: "Recursion Basics - Quiz 2", date: "Sep 28, 2025", qs: 10 }
  ]);

  // --- EXAM META ---
  const [examTitle, setExamTitle] = useState("Software Architecture Final");

  // --- HANDLERS: FILE UPLOAD ---
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // --- HANDLERS: AI GENERATOR (REAL API CALL) ---
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('count', aiSettings.count);
      formData.append('difficulty', aiSettings.difficulty);
      
      files.forEach(file => formData.append('files', file)); // Attach multiple PDFs

      const response = await fetch('http://localhost:5000/api/generate-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const newQuestions = await response.json();
      
      setAiDrafts(newQuestions);
      setWorkspaceMode("sandbox"); 

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Failed to generate questions. Make sure your Node backend is running!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSingle = async (id, isOfficial = false) => {
    setRegeneratingIds(prev => [...prev, id]); 
    
    try {
      const targetQ = isOfficial 
        ? officialBank.find(q => q.id === id) 
        : aiDrafts.find(q => q.id === id);

      const specificPrompt = `Provide a better, alternative version of this exact question: "${targetQ.text}". ${prompt ? "Also consider: " + prompt : ""}`;

      const formData = new FormData();
      formData.append('prompt', specificPrompt);
      formData.append('count', 1); 
      formData.append('difficulty', aiSettings.difficulty);
      files.forEach(file => formData.append('files', file));

      const response = await fetch('http://localhost:5000/api/generate-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Network error");

      const newQuestions = await response.json();
      
      if (newQuestions && newQuestions.length > 0) {
        if (isOfficial) {
          setOfficialBank(prev => prev.map(q => q.id === id ? { ...newQuestions[0], id: q.id } : q));
        } else {
          setAiDrafts(prev => prev.map(q => q.id === id ? { ...newQuestions[0], id: q.id } : q));
        }
      }
    } catch (error) {
      alert("Failed to regenerate this specific question.");
    } finally {
      setRegeneratingIds(prev => prev.filter(reqId => reqId !== id)); 
    }
  };

  // --- HANDLERS: MOVING TO OFFICIAL BANK ---
  const discardDraft = (id) => setAiDrafts(aiDrafts.filter(d => d.id !== id));
  
  const moveSingleToBank = (draft) => {
    setOfficialBank([...officialBank, draft]);
    discardDraft(draft.id);
  };

  const moveAllToBank = () => {
    setOfficialBank([...officialBank, ...aiDrafts]);
    setAiDrafts([]);
    setWorkspaceMode("official"); 
  };

  // --- HANDLERS: OFFICIAL BANK MANAGEMENT ---
  const handleAddManual = () => {
    const newQ = { id: `m-${Date.now()}`, text: "", options: ["", "", "", ""], correct: null, difficulty: "Medium", points: 1.0, isAiGenerated: false };
    setOfficialBank([newQ, ...officialBank]); 
    setWorkspaceMode("official");
  };

  const deleteFromBank = (id) => setOfficialBank(officialBank.filter(q => q.id !== id));

  const updateOfficialQuestion = (id, field, value) => {
    setOfficialBank(officialBank.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // --- PIPELINE HANDLER 1: SAVE -> MOVE TO SCHEDULER ---
  const handleSaveOfficialBank = () => {
    if (officialBank.length === 0) {
      alert("Your official bank is empty! Add questions before saving.");
      return;
    }
    
    // Simulate saving to backend DB
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Auto-redirect to Scheduler Tab (Tab index 2)
      setActiveTab(2); 
    }, 1000);
  };

  // --- PIPELINE HANDLER 2: DEPLOY -> MOVE TO PAST EXAMS ---
  const handleDeployExam = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      
      // 1. Add the new exam to the Archives
      const newPastExam = {
        title: examTitle,
        date: new Date().toLocaleDateString(),
        qs: officialBank.length
      };
      setPastExams([newPastExam, ...pastExams]);
      
      // 2. Clear the current workspace for the next exam
      setOfficialBank([]);
      setAiDrafts([]);
      setWorkspaceMode("sandbox");
      
      // 3. Auto-redirect to Past Exams Tab (Tab index 1)
      setActiveTab(1);
    }, 1500);
  };

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10, color: "#fff", minHeight: "100vh" }}>
      
      {/* --- HEADER HUD --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>Question Architect</Typography>
          <TextField 
            variant="standard" value={examTitle} onChange={(e) => setExamTitle(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontSize: "1.2rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 } }} 
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip icon={<Target size={18} />} label={`${officialBank.length} Official Qs`} sx={{ bgcolor: "rgba(0, 221, 179, 0.1)", color: "#00DDB3", fontWeight: 800, fontSize: "1rem", py: 2.5 }} />
          <Button 
            variant="contained" onClick={handleSaveOfficialBank} disabled={isSaving || officialBank.length === 0}
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />} 
            sx={{ height: 48, borderRadius: 3, px: 4, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 800 }}
          >
            {isSaving ? "Saving..." : "Save & Schedule"}
          </Button>
        </Stack>
      </Box>

      {/* --- MAIN TABS --- */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 4, borderBottom: "1px solid rgba(255,255,255,0.05)", "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", fontWeight: 700 }, "& .Mui-selected": { color: "#00DDB3 !important" } }}>
        <Tab icon={<Sparkles size={18} />} label="Creation Workspace" iconPosition="start" />
        <Tab icon={<History size={18} />} label="Past Exams" iconPosition="start" />
        <Tab icon={<Calendar size={18} />} label="Exam Scheduler" iconPosition="start" />
      </Tabs>

      {/* ========================================= */}
      {/* TAB 0: CREATION WORKSPACE (AI + Editor)   */}
      {/* ========================================= */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          
          {/* LEFT PANEL: THE AI ENGINE */}
          <Grid item xs={12} md={3.5}>
            <Stack spacing={3} sx={{ position: "sticky", top: 20 }}>
              <Card sx={{ p: 3, bgcolor: "rgba(0, 221, 179, 0.02)", border: "1px solid rgba(0, 221, 179, 0.15)", borderRadius: 4 }}>
                <Typography variant="subtitle2" sx={{ color: "#00DDB3", fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Database size={16} /> 1. UPLOAD CONTEXT
                </Typography>
                <Box sx={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 3, p: 3, textAlign: "center", mb: 2, cursor: "pointer", "&:hover": { bgcolor: "rgba(0, 221, 179, 0.05)" } }}>
                  <input type="file" multiple accept=".pdf,.txt" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload-input" />
                  <label htmlFor="file-upload-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                    <FileUp size={28} color="#00DDB3" />
                    <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.6)" }}>Click to Upload PDFs/Slides</Typography>
                  </label>
                </Box>
                <Stack spacing={1}>
                  {files.map((f, i) => (
                    <Paper key={i} sx={{ p: 1.5, px: 2, bgcolor: "rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 2 }}>
                      <Typography variant="caption" noWrap sx={{ color: "#fff", fontWeight: 700, maxWidth: 200 }}>{typeof f === 'string' ? f : f.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeFile(i)}><Trash2 size={16} /></IconButton>
                    </Paper>
                  ))}
                </Stack>
              </Card>

              <Card sx={{ p: 3, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.05)" }}>
                <Typography variant="subtitle2" sx={{ color: "#06B6D4", fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Bot size={16} /> 2. AI GENERATOR
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth type="number" label="Q. Count" variant="filled" value={aiSettings.count} onChange={(e) => setAiSettings({...aiSettings, count: e.target.value})} InputProps={{ disableUnderline: true, sx: { borderRadius: 2, bgcolor: "rgba(0,0,0,0.3)", color: "#fff" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField select fullWidth label="Difficulty" variant="filled" value={aiSettings.difficulty} onChange={(e) => setAiSettings({...aiSettings, difficulty: e.target.value})} InputProps={{ disableUnderline: true, sx: { borderRadius: 2, bgcolor: "rgba(0,0,0,0.3)", color: "#fff" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}>
                      <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <TextField 
                  fullWidth multiline rows={4} variant="filled" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Generate questions about Normalization based on the PDFs..." 
                  InputProps={{ disableUnderline: true, sx: { color: "#fff", borderRadius: 3, fontSize: "0.9rem" } }} sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)" }, mb: 2 }}
                />
                <Button 
                  fullWidth variant="contained" onClick={handleGenerateAll} disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                  sx={{ py: 1.5, background: "linear-gradient(135deg, #06B6D4, #3B82F6)", borderRadius: 3, fontWeight: 800 }}
                >
                  {isGenerating ? "Generating Previews..." : "Generate Previews"}
                </Button>
              </Card>
            </Stack>
          </Grid>

          {/* RIGHT PANEL: THE WORKSPACE */}
          <Grid item xs={12} md={8.5}>
            <Paper sx={{ p: 1, bgcolor: "rgba(0,0,0,0.3)", borderRadius: 4, display: "flex", mb: 4, border: "1px solid rgba(255,255,255,0.05)" }}>
              <Button fullWidth onClick={() => setWorkspaceMode("sandbox")} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, fontSize: "1rem", transition: "0.3s", bgcolor: workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.15)" : "transparent", color: workspaceMode === "sandbox" ? "#06B6D4" : "rgba(255,255,255,0.5)" }}>
                <Badge badgeContent={aiDrafts.length} color="info" sx={{ "& .MuiBadge-badge": { right: -15, top: 0 } }}><Wand2 size={18} style={{ marginRight: 8 }} /> AI Draft Sandbox</Badge>
              </Button>
              <Button fullWidth onClick={() => setWorkspaceMode("official")} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, fontSize: "1rem", transition: "0.3s", bgcolor: workspaceMode === "official" ? "rgba(0, 221, 179, 0.15)" : "transparent", color: workspaceMode === "official" ? "#00DDB3" : "rgba(255,255,255,0.5)" }}>
                <Badge badgeContent={officialBank.length} color="success" sx={{ "& .MuiBadge-badge": { right: -15, top: 0, bgcolor: "#00DDB3" } }}><Database size={18} style={{ marginRight: 8 }} /> Official Question Bank</Badge>
              </Button>
            </Paper>

            {/* AI SANDBOX */}
            {workspaceMode === "sandbox" && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Review Generated Drafts</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }} size="small" onClick={handleGenerateAll} disabled={isGenerating} startIcon={<RefreshCcw size={16} />}>Regenerate All</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setAiDrafts([])} disabled={aiDrafts.length === 0}>Discard All</Button>
                    <Button variant="contained" sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 700 }} onClick={moveAllToBank} disabled={aiDrafts.length === 0} startIcon={<ArrowRight />}>Move All to Bank</Button>
                  </Stack>
                </Box>

                <AnimatePresence>
                  {aiDrafts.length === 0 && (
                    <Card sx={{ p: 6, textAlign: "center", bgcolor: "rgba(255,255,255,0.01)", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 5 }}>
                      <Bot size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                      <Typography variant="h6" color="text.secondary">Sandbox is empty.</Typography>
                    </Card>
                  )}
                  {aiDrafts.map((draft, idx) => (
                    <motion.div key={draft.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card sx={{ p: 4, mb: 3, bgcolor: "rgba(6, 182, 212, 0.02)", border: "1px solid rgba(6, 182, 212, 0.2)", borderRadius: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Chip label={`Draft ${idx + 1}`} size="small" sx={{ bgcolor: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", fontWeight: 800 }} />
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Provide a smart alternative">
                              <IconButton onClick={() => handleRegenerateSingle(draft.id, false)} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} disabled={regeneratingIds.includes(draft.id)}>
                                {regeneratingIds.includes(draft.id) ? <CircularProgress size={16} color="info" /> : <RefreshCcw size={16} color="#06B6D4" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Discard Draft"><IconButton onClick={() => discardDraft(draft.id)} sx={{ bgcolor: "rgba(255,0,0,0.1)" }}><X size={16} color="#ff4d4d" /></IconButton></Tooltip>
                          </Stack>
                        </Stack>
                        
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>{draft.text}</Typography>
                        
                        <Grid container spacing={2}>
                          {draft.options.map((opt, oIdx) => (
                            <Grid item xs={12} sm={6} key={oIdx}>
                              <Paper sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", borderRadius: 3, border: draft.correct === oIdx ? "2px solid #06B6D4" : "1px solid rgba(255,255,255,0.1)", bgcolor: draft.correct === oIdx ? "rgba(6, 182, 212, 0.1)" : "rgba(0,0,0,0.2)" }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem", bgcolor: draft.correct === oIdx ? "#06B6D4" : "rgba(255,255,255,0.1)", color: draft.correct === oIdx ? "#000" : "#fff", fontWeight: 800 }}>{String.fromCharCode(65 + oIdx)}</Avatar>
                                <Typography variant="body2" sx={{ fontWeight: draft.correct === oIdx ? 700 : 400 }}>{opt}</Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>

                        <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end" }}>
                          <Button variant="contained" onClick={() => moveSingleToBank(draft)} endIcon={<ArrowRight />} sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, borderRadius: 2 }}>
                            Add to Official Bank
                          </Button>
                        </Box>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            )}

            {/* OFFICIAL BANK */}
            {workspaceMode === "official" && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Official Assessment Bank</Typography>
                  <Button startIcon={<Plus />} onClick={handleAddManual} variant="outlined" sx={{ color: "#00DDB3", borderColor: "rgba(0, 221, 179, 0.3)", borderRadius: 2 }}>Add Manual Question</Button>
                </Box>

                <AnimatePresence>
                  {officialBank.length === 0 && (
                    <Card sx={{ p: 6, textAlign: "center", bgcolor: "rgba(255,255,255,0.01)", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 5 }}>
                      <Database size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                      <Typography variant="h6" color="text.secondary">Official Bank is empty.</Typography>
                    </Card>
                  )}
                  {officialBank.map((q, idx) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card sx={{ p: 4, mb: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(0, 221, 179, 0.3)", borderRadius: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 900 }}>{idx + 1}</Avatar>
                            {q.isAiGenerated ? <Chip label="AI Sourced" size="small" variant="outlined" sx={{ color: "#06B6D4", borderColor: "#06B6D4" }} /> : <Chip label="Manual" size="small" variant="outlined" sx={{ color: "rgba(255,255,255,0.5)" }} />}
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="AI Re-phrase this specific question">
                              <IconButton onClick={() => handleRegenerateSingle(q.id, true)} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} disabled={regeneratingIds.includes(q.id)}>
                                {regeneratingIds.includes(q.id) ? <CircularProgress size={16} sx={{ color: "#00DDB3" }} /> : <RefreshCcw size={16} sx={{ color: "#00DDB3" }} />}
                              </IconButton>
                            </Tooltip>
                            <IconButton onClick={() => deleteFromBank(q.id)} color="error" sx={{ opacity: 0.6 }}><Trash2 size={18} /></IconButton>
                          </Stack>
                        </Stack>

                        <TextField 
                          fullWidth multiline variant="standard" value={q.text} onChange={(e) => updateOfficialQuestion(q.id, "text", e.target.value)}
                          placeholder="Type your question statement..." InputProps={{ disableUnderline: true, sx: { fontSize: "1.3rem", fontWeight: 800, color: "#fff", mb: 3 } }} 
                        />

                        <Grid container spacing={2}>
                          {q.options.map((opt, oIdx) => {
                            const label = String.fromCharCode(65 + oIdx);
                            const isCorrect = q.correct === oIdx;
                            return (
                              <Grid item xs={12} sm={6} key={oIdx}>
                                <Paper onClick={() => updateOfficialQuestion(q.id, "correct", oIdx)} sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", borderRadius: 3, border: isCorrect ? "2px solid #00DDB3" : "1px solid rgba(255,255,255,0.1)", bgcolor: isCorrect ? "rgba(0, 221, 179, 0.15)" : "rgba(0,0,0,0.2)", cursor: "pointer", transition: "0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                  <Avatar sx={{ width: 28, height: 28, fontSize: "0.8rem", bgcolor: isCorrect ? "#00DDB3" : "rgba(255,255,255,0.1)", color: isCorrect ? "#000" : "#fff", fontWeight: 800 }}>{label}</Avatar>
                                  <TextField 
                                    fullWidth variant="standard" value={opt} placeholder={`Option ${label}`} 
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[oIdx] = e.target.value;
                                      updateOfficialQuestion(q.id, "options", newOpts);
                                    }}
                                    InputProps={{ disableUnderline: true, sx: { color: "#fff", fontSize: "1rem" } }} 
                                  />
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>

                        <Divider sx={{ my: 3, opacity: 0.1 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Select variant="standard" value={q.difficulty} onChange={(e) => updateOfficialQuestion(q.id, "difficulty", e.target.value)} sx={{ color: "#00DDB3", fontWeight: 800, fontSize: "0.9rem" }}>
                            <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                          </Select>
                          <TextField type="number" variant="standard" value={q.points} onChange={(e) => updateOfficialQuestion(q.id, "points", parseFloat(e.target.value))} InputProps={{ disableUnderline: true, sx: { color: "#00DDB3", fontWeight: 900, width: 45, textAlign: "right", fontSize: "1.1rem" } }} />
                        </Box>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            )}

          </Grid>
        </Grid>
      )}

      {/* ========================================= */}
      {/* TAB 1: PAST EXAMS (ARCHIVES)              */}
      {/* ========================================= */}
      {activeTab === 1 && (
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          <Card sx={{ p: 0, borderRadius: 6, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <List disablePadding>
              {pastExams.map((exam, idx) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ py: 3, px: 4, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }, cursor: "pointer" }}>
                    <Box sx={{ mr: 4, p: 2, bgcolor: "rgba(0, 221, 179, 0.1)", borderRadius: 3 }}><Database size={24} color="#00DDB3" /></Box>
                    <ListItemText 
                      primary={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{exam.title}</Typography>} 
                      secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Deployed on {exam.date} • {exam.qs} Questions • Locked Key</Typography>} 
                    />
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" size="small" sx={{ borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}>View Results</Button>
                      <IconButton sx={{ color: "#00DDB3" }}><ChevronRight /></IconButton>
                    </Stack>
                  </ListItem>
                  <Divider sx={{ opacity: 0.05 }} />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Box>
      )}

      {/* ========================================= */}
      {/* TAB 2: EXAM SCHEDULER                     */}
      {/* ========================================= */}
      {activeTab === 2 && (
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
          <Card sx={{ p: 6, borderRadius: 10, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(0, 221, 179, 0.2)", textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(0, 221, 179, 0.1)", mx: 'auto', mb: 3 }}><Calendar size={40} color="#00DDB3" /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Set Exam Live</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 4 }}>You are preparing to deploy <b>{examTitle}</b> ({officialBank.length} Questions).</Typography>
            
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Execution Date" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="time" label="Launch Time" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Assigned Student Batch" placeholder="Ex: BSCS-2026-A" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }} />
              </Grid>
            </Grid>

            <Button 
              fullWidth variant="contained" onClick={handleDeployExam} disabled={isDeploying || officialBank.length === 0}
              sx={{ mt: 6, py: 2.5, bgcolor: "#00DDB3", color: "#000", fontWeight: 900, fontSize: "1.1rem", borderRadius: 3 }}
            >
              {isDeploying ? "Deploying Assessment..." : "Finalize & Deploy"}
            </Button>
            {officialBank.length === 0 && (
               <Typography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>Cannot deploy an empty exam bank.</Typography>
            )}
          </Card>
        </Box>
      )}

    </Box>
  );
}
import React, { useState } from "react";
import {
  Box, Typography, Grid, Card, TextField, Button, Tabs, Tab,
  Divider, Chip, Stack, IconButton, Paper, Avatar, Switch,
  FormControlLabel, Select, MenuItem, Tooltip, Badge, CircularProgress,
  List, ListItem, ListItemText, ListItemButton, InputLabel, FormControl,
  Dialog, DialogContent // Added Dialog imports for the new PDF Viewer
} from "@mui/material";
import {
  Sparkles, Save, Plus, FileUp, History, Calendar,
  Trash2, Database, Bot, RefreshCcw, ArrowRight, X,
  Wand2, Target, ChevronRight, SlidersHorizontal, Lightbulb, AlertCircle, PlayCircle, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCourseQuestions } from "../api/questionApi";
import { getAllCourses } from "../api/courseApi";

export default function QuestionBank() {
  // --- CORE STATE ---
  const [activeTab, setActiveTab] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState("sandbox"); // 'sandbox' or 'official'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [files, setFiles] = useState([]);
  const [regeneratingIds, setRegeneratingIds] = useState([]);

  // --- PDF MODAL STATE ---
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: "", name: "" });

  // --- GENERATOR SETTINGS STATE ---
  const [prompt, setPrompt] = useState("");
  const [sourceType, setSourceType] = useState("AI"); // 'AI', 'MANUAL', or 'HYBRID'
  const [aiSettings, setAiSettings] = useState({ count: 5, difficulty: "Medium" });

  // --- STAGES OF EXAM LIFECYCLE ---
  const [aiDrafts, setAiDrafts] = useState([]);
  const [officialBank, setOfficialBank] = useState([]);
  const [pastExams, setPastExams] = useState([
    { title: "Midterm 2026 - Data Structures", date: "Oct 12, 2026", qs: 24 }
  ]);
  const [examTitle, setExamTitle] = useState("Software Architecture Final");

  // Track the currently active question for the 3-pane editor
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // --- DATABASE SYNC ---
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const coursesData = await getAllCourses();
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
          const { questions } = await getCourseQuestions(coursesData[0].id);
          setOfficialBank(questions.map(q => ({
            id: q.id,
            text: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct: ['A', 'B', 'C', 'D'].indexOf(q.correct_option),
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points || 1.0,
            isAiGenerated: q.is_ai_generated
          })));
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Resolve active question
  const activeQuestion = workspaceMode === "official"
    ? officialBank.find(q => q.id === activeQuestionId) || officialBank[0]
    : aiDrafts.find(q => q.id === activeQuestionId) || aiDrafts[0];

  // --- HANDLERS: FILE UPLOAD & VIEWING ---
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Create local object URLs so we can render them in an iframe modal
    const filesWithUrls = selectedFiles.map(file => ({
      originalFile: file,
      name: file.name,
      previewUrl: URL.createObjectURL(file)
    }));

    setFiles(prev => [...prev, ...filesWithUrls]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const openPdfModal = (file) => {
    setPdfPreview({ open: true, url: file.previewUrl, name: file.name });
  };

  const closePdfModal = () => {
    setPdfPreview({ open: false, url: "", name: "" });
  };

  // --- HANDLERS: GENERATE MULTIPLE DRAFTS ---
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('sourceType', sourceType);
      if (sourceType !== 'MANUAL') formData.append('prompt', prompt);
      formData.append('count', aiSettings.count);
      formData.append('difficulty', aiSettings.difficulty);

      files.forEach(fObj => formData.append('files', fObj.originalFile));

      const response = await fetch('http://localhost:5000/api/generate-questions', {
        method: 'POST', body: formData,
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const newQuestions = await response.json();
      setAiDrafts(newQuestions);
      setWorkspaceMode("sandbox");
      if (newQuestions.length > 0) setActiveQuestionId(newQuestions[0].id);

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Failed to generate questions. Ensure Node backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- HANDLERS: REGENERATE SINGLE QUESTION ---
  const handleRegenerateSingle = async (id, isOfficial = false) => {
    setRegeneratingIds(prev => [...prev, id]);
    try {
      const targetQ = isOfficial ? officialBank.find(q => q.id === id) : aiDrafts.find(q => q.id === id);
      const specificPrompt = `Provide a better, alternative version of this exact question: "${targetQ.text}". ${prompt ? "Consider: " + prompt : ""}`;

      const formData = new FormData();
      formData.append('sourceType', 'AI');
      formData.append('prompt', specificPrompt);
      formData.append('count', 1);
      formData.append('difficulty', aiSettings.difficulty);
      files.forEach(fObj => formData.append('files', fObj.originalFile));

      const response = await fetch('http://localhost:5000/api/generate-questions', { method: 'POST', body: formData });
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

  // --- HANDLERS: WORKSPACE MANAGEMENT ---
  const discardDraft = (id) => {
    const updatedDrafts = aiDrafts.filter(d => d.id !== id);
    setAiDrafts(updatedDrafts);
    if (activeQuestionId === id) setActiveQuestionId(updatedDrafts[0]?.id || null);
  };

  const moveSingleToBank = (draft) => {
    setOfficialBank([...officialBank, draft]);
    discardDraft(draft.id);
    setWorkspaceMode("official");
    setActiveQuestionId(draft.id);
  };

  const moveAllToBank = () => {
    setOfficialBank([...officialBank, ...aiDrafts]);
    setAiDrafts([]);
    setWorkspaceMode("official");
    setActiveQuestionId(officialBank[0]?.id || aiDrafts[0]?.id || null);
  };

  const handleAddManual = () => {
    const newId = `m-${Date.now()}`;
    const newQ = { id: newId, text: "", options: ["", "", "", ""], correct: null, explanation: "", difficulty: "Medium", points: 1.0, isAiGenerated: false };
    setOfficialBank([newQ, ...officialBank]);
    setWorkspaceMode("official");
    setActiveQuestionId(newId);
  };

  const deleteFromBank = (id) => {
    const updatedBank = officialBank.filter(q => q.id !== id);
    setOfficialBank(updatedBank);
    if (activeQuestionId === id) setActiveQuestionId(updatedBank[0]?.id || null);
  };

  const updateActiveQuestion = (field, value) => {
    if (workspaceMode === "official") {
      setOfficialBank(officialBank.map(q => q.id === activeQuestionId ? { ...q, [field]: value } : q));
    } else {
      setAiDrafts(aiDrafts.map(q => q.id === activeQuestionId ? { ...q, [field]: value } : q));
    }
  };

  const updateOption = (index, value) => {
    if (!activeQuestion) return;
    const newOptions = [...activeQuestion.options];
    newOptions[index] = value;
    updateActiveQuestion("options", newOptions);
  };

  // --- PIPELINE: SAVE -> DEPLOY ---
  const handleSaveOfficialBank = () => {
    if (officialBank.length === 0) return alert("Your official bank is empty!");
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setActiveTab(2);
    }, 1000);
  };

  const handleDeployExam = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setPastExams([{ title: examTitle, date: new Date().toLocaleDateString(), qs: officialBank.length }, ...pastExams]);
      setOfficialBank([]);
      setAiDrafts([]);
      setWorkspaceMode("sandbox");
      setActiveTab(1);
    }, 1500);
  };

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10, color: "#fff", minHeight: "100vh" }}>

      {/* --- HEADER HUD --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.5px" }}>Question Architect</Typography>
          <TextField
            variant="standard" value={examTitle} onChange={(e) => setExamTitle(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 } }}
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip icon={<Target size={16} />} label={`${officialBank.length} Official Qs`} sx={{ bgcolor: "rgba(0, 221, 179, 0.1)", color: "#00DDB3", fontWeight: 800, fontSize: "0.95rem", py: 2.5, borderRadius: "12px" }} />
          <Button
            variant="contained" onClick={handleSaveOfficialBank} disabled={isSaving || officialBank.length === 0}
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            sx={{ height: 48, borderRadius: "12px", px: 4, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 800, textTransform: "none", fontSize: "1rem" }}
          >
            {isSaving ? "Saving..." : "Save & Schedule"}
          </Button>
        </Stack>
      </Box>

      {/* --- MAIN TABS --- */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 4, borderBottom: "1px solid rgba(255,255,255,0.05)", "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontSize: "1rem", fontWeight: 700, textTransform: "none", minHeight: 60 }, "& .Mui-selected": { color: "#00DDB3 !important" }, "& .MuiTabs-indicator": { backgroundColor: "#00DDB3", height: 3 } }}>
        <Tab icon={<Sparkles size={18} />} label="Creation Workspace" iconPosition="start" />
        <Tab icon={<History size={18} />} label="Past Exams" iconPosition="start" />
        <Tab icon={<Calendar size={18} />} label="Exam Scheduler" iconPosition="start" />
      </Tabs>

      {/* ========================================= */}
      {/* TAB 0: CREATION WORKSPACE (3-PANE IDE)    */}
      {/* ========================================= */}
      {activeTab === 0 && (
        <Grid container spacing={3} sx={{ flexGrow: 1 }}>

          {/* PANE 1: THE CONFIGURATOR (Left) */}
          <Grid item xs={12} md={3.2}>
            <Stack spacing={3} sx={{ position: "sticky", top: 20 }}>

              <Card sx={{ p: 3, bgcolor: "rgba(0, 221, 179, 0.02)", border: "1px solid rgba(0, 221, 179, 0.15)", borderRadius: "24px" }}>
                <Typography variant="subtitle2" sx={{ color: "#00DDB3", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1, letterSpacing: "0.5px" }}><Database size={16} /> 1. UPLOAD CONTEXT</Typography>
                <Box sx={{ border: "2px dashed rgba(0, 221, 179, 0.2)", borderRadius: "16px", p: 3, textAlign: "center", mb: 2, cursor: "pointer", transition: "0.2s", "&:hover": { bgcolor: "rgba(0, 221, 179, 0.05)", borderColor: "rgba(0, 221, 179, 0.4)" } }}>
                  <input type="file" multiple accept=".pdf,.txt" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload-input" />
                  <label htmlFor="file-upload-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                    <FileUp size={28} color="#00DDB3" style={{ marginBottom: 4 }} />
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Click to Upload PDFs</Typography>
                  </label>
                </Box>
                <Stack spacing={1}>
                  {files.map((f, i) => (
                    <Paper key={i} sx={{ p: 1, pl: 2, bgcolor: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Typography variant="caption" noWrap sx={{ color: "#fff", fontWeight: 600, maxWidth: 140 }}>{f.name}</Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Preview PDF Document">
                          <IconButton size="small" onClick={() => openPdfModal(f)} sx={{ p: 0.5, color: "rgba(255,255,255,0.4)", "&:hover": { color: "#06B6D4" } }}><Eye size={16} /></IconButton>
                        </Tooltip>
                        <IconButton size="small" color="error" onClick={() => removeFile(i)} sx={{ p: 0.5 }}><Trash2 size={16} /></IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Card>

              <Card sx={{ p: 3, bgcolor: "rgba(6, 182, 212, 0.02)", borderRadius: "24px", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <Typography variant="subtitle2" sx={{ color: "#06B6D4", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1, letterSpacing: "0.5px" }}><SlidersHorizontal size={16} /> 2. GENERATOR SETTINGS</Typography>

                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Generation Source</Typography>
                <FormControl fullWidth variant="filled" sx={{ mb: 3, "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" } }}>
                  <Select value={sourceType} onChange={(e) => setSourceType(e.target.value)} disableUnderline sx={{ fontWeight: 600 }}>
                    <MenuItem value="AI">AI Only (Auto-generate all)</MenuItem>
                    <MenuItem value="MANUAL">Manual Only (Create blank templates)</MenuItem>
                    <MenuItem value="HYBRID">Hybrid (Half AI, Half Blank Templates)</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Q. Count</Typography>
                    <TextField fullWidth type="number" variant="filled" value={aiSettings.count} onChange={(e) => setAiSettings({ ...aiSettings, count: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)" } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Difficulty</Typography>
                    <TextField select fullWidth variant="filled" value={aiSettings.difficulty} onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)" } }}>
                      <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <AnimatePresence>
                  {sourceType !== 'MANUAL' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>AI Instructions (Optional)</Typography>
                      <TextField
                        fullWidth multiline rows={3} variant="filled" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Focus strictly on Chapter 4 concepts..."
                        InputProps={{ disableUnderline: true, sx: { color: "#fff", borderRadius: "12px", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.05)" } }} sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)" }, mb: 3 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  fullWidth variant="contained" onClick={handleGenerateAll} disabled={isGenerating}
                  startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : (sourceType === 'MANUAL' ? <PlayCircle size={18} /> : <Sparkles size={18} />)}
                  sx={{ py: 1.8, background: sourceType === 'MANUAL' ? "linear-gradient(135deg, #06B6D4, #3B82F6)" : "linear-gradient(135deg, #06B6D4, #3B82F6)", borderRadius: "12px", fontWeight: 800, textTransform: "none", fontSize: "1.05rem" }}
                >
                  {isGenerating ? "Processing Request..." : (sourceType === 'MANUAL' ? "Create Blank Templates" : "Generate Previews")}
                </Button>
              </Card>
            </Stack>
          </Grid>

          {/* PANE 2 & 3: THE WORKSPACE (Middle & Right) */}
          <Grid item xs={12} md={8.8}>

            <Paper sx={{ p: 0.5, bgcolor: "rgba(0,0,0,0.4)", borderRadius: "50px", display: "flex", mb: 3, border: "1px solid rgba(255,255,255,0.05)", width: "fit-content" }}>
              <Button onClick={() => { setWorkspaceMode("sandbox"); setActiveQuestionId(aiDrafts[0]?.id || null); }} sx={{ px: 4, py: 1.2, borderRadius: "50px", fontWeight: 700, fontSize: "0.95rem", textTransform: "none", transition: "0.3s", bgcolor: workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.15)" : "transparent", color: workspaceMode === "sandbox" ? "#06B6D4" : "rgba(255,255,255,0.5)" }}>
                <Wand2 size={16} style={{ marginRight: 8 }} /> Generated Draft Sandbox
                {aiDrafts.length > 0 && <Chip label={aiDrafts.length} size="small" sx={{ ml: 1.5, height: 20, fontSize: "0.7rem", bgcolor: workspaceMode === "sandbox" ? "#06B6D4" : "rgba(255,255,255,0.1)", color: workspaceMode === "sandbox" ? "#000" : "#fff", fontWeight: 800 }} />}
              </Button>
              <Button onClick={() => { setWorkspaceMode("official"); setActiveQuestionId(officialBank[0]?.id || null); }} sx={{ px: 4, py: 1.2, borderRadius: "50px", fontWeight: 700, fontSize: "0.95rem", textTransform: "none", transition: "0.3s", bgcolor: workspaceMode === "official" ? "rgba(0, 221, 179, 0.15)" : "transparent", color: workspaceMode === "official" ? "#00DDB3" : "rgba(255,255,255,0.5)" }}>
                <Database size={16} style={{ marginRight: 8 }} /> Official Question Bank
                {officialBank.length > 0 && <Chip label={officialBank.length} size="small" sx={{ ml: 1.5, height: 20, fontSize: "0.7rem", bgcolor: workspaceMode === "official" ? "#00DDB3" : "rgba(255,255,255,0.1)", color: workspaceMode === "official" ? "#000" : "#fff", fontWeight: 800 }} />}
              </Button>
            </Paper>

            <Grid container spacing={3}>
              {/* MIDDLE PANE: OUTLINE NAVIGATOR */}
              <Grid item xs={4.5}>
                <Card sx={{ p: 2, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", height: "calc(100vh - 270px)", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{workspaceMode === 'sandbox' ? "Sandbox Outline" : "Bank Outline"}</Typography>

                    {workspaceMode === "official" && (sourceType === 'MANUAL' || sourceType === 'HYBRID') && (
                      <Tooltip title="Add Blank Question Card">
                        <IconButton onClick={handleAddManual} sx={{ color: "#00DDB3", bgcolor: "rgba(0, 221, 179, 0.1)", p: 1, "&:hover": { bgcolor: "rgba(0, 221, 179, 0.2)" } }}><Plus size={18} /></IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <List sx={{ flexGrow: 1, overflowY: "auto", px: 0 }}>
                    {(workspaceMode === "sandbox" ? aiDrafts : officialBank).map((q, idx) => {
                      const isMissingAnswer = q.correct === null;
                      return (
                        <ListItemButton
                          key={q.id} selected={activeQuestionId === q.id} onClick={() => setActiveQuestionId(q.id)}
                          sx={{ borderRadius: "16px", mb: 1, p: 1.5, transition: "0.2s", "&.Mui-selected": { bgcolor: workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.1)" : "rgba(0, 221, 179, 0.1)", border: `1px solid ${workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.3)" : "rgba(0, 221, 179, 0.3)"}` }, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
                        >
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 900, bgcolor: activeQuestionId === q.id ? (workspaceMode === 'sandbox' ? "#06B6D4" : "#00DDB3") : "rgba(255,255,255,0.05)", color: activeQuestionId === q.id ? "#000" : "#fff", mr: 1.5 }}>{idx + 1}</Avatar>
                          <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 700, color: activeQuestionId === q.id ? "#fff" : "rgba(255,255,255,0.8)" }} noWrap>{q.text || "Empty Statement..."}</Typography>} secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{q.difficulty} • {q.points} Pts</Typography>} />
                          {isMissingAnswer && <Tooltip title="Missing Answer Key"><AlertCircle size={16} color="#f59e0b" /></Tooltip>}
                        </ListItemButton>
                      );
                    })}
                    {(workspaceMode === "sandbox" ? aiDrafts : officialBank).length === 0 && (
                      <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.5 }}>
                        <Typography variant="body2">List is empty.</Typography>
                      </Box>
                    )}
                  </List>

                  {workspaceMode === "sandbox" && aiDrafts.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <Button fullWidth variant="contained" onClick={moveAllToBank} sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, mb: 1, borderRadius: "12px", textTransform: "none" }}>Approve All to Bank</Button>
                      <Button fullWidth variant="outlined" color="error" size="small" onClick={() => { setAiDrafts([]); setActiveQuestionId(null) }} sx={{ borderRadius: "12px", textTransform: "none", borderColor: "rgba(255,0,0,0.3)" }}>Discard All</Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* RIGHT PANE: ACTIVE EDITOR */}
              <Grid item xs={7.5}>
                {activeQuestion ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeQuestionId} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                      <Card sx={{ p: 4, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", height: "calc(100vh - 270px)", overflowY: "auto" }}>

                        <Stack direction="row" justifyContent="space-between" mb={4} alignItems="center">
                          <Chip label={activeQuestion.isAiGenerated ? "AI GENERATED" : "MANUAL ENTRY"} size="small" sx={{ bgcolor: activeQuestion.isAiGenerated ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.05)", color: activeQuestion.isAiGenerated ? "#06B6D4" : "rgba(255,255,255,0.6)", fontWeight: 900, borderRadius: "8px" }} />
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="AI Rewrite (Generates an alternative to this question)">
                              <IconButton onClick={() => handleRegenerateSingle(activeQuestion.id, workspaceMode === 'official')} sx={{ bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(6, 182, 212, 0.2)" } }} disabled={regeneratingIds.includes(activeQuestion.id)}>
                                {regeneratingIds.includes(activeQuestion.id) ? <CircularProgress size={18} color="info" /> : <RefreshCcw size={18} color="#06B6D4" />}
                              </IconButton>
                            </Tooltip>
                            {workspaceMode === "sandbox" && (
                              <Button variant="contained" onClick={() => moveSingleToBank(activeQuestion)} sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, ml: 2, px: 3, borderRadius: "12px", textTransform: "none" }}>Approve to Bank</Button>
                            )}
                            {workspaceMode === "official" && (
                              <IconButton color="error" onClick={() => deleteFromBank(activeQuestion.id)} sx={{ opacity: 0.8, ml: 1, bgcolor: "rgba(255,0,0,0.1)", "&:hover": { bgcolor: "rgba(255,0,0,0.2)" } }}><Trash2 size={18} /></IconButton>
                            )}
                          </Stack>
                        </Stack>

                        <TextField
                          fullWidth multiline variant="standard" value={activeQuestion.text} onChange={(e) => updateActiveQuestion("text", e.target.value)}
                          placeholder="Type the question statement here..." InputProps={{ disableUnderline: true, sx: { fontSize: "1.4rem", fontWeight: 800, color: "#fff", mb: 4, lineHeight: 1.5 } }}
                        />

                        <Grid container spacing={2.5} sx={{ mb: 4 }}>
                          {activeQuestion.options.map((opt, oIdx) => {
                            const label = String.fromCharCode(65 + oIdx);
                            const isCorrect = activeQuestion.correct === oIdx;
                            return (
                              <Grid item xs={12} sm={6} key={oIdx}>
                                <Paper onClick={() => updateActiveQuestion("correct", oIdx)} sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2, borderRadius: "16px", bgcolor: isCorrect ? "rgba(0, 221, 179, 0.1)" : "rgba(0,0,0,0.3)", border: isCorrect ? "2px solid #00DDB3" : "2px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s ease", "&:hover": { bgcolor: isCorrect ? "rgba(0, 221, 179, 0.15)" : "rgba(255,255,255,0.05)", border: isCorrect ? "2px solid #00DDB3" : "2px solid rgba(255,255,255,0.2)" } }}>
                                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem', fontWeight: 900, bgcolor: isCorrect ? "#00DDB3" : "rgba(255,255,255,0.05)", color: isCorrect ? "#000" : "#fff" }}>{label}</Avatar>
                                  <TextField fullWidth multiline variant="standard" value={opt} onChange={(e) => updateOption(oIdx, e.target.value)} placeholder={`Option ${label}`} InputProps={{ disableUnderline: true, sx: { color: "#fff", fontSize: "1.05rem", fontWeight: 500 } }} />
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>

                        <Box sx={{ p: 3, bgcolor: "rgba(6, 182, 212, 0.03)", borderRadius: "16px", border: "1px dashed rgba(6, 182, 212, 0.2)", mb: 4 }}>
                          <Typography variant="caption" sx={{ color: "#06B6D4", fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}><Lightbulb size={14} /> Answer Explanation</Typography>
                          <TextField fullWidth multiline variant="standard" value={activeQuestion.explanation} onChange={(e) => updateActiveQuestion("explanation", e.target.value)} placeholder="Explain why this answer is correct (shown to students post-exam)..." InputProps={{ disableUnderline: true, sx: { color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" } }} />
                        </Box>

                        <Divider sx={{ mb: 3, opacity: 0.1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: "rgba(0,0,0,0.2)", p: 2, borderRadius: "16px" }}>
                          <Stack direction="row" spacing={4} alignItems="center">
                            <FormControlLabel control={<Switch defaultChecked sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }} />} label={<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Auto-Grade</Typography>} />
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Difficulty:</Typography>
                              <Select variant="standard" value={activeQuestion.difficulty} onChange={(e) => updateActiveQuestion("difficulty", e.target.value)} sx={{ color: "#06B6D4", fontSize: "0.95rem", fontWeight: 800, disableUnderline: true }}>
                                <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                              </Select>
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Points:</Typography>
                            <TextField type="number" variant="standard" value={activeQuestion.points} onChange={(e) => updateActiveQuestion("points", parseFloat(e.target.value))} InputProps={{ disableUnderline: true, sx: { color: "#00DDB3", fontWeight: 900, width: 50, textAlign: "right", fontSize: "1.1rem" } }} />
                          </Stack>
                        </Box>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <Card sx={{ height: "calc(100vh - 270px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.01)", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: "24px" }}>
                    <Target size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>Select a question to begin editing.</Typography>
                  </Card>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* ========================================= */}
      {/* TAB 1: PAST EXAMS (ARCHIVES)              */}
      {/* ========================================= */}
      {activeTab === 1 && (
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          <Card sx={{ p: 0, borderRadius: "24px", bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <List disablePadding>
              {pastExams.map((exam, idx) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ py: 3, px: 4, transition: "0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }, cursor: "pointer" }}>
                    <Box sx={{ mr: 4, p: 2, bgcolor: "rgba(0, 221, 179, 0.1)", borderRadius: "16px" }}><Database size={24} color="#00DDB3" /></Box>
                    <ListItemText
                      primary={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{exam.title}</Typography>}
                      secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Deployed on {exam.date} • {exam.qs} Questions • Locked Key</Typography>}
                    />
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Button variant="outlined" size="small" onClick={() => navigate(`/exam-results/${exam.title.replace(/\s+/g, '-').toLowerCase()}`)} sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#fff", textTransform: "none", borderRadius: "8px" }}>View Results</Button>
                      <IconButton sx={{ color: "#00DDB3", bgcolor: "rgba(0, 221, 179, 0.1)" }}><ChevronRight size={18} /></IconButton>
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
          <Card sx={{ p: 6, borderRadius: "24px", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(0, 221, 179, 0.2)", textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(0, 221, 179, 0.1)", mx: 'auto', mb: 3 }}><Calendar size={40} color="#00DDB3" /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Set Exam Live</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 4 }}>You are preparing to deploy <b>{examTitle}</b> ({officialBank.length} Questions).</Typography>

            <Grid container spacing={4} sx={{ mt: 2, textAlign: "left" }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Execution Date" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="time" label="Launch Time" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Assigned Student Batch" placeholder="Ex: BSCS-2026-A" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} />
              </Grid>
            </Grid>

            <Button
              fullWidth variant="contained" onClick={handleDeployExam} disabled={isDeploying || officialBank.length === 0}
              sx={{ mt: 6, py: 2.5, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 900, fontSize: "1.1rem", borderRadius: "12px", textTransform: "none" }}
            >
              {isDeploying ? "Deploying Assessment..." : "Finalize & Deploy to Students"}
            </Button>
            {officialBank.length === 0 && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 2, fontWeight: 600 }}>Cannot deploy an empty exam bank. Return to Creation Workspace.</Typography>
            )}
          </Card>
        </Box>
      )}

      {/* ========================================= */}
      {/* GLOBAL: PDF PREVIEW MODAL                 */}
      {/* ========================================= */}
      <Dialog
        open={pdfPreview.open}
        onClose={closePdfModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '85vh', bgcolor: '#121212', borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: "#1a1a1a" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FileUp size={24} color="#00DDB3" />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>{pdfPreview.name}</Typography>
          </Stack>
          <IconButton onClick={closePdfModal} sx={{ color: 'rgba(255,255,255,0.5)', "&:hover": { color: "#fff" } }}><X size={24} /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, bgcolor: "#242424" }}>
          <iframe
            src={`${pdfPreview.url}#view=FitH&toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="PDF Preview"
          />
        </DialogContent>
      </Dialog>

    </Box>
  );
}
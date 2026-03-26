import React, { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, TextField, Button, Tabs, Tab,
  Divider, Chip, Stack, IconButton, Paper, Avatar, Switch,
  FormControlLabel, Select, MenuItem, Tooltip, CircularProgress,
  List, ListItem, ListItemText, ListItemButton, FormControl,
  Dialog, DialogContent, Snackbar, Alert
} from "@mui/material";
import {
  Sparkles, Save, Plus, FileUp, History, Calendar,
  Trash2, Database, RefreshCcw, X, Wand2, Target, 
  ChevronRight, SlidersHorizontal, Lightbulb, AlertCircle, PlayCircle, Eye,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// --- AUTH & DB IMPORTS ---
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../server/config/supabaseClient";

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default function QuestionBank() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState("sandbox");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [files, setFiles] = useState([]);
  const [regeneratingIds, setRegeneratingIds] = useState([]);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });
  const handleCloseToast = () => setToast({ ...toast, open: false });
  const [pdfPreview, setPdfPreview] = useState({ open: false, url: "", name: "" });

  const [viewExamModal, setViewExamModal] = useState({ open: false, title: "", questions: [] });
  const [isLoadingExam, setIsLoadingExam] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [sourceType, setSourceType] = useState("HYBRID");
  const [aiSettings, setAiSettings] = useState({ count: 5, difficulty: "Medium" });

  const [aiDrafts, setAiDrafts] = useState([]);
  const [officialBank, setOfficialBank] = useState([]);
  const [pastExams, setPastExams] = useState([]);
  const [examTitle, setExamTitle] = useState("Course Final Assessment");
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("new");

  const [schedulingData, setSchedulingData] = useState({ date: "", time: "", duration: 60, batch: "" });

  // --- 🌟 3-STEP BRIDGE FETCHER 🌟 ---
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!profile) return;

      try {
        const authId = profile.user_id || profile.id;
        let dbUserId = authId;

        if (profile.email) {
          const { data: userByEmail } = await supabase.from("users").select("id").eq("email", profile.email).maybeSingle();
          if (userByEmail && userByEmail.id) dbUserId = userByEmail.id;
        }

        if (dbUserId === authId) {
           const columnsToTry = ["auth_id", "user_id"];
           for (const col of columnsToTry) {
               const { data: userByCol } = await supabase.from("users").select("id").eq(col, authId).maybeSingle();
               if (userByCol && userByCol.id) { dbUserId = userByCol.id; break; }
           }
        }

        const { data: teacherData } = await supabase.from("teachers").select("course_id").eq("user_id", dbUserId).not("course_id", "is", null).maybeSingle();

        if (teacherData && teacherData.course_id) {
          const { data: courseData } = await supabase.from("courses").select("id, name").eq("id", teacherData.course_id).maybeSingle();
          if (courseData) {
            setCourses([courseData]);
            setSelectedCourseId(courseData.id);
          }
        }
      } catch (error) {
        console.error("Course Fetch Error:", error);
      }
    };
    
    fetchTeacherData();
  }, [profile]);

  // --- 🌟 ADVANCED RELATIONAL FETCHING 🌟 ---
  const fetchCourseData = async () => {
    if (!selectedCourseId) {
      setOfficialBank([]);
      setTemplates([]);
      setPastExams([]);
      return;
    }
    
    try {
      const { data: questions } = await supabase
        .from("questions")
        .select(`*, test_questions(test_id)`)
        .eq("course_id", selectedCourseId);

      if (questions) {
        const unusedQuestions = questions.filter(q => !q.test_questions || q.test_questions.length === 0);
        setOfficialBank(unusedQuestions.map(q => ({
          id: q.id,
          text: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correct: ['A', 'B', 'C', 'D'].indexOf(q.correct_option),
          explanation: q.explanation || "",
          difficulty: q.difficulty ? (q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)) : "Medium",
          points: 1.0, 
          isAiGenerated: q.is_ai_generated || false
        })));
      }

      const { data: fetchedTemplates } = await supabase.from("templates").select("*").eq("course_id", selectedCourseId);
      if (fetchedTemplates) setTemplates(fetchedTemplates);

      const { data: pastTests } = await supabase
        .from("tests")
        .select(`id, name, test_schedules ( availability_start ), test_questions ( question_id )`)
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: false });

      if (pastTests) {
        const formattedPastExams = pastTests.map(pt => {
          const schedule = pt.test_schedules && pt.test_schedules.length > 0 ? pt.test_schedules[0].availability_start : null;
          const date = schedule ? new Date(schedule).toLocaleDateString() : "Unscheduled";
          return { id: pt.id, title: pt.name, date: date, qs: pt.test_questions ? pt.test_questions.length : 0 };
        });
        setPastExams(formattedPastExams);
      }
      
    } catch (err) {
      console.error("Error fetching course data:", err);
    }
  };

  useEffect(() => {
    fetchCourseData();
    setSelectedTemplateId("new"); 
  }, [selectedCourseId]);

  const handleViewExamDetails = async (exam) => {
    setIsLoadingExam(true);
    try {
      const { data: testQs, error } = await supabase.from("test_questions").select("questions(*)").eq("test_id", exam.id);
      if (error) throw error;
      const extractedQuestions = testQs.map(item => item.questions).filter(Boolean);
      setViewExamModal({ open: true, title: exam.title, questions: extractedQuestions });
    } catch (err) {
      showToast("Error retrieving exam details from database.", "error");
    } finally {
      setIsLoadingExam(false);
    }
  };

  const handleTemplateChange = (e) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);
    if (tempId !== "new") {
      const selected = templates.find(t => t.id === tempId);
      if (selected) {
        setAiSettings(prev => ({ ...prev, count: selected.total_questions || prev.count }));
        setExamTitle(selected.name || examTitle);
      }
    }
  };

  const activeQuestion = workspaceMode === "official"
    ? officialBank.find(q => q.id === activeQuestionId) || officialBank[0]
    : aiDrafts.find(q => q.id === activeQuestionId) || aiDrafts[0];

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const filesWithUrls = selectedFiles.map(file => ({ originalFile: file, name: file.name, previewUrl: URL.createObjectURL(file) }));
    setFiles(prev => [...prev, ...filesWithUrls]);
  };

  const removeFile = (indexToRemove) => setFiles(files.filter((_, index) => index !== indexToRemove));
  const openPdfModal = (file) => setPdfPreview({ open: true, url: file.previewUrl, name: file.name });
  const closePdfModal = () => setPdfPreview({ open: false, url: "", name: "" });

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      
      // THE FIX: If HYBRID is selected, we still force the backend to generate AI questions. 
      // The only difference is the UI allows blank templates to be manually added.
      const backendSourceType = sourceType === 'HYBRID' ? 'AI' : sourceType;
      formData.append('sourceType', backendSourceType); 
      
      if (backendSourceType !== 'MANUAL') formData.append('prompt', prompt);
      formData.append('count', aiSettings.count);
      formData.append('difficulty', aiSettings.difficulty);
      files.forEach(fObj => formData.append('files', fObj.originalFile));

      const response = await fetch('http://localhost:5000/api/generate-questions', { method: 'POST', body: formData });
      if (!response.ok) throw new Error("Network response was not ok");
      
      const newQuestions = await response.json();
      const formatted = newQuestions.map(q => ({ 
        ...q, 
        id: q.id && isValidUUID(q.id) ? q.id : crypto.randomUUID(),
        isAiGenerated: backendSourceType === 'AI'
      }));
      setAiDrafts(formatted);
      setWorkspaceMode("sandbox");
      if (formatted.length > 0) setActiveQuestionId(formatted[0].id);

    } catch (error) {
      showToast("Failed to generate questions. Ensure Node backend is running.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

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
        const replacementQ = { ...newQuestions[0], isAiGenerated: true };
        if (isOfficial) {
          setOfficialBank(prev => prev.map(q => q.id === id ? { ...replacementQ, id: q.id } : q));
        } else {
          setAiDrafts(prev => prev.map(q => q.id === id ? { ...replacementQ, id: q.id } : q));
        }
      }
    } catch (error) {
      showToast("Failed to regenerate this specific question.", "error");
    } finally {
      setRegeneratingIds(prev => prev.filter(reqId => reqId !== id));
    }
  };

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
    const newId = crypto.randomUUID(); 
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
    if (workspaceMode === "official") setOfficialBank(officialBank.map(q => q.id === activeQuestionId ? { ...q, [field]: value } : q));
    else setAiDrafts(aiDrafts.map(q => q.id === activeQuestionId ? { ...q, [field]: value } : q));
  };

  const updateOption = (index, value) => {
    if (!activeQuestion) return;
    const newOptions = [...activeQuestion.options];
    newOptions[index] = value;
    updateActiveQuestion("options", newOptions);
  };

  const saveBankToDatabase = async () => {
    if (officialBank.length === 0) throw new Error("Question bank is empty!");
    if (!selectedCourseId) throw new Error("No course selected/assigned to save against.");
    const courseName = courses.find(c => c.id === selectedCourseId)?.name || 'General';

    const questionsToSave = officialBank.map(q => {
      const uuid = (q.id && isValidUUID(q.id)) ? q.id : crypto.randomUUID();
      q.id = uuid; 
      return {
        id: uuid, course_id: selectedCourseId, question_text: q.text, option_a: q.options[0] || "", option_b: q.options[1] || "",
        option_c: q.options[2] || "", option_d: q.options[3] || "", correct_option: ['A', 'B', 'C', 'D'][q.correct] || 'A', 
        explanation: q.explanation || "", difficulty: (q.difficulty || "medium").toLowerCase(), is_ai_generated: q.isAiGenerated || false, 
        source_type: q.isAiGenerated ? 'AI' : 'MANUAL', 
        topic: courseName 
      };
    });

    const { error } = await supabase.from("questions").upsert(questionsToSave, { onConflict: 'id' });
    if (error) throw new Error(`Database Error: ${error.message}`);
    setOfficialBank([...officialBank]); 
  };

  const handleSaveOfficialBank = async () => {
    setIsSaving(true);
    try {
      await saveBankToDatabase();
      showToast("Question bank synced to database successfully!", "success");
      setActiveTab(2); 
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeployExam = async () => {
    if (!schedulingData.date || !schedulingData.time) return showToast("Please select a date and time.", "warning");
    
    setIsDeploying(true);
    try {
      await saveBankToDatabase();
      let templateIdToUse = selectedTemplateId;

      if (!templateIdToUse || templateIdToUse === "new") {
        const { data: template, error: tError } = await supabase.from('templates').insert([{ course_id: selectedCourseId, name: examTitle, total_questions: officialBank.length, duration_minutes: schedulingData.duration, template_type: 'exam', is_active: true }]).select().single();
        if (tError) throw new Error(`Template Error: ${tError.message}`);
        templateIdToUse = template.id;
      }

      const { data: test, error: testError } = await supabase.from('tests').insert([{ name: examTitle, course_id: selectedCourseId, template_id: templateIdToUse }]).select().single();
      if (testError) throw new Error(`Test Instance Error: ${testError.message}`);

      const testQuestions = officialBank.map(q => ({ test_id: test.id, question_id: q.id, marks: q.points || 1.0 }));
      const { error: tqError } = await supabase.from('test_questions').insert(testQuestions);
      if (tqError) throw new Error(`Question Link Error: ${tqError.message}`);

      const startTimestamp = `${schedulingData.date}T${schedulingData.time}:00`;
      const startDate = new Date(startTimestamp);
      const endDate = new Date(startDate.getTime() + (schedulingData.duration * 60 * 1000)); 

      const { error: scheduleError } = await supabase.from('test_schedules').insert([{ test_id: test.id, availability_start: startDate.toISOString(), availability_end: endDate.toISOString(), time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, is_active: true }]);
      if (scheduleError) throw new Error(`Scheduling Error: ${scheduleError.message}`);

      showToast("Exam successfully scheduled and deployed!", "success");
      
      setOfficialBank([]); 
      setAiDrafts([]); 
      setWorkspaceMode("sandbox"); 
      setActiveTab(1); 
      
      await fetchCourseData();

    } catch (err) {
      showToast(err.message || "Deployment failed. See console.", "error");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10, color: "#fff", minHeight: "100vh" }}>
      {/* HEADER HUD */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.5px" }}>Question Architect</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField variant="standard" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} InputProps={{ disableUnderline: true, sx: { fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 } }} />
            {courses.length > 0 ? (
              <Select variant="standard" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} disableUnderline sx={{ color: "#00DDB3", fontSize: "1rem", fontWeight: 700 }}>
                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            ) : (
              <Typography variant="body2" sx={{ color: "error.main", fontWeight: "bold", bgcolor: "rgba(255,0,0,0.1)", px: 2, py: 0.5, borderRadius: 1 }}>
                Database Error: Course Mapping Missing
              </Typography>
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip icon={<Target size={16} />} label={`${officialBank.length} Official Qs`} sx={{ bgcolor: "rgba(0, 221, 179, 0.1)", color: "#00DDB3", fontWeight: 800, fontSize: "0.95rem", py: 2.5, borderRadius: "12px" }} />
          <Button variant="contained" onClick={handleSaveOfficialBank} disabled={isSaving || officialBank.length === 0 || !selectedCourseId} startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />} sx={{ height: 48, borderRadius: "12px", px: 4, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 800, textTransform: "none", fontSize: "1rem" }}>
            {isSaving ? "Saving..." : "Save Bank Data"}
          </Button>
        </Stack>
      </Box>

      {/* TABS */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 4, borderBottom: "1px solid rgba(255,255,255,0.05)", "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontSize: "1rem", fontWeight: 700, textTransform: "none", minHeight: 60 }, "& .Mui-selected": { color: "#00DDB3 !important" }, "& .MuiTabs-indicator": { backgroundColor: "#00DDB3", height: 3 } }}>
        <Tab icon={<Sparkles size={18} />} label="Creation Workspace" iconPosition="start" />
        <Tab icon={<History size={18} />} label="Past Exams" iconPosition="start" />
        <Tab icon={<Calendar size={18} />} label="Exam Scheduler" iconPosition="start" />
      </Tabs>

      {/* TAB 0: WORKSPACE */}
      {activeTab === 0 && (
        <Grid container spacing={3} sx={{ flexGrow: 1 }}>
          {/* LAYOUT UPGRADE: Proper standard MUI breakpoints to un-compress the UI */}
          <Grid size={{ xs: 12, lg: 3 }}>
            <Stack spacing={3} sx={{ position: "sticky", top: 20 }}>
              <Card sx={{ p: 3, bgcolor: "rgba(0, 221, 179, 0.02)", border: "1px solid rgba(0, 221, 179, 0.15)", borderRadius: "24px" }}>
                <Typography variant="subtitle2" sx={{ color: "#00DDB3", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1, letterSpacing: "0.5px" }}><Database size={16} /> 1. UPLOAD CONTEXT</Typography>
                <Box sx={{ border: "2px dashed rgba(0, 221, 179, 0.2)", borderRadius: "16px", p: 2, textAlign: "center", mb: 2, cursor: "pointer", transition: "0.2s", "&:hover": { bgcolor: "rgba(0, 221, 179, 0.05)", borderColor: "rgba(0, 221, 179, 0.4)" } }}>
                  <input type="file" multiple accept=".pdf,.txt" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload-input" />
                  <label htmlFor="file-upload-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                    <FileUp size={24} color="#00DDB3" style={{ marginBottom: 4 }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, display: "block" }}>Click to Upload PDFs</Typography>
                  </label>
                </Box>
                <Stack spacing={1}>
                  {files.map((f, i) => (
                    <Paper key={i} sx={{ p: 1, pl: 1.5, bgcolor: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Typography variant="caption" noWrap sx={{ color: "#fff", fontWeight: 600, maxWidth: 90 }}>{f.name}</Typography>
                      <Stack direction="row" spacing={0}>
                        <Tooltip title="Preview PDF"><IconButton size="small" onClick={() => openPdfModal(f)} sx={{ p: 0.5, color: "rgba(255,255,255,0.4)", "&:hover": { color: "#06B6D4" } }}><Eye size={14} /></IconButton></Tooltip>
                        <IconButton size="small" color="error" onClick={() => removeFile(i)} sx={{ p: 0.5 }}><Trash2 size={14} /></IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Card>

              <Card sx={{ p: 3, bgcolor: "rgba(6, 182, 212, 0.02)", borderRadius: "24px", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <Typography variant="subtitle2" sx={{ color: "#06B6D4", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1, letterSpacing: "0.5px" }}><SlidersHorizontal size={16} /> 2. GENERATOR SETTINGS</Typography>
                
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Target Template</Typography>
                <FormControl fullWidth variant="filled" sx={{ mb: 2.5, "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" } }}>
                  <Select value={selectedTemplateId || "new"} onChange={handleTemplateChange} disableUnderline sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    <MenuItem value="new">+ Create New Template</MenuItem>
                    {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name} ({t.total_questions} Qs)</MenuItem>)}
                  </Select>
                </FormControl>

                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Generation Source</Typography>
                <FormControl fullWidth variant="filled" sx={{ mb: 2.5, "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" } }}>
                  <Select value={sourceType} onChange={(e) => setSourceType(e.target.value)} disableUnderline sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    <MenuItem value="AI">AI Only (Locked UI)</MenuItem>
                    <MenuItem value="MANUAL">Manual Blank Canvas</MenuItem>
                    <MenuItem value="HYBRID">Hybrid (AI + Manual Edits)</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Q. Count</Typography>
                    <TextField fullWidth type="number" variant="filled" value={aiSettings.count} onChange={(e) => setAiSettings({ ...aiSettings, count: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.9rem" } }} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Difficulty</Typography>
                    <TextField select fullWidth variant="filled" value={aiSettings.difficulty} onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.9rem" } }}>
                      <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Med</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <AnimatePresence>
                  {sourceType !== 'MANUAL' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>AI Instructions (Optional)</Typography>
                      <TextField fullWidth multiline rows={2} variant="filled" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Focus on Chapter 4..." InputProps={{ disableUnderline: true, sx: { color: "#fff", borderRadius: "12px", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.05)" } }} sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)" }, mb: 3 }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button fullWidth variant="contained" onClick={handleGenerateAll} disabled={isGenerating || !selectedCourseId} startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : (sourceType === 'MANUAL' ? <PlayCircle size={16} /> : <Sparkles size={16} />)} sx={{ py: 1.5, background: sourceType === 'MANUAL' ? "linear-gradient(135deg, #06B6D4, #3B82F6)" : "linear-gradient(135deg, #06B6D4, #3B82F6)", borderRadius: "12px", fontWeight: 800, textTransform: "none", fontSize: "0.95rem" }}>
                  {isGenerating ? "Processing..." : (sourceType === 'MANUAL' ? "Create Blanks" : "Generate Qs")}
                </Button>
              </Card>
            </Stack>
          </Grid>

          {/* LAYOUT UPGRADE: Vastly expanded the main workspace */}
          <Grid size={{ xs: 12, lg: 9 }}>
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
              {/* LAYOUT UPGRADE: Standard 4/8 Split for Outline and Editor */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 2, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", height: "calc(100vh - 270px)", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{workspaceMode === 'sandbox' ? "Sandbox Outline" : "Bank Outline"}</Typography>
                    
                    {/* 🌟 LOGIC FIX: Hides the "+" button if "AI Only" is selected */}
                    {workspaceMode === "official" && sourceType !== "AI" && (
                      <Tooltip title="Add Blank Question Card">
                        <IconButton onClick={handleAddManual} sx={{ color: "#00DDB3", bgcolor: "rgba(0, 221, 179, 0.1)", p: 1, "&:hover": { bgcolor: "rgba(0, 221, 179, 0.2)" } }}>
                          <Plus size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <List sx={{ flexGrow: 1, overflowY: "auto", px: 0 }}>
                    {(workspaceMode === "sandbox" ? aiDrafts : officialBank).map((q, idx) => (
                      <ListItem 
                        key={q.id} 
                        disablePadding 
                        sx={{ mb: 1 }}
                        // 🌟 THE FIX: DELETE BUTTON ADDED EXPLICITLY TO EVERY ROW! 🌟
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={(e) => {
                              e.stopPropagation();
                              workspaceMode === "sandbox" ? discardDraft(q.id) : deleteFromBank(q.id);
                            }}
                            sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" } }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        }
                      >
                        <ListItemButton 
                          selected={activeQuestionId === q.id} 
                          onClick={() => setActiveQuestionId(q.id)} 
                          sx={{ borderRadius: "16px", p: 1.5, transition: "0.2s", pr: 6, "&.Mui-selected": { bgcolor: workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.1)" : "rgba(0, 221, 179, 0.1)", border: `1px solid ${workspaceMode === "sandbox" ? "rgba(6, 182, 212, 0.3)" : "rgba(0, 221, 179, 0.3)"}` }, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
                        >
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 900, bgcolor: activeQuestionId === q.id ? (workspaceMode === 'sandbox' ? "#06B6D4" : "#00DDB3") : "rgba(255,255,255,0.05)", color: activeQuestionId === q.id ? "#000" : "#fff", mr: 1.5 }}>{idx + 1}</Avatar>
                          <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 700, color: activeQuestionId === q.id ? "#fff" : "rgba(255,255,255,0.8)" }} noWrap>{q.text || "Empty Statement..."}</Typography>} secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{q.difficulty} • {q.points} Pts</Typography>} />
                          {q.correct === null && <Tooltip title="Missing Answer Key"><AlertCircle size={16} color="#f59e0b" style={{ marginLeft: 8 }} /></Tooltip>}
                        </ListItemButton>
                      </ListItem>
                    ))}
                    {(workspaceMode === "sandbox" ? aiDrafts : officialBank).length === 0 && <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.5 }}><Typography variant="body2">List is empty. Only unused questions appear here.</Typography></Box>}
                  </List>

                  {workspaceMode === "sandbox" && aiDrafts.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <Button fullWidth variant="contained" onClick={moveAllToBank} sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, mb: 1, borderRadius: "12px", textTransform: "none" }}>Approve All to Bank</Button>
                      <Button fullWidth variant="outlined" color="error" size="small" onClick={() => { setAiDrafts([]); setActiveQuestionId(null) }} sx={{ borderRadius: "12px", textTransform: "none", borderColor: "rgba(255,0,0,0.3)", mt: 1 }}>Discard All</Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* LAYOUT UPGRADE: Gave the Active Editor generous space */}
              <Grid size={{ xs: 12, md: 8 }}>
                {activeQuestion ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeQuestionId} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                      <Card sx={{ p: 5, bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", height: "calc(100vh - 270px)", overflowY: "auto" }}>
                        <Stack direction="row" justifyContent="space-between" mb={4} alignItems="center">
                          <Chip label={activeQuestion.isAiGenerated ? "AI GENERATED" : "MANUAL ENTRY"} size="small" sx={{ bgcolor: activeQuestion.isAiGenerated ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.05)", color: activeQuestion.isAiGenerated ? "#06B6D4" : "rgba(255,255,255,0.6)", fontWeight: 900, borderRadius: "8px", px: 1 }} />
                          <Stack direction="row" spacing={1.5}>
                            <Tooltip title="AI Rewrite">
                              <IconButton onClick={() => handleRegenerateSingle(activeQuestion.id, workspaceMode === 'official')} sx={{ bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(6, 182, 212, 0.2)" } }} disabled={regeneratingIds.includes(activeQuestion.id)}>
                                {regeneratingIds.includes(activeQuestion.id) ? <CircularProgress size={18} color="info" /> : <RefreshCcw size={18} color="#06B6D4" />}
                              </IconButton>
                            </Tooltip>
                            {workspaceMode === "sandbox" && <Button variant="contained" onClick={() => moveSingleToBank(activeQuestion)} sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 800, ml: 2, px: 3, borderRadius: "12px", textTransform: "none" }}>Approve to Bank</Button>}
                          </Stack>
                        </Stack>

                        <TextField fullWidth multiline variant="standard" value={activeQuestion.text} onChange={(e) => updateActiveQuestion("text", e.target.value)} placeholder="Type the question statement here..." InputProps={{ disableUnderline: true, sx: { fontSize: "1.5rem", fontWeight: 800, color: "#fff", mb: 5, lineHeight: 1.5 } }} />

                        <Grid container spacing={3} sx={{ mb: 5 }}>
                          {activeQuestion.options.map((opt, oIdx) => {
                            const label = String.fromCharCode(65 + oIdx);
                            const isCorrect = activeQuestion.correct === oIdx;
                            return (
                              <Grid size={{ xs: 12, sm: 6 }} key={oIdx}>
                                <Paper onClick={() => updateActiveQuestion("correct", oIdx)} sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2.5, borderRadius: "16px", bgcolor: isCorrect ? "rgba(0, 221, 179, 0.1)" : "rgba(0,0,0,0.3)", border: isCorrect ? "2px solid #00DDB3" : "2px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s ease", "&:hover": { bgcolor: isCorrect ? "rgba(0, 221, 179, 0.15)" : "rgba(255,255,255,0.05)", border: isCorrect ? "2px solid #00DDB3" : "2px solid rgba(255,255,255,0.2)" } }}>
                                  <Avatar sx={{ width: 36, height: 36, fontSize: '1rem', fontWeight: 900, bgcolor: isCorrect ? "#00DDB3" : "rgba(255,255,255,0.05)", color: isCorrect ? "#000" : "#fff" }}>{label}</Avatar>
                                  <TextField fullWidth multiline variant="standard" value={opt} onChange={(e) => updateOption(oIdx, e.target.value)} placeholder={`Option ${label}`} InputProps={{ disableUnderline: true, sx: { color: "#fff", fontSize: "1.1rem", fontWeight: 500, lineHeight: 1.4 } }} />
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>

                        <Box sx={{ p: 3, bgcolor: "rgba(6, 182, 212, 0.03)", borderRadius: "16px", border: "1px dashed rgba(6, 182, 212, 0.2)", mb: 4 }}>
                          <Typography variant="caption" sx={{ color: "#06B6D4", fontWeight: 800, mb: 1.5, display: "flex", alignItems: "center", gap: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}><Lightbulb size={14} /> Answer Explanation</Typography>
                          <TextField fullWidth multiline variant="standard" value={activeQuestion.explanation} onChange={(e) => updateActiveQuestion("explanation", e.target.value)} placeholder="Explain why this answer is correct (shown to students post-exam)..." InputProps={{ disableUnderline: true, sx: { color: "rgba(255,255,255,0.8)", fontSize: "1rem", lineHeight: 1.5 } }} />
                        </Box>

                        <Divider sx={{ mb: 3, opacity: 0.1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: "rgba(0,0,0,0.2)", p: 2.5, borderRadius: "16px" }}>
                          <Stack direction="row" spacing={5} alignItems="center">
                            <FormControlLabel control={<Switch defaultChecked sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }} />} label={<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Auto-Grade</Typography>} />
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Difficulty:</Typography>
                              <Select variant="standard" value={activeQuestion.difficulty} onChange={(e) => updateActiveQuestion("difficulty", e.target.value)} sx={{ color: "#06B6D4", fontSize: "1rem", fontWeight: 800, disableUnderline: true }}>
                                <MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                              </Select>
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Points:</Typography>
                            <TextField type="number" variant="standard" value={activeQuestion.points} onChange={(e) => updateActiveQuestion("points", parseFloat(e.target.value))} InputProps={{ disableUnderline: true, sx: { color: "#00DDB3", fontWeight: 900, width: 60, textAlign: "right", fontSize: "1.2rem" } }} />
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

      {/* TAB 1: ARCHIVES */}
      {activeTab === 1 && (
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          <Card sx={{ p: 0, borderRadius: "24px", bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <List disablePadding>
              {pastExams.map((exam, idx) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ py: 3, px: 4, transition: "0.2s", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                    <Box sx={{ mr: 4, p: 2, bgcolor: "rgba(0, 221, 179, 0.1)", borderRadius: "16px" }}><Database size={24} color="#00DDB3" /></Box>
                    <ListItemText 
                      primary={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{exam.title}</Typography>} 
                      secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Scheduled Date: {exam.date} • {exam.qs} Questions Locked</Typography>} 
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button variant="outlined" size="small" disabled={isLoadingExam} onClick={() => handleViewExamDetails(exam)} sx={{ borderColor: "rgba(0, 221, 179, 0.3)", color: "#00DDB3", textTransform: "none", borderRadius: "8px", fontWeight: 700 }}>
                        View Exam Details
                      </Button>
                      <Button variant="outlined" size="small" onClick={() => navigate(`/exam-results/${exam.title.replace(/\s+/g, '-').toLowerCase()}`)} sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#fff", textTransform: "none", borderRadius: "8px" }}>
                        View Student Results
                      </Button>
                    </Stack>
                  </ListItem>
                  <Divider sx={{ opacity: 0.05 }} />
                </React.Fragment>
              ))}
              {pastExams.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.5 }}>
                  <Typography variant="body1">No past exams found for this course.</Typography>
                </Box>
              )}
            </List>
          </Card>
        </Box>
      )}

      {/* TAB 2: EXAM SCHEDULER */}
      {activeTab === 2 && (
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
          <Card sx={{ p: 6, borderRadius: "24px", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(0, 221, 179, 0.2)", textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(0, 221, 179, 0.1)", mx: 'auto', mb: 3 }}><Calendar size={40} color="#00DDB3" /></Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Set Exam Live</Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 4 }}>Logged in as: <b>{profile?.name}</b></Typography>

            <Grid container spacing={4} sx={{ mt: 2, textAlign: "left" }}>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth type="date" label="Execution Date" value={schedulingData.date} onChange={(e) => setSchedulingData({...schedulingData, date: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth type="time" label="Launch Time" value={schedulingData.time} onChange={(e) => setSchedulingData({...schedulingData, time: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth type="number" label="Duration (Mins)" value={schedulingData.duration} onChange={(e) => setSchedulingData({...schedulingData, duration: parseInt(e.target.value)})} InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Assigned Student Batch" value={schedulingData.batch} onChange={(e) => setSchedulingData({...schedulingData, batch: e.target.value})} placeholder="Ex: BSCS-2026-A" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)" } }} /></Grid>
            </Grid>

            <Button fullWidth variant="contained" onClick={handleDeployExam} disabled={isDeploying || officialBank.length === 0 || !selectedCourseId} sx={{ mt: 6, py: 2.5, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 900, fontSize: "1.1rem", borderRadius: "12px", textTransform: "none" }}>
              {isDeploying ? "Deploying Assessment..." : "Finalize & Deploy to Students"}
            </Button>
            {(!selectedCourseId) && <Typography variant="caption" color="error" sx={{ display: "block", mt: 2, fontWeight: 600 }}>Error: No course mapped to this account. Cannot deploy.</Typography>}
            {(officialBank.length === 0 && selectedCourseId) && <Typography variant="caption" color="error" sx={{ display: "block", mt: 2, fontWeight: 600 }}>Cannot deploy an empty exam bank. Return to Creation Workspace.</Typography>}
          </Card>
        </Box>
      )}

      {/* --- EXAM PREVIEW MODAL --- */}
      <Dialog open={viewExamModal.open} onClose={() => setViewExamModal({ open: false, title: "", questions: [] })} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#0F172A', borderRadius: "24px", border: "1px solid rgba(0, 221, 179, 0.2)" } }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: "linear-gradient(135deg, rgba(0,221,179,0.1), transparent)" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Database size={24} color="#00DDB3" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}>{viewExamModal.title}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Read-Only Database Preview • {viewExamModal.questions.length} Questions</Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setViewExamModal({ open: false, title: "", questions: [] })} sx={{ color: 'rgba(255,255,255,0.5)', "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}><X size={24} /></IconButton>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          {viewExamModal.questions.length === 0 ? (
             <Typography sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center", py: 4 }}>No questions found for this exam.</Typography>
          ) : (
            <Stack spacing={3}>
              {viewExamModal.questions.map((q, idx) => (
                <Paper key={idx} sx={{ p: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: "#fff", mb: 2 }}>{idx + 1}. {q.question_text}</Typography>
                  <Grid container spacing={1.5}>
                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                      const isCorrect = q.correct_option === letter;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={letter}>
                           <Box sx={{ p: 1.5, borderRadius: "12px", display: "flex", alignItems: "center", gap: 1.5, bgcolor: isCorrect ? "rgba(0, 221, 179, 0.1)" : "rgba(0,0,0,0.2)", border: isCorrect ? "1px solid rgba(0, 221, 179, 0.3)" : "1px solid transparent" }}>
                             <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 900, bgcolor: isCorrect ? "#00DDB3" : "rgba(255,255,255,0.05)", color: isCorrect ? "#000" : "#fff" }}>
                               {isCorrect ? <CheckCircle2 size={14} /> : letter}
                             </Avatar>
                             <Typography variant="body2" sx={{ color: isCorrect ? "#00DDB3" : "rgba(255,255,255,0.7)", fontWeight: isCorrect ? 700 : 400 }}>
                               {q[`option_${letter.toLowerCase()}`]}
                             </Typography>
                           </Box>
                        </Grid>
                      )
                    })}
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF PREVIEW MODAL */}
      <Dialog open={pdfPreview.open} onClose={closePdfModal} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '85vh', bgcolor: '#121212', borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: "#1a1a1a" }}>
          <Stack direction="row" spacing={2} alignItems="center"><FileUp size={24} color="#00DDB3" /><Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>{pdfPreview.name}</Typography></Stack>
          <IconButton onClick={closePdfModal} sx={{ color: 'rgba(255,255,255,0.5)', "&:hover": { color: "#fff" } }}><X size={24} /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, bgcolor: "#242424" }}><iframe src={`${pdfPreview.url}#view=FitH&toolbar=0`} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" /></DialogContent>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem' }}>{toast.message}</Alert>
      </Snackbar>

    </Box>
  );
}
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, TextField, Button,
  Divider, Stack, IconButton, Paper, Switch,
  FormControlLabel, Select, MenuItem, Collapse, InputLabel, FormControl, Slider,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
  Save, LayoutTemplate, Clock, Target, Settings,
  Plus, Trash2, ShieldAlert, FileText, Shuffle,
  Eye, Lock, CheckCircle2, ChevronRight, BookOpen, ShieldCheck, GraduationCap, X,
  AlertCircle, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- AUTH & DB IMPORTS ---
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../server/config/supabaseClient";

export default function TestTemplateBuilder() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // --- 1. COURSE & META STATE ---
  const [selectedCourse, setSelectedCourse] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [testCategory, setTestCategory] = useState("Quiz");

  // --- 2. STRUCTURE STATE ---
  const [duration, setDuration] = useState(60);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [hasSections, setHasSections] = useState(false);
  const [sections, setSections] = useState([
    { id: 1, name: "General Knowledge", count: 10, difficulty: "Mixed", topic: "All" }
  ]);

  // --- 3. SCORING RULES STATE ---
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [marksPerQ, setMarksPerQ] = useState(2.0);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(false);
  const [penalty, setPenalty] = useState(0.5);
  /** From this wrong-answer ordinal onward, apply penalty (default 3 = first two wrongs are 0). */
  const [wrongThreshold, setWrongThreshold] = useState(3);

  // --- 4. BEHAVIOR & SECURITY STATE ---
  const [behavior, setBehavior] = useState({
    shuffleQs: true,
    shuffleOpts: true,
    allowReview: true,
    showResultsImmediately: false, // Updated to match DB concept
    maxAttempts: 1,
    strictProctoring: false,
    preventTabSwitch: true
  });

  // --- 🌟 3-STEP BRIDGE FETCHER (Locks onto your course automatically) 🌟 ---
  useEffect(() => {
    const fetchTeacherData = async () => {
      setIsLoading(true);
      if (!profile) return;

      try {
        const authId = profile.user_id || profile.id;
        let dbUserId = authId;

        // 1. BRIDGE THE GAP: users table
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

        // 2. FETCH THE COURSE MAPPING
        const { data: teacherData } = await supabase.from("teachers").select("course_id").eq("user_id", dbUserId).not("course_id", "is", null).maybeSingle();

        if (teacherData && teacherData.course_id) {
          // 3. FETCH THE COURSE DETAILS
          const { data: courseData } = await supabase.from("courses").select("id, name").eq("id", teacherData.course_id).maybeSingle();
          if (courseData) {
            setAssignedCourses([courseData]);
            setSelectedCourse(courseData.id);
            
            // Load existing templates for this course directly from Supabase
            const { data: existing } = await supabase.from("templates").select("*").eq("course_id", courseData.id).order("created_at", { ascending: false });
            if (existing) setExistingTemplates(existing);
          }
        } else {
          setError("No course mapped to this account in the database.");
        }

        // 4. LOAD SPECIFIC TEMPLATE IF EDITING
        if (templateId) {
          const { data: templateData } = await supabase.from("templates").select("*").eq("id", templateId).single();
          if (templateData) handleEditTemplate(templateData);
        }

      } catch (err) {
        console.error("Initialization Error:", err);
        setError("Failed to load course and templates.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [profile, templateId]);


  // --- HANDLERS ---
  const handleAddSection = () => {
    setSections([...sections, { id: Date.now(), name: `Section ${sections.length + 1}`, count: 5, difficulty: "Medium", topic: "All" }]);
  };

  const handleRemoveSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleSectionChange = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleBehaviorChange = (field, value) => {
    setBehavior({ ...behavior, [field]: value });
  };

  // --- 🌟 EXACT DB MAPPING SAVE FUNCTION 🌟 ---
  const handleSaveTemplate = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCourse) {
      setError("Please select a specific course for this template.");
      return;
    }
    
    if (!templateName) {
      setError("Template Name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const calculatedTotalQs = hasSections 
        ? sections.reduce((acc, s) => acc + (parseInt(s.count) || 0), 0) 
        : parseInt(totalQuestions) || 0;

      // 🌟 EXACT 1:1 SCHEMA MAPPING BASED ON YOUR JSON 🌟
      const templatePayload = {
        name: templateName,
        course_id: selectedCourse,
        template_type: testCategory,
        duration_minutes: parseInt(duration),
        total_questions: calculatedTotalQs,
        passing_percentage: parseInt(passingPercentage),
        has_sections: hasSections,
        sections_config: hasSections ? sections : null, // JSONB column
        marks_per_question: parseFloat(marksPerQ) || 0,
        negative_marking_enabled: hasNegativeMarking,
        negative_marking_penalty: hasNegativeMarking ? (parseFloat(penalty) || 0) : 0,
        negative_marking_wrong_threshold: hasNegativeMarking
          ? Math.max(1, parseInt(String(wrongThreshold), 10) || 3)
          : 3,
        
        // Unpacked the behavior object directly into the specific columns!
        shuffle_questions: behavior.shuffleQs,
        shuffle_options: behavior.shuffleOpts,
        allow_review: behavior.allowReview,
        show_results_immediately: behavior.showResultsImmediately,
        max_attempts: behavior.maxAttempts,
        strict_proctoring: behavior.strictProctoring,
        prevent_tab_switch: behavior.preventTabSwitch,
        
        is_active: true
      };

      if (editingTemplateId) {
        const { error: dbError } = await supabase.from("templates").update(templatePayload).eq("id", editingTemplateId);
        if (dbError) throw dbError;
        setSuccess("Template updated successfully!");
        setEditingTemplateId(null);
      } else {
        const { error: dbError } = await supabase.from("templates").insert([templatePayload]);
        if (dbError) throw dbError;
        setSuccess("Template created successfully!");
      }

      // Reload templates into memory
      const { data: updatedList } = await supabase.from("templates").select("*").eq("course_id", selectedCourse).order("created_at", { ascending: false });
      if (updatedList) setExistingTemplates(updatedList);

      // Reset form
      setTemplateName("");
      setTestCategory("Quiz");
      setDuration(60);
      setPassingPercentage(50);
      setHasSections(false);
      setSections([{ id: 1, name: "General Knowledge", count: 10, difficulty: "Mixed", topic: "All" }]);
      setMarksPerQ(2.0);
      setHasNegativeMarking(false);
      setPenalty(0.5);
      setWrongThreshold(3);
      
    } catch (err) {
      const errorMessage = err.message || "Failed to save template. Please check database configuration.";
      setError(errorMessage);
      console.error('Template save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    setSelectedCourse(template.course_id || "");
    setTemplateName(template.name || "");
    setTestCategory(template.template_type || "Quiz");
    setDuration(template.duration_minutes || 60);
    setPassingPercentage(template.passing_percentage || 50);
    setHasSections(template.has_sections || false);
    setTotalQuestions(template.total_questions || 0);
    setSections(template.sections_config || [{ id: 1, name: "General Knowledge", count: 10, difficulty: "Mixed", topic: "All" }]);
    setMarksPerQ(template.marks_per_question ?? 2.0);
    setHasNegativeMarking(template.negative_marking_enabled ?? false);
    setPenalty(template.negative_marking_penalty ?? 0.5);
    setWrongThreshold(template.negative_marking_wrong_threshold ?? 3);
    
    // Repack the individual columns back into the behavior state object
    setBehavior({
      shuffleQs: template.shuffle_questions ?? true, 
      shuffleOpts: template.shuffle_options ?? true, 
      allowReview: template.allow_review ?? true, 
      showResultsImmediately: template.show_results_immediately ?? false, 
      lockNav: template.lock_section_navigation ?? false, 
      maxAttempts: template.max_attempts ?? 1, 
      strictProctoring: template.strict_proctoring ?? false, 
      preventTabSwitch: template.prevent_tab_switch ?? true
    });
    setShowTemplateList(false);
  };

  const handleDeleteTemplate = async () => {
    try {
      const { error: dbError } = await supabase.from("templates").delete().eq("id", templateToDelete.id);
      if (dbError) throw dbError;
      
      setSuccess("Template deleted successfully!");
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      
      if (selectedCourse) {
        const { data: updatedList } = await supabase.from("templates").select("*").eq("course_id", selectedCourse).order("created_at", { ascending: false });
        if (updatedList) setExistingTemplates(updatedList);
      }
    } catch (err) {
      setError("Failed to delete template");
    }
  };

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10, color: "#fff", minHeight: "100vh" }}>

      {/* LOADING STATE */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: "#00DDB3" }} />
        </Box>
      )}

      {!isLoading && (
        <>
          {/* ERROR ALERT */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setError(null)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertCircle size={20} />
                {error}
              </Box>
            </Alert>
          )}

          {/* SUCCESS ALERT */}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setSuccess(null)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle size={20} />
                {success}
              </Box>
            </Alert>
          )}

          {/* --- HEADER HUD --- */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 2 }}>
                <LayoutTemplate size={36} color="#00DDB3" /> Template Builder
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>Design robust, customizable assessment blueprints for your assigned courses.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowTemplateList(!showTemplateList)}
                sx={{ height: 48, borderRadius: "12px", px: 3, borderColor: "#00DDB3", color: "#00DDB3", fontWeight: 800, textTransform: "none", fontSize: "0.9rem" }}
              >
                View Templates ({existingTemplates.length})
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/teacher/dashboard')}
                sx={{ height: 48, borderRadius: "12px", px: 3, borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", fontWeight: 800, textTransform: "none", fontSize: "0.9rem" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveTemplate}
                disabled={isSaving || !templateName || !selectedCourse}
                startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                sx={{ height: 48, borderRadius: "12px", px: 4, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#000", fontWeight: 800, textTransform: "none", fontSize: "1rem" }}
              >
                {isSaving ? "Saving..." : editingTemplateId ? "Update Template" : "Save Template"}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={4}>

            {/* LEFT COLUMN: THE BUILDER FORM */}
            <Grid item xs={12} md={8}>
              <Stack spacing={4}>

                {/* 1. COURSE & METADATA */}
                <Card sx={{ p: 4, bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "24px" }}>
                  <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                    <BookOpen size={20} color="#00DDB3" /> 1. Course Assignment & Metadata
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="filled" sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(0, 221, 179, 0.2)" } }}>
                        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Assigned Course</InputLabel>
                        <Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disableUnderline sx={{ color: "#fff", fontWeight: 700 }}>
                          {assignedCourses.map(course => (
                            <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="filled" sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}>
                        <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Test Category</InputLabel>
                        <Select value={testCategory?.toLowerCase()} onChange={(e) => setTestCategory(e.target.value)} disableUnderline sx={{ color: "#fff", fontWeight: 700 }}>
                          <MenuItem value="quiz">Weekly Quiz</MenuItem>
                          <MenuItem value="assignment">Assignment</MenuItem>
                          <MenuItem value="midterm">Midterm Exam</MenuItem>
                          <MenuItem value="final">Final Exam</MenuItem>
                          <MenuItem value="practice">Practice / Mock Test</MenuItem>
                          <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Internal Template Name (Students won't see this)</Typography>
                      <TextField fullWidth variant="filled" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Midterm Exam Template" InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 700, border: "1px solid rgba(255,255,255,0.05)", fontSize: "1.1rem" } }} />
                    </Grid>
                  </Grid>
                </Card>

                {/* 2. STRUCTURE & TIMING */}
                <Card sx={{ p: 4, bgcolor: "rgba(0, 221, 179, 0.02)", border: "1px solid rgba(0, 221, 179, 0.15)", borderRadius: "24px" }}>
                  <Typography variant="h6" sx={{ color: "#00DDB3", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                    <FileText size={20} /> 2. Blueprint & Sections
                  </Typography>

                  <Grid container spacing={4} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Total Duration (Minutes)</Typography>
                      <TextField fullWidth type="number" variant="filled" value={duration} onChange={(e) => setDuration(e.target.value)} InputProps={{ startAdornment: <Clock size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />, disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 700, border: "1px solid rgba(255,255,255,0.05)" } }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Passing Criteria: {passingPercentage}%</Typography>
                      <Box sx={{ px: 2, pt: 1 }}>
                        <Slider value={passingPercentage} onChange={(e, val) => setPassingPercentage(val)} step={5} marks min={0} max={100} valueLabelDisplay="auto" sx={{ color: "#00DDB3" }} />
                      </Box>
                    </Grid>
                  </Grid>

                  <Collapse in={!hasSections}>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Total Questions</Typography>
                      <TextField fullWidth type="number" variant="filled" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 700, border: "1px solid rgba(255,255,255,0.05)" } }} />
                    </Box>
                  </Collapse>

                  <Divider sx={{ mb: 3, opacity: 0.1 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Enable Complex Sections</Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>Divide the test into distinct parts (e.g., Theory vs Code).</Typography>
                    </Box>
                    <Switch checked={hasSections} onChange={(e) => setHasSections(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#00DDB3" } }} />
                  </Box>

                  <Collapse in={hasSections}>
                    <Box sx={{ mt: 3, p: 3, bgcolor: "rgba(0,0,0,0.2)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Stack spacing={2}>
                        {sections.map((sec, idx) => (
                          <Paper key={sec.id} sx={{ p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                            <Typography sx={{ fontWeight: 800, color: "rgba(255,255,255,0.3)", minWidth: 20 }}>{idx + 1}.</Typography>
                            <TextField size="small" variant="standard" value={sec.name} onChange={(e) => handleSectionChange(sec.id, "name", e.target.value)} placeholder="Section Title" InputProps={{ disableUnderline: true, sx: { color: "#fff", fontWeight: 600 } }} sx={{ flexGrow: 1, minWidth: 150 }} />
                            <TextField size="small" type="number" variant="outlined" label="Q. Count" value={sec.count} onChange={(e) => handleSectionChange(sec.id, "count", e.target.value)} sx={{ width: 100, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
                            <Select size="small" value={sec.difficulty} onChange={(e) => handleSectionChange(sec.id, "difficulty", e.target.value)} sx={{ width: 120, borderRadius: "8px" }}>
                              <MenuItem value="Mixed">Mixed</MenuItem><MenuItem value="Easy">Easy</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="Hard">Hard</MenuItem>
                            </Select>
                            <IconButton color="error" onClick={() => handleRemoveSection(sec.id)} disabled={sections.length === 1}><Trash2 size={18} /></IconButton>
                          </Paper>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAddSection} sx={{ color: "#00DDB3", borderColor: "rgba(0, 221, 179, 0.3)", borderRadius: "12px", py: 1.5, borderStyle: "dashed" }}>Add Another Section</Button>
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>

                {/* 3. SCORING RULES */}
                <Card sx={{ p: 4, bgcolor: "rgba(6, 182, 212, 0.02)", border: "1px solid rgba(6, 182, 212, 0.15)", borderRadius: "24px" }}>
                  <Typography variant="h6" sx={{ color: "#06B6D4", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                    <Target size={20} /> 3. Scoring Engine
                  </Typography>

                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Base Marks Per Question</Typography>
                      <TextField fullWidth type="number" variant="filled" value={marksPerQ} onChange={(e) => setMarksPerQ(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#06B6D4", fontWeight: 800, border: "1px solid rgba(255,255,255,0.05)", fontSize: "1.2rem" } }} />
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <Paper sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <ShieldAlert size={20} color={hasNegativeMarking ? "#ff4d4d" : "rgba(255,255,255,0.3)"} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: hasNegativeMarking ? "#fff" : "rgba(255,255,255,0.5)" }}>Negative Marking</Typography>
                          </Box>
                          <Switch checked={hasNegativeMarking} onChange={(e) => setHasNegativeMarking(e.target.checked)} color="error" />
                        </Box>

                        <Collapse in={hasNegativeMarking}>
                          <Stack spacing={2} sx={{ mt: 3, pt: 3, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>Deduct</Typography>
                              <TextField size="small" type="number" value={penalty} onChange={(e) => setPenalty(e.target.value)} sx={{ width: 80, "& .MuiOutlinedInput-root": { borderRadius: "8px", color: "#ff4d4d", fontWeight: 800, bgcolor: "rgba(255,0,0,0.05)" } }} />
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>marks per skipped question, and from wrong answer</Typography>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={wrongThreshold}
                                onChange={(e) => setWrongThreshold(e.target.value)}
                                sx={{ width: 72, "& .MuiOutlinedInput-root": { borderRadius: "8px", color: "#ff4d4d", fontWeight: 800, bgcolor: "rgba(255,0,0,0.05)" } }}
                              />
                              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>onward (earlier wrongs score 0).</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block" }}>
                              Example: threshold 3 → 1st and 2nd wrong answers get 0; 3rd wrong onward get −penalty. Empty options always get −penalty.
                            </Typography>
                          </Stack>
                        </Collapse>
                      </Paper>
                    </Grid>
                  </Grid>
                </Card>

                {/* 4. SECURITY & BEHAVIOR */}
                <Card sx={{ p: 4, bgcolor: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px" }}>
                  <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                    <ShieldCheck size={20} color="#ec4899" /> 4. Security & Behavior Rules
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Shuffle size={18} color="#00DDB3" />
                          <Typography variant="body2" fontWeight={600}>Shuffle Questions</Typography>
                        </Box>
                        <Switch checked={behavior?.shuffleQs || false} onChange={(e) => handleBehaviorChange("shuffleQs", e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }} />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Lock size={18} color="#f59e0b" />
                          <Typography variant="body2" fontWeight={600}>Prevent Tab Switching</Typography>
                        </Box>
                        <Switch checked={behavior?.preventTabSwitch || false} onChange={(e) => handleBehaviorChange("preventTabSwitch", e.target.checked)} color="warning" />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <ShieldAlert size={18} color="#ec4899" />
                          <Typography variant="body2" fontWeight={600}>Strict Proctoring (Webcam)</Typography>
                        </Box>
                        <Switch checked={behavior?.strictProctoring || false} onChange={(e) => handleBehaviorChange("strictProctoring", e.target.checked)} color="secondary" />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Eye size={18} color="#06B6D4" />
                          <Typography variant="body2" fontWeight={600}>Allow Review Before Submit</Typography>
                        </Box>
                        <Switch checked={behavior?.allowReview || false} onChange={(e) => handleBehaviorChange("allowReview", e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#06B6D4" } }} />
                      </Paper>
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>Max Attempts Allowed</Typography>
                      <Select fullWidth variant="filled" value={behavior?.maxAttempts || 1} onChange={(e) => handleBehaviorChange("maxAttempts", e.target.value)} disableUnderline sx={{ borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <MenuItem value={1}>1 Attempt (Strict)</MenuItem>
                        <MenuItem value={2}>2 Attempts</MenuItem>
                        <MenuItem value={3}>3 Attempts</MenuItem>
                        <MenuItem value={999}>Unlimited Attempts</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", ml: 1 }}>When are results shown?</Typography>
                      <Select fullWidth variant="filled" value={behavior?.showResultsImmediately} onChange={(e) => handleBehaviorChange("showResultsImmediately", e.target.value)} disableUnderline sx={{ borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <MenuItem value={true}>Immediately on Submit</MenuItem>
                        <MenuItem value={false}>Manual Release by Teacher</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>
                </Card>

              </Stack>
            </Grid>

            {/* RIGHT COLUMN: LIVE SUMMARY (Sticky Receipt) */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: "sticky", top: 20 }}>
                <Card sx={{ p: 0, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", overflow: "hidden" }}>

                  {/* Receipt Header */}
                  <Box sx={{ p: 3, bgcolor: "rgba(0,0,0,0.4)", textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.2)" }}>
                    <Typography variant="overline" sx={{ color: "#00DDB3", fontWeight: 800, letterSpacing: "1px" }}>{testCategory} Blueprint</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, mt: 1, lineHeight: 1.2 }}>{templateName || "Untitled Template"}</Typography>
                    <Typography variant="caption" sx={{ color: "#06B6D4", mt: 1, display: "block", fontWeight: 600 }}>{assignedCourses.find(c => c.id === selectedCourse)?.name || 'Select a course'}</Typography>
                  </Box>

                  <Box sx={{ p: 3 }}>
                    {(() => {
                      const totalQs = hasSections ? sections.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0) : parseInt(totalQuestions) || 0;
                      const totalMarks = totalQs * (parseFloat(marksPerQ) || 0);

                      return (
                        <Stack spacing={2.5}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>Duration</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{duration} Mins</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>Structure</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{hasSections ? `${sections.length} Sections` : "Standard List"}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>Passing Criteria</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: passingPercentage > 70 ? "#f59e0b" : "#00DDB3" }}>{passingPercentage}%</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>Max Marks</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#00DDB3" }}>{totalMarks} Pts</Typography>
                          </Box>

                          <Divider sx={{ opacity: 0.1 }} />

                          <Typography variant="caption" sx={{ color: "#ec4899", fontWeight: 800, textTransform: "uppercase" }}>Security & Policy</Typography>
                          <Stack spacing={1.5}>
                            {behavior?.strictProctoring ? (
                              <Box display="flex" alignItems="center" gap={1.5}><ShieldCheck size={16} color="#ec4899" /><Typography variant="body2">Strict Webcam Proctoring</Typography></Box>
                            ) : (
                              <Box display="flex" alignItems="center" gap={1.5}><CheckCircle2 size={16} color="rgba(255,255,255,0.3)" /><Typography variant="body2" color="rgba(255,255,255,0.5)">No Active Proctoring</Typography></Box>
                            )}

                            {behavior?.preventTabSwitch && (
                              <Box display="flex" alignItems="center" gap={1.5}><Lock size={16} color="#f59e0b" /><Typography variant="body2">Tab Switching Locked</Typography></Box>
                            )}

                            <Box display="flex" alignItems="center" gap={1.5}>
                              <GraduationCap size={16} color="#06B6D4" />
                              <Typography variant="body2">Attempts: {behavior?.maxAttempts === 999 ? "Unlimited" : (behavior?.maxAttempts || 1)}</Typography>
                            </Box>

                            {hasNegativeMarking && (
                              <Box display="flex" alignItems="flex-start" gap={1.5}>
                                <X size={16} color="#ff4d4d" style={{ marginTop: 2 }} />
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                  −{penalty} per skip; from {wrongThreshold}rd wrong onward; earlier wrongs 0
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                      );
                    })()}
                  </Box>

                  <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.3)", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Template will be linked to your course automatically.</Typography>
                  </Box>
                </Card>
              </Box>
            </Grid>

          </Grid>

          {/* TEMPLATE LIST MODAL */}
          <Dialog open={showTemplateList} onClose={() => setShowTemplateList(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, fontSize: "1.3rem" }}>
              Existing Templates for {assignedCourses.find(c => c.id === selectedCourse)?.name || 'Course'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {existingTemplates.length === 0 ? (
                <Typography sx={{ textAlign: 'center', py: 4, color: 'rgba(255,255,255,0.5)' }}>
                  No templates created yet for this course.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {existingTemplates.map(template => (
                    <Paper key={template.id} sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.3)", borderRadius: "12px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{template.name}</Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                          {template.template_type} • {template.duration_minutes} mins • {template.total_questions} questions
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEditTemplate(template)}
                          sx={{ color: "#00DDB3", borderColor: "#00DDB3" }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setTemplateToDelete(template);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setShowTemplateList(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* DELETE CONFIRMATION DIALOG */}
          <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle>Delete Template?</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteTemplate} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
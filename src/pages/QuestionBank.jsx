import React, { useState } from "react";
import { 
  Box, Typography, Grid, Card, TextField, Button, Tabs, Tab, 
  Divider, Chip, Stack, IconButton, List, ListItem, ListItemText,
  Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl,
  Paper, Avatar, Badge
} from "@mui/material";
import { 
  Sparkles, Save, Plus, FileUp, History, Calendar, 
  Trash2, ChevronRight, Database, Bot, FileText, Copy, 
  GripVertical, Zap, Target, MousePointer2
} from "lucide-react";
import { motion } from "framer-motion";

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("Quick Quiz (15m)");
  const [files, setFiles] = useState(["Lecture_04_Recursion.pdf", "Python_Data_Types.txt"]);

  // Mock data for question preview
  const initialQuestions = [
    { id: 1, type: "Multiple Choice", difficulty: "Medium", points: 2.0 },
    { id: 2, type: "Multiple Choice", difficulty: "Hard", points: 5.0 }
  ];

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10, color: "#fff" }}>
      
      {/* HEADER SECTION: Template Selector & Main Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", mb: 0.5, letterSpacing: -1 }}>
            Question Architect
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>
            Design and generate intelligence-driven assessments from your course materials.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel sx={{ color: "#00DDB3", "&.Mui-focused": { color: "#00DDB3" } }}>Active Template Context</InputLabel>
            <Select
              value={selectedTemplate}
              label="Active Template Context"
              onChange={(e) => setSelectedTemplate(e.target.value)}
              sx={{ 
                borderRadius: 4, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                color: "#fff",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0, 221, 179, 0.3)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00DDB3" }
              }}
            >
              <MenuItem value="Quick Quiz (15m)">Quick Quiz (15m)</MenuItem>
              <MenuItem value="Midterm (60m)">Midterm (60m)</MenuItem>
              <MenuItem value="Final Exam (120m)">Final Exam (120m)</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<Zap size={18} />} 
            sx={{ 
              height: 56, borderRadius: 4, px: 4, 
              background: "linear-gradient(135deg, #00DDB3, #06B6D4)", 
              color: "#000", fontWeight: 800,
              boxShadow: "0 10px 20px rgba(0, 221, 179, 0.2)",
              "&:hover": { filter: "brightness(1.1)" }
            }}
          >
            Finalize & Schedule
          </Button>
        </Stack>
      </Box>

      {/* NAVIGATION TABS */}
      <Tabs 
        value={activeTab} 
        onChange={(e, val) => setActiveTab(val)} 
        sx={{ 
          mb: 4, 
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          "& .MuiTab-root": { color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.95rem" },
          "& .Mui-selected": { color: "#00DDB3 !important" },
          "& .MuiTabs-indicator": { bgcolor: "#00DDB3" }
        }}
      >
        <Tab icon={<Sparkles size={18} />} label="AI Builder" iconPosition="start" />
        <Tab icon={<History size={18} />} label="Past Banks" iconPosition="start" />
        <Tab icon={<Calendar size={18} />} label="Exam Scheduler" iconPosition="start" />
      </Tabs>

      {/* TAB 0: THE ARCHITECT CANVAS */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          
          {/* LEFT SIDEBAR: Context & AI Control */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ position: "sticky", top: 20 }}>
              
              {/* Card 1: Source Context */}
              <Card sx={{ p: 3, bgcolor: "rgba(0, 221, 179, 0.03)", border: "1px solid rgba(0, 221, 179, 0.15)", borderRadius: 6 }}>
                <Typography variant="subtitle2" sx={{ color: "#00DDB3", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <FileText size={18} /> SOURCE CONTEXT
                </Typography>
                <Box sx={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 4, p: 3, textAlign: "center", mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Provide PDFs for AI analysis</Typography>
                  <Button size="small" variant="outlined" sx={{ color: "#00DDB3", borderColor: "#00DDB3", fontWeight: 700 }}>Add Files</Button>
                </Box>
                <Stack spacing={1}>
                  {files.map(file => (
                    <Paper key={file} sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FileText size={14} color="#00DDB3" />
                        <Typography variant="caption" noWrap sx={{ maxWidth: 120, color: "#fff" }}>{file}</Typography>
                      </Box>
                      <IconButton size="small"><Trash2 size={14} color="rgba(255,0,0,0.5)" /></IconButton>
                    </Paper>
                  ))}
                </Stack>
              </Card>

              {/* Card 2: AI Control Terminal */}
              <Card sx={{ p: 3, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)" }}>
                <Typography variant="subtitle2" sx={{ color: "#06B6D4", fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Bot size={18} /> AI BUILDER QUERY
                </Typography>
                <TextField 
                  fullWidth multiline rows={4} variant="filled" 
                  placeholder="Ex: 'Generate 10 questions on recursion complexity using the uploaded PDF...'" 
                  InputProps={{ disableUnderline: true, sx: { color: "#fff", borderRadius: 3 } }}
                  sx={{ "& .MuiFilledInput-root": { bgcolor: "rgba(0,0,0,0.2)" } }}
                />
                <Button 
                  fullWidth variant="contained" 
                  sx={{ mt: 2, py: 1.8, background: "linear-gradient(135deg, #06B6D4, #3B82F6)", borderRadius: 3, fontWeight: 800, letterSpacing: 0.5 }}
                >
                  Generate Intelligence
                </Button>
              </Card>
            </Stack>
          </Grid>

          {/* MAIN CANVAS: The Question Bank Draft */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>Draft Canvas</Typography>
                <Chip label="2 Questions Active" size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontWeight: 600 }} />
              </Stack>
              <Button startIcon={<Plus size={18}/>} variant="outlined" sx={{ borderRadius: 3, color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                Manual Add
              </Button>
            </Box>

            <Stack spacing={3}>
              {initialQuestions.map((q) => (
                <motion.div key={q.id} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card sx={{ 
                    p: 4, bgcolor: "rgba(255,255,255,0.02)", 
                    border: "1px solid rgba(255,255,255,0.08)", 
                    borderRadius: 8, position: "relative",
                    overflow: "visible"
                  }}>
                    {/* Drag Handle Decoration */}
                    <Box sx={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.15)" }}>
                       <GripVertical size={24} />
                    </Box>
                    
                    <Stack direction="row" justifyContent="space-between" mb={3}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 900, width: 32, height: 32, fontSize: "0.9rem" }}>
                          {q.id}
                        </Avatar>
                        <Chip label={q.type} size="small" variant="outlined" sx={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" sx={{ color: "rgba(255,255,255,0.3)" }}><Copy size={18} /></IconButton>
                        <IconButton size="small" color="error" sx={{ opacity: 0.6 }}><Trash2 size={18} /></IconButton>
                      </Stack>
                    </Stack>

                    <TextField 
                      fullWidth multiline placeholder="Enter Question Statement..." variant="standard" 
                      defaultValue={q.id === 1 ? "What is the time complexity of a recursive binary search?" : ""}
                      InputProps={{ disableUnderline: true, sx: { fontSize: "1.25rem", fontWeight: 800, color: "#fff", mb: 3 } }} 
                    />
                    
                    <Grid container spacing={2}>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <Grid item xs={12} sm={6} key={opt}>
                          <Paper sx={{ 
                            p: 2, display: "flex", alignItems: "center", gap: 2, 
                            bgcolor: "rgba(0,0,0,0.3)", borderRadius: 4, 
                            border: opt === 'A' ? "1px solid #00DDB3" : "1px solid transparent",
                            transition: "all 0.2s ease",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }
                          }}>
                             <Avatar sx={{ 
                               width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800,
                               bgcolor: opt === 'A' ? "#00DDB3" : "rgba(255,255,255,0.08)", 
                               color: opt === 'A' ? "#000" : "#fff" 
                             }}>
                               {opt}
                             </Avatar>
                             <TextField fullWidth size="small" placeholder={`Option ${opt}`} variant="standard" InputProps={{ disableUnderline: true, sx: { color: "rgba(255,255,255,0.8)" } }} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    <Divider sx={{ my: 4, opacity: 0.05 }} />
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Stack direction="row" spacing={3}>
                        <FormControlLabel control={<Switch size="small" defaultChecked sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }} />} label={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Auto-Grading</Typography>} />
                        <FormControlLabel control={<Switch size="small" sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#06B6D4" } }} />} label={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Explanation Req.</Typography>} />
                      </Stack>
                      
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: 'block', lineHeight: 1 }}>Points</Typography>
                            <Select size="small" defaultValue={q.points} variant="standard" sx={{ color: "#00DDB3", fontWeight: 800, "&:before, &:after": { display: 'none' } }}>
                                <MenuItem value={1.0}>1.0</MenuItem>
                                <MenuItem value={2.0}>2.0</MenuItem>
                                <MenuItem value={5.0}>5.0</MenuItem>
                            </Select>
                        </Box>
                        <Chip 
                          icon={<Target size={14} />} 
                          label={q.difficulty} 
                          size="small" 
                          sx={{ 
                            bgcolor: q.difficulty === "Hard" ? "rgba(244, 63, 94, 0.1)" : "rgba(6, 182, 212, 0.1)", 
                            color: q.difficulty === "Hard" ? "#fb7185" : "#06B6D4",
                            fontWeight: 700,
                            borderRadius: 2
                          }} 
                        />
                      </Stack>
                    </Stack>
                  </Card>
                </motion.div>
              ))}
            </Stack>

            {/* ADD QUESTION BUTTON */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button 
                    variant="dashed" 
                    fullWidth 
                    startIcon={<Plus />}
                    sx={{ 
                        py: 3, borderRadius: 8, border: "2px dashed rgba(255,255,255,0.1)", 
                        color: "rgba(255,255,255,0.4)", 
                        "&:hover": { border: "2px dashed #00DDB3", color: "#00DDB3", bgcolor: "rgba(0, 221, 179, 0.02)" } 
                    }}
                >
                    Insert New Question Card
                </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: PAST BANKS */}
      {activeTab === 1 && (
        <Card sx={{ p: 0, borderRadius: 8, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <List disablePadding>
            {["Midterm 2026 - Data Structures", "Recursion Basics - Quiz 2", "Final Exam Mock"].map((item, idx) => (
              <React.Fragment key={idx}>
                <ListItem sx={{ py: 4, px: 5, "&:hover": { bgcolor: "rgba(255,255,255,0.02)" }, cursor: "pointer" }}>
                  <Box sx={{ mr: 4, p: 2, bgcolor: "rgba(0, 221, 179, 0.1)", borderRadius: 4 }}>
                    <Database size={28} color="#00DDB3" />
                  </Box>
                  <ListItemText 
                    primary={<Typography variant="h6" sx={{ fontWeight: 800 }}>{item}</Typography>} 
                    secondary={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Last synced 2 days ago • 24 Questions • Locked Key</Typography>} 
                  />
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" size="small" sx={{ borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}>Clone</Button>
                    <IconButton sx={{ color: "#00DDB3" }}><ChevronRight /></IconButton>
                  </Stack>
                </ListItem>
                <Divider sx={{ opacity: 0.05 }} />
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* TAB 2: SCHEDULER */}
      {activeTab === 2 && (
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Card sx={{ p: 6, borderRadius: 10, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(0, 221, 179, 0.2)", textAlign: 'center' }}>
            <Box sx={{ mb: 4 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(0, 221, 179, 0.1)", mx: 'auto', mb: 3 }}>
                    <Calendar size={40} color="#00DDB3" />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Set Exam Live</Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>Selected Bank: Midterm 2026 - Data Structures</Typography>
            </Box>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Release Date" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="time" label="Execution Time" InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Assigned Student Batch" placeholder="Ex: BSCS-2026-A" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }} />
              </Grid>
            </Grid>

            <Button 
                fullWidth 
                variant="contained" 
                sx={{ 
                    mt: 6, py: 2.5, borderRadius: 4, bgcolor: "#00DDB3", color: "#000", fontWeight: 900, fontSize: "1.1rem",
                    boxShadow: "0 15px 30px rgba(0, 221, 179, 0.3)" 
                }}
            >
              Lock & Deploy Assessment
            </Button>
          </Card>
        </Box>
      )}

    </Box>
  );
}
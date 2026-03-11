import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Card, Grid, Avatar, Chip, LinearProgress, 
    IconButton, Tooltip, Button, Stack, Paper, InputBase, MenuItem, Select, FormControl, Divider 
} from '@mui/material';
import { 
    ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, 
    StopCircle, Search, Filter, Users, Activity, Flag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveMonitoring() {
    const [students, setStudents] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Filtering and Searching State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const fetchLiveData = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('http://localhost:5000/api/live-monitoring');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch live monitoring data:", error);
        } finally {
            setTimeout(() => setIsRefreshing(false), 500); 
        }
    };

    useEffect(() => {
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- DERIVED STATS ---
    const totalStudents = students.length;
    const submittedCount = students.filter(s => s.status === 'Submitted').length;
    const flaggedCount = students.filter(s => s.violations > 0 && s.status !== 'Submitted').length;
    const activeCount = totalStudents - submittedCount;

    // --- FILTER LOGIC ---
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = true;
        if (filterStatus === "Suspicious") matchesFilter = student.violations > 0 && student.status !== 'Submitted';
        if (filterStatus === "Submitted") matchesFilter = student.status === 'Submitted';
        if (filterStatus === "Active") matchesFilter = student.status === 'Active' && student.violations === 0;

        return matchesSearch && matchesFilter;
    });

    return (
        <Box sx={{ animation: "fadeIn 0.5s ease", color: "#fff", p: { xs: 1, md: 3 }, minHeight: "85vh" }}>
            
            {/* --- HEADER: COMMAND CENTER HUD --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.5, px: 1.5, bgcolor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "50px" }}>
                            <Box sx={{ width: 8, height: 8, bgcolor: "#ef4444", borderRadius: "50%", animation: "pulse 1.5s infinite", boxShadow: "0 0 10px #ef4444" }} />
                            <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 800, letterSpacing: 1 }}>LIVE</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
                            Exam Monitor
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>CS-201: Data Structures Midterm</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 3, bgcolor: "rgba(15, 23, 42, 0.6)", p: 1.5, px: 3, borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Time Remaining</Typography>
                        <Typography variant="h5" sx={{ color: "#00DDB3", fontWeight: 900, fontFamily: "monospace" }}>45:22</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                    <Tooltip title="Force Sync Network">
                        <IconButton onClick={fetchLiveData} sx={{ color: "#fff", bgcolor: "rgba(255, 255, 255, 0.05)", "&:hover": { bgcolor: "#00DDB3", color: "#000" } }}>
                            <RefreshCw size={22} className={isRefreshing ? "spin-animation" : ""} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* --- TOP STATS ROW --- */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.05)", borderRadius: "16px" }}><Users color="#fff" size={24}/></Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900}>{totalStudents}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Roster</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: "rgba(0, 221, 179, 0.05)", border: "1px solid rgba(0, 221, 179, 0.2)", borderRadius: "24px", display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: "rgba(0, 221, 179, 0.15)", borderRadius: "16px" }}><Activity color="#00DDB3" size={24}/></Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} color="#00DDB3">{activeCount}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Active Now</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: flaggedCount > 0 ? "rgba(239, 68, 68, 0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${flaggedCount > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.05)"}`, borderRadius: "24px", display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: flaggedCount > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)", borderRadius: "16px" }}><Flag color={flaggedCount > 0 ? "#ef4444" : "#fff"} size={24}/></Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} color={flaggedCount > 0 ? "#ef4444" : "#fff"}>{flaggedCount}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Flagged/Suspicious</Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ p: 3, bgcolor: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.2)", borderRadius: "24px", display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: "rgba(6, 182, 212, 0.15)", borderRadius: "16px" }}><CheckCircle2 color="#06B6D4" size={24}/></Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} color="#06B6D4">{submittedCount}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Submitted</Typography>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* --- TOOLBAR (Search & Filter) --- */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
                <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 0.5, bgcolor: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", flexGrow: 1, maxWidth: 400 }}>
                    <Search size={20} color="rgba(255,255,255,0.5)" />
                    <InputBase 
                        placeholder="Search student name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ ml: 2, flex: 1, color: "#fff", "& input": { py: 1.5 } }} 
                    />
                </Paper>
                
                <FormControl variant="outlined" sx={{ minWidth: 200, bgcolor: "rgba(15, 23, 42, 0.6)", borderRadius: "16px" }}>
                    <Select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: "16px", color: "#fff", "& fieldset": { borderColor: "rgba(255,255,255,0.1)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } }}
                        startAdornment={<Filter size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />}
                    >
                        <MenuItem value="All">All Students</MenuItem>
                        <MenuItem value="Active">Active (No Flags)</MenuItem>
                        <MenuItem value="Suspicious">Suspicious (Flagged)</MenuItem>
                        <MenuItem value="Submitted">Submitted</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* --- MAIN GRID OF STUDENTS --- */}
            <Grid container spacing={3}>
                <AnimatePresence>
                    {filteredStudents.length === 0 ? (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: "center", py: 10, opacity: 0.5 }}>
                                <Users size={48} style={{ marginBottom: 16 }} />
                                <Typography variant="h6">No students match your filters.</Typography>
                            </Box>
                        </Grid>
                    ) : (
                        filteredStudents.map((student) => {
                            // Determine if critical for UI pulsing
                            const isCritical = student.violations > 5 && student.status !== 'Submitted';
                            
                            return (
                                <Grid item xs={12} md={6} lg={4} key={student.id}>
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} layout>
                                        <Card sx={{ 
                                            p: 3, 
                                            bgcolor: "rgba(15, 23, 42, 0.6)", 
                                            backdropFilter: "blur(10px)",
                                            border: `1px solid ${isCritical ? '#ef4444' : student.statusColor + '40'}`, 
                                            borderRadius: "24px",
                                            boxShadow: isCritical ? `0 0 30px rgba(239, 68, 68, 0.2)` : `0 10px 30px ${student.statusColor}10`,
                                            transition: "all 0.3s ease",
                                            position: "relative",
                                            overflow: "hidden"
                                        }}>
                                            
                                            {/* Background glow for critical state */}
                                            {isCritical && <Box sx={{ position: "absolute", top: 0, right: 0, width: 100, height: 100, background: "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)", filter: "blur(20px)", animation: "pulse 2s infinite" }} />}

                                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, position: "relative", zIndex: 2 }}>
                                                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                                    <Avatar sx={{ width: 48, height: 48, bgcolor: `${student.statusColor}20`, color: student.statusColor, fontWeight: 900, border: `2px solid ${student.statusColor}40` }}>
                                                        {student.name.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={900} lineHeight={1.2}>{student.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{student.email}</Typography>
                                                    </Box>
                                                </Box>
                                                
                                                {/* Status Icon/Badge */}
                                                {student.violations > 0 && student.status !== 'Submitted' ? (
                                                    <Tooltip title={`${student.violations} Tab Switches Detected`}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: student.statusColor, bgcolor: `${student.statusColor}15`, px: 1.5, py: 0.5, borderRadius: "12px", border: `1px solid ${student.statusColor}50`, height: "fit-content" }}>
                                                            {isCritical ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                                                            <Typography variant="caption" fontWeight={900}>{student.violations} Flags</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ) : (
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "12px", bgcolor: `${student.statusColor}10`, border: `1px solid ${student.statusColor}30` }}>
                                                        <CheckCircle2 size={20} color={student.statusColor} />
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box sx={{ mb: 3, position: "relative", zIndex: 2 }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Exam Progress</Typography>
                                                    <Typography variant="caption" fontWeight={800} color={student.statusColor}>
                                                        {student.status === 'Submitted' ? 'Completed' : `${student.questionsAnswered} / 3 Qs`}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={student.status === 'Submitted' ? 100 : (student.questionsAnswered / 3) * 100} 
                                                    sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: student.statusColor } }} 
                                                />
                                            </Box>

                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 2 }}>
                                                <Chip label={student.status} size="small" sx={{ bgcolor: `${student.statusColor}15`, color: student.statusColor, fontWeight: 800, borderRadius: "8px", border: `1px solid ${student.statusColor}40` }} />
                                                {student.status !== 'Submitted' && (
                                                    <Button size="small" variant="outlined" color="error" startIcon={<StopCircle size={16}/>} sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)", "&:hover": { bgcolor: "rgba(239,68,68,0.1)" } }}>
                                                        Force Submit
                                                    </Button>
                                                )}
                                            </Box>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            );
                        })
                    )}
                </AnimatePresence>
            </Grid>
            
            <style>{`
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
            `}</style>
        </Box>
    );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Box, Typography, Card, Grid, Avatar, Chip, LinearProgress, 
    IconButton, Stack, Paper, InputBase, MenuItem, Select, Divider 
} from '@mui/material';
import { 
    RefreshCw, Search, Users, Flag, Activity, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../server/config/supabaseClient";
import { authFetch } from "../utils/authFetch";

export default function LiveMonitoring() {
    const { profile } = useAuth();
    const [students, setStudents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [courseInfo, setCourseInfo] = useState({ id: null, name: "Connecting..." });
    
    // --- FILTER & SEARCH STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [collisions, setCollisions] = useState([]);
    
    const socketRef = useRef(null);

    // --- 1. THE DATA SYNC (Database Pull) ---
    const syncData = useCallback(async (cId) => {
        if (!cId) return;
        const { data: enrollment } = await supabase
            .from('students')
            .select(`user_id, users:user_id(id, name, email)`)
            .eq('course_id', cId);
            
        if (!enrollment) return;

        const { data: attempts } = await supabase
            .from('attempts')
            .select('*, initial_ip, ip_locked')
            .in('student_id', enrollment.map(e => e.user_id));

        const roster = enrollment.map(e => {
            const user = e.users;
            const att = attempts?.find(a => a.student_id === user.id);
            let status = 'Inactive';
            let color = '#94a3b8';
            if (att) {
                if (att.submitted_at) { status = 'Submitted'; color = '#06B6D4'; }
                else if (att.violations > 0) { status = 'Suspicious'; color = '#ef4444'; }
                else { status = 'Active'; color = '#00DDB3'; }
            }
            return {
                id: user.id, 
                name: user.name || "Unknown Student", 
                email: user.email,
                status, 
                statusColor: color, 
                violations: att?.violations || 0,
                questionsAnswered: att ? (att.violations > 0 ? 4 : 2) : 0, 
                totalQuestions: 10,
                initialIp: att?.initial_ip || null,
                ipLocked: att?.ip_locked || false,
            };
        });
        setStudents(roster);
    }, []);

    // --- 2. INITIALIZATION & OBSERVER HOOK ---
    useEffect(() => {
        const init = async () => {
            if (!profile) return;
            const { data: user } = await supabase.from("users").select("id").eq("email", profile.email).single();
            const { data: teacher } = await supabase.from("teachers").select("course_id").eq("user_id", user.id).single();
            const { data: course } = await supabase.from("courses").select("id, name").eq("id", teacher.course_id).single();
            
            setCourseInfo({ id: course.id, name: course.name });
            syncData(course.id);

            // ⚡ POLLING FALLBACK: Check DB every 5s for manual SQL changes
            const poller = setInterval(() => syncData(course.id), 5000);

            // 📡 WEBSOCKET: Real-time trigger
            const socketUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
            socketRef.current = io(socketUrl, { transports: ["websocket"] });
            socketRef.current.on("connect", () => {
                setIsConnected(true);
                socketRef.current.emit("subscribe_to_course", course.id);
            });
            socketRef.current.on("student_update", (data) => {
                setStudents(prev => prev.map(s => s.id === data.id ? { ...s, ...data } : s));
            });

            return () => {
                clearInterval(poller);
                socketRef.current?.disconnect();
            };
        };
        init();
    }, [profile, syncData]);

    // --- 3. FILTERING LOGIC ---
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "All" || s.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // --- 4. DYNAMIC STATS ---
    const stats = {
        total: students.length,
        active: students.filter(s => s.status === 'Active' || s.status === 'Suspicious').length,
        flagged: students.filter(s => s.status === 'Suspicious').length,
        done: students.filter(s => s.status === 'Submitted').length,
        ipFlagged: students.filter(s => s.ipLocked).length,
    };

    return (
        <Box sx={{ p: 3, color: "#fff", minHeight: "100vh" }}>
            {/* HUD HEADER */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1px' }}>Live Exam Center</Typography>
                    <Typography
                        component="div"
                        color="#00DDB3"
                        sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <Box
                            component="span"
                            sx={{
                                width: 8,
                                height: 8,
                                bgcolor: isConnected ? "#00DDB3" : "#ef4444",
                                borderRadius: "50%",
                                animation: isConnected ? "pulse 2s infinite" : "none",
                                display: "inline-block",
                            }}
                        />
                        {courseInfo.name} | {isConnected ? "LIVE SYNC ACTIVE" : "RECONNECTING..."}
                    </Typography>
                </Box>
                <IconButton onClick={() => syncData(courseInfo.id)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <RefreshCw size={24} />
                </IconButton>
            </Stack>

            {/* STATS HUD */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={6} md={3}>
                   <Card sx={{ p: 2, bgcolor: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <Stack direction="row" spacing={2} alignItems="center">
                            <Users color="#94a3b8" />
                            <Box>
                                <Typography variant="h4" fontWeight={900}>{stats.total}</Typography>
                                <Typography variant="caption" color="text.secondary">Total Enrolled</Typography>
                            </Box>
                       </Stack>
                   </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                   <Card sx={{ p: 2, bgcolor: "rgba(0, 221, 179, 0.05)", borderRadius: "16px", border: "1px solid rgba(0, 221, 179, 0.2)" }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Activity color="#00DDB3" />
                            <Box>
                                <Typography variant="h4" fontWeight={900} color="#00DDB3">{stats.active}</Typography>
                                <Typography variant="caption" color="text.secondary">Active Now</Typography>
                            </Box>
                       </Stack>
                   </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                   <Card sx={{ p: 2, bgcolor: stats.flagged > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(15, 23, 42, 0.4)", borderRadius: "16px", border: stats.flagged > 0 ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.05)" }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Flag color={stats.flagged > 0 ? "#ef4444" : "#94a3b8"} />
                            <Box>
                                <Typography variant="h4" fontWeight={900} color={stats.flagged > 0 ? "#ef4444" : "#fff"}>{stats.flagged}</Typography>
                                <Typography variant="caption" color="text.secondary">Suspicious</Typography>
                            </Box>
                       </Stack>
                   </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                   <Card sx={{ p: 2, bgcolor: stats.ipFlagged > 0 ? "rgba(168,85,247,0.1)" : "rgba(15, 23, 42, 0.4)", borderRadius: "16px", border: stats.ipFlagged > 0 ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.05)" }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ color: stats.ipFlagged > 0 ? "#A855F7" : "#94a3b8" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={900} color={stats.ipFlagged > 0 ? "#A855F7" : "#fff"}>{stats.ipFlagged}</Typography>
                                <Typography variant="caption" color="text.secondary">IP Flagged</Typography>
                            </Box>
                       </Stack>
                   </Card>
                </Grid>
            </Grid>

            {/* IP Collision Warnings */}
            {collisions.length > 0 && (
                <Card sx={{ p: 2.5, mb: 4, bgcolor: "rgba(245,158,11,0.08)", borderRadius: "16px", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                        <Flag color="#F59E0B" size={20} />
                        <Typography fontWeight={800} color="#F59E0B" fontSize="15px">IP Collision Alert — {collisions.length} shared IP(s) detected</Typography>
                    </Stack>
                    {collisions.map((c, i) => (
                        <Box key={i} sx={{ p: 1.5, mb: 1, bgcolor: "rgba(0,0,0,0.2)", borderRadius: "10px" }}>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#F59E0B", fontWeight: 600 }}>
                                IP {c.ip} — shared by {c.count} students
                            </Typography>
                        </Box>
                    ))}
                </Card>
            )}

            {/* --- FILTERS BAR --- */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
                <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, bgcolor: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", flexGrow: 1 }}>
                    <Search size={18} color="gray" />
                    <InputBase 
                        placeholder="Search student name or email..." 
                        sx={{ ml: 2, color: "#fff", flex: 1, py: 1.5 }} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Paper>
                
                <Select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    startAdornment={<Filter size={18} style={{ marginRight: 8, color: 'gray' }} />}
                    sx={{ 
                        borderRadius: "12px", 
                        color: "#fff", 
                        bgcolor: "rgba(15, 23, 42, 0.6)", 
                        minWidth: 180,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }
                    }}
                >
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Suspicious">Suspicious</MenuItem>
                    <MenuItem value="Submitted">Submitted</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
            </Stack>

            {/* STUDENT GRID */}
            <Grid container spacing={3}>
                <AnimatePresence>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                            <Grid item xs={12} md={6} lg={4} key={student.id}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} layout>
                                    <Card sx={{ 
                                        p: 3, 
                                        bgcolor: "rgba(15, 23, 42, 0.6)", 
                                        borderRadius: "24px", 
                                        border: `1px solid ${student.statusColor}50`,
                                        boxShadow: student.status === 'Suspicious' ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none'
                                    }}>
                                        <Stack direction="row" spacing={2} mb={2}>
                                            <Avatar sx={{ bgcolor: `${student.statusColor}20`, color: student.statusColor, fontWeight: 900, border: `1px solid ${student.statusColor}40` }}>
                                                {student.name[0]}
                                            </Avatar>
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography fontWeight={800} noWrap>{student.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap display="block">{student.email}</Typography>
                                            </Box>
                                        </Stack>

                                        <Box mb={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">Exam Progress</Typography>
                                                <Typography variant="caption" fontWeight={900} color={student.statusColor}>
                                                    {student.questionsAnswered}/{student.totalQuestions}
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={(student.questionsAnswered / student.totalQuestions) * 100} 
                                                sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: student.statusColor } }} 
                                            />
                                        </Box>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Chip 
                                                label={student.status} 
                                                size="small" 
                                                sx={{ bgcolor: `${student.statusColor}20`, color: student.statusColor, fontWeight: 900, borderRadius: '8px' }} 
                                            />
                                            <Typography
                                                component="div"
                                                variant="caption"
                                                sx={{
                                                    color: student.violations > 3 ? "#ef4444" : "#fff",
                                                    fontWeight: 900,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {student.violations > 0 && <Flag size={12} />}
                                                {student.violations} Flags
                                            </Typography>
                                        </Stack>

                                        {/* IP Info */}
                                        <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.06)" }} />
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "11px" }}>
                                                IP: {student.initialIp || "—"}
                                            </Typography>
                                            {student.ipLocked && (
                                                <Chip
                                                    label="IP FLAGGED"
                                                    size="small"
                                                    sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 800, fontSize: "10px", height: 22 }}
                                                />
                                            )}
                                        </Stack>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.3 }}>
                                <Search size={48} style={{ marginBottom: 16 }} />
                                <Typography variant="h6">No students match your search or filter</Typography>
                            </Box>
                        </Grid>
                    )}
                </AnimatePresence>
            </Grid>
        </Box>
    );
}
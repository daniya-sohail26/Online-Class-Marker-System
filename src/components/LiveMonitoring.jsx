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

export default function LiveMonitoring() {
    const { profile } = useAuth();
    const [students, setStudents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [courseInfo, setCourseInfo] = useState({ id: null, name: "Connecting..." });
    
    // --- FILTER & SEARCH STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    
    const socketRef = useRef(null);

    // --- 1. THE DATA SYNC (Database Pull) ---
    const syncData = useCallback(async (cId) => {
        if (!cId) return;
        const { data: enrollment } = await supabase
            .from('students')
            .select(`user_id, users:user_id(id, name, email)`)
            .eq('course_id', cId);
            
        if (!enrollment) return;

        const studentIds = enrollment.map((e) => e.user_id).filter(Boolean);

        const { data: tests } = await supabase
            .from('tests')
            .select('id, name, start_time, end_time, is_published')
            .eq('course_id', cId)
            .eq('is_published', true);

        const testIds = (tests ?? []).map((t) => t.id);

        const { data: schedules } = testIds.length > 0
            ? await supabase
                .from('test_schedules')
                .select('test_id, availability_start, availability_end, is_active')
                .in('test_id', testIds)
                .eq('is_active', true)
            : { data: [] };

        const { data: attempts } = await supabase
            .from('attempts')
            .select('*')
            .in('student_id', studentIds);

        const attemptIds = (attempts ?? []).map((a) => a.id).filter(Boolean);
        const { data: answers } = attemptIds.length > 0
            ? await supabase
                .from('answers')
                .select('attempt_id')
                .in('attempt_id', attemptIds)
            : { data: [] };

        const answerCountMap = (answers ?? []).reduce((acc, row) => {
            acc[row.attempt_id] = (acc[row.attempt_id] || 0) + 1;
            return acc;
        }, {});

        const scheduleMap = (schedules ?? []).reduce((acc, row) => {
            const existing = acc[row.test_id];
            if (!existing) {
                acc[row.test_id] = row;
                return acc;
            }
            const existingStart = existing.availability_start ? new Date(existing.availability_start).getTime() : 0;
            const rowStart = row.availability_start ? new Date(row.availability_start).getTime() : 0;
            if (rowStart >= existingStart) acc[row.test_id] = row;
            return acc;
        }, {});

        const attemptsByStudentAndTest = (attempts ?? []).reduce((acc, row) => {
            if (!row.student_id || !row.test_id) return acc;
            const key = `${row.student_id}::${row.test_id}`;
            const prev = acc[key];
            if (!prev) {
                acc[key] = row;
                return acc;
            }
            const prevTs = new Date(prev.created_at || prev.started_at || 0).getTime();
            const rowTs = new Date(row.created_at || row.started_at || 0).getTime();
            if (rowTs >= prevTs) acc[key] = row;
            return acc;
        }, {});

        const now = new Date();

        const getWindow = (testId, fallbackStart, fallbackEnd) => {
            const schedule = scheduleMap[testId];
            const startRaw = schedule?.availability_start || fallbackStart || null;
            const endRaw = schedule?.availability_end || fallbackEnd || null;
            const start = startRaw ? new Date(startRaw) : null;
            const end = endRaw ? new Date(endRaw) : null;
            const valid = Boolean(
                start &&
                end &&
                !Number.isNaN(start.getTime()) &&
                !Number.isNaN(end.getTime()) &&
                end > start
            );
            return { start, end, valid };
        };

        const statusPriority = {
            Suspicious: 6,
            Active: 5,
            'Not Started': 4,
            Upcoming: 3,
            Submitted: 2,
            Missed: 1,
            Inactive: 0,
        };

        const statusColorMap = {
            Suspicious: '#ef4444',
            Active: '#00DDB3',
            'Not Started': '#06B6D4',
            Upcoming: '#a78bfa',
            Submitted: '#22D3EE',
            Missed: '#f59e0b',
            Inactive: '#94a3b8',
        };

        const roster = enrollment.map(e => {
            const user = e.users;
            const perTestStatuses = (tests ?? []).map((test) => {
                const key = `${user.id}::${test.id}`;
                const att = attemptsByStudentAndTest[key];
                const window = getWindow(test.id, test.start_time, test.end_time);

                let status = 'Inactive';
                if (!window.valid) {
                    status = att?.submitted_at ? 'Submitted' : 'Inactive';
                } else if (att?.submitted_at) {
                    status = 'Submitted';
                } else if (window.start > now) {
                    status = 'Upcoming';
                } else if (window.end < now) {
                    status = att ? 'Missed' : 'Inactive';
                } else if (att && Number(att.violations || 0) > 0) {
                    status = 'Suspicious';
                } else if (att) {
                    status = 'Active';
                } else {
                    status = 'Not Started';
                }

                return {
                    testId: test.id,
                    testName: test.name || 'Test',
                    status,
                    color: statusColorMap[status] || '#94a3b8',
                    attemptId: att?.id || null,
                    violations: Number(att?.violations || 0),
                    answered: att?.id ? (answerCountMap[att.id] || 0) : 0,
                };
            });

            let primaryStatus = 'Inactive';
            for (const item of perTestStatuses) {
                if ((statusPriority[item.status] || 0) > (statusPriority[primaryStatus] || 0)) {
                    primaryStatus = item.status;
                }
            }

            const primaryColor = statusColorMap[primaryStatus] || '#94a3b8';
            const totalViolations = perTestStatuses.reduce((sum, t) => sum + (t.violations || 0), 0);
            const activeAttempt = perTestStatuses.find((t) => t.status === 'Active' || t.status === 'Suspicious');

            return {
                id: user.id, 
                name: user.name || "Unknown Student", 
                email: user.email,
                status: primaryStatus,
                statusColor: primaryColor,
                violations: totalViolations,
                questionsAnswered: activeAttempt?.answered || 0,
                totalQuestions: 10,
                testStatuses: perTestStatuses,
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
        done: students.filter(s => s.status === 'Submitted').length
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
            </Grid>

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

                                        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />
                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
                                            Test Statuses
                                        </Typography>
                                        <Box sx={{ mt: 1.2, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                            {(student.testStatuses || []).length === 0 ? (
                                                <Chip size="small" label="No Tests" sx={{ bgcolor: "rgba(148,163,184,0.15)", color: "#94a3b8" }} />
                                            ) : (
                                                student.testStatuses.map((item) => (
                                                    <Chip
                                                        key={`${student.id}-${item.testId}`}
                                                        size="small"
                                                        label={`${item.testName}: ${item.status}`}
                                                        sx={{
                                                            bgcolor: `${item.color}20`,
                                                            color: item.color,
                                                            border: `1px solid ${item.color}55`,
                                                            maxWidth: '100%',
                                                            '& .MuiChip-label': { whiteSpace: 'normal' },
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </Box>
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
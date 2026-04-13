import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  RadioButtonUnchecked as UpcomingIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../server/config/supabaseClient";
import { motion } from "framer-motion";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTestStatus(test, submittedIds) {
  const now   = new Date();
  const start = test.availabilityStart;
  const end   = test.availabilityEnd;
  const hasValidWindow = start && end && end > start;

  if (submittedIds.has(test.id))              return "completed";
  if (hasValidWindow && now > end)            return "completed";
  if (hasValidWindow && now < start)          return "upcoming";
  return "active";
}

function formatWindow(start, end) {
  if (!start || !end) return "—";
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, title, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%" }}
    >
      <Card
        sx={{
          p: 2.5,
          height: "100%",
          bgcolor: "rgba(10,12,28,0.7)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px",
          display: "flex",
          gap: 2,
          alignItems: "center",
          backdropFilter: "blur(12px)",
          transition: "border-color 0.25s, box-shadow 0.25s",
          "&:hover": {
            borderColor: `${accent}55`,
            boxShadow: `0 0 24px ${accent}22`,
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              mb: 0.4,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ fontSize: "26px", fontWeight: 800, color: "#fff", lineHeight: 1 }}
          >
            {value}
          </Typography>
        </Box>
      </Card>
    </motion.div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, accent }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Box sx={{ color: accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "15px" }}>
        {title}
      </Typography>
      <Box
        sx={{
          ml: "auto",
          px: 1.5,
          py: 0.3,
          borderRadius: "20px",
          bgcolor: `${accent}18`,
          color: accent,
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {count}
      </Box>
    </Box>
  );
}

// ── Table Header Row ──────────────────────────────────────────────────────────

function TheadRow({ headers }) {
  return (
    <TableRow>
      {headers.map((h) => (
        <TableCell
          key={h}
          sx={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          {h}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const navigate    = useNavigate();
  const { profile } = useAuth();

  const [tests, setTests]       = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      setError("");

      // 1. Published tests for student's course
      const { data: rawTests, error: testsErr } = await supabase
        .from("tests")
        .select("id, name, total_marks, is_published, template_id, start_time, end_time")
        .eq("course_id", profile.course_id)
        .eq("is_published", true);

      if (testsErr) throw testsErr;

      if (!rawTests?.length) {
        setTests([]);
        setLoading(false);
        return;
      }

      // 2. Template durations
      const templateIds = [
        ...new Set(rawTests.map((t) => t.template_id).filter(Boolean)),
      ];
      const { data: templates } = await supabase
        .from("templates")
        .select("id, duration_minutes")
        .in("id", templateIds);

      const durationMap = {};
      for (const tmpl of templates ?? []) {
        durationMap[tmpl.id] = tmpl.duration_minutes;
      }

      // 3. Active schedules
      const testIds = rawTests.map((t) => t.id);
      const { data: schedules } = await supabase
        .from("test_schedules")
        .select("test_id, availability_start, availability_end, is_active")
        .in("test_id", testIds)
        .eq("is_active", true);

      const scheduleMap = {};
      for (const s of schedules ?? []) {
        const start = new Date(s.availability_start);
        const end   = new Date(s.availability_end);
        if (end > start) scheduleMap[s.test_id] = { start, end };
      }

      // 4. Student's submitted attempts
      const { data: attemptsData, error: attemptsErr } = await supabase
        .from("attempts")
        .select("id, test_id, score, submitted_at, created_at")
        .eq("student_id", profile.user_id)
        .not("submitted_at", "is", null)
        .order("created_at", { ascending: false });

      if (attemptsErr) throw attemptsErr;

      // 5. Enrich tests
      const enriched = rawTests.map((t) => ({
        id:                t.id,
        name:              t.name,
        durationMinutes:   durationMap[t.template_id] ?? 60,
        totalMarks:        t.total_marks,
        availabilityStart: scheduleMap[t.id]?.start ?? (t.start_time ? new Date(t.start_time) : null),
        availabilityEnd:   scheduleMap[t.id]?.end   ?? (t.end_time   ? new Date(t.end_time)   : null),
        isPublished:       t.is_published,
      }));

      setTests(enriched);
      setAttempts(attemptsData ?? []);
    } catch (err) {
      console.error("[Dashboard] fetch error:", err);
      setError(err.message ?? "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, profile?.course_id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const submittedIds    = new Set(attempts.map((a) => a.test_id));
  const attemptByTestId = {};
  for (const a of attempts) attemptByTestId[a.test_id] = a;

  const activeTests    = tests.filter((t) => getTestStatus(t, submittedIds) === "active");
  const upcomingTests  = tests.filter((t) => getTestStatus(t, submittedIds) === "upcoming");
  const completedTests = tests.filter((t) => getTestStatus(t, submittedIds) === "completed");

  const avgScore =
    attempts.length > 0
      ? (attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length).toFixed(1)
      : "—";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={36} sx={{ color: "#6366F1" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
          Loading your dashboard…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, maxWidth: 1100, mx: "auto" }}>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#fff", mb: 0.5, letterSpacing: "-0.02em" }}>
            Welcome back, {profile?.name ?? "Student"} 👋
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
            Your exam portal — view your tests and results below
          </Typography>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <AssignmentIcon fontSize="small" />, title: "Total Tests",  value: tests.length,          accent: "#10B981" },
          { icon: <ScheduleIcon   fontSize="small" />, title: "Active Now",   value: activeTests.length,    accent: "#F59E0B" },
          { icon: <CheckCircleIcon fontSize="small"/>, title: "Completed",    value: completedTests.length, accent: "#6366F1" },
      
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} delay={i * 0.08} />
          </Grid>
        ))}
      </Grid>

      {/* Active Tests */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Card sx={{ mb: 3, bgcolor: "rgba(10,12,28,0.7)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "14px", overflow: "hidden", backdropFilter: "blur(12px)" }}>
          <SectionHeader icon={<CheckCircleIcon fontSize="small" />} title="Active Tests" count={activeTests.length} accent="#10B981" />
          {activeTests.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>No active tests right now</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead><TheadRow headers={["Test Name", "Duration", "Marks", "Window", "Note"]} /></TableHead>
                <TableBody>
                  {activeTests.map((test) => (
                    <TableRow key={test.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{test.name}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{test.durationMinutes} min</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{test.totalMarks ?? "—"}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{formatWindow(test.availabilityStart, test.availabilityEnd)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<LockIcon sx={{ fontSize: "12px !important" }} />}
                          label="Use Mobile App"
                          size="small"
                          sx={{ bgcolor: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 600, fontSize: "11px", border: "1px solid rgba(16,185,129,0.25)" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </motion.div>

      {/* Upcoming Tests */}
      {upcomingTests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}>
          <Card sx={{ mb: 3, bgcolor: "rgba(10,12,28,0.7)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "14px", overflow: "hidden", backdropFilter: "blur(12px)" }}>
            <SectionHeader icon={<UpcomingIcon fontSize="small" />} title="Upcoming Tests" count={upcomingTests.length} accent="#F59E0B" />
            <TableContainer>
              <Table>
                <TableHead><TheadRow headers={["Test Name", "Duration", "Marks", "Available From"]} /></TableHead>
                <TableBody>
                  {upcomingTests.map((test) => (
                    <TableRow key={test.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", "&:last-child td": { border: 0 }, opacity: 0.75 }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{test.name}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{test.durationMinutes} min</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{test.totalMarks ?? "—"}</TableCell>
                      <TableCell sx={{ color: "#F59E0B", fontSize: "13px", fontWeight: 500 }}>
                        {test.availabilityStart?.toLocaleDateString() ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}>
          <Card sx={{ bgcolor: "rgba(10,12,28,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "14px", overflow: "hidden", backdropFilter: "blur(12px)" }}>
            <SectionHeader icon={<ScheduleIcon fontSize="small" />} title="Completed Tests" count={completedTests.length} accent="#6366F1" />
            <TableContainer>
              <Table>
                <TableHead><TheadRow headers={["Test Name", "Duration", "Score", "Submitted", "Result"]} /></TableHead>
                <TableBody>
                  {completedTests.map((test) => {
                    const attempt = attemptByTestId[test.id];
                    const score   = attempt?.score ?? null;
                    const passed  = score != null && score >= 50;

                    return (
                      <TableRow
                        key={test.id}
                        sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }, cursor: attempt ? "pointer" : "default" }}
                        onClick={() => { if (attempt) navigate(`/student/results/${attempt.id}?testId=${test.id}`); }}
                      >
                        <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{test.name}</TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)" }}>{test.durationMinutes} min</TableCell>
                        <TableCell>
                          {score != null ? (
                            <Chip
                              label={`${Number(score).toFixed(1)} / ${test.totalMarks}`}
                              size="small"
                              sx={{ bgcolor: passed ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: passed ? "#10B981" : "#EF4444", fontWeight: 700, fontSize: "12px", border: `1px solid ${passed ? "#10B98133" : "#EF444433"}` }}
                            />
                          ) : (
                            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Pending</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                          {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {attempt ? (
                            <Chip
                              icon={<VisibilityIcon sx={{ fontSize: "12px !important" }} />}
                              label="View Results"
                              size="small"
                              sx={{ bgcolor: "rgba(99,102,241,0.12)", color: "#6366F1", fontWeight: 600, fontSize: "11px", border: "1px solid rgba(99,102,241,0.25)", cursor: "pointer" }}
                            />
                          ) : (
                            <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}
    </Box>
  );
}
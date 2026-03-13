import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Users, BookOpen, Building2, GraduationCap, BarChart3, TrendingUp, Percent, Award } from "lucide-react";
import { supabase } from "../../lib/supabase";

const PASS_THRESHOLD = 40; // 40% to pass

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    departments: 0,
    courses: 0,
    teachers: 0,
    students: 0,
    testsTotal: 0,
    attemptsTotal: 0,
    passCount: 0,
    failCount: 0,
    avgScoreOverall: 0,
    completionRate: 0,
  });
  const [coursePerformance, setCoursePerformance] = useState([]);
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const [deptRes, courseRes, teacherRes, studentRes, testRes, attemptRes] = await Promise.all([
          supabase.from("departments").select("id, name"),
          supabase.from("courses").select("id, name, department_id"),
          supabase.from("teachers").select("id", { count: "exact", head: true }),
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("tests").select("id", { count: "exact", head: true }),
          supabase.from("attempts").select("id, score, test_id, submitted_at").not("submitted_at", "is", null),
        ]);

        const departments = deptRes.data || [];
        const courses = courseRes.data || [];
        const attempts = attemptRes.data || [];

        // Get tests with course info for course-wise analytics
        const { data: testsWithCourse } = await supabase
          .from("tests")
          .select("id, course_id, total_marks")
          .eq("is_published", true);

        const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
        const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

        // Build attempt -> test -> course mapping
        const testMap = Object.fromEntries((testsWithCourse || []).map((t) => [t.id, t]));
        const attemptsWithCourse = attempts
          .map((a) => {
            const test = testMap[a.test_id];
            if (!test) return null;
            const course = courseMap[test.course_id];
            const totalMarks = test.total_marks || 100;
            const pct = a.score != null ? (Number(a.score) / totalMarks) * 100 : null;
            return { ...a, course_id: test.course_id, course_name: course?.name, total_marks: totalMarks, pct };
          })
          .filter(Boolean);

        // Course-wise performance
        const courseStats = {};
        attemptsWithCourse.forEach((a) => {
          const cid = a.course_id;
          if (!courseStats[cid]) {
            courseStats[cid] = { name: a.course_name, scores: [], pcts: [], total: 0 };
          }
          if (a.score != null) {
            courseStats[cid].scores.push(Number(a.score));
            courseStats[cid].pcts.push(a.pct);
            courseStats[cid].total++;
          }
        });

        const coursePerf = Object.entries(courseStats).map(([id, s]) => {
          const avg = s.scores.length ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0;
          const pass = s.pcts.filter((p) => p >= PASS_THRESHOLD).length;
          const fail = s.scores.length - pass;
          return {
            id,
            name: s.name,
            attempts: s.total,
            avgScore: avg.toFixed(1),
            passCount: pass,
            failCount: fail,
            passRate: s.scores.length ? ((pass / s.scores.length) * 100).toFixed(1) : 0,
          };
        });

        // Department-wise (aggregate courses)
        const deptStats = {};
        coursePerf.forEach((cp) => {
          const course = courses.find((c) => c.id === cp.id);
          if (!course) return;
          const did = course.department_id;
          if (!deptStats[did]) {
            deptStats[did] = { name: deptMap[did]?.name, attempts: 0, totalScore: 0, pass: 0, fail: 0 };
          }
          deptStats[did].attempts += cp.attempts;
          deptStats[did].totalScore += cp.attempts * parseFloat(cp.avgScore);
          deptStats[did].pass += cp.passCount;
          deptStats[did].fail += cp.failCount;
        });

        const deptPerf = Object.entries(deptStats).map(([id, s]) => {
          const total = s.pass + s.fail;
          const avg = s.attempts ? (s.totalScore / s.attempts).toFixed(1) : 0;
          const passRate = total ? ((s.pass / total) * 100).toFixed(1) : 0;
          return {
            id,
            name: s.name,
            attempts: s.attempts,
            avgScore: avg,
            passCount: s.pass,
            failCount: s.fail,
            passRate,
          };
        });

        const totalAttempts = attempts.length;
        const submitted = attempts.filter((a) => a.submitted_at).length;
        const withPct = attemptsWithCourse.filter((a) => a.pct != null);
        const avgOverall = withPct.length ? withPct.reduce((sum, a) => sum + a.pct, 0) / withPct.length : 0;
        const passCount = withPct.filter((a) => a.pct >= PASS_THRESHOLD).length;
        const failCount = withPct.length - passCount;
        const completionRate = totalAttempts ? (submitted / totalAttempts) * 100 : 0;

        setStats({
          departments: departments.length,
          courses: courses.length,
          teachers: teacherRes.count ?? 0,
          students: studentRes.count ?? 0,
          testsTotal: testRes.count ?? 0,
          attemptsTotal: totalAttempts,
          passCount,
          failCount,
          avgScoreOverall: avgOverall.toFixed(1),
          completionRate: completionRate.toFixed(1),
        });
        setCoursePerformance(coursePerf);
        setDeptPerformance(deptPerf);
        setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const statCards = [
    { label: "Departments", value: stats.departments, icon: <Building2 size={28} />, color: "#06B6D4" },
    { label: "Courses", value: stats.courses, icon: <BookOpen size={28} />, color: "#00DDB3" },
    { label: "Teachers", value: stats.teachers, icon: <Users size={28} />, color: "#8A2BE2" },
    { label: "Students", value: stats.students, icon: <GraduationCap size={28} />, color: "#EC4899" },
    { label: "Tests Conducted", value: stats.testsTotal, icon: <BarChart3 size={28} />, color: "#F59E0B" },
    { label: "Total Attempts", value: stats.attemptsTotal, icon: <TrendingUp size={28} />, color: "#10B981" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" mb={1}>Institutional Analytics</Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of tests, performance, and completion rates. Admin cannot modify questions, templates, or scoring.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 3, borderLeft: `4px solid ${s.color}` }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${s.color}20`, color: s.color }}>{s.icon}</Box>
              <Box>
                <Typography variant="h4">{s.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: 1 }}>
                  {s.label}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pass/Fail & Completion Rates */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "4px solid #10B981" }}>
            <Award size={24} color="#10B981" />
            <Box>
              <Typography variant="h5">{stats.passCount} / {stats.passCount + stats.failCount}</Typography>
              <Typography variant="body2" color="text.secondary">Pass / Fail Ratio</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "4px solid #00DDB3" }}>
            <Percent size={24} color="#00DDB3" />
            <Box>
              <Typography variant="h5">{stats.avgScoreOverall}%</Typography>
              <Typography variant="body2" color="text.secondary">Average Score (Overall)</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: "4px solid #06B6D4" }}>
            <TrendingUp size={24} color="#06B6D4" />
            <Box>
              <Typography variant="h5">{stats.completionRate}%</Typography>
              <Typography variant="body2" color="text.secondary">Test Completion Rate</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Course-wise Performance */}
      <Card sx={{ overflow: "hidden", mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6">Course-wise Performance</Typography>
          <Typography variant="body2" color="text.secondary">Average scores, pass/fail, and attempt counts per course.</Typography>
        </Box>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell align="right">Attempts</TableCell>
              <TableCell align="right">Avg Score</TableCell>
              <TableCell align="right">Pass</TableCell>
              <TableCell align="right">Fail</TableCell>
              <TableCell align="right">Pass Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coursePerformance.map((c, i) => (
              <TableRow key={i} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell align="right">{c.attempts}</TableCell>
                <TableCell align="right">{c.avgScore}%</TableCell>
                <TableCell align="right"><Chip label={c.passCount} size="small" color="success" sx={{ bgcolor: "#10b98120" }} /></TableCell>
                <TableCell align="right"><Chip label={c.failCount} size="small" color="error" sx={{ bgcolor: "#ef444420" }} /></TableCell>
                <TableCell align="right">{c.passRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Department-wise Performance */}
      <Card sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6">Department-wise Performance</Typography>
          <Typography variant="body2" color="text.secondary">Aggregated metrics by department.</Typography>
        </Box>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell align="right">Attempts</TableCell>
              <TableCell align="right">Avg Score</TableCell>
              <TableCell align="right">Pass</TableCell>
              <TableCell align="right">Fail</TableCell>
              <TableCell align="right">Pass Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deptPerformance.map((d, i) => (
              <TableRow key={i} hover>
                <TableCell>{d.name}</TableCell>
                <TableCell align="right">{d.attempts}</TableCell>
                <TableCell align="right">{d.avgScore}%</TableCell>
                <TableCell align="right"><Chip label={d.passCount} size="small" color="success" sx={{ bgcolor: "#10b98120" }} /></TableCell>
                <TableCell align="right"><Chip label={d.failCount} size="small" color="error" sx={{ bgcolor: "#ef444420" }} /></TableCell>
                <TableCell align="right">{d.passRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

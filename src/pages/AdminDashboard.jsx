import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, Card, Button, Avatar, Table, TableBody, TableCell, TableHead, TableRow, Chip } from "@mui/material";
import { Users, BookOpen, Building2, UploadCloud, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ departments: 0, teachers: 0, students: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      if (!supabase) {
        setStats({ departments: 0, teachers: 0, students: 0 });
        setRecent([]);
        return;
      }
      const [d, t, s] = await Promise.all([
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        departments: d.count ?? 0,
        teachers: t.count ?? 0,
        students: s.count ?? 0,
      });
      const { data } = await supabase.from("users").select("name, email, role, created_at").order("created_at", { ascending: false }).limit(5);
      setRecent(data || []);
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.students.toLocaleString(), icon: <Users />, color: "#6366f1" },
    { label: "Active Teachers", value: stats.teachers.toString(), icon: <BookOpen />, color: "#8b5cf6" },
    { label: "Departments", value: stats.departments.toString(), icon: <Building2 />, color: "#10b981" },
  ];

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Institution Overview</Typography>
          <Typography variant="body1" color="text.secondary">Manage departments, courses, and user accounts.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" startIcon={<UploadCloud size={18} />} onClick={() => navigate("/admin/bulk-upload")}>
            Bulk Upload Students
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/admin/teachers")}>
            Add Teacher
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={5}>
        {statCards.map((stat, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 4 } }} onClick={() => navigate(idx === 0 ? "/admin/students" : idx === 1 ? "/admin/teachers" : "/admin/departments")}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: 1 }}>
                  {stat.label}
                </Typography>
              </Box>
              <ArrowRight size={20} color={stat.color} />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Recent Enrollments</Typography>
          <Button size="small" onClick={() => navigate("/admin/users")}>View All</Button>
        </Box>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recent.map((u, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>{u.name?.[0] || "?"}</Avatar>
                  {u.name}
                </TableCell>
                <TableCell><Chip label={u.role} size="small" color={u.role === "admin" ? "error" : u.role === "teacher" ? "primary" : "default"} /></TableCell>
                <TableCell><Chip label="Active" size="small" color="success" sx={{ bgcolor: "#10b98120" }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

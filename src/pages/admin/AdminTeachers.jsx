import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../server/config/supabaseClient"; // <-- Added Supabase import

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchData = async () => {
    if (!supabase) {
      setTeachers([]);
      setUsers([]);
      setCourses([]);
      setDepartments([]);
      return;
    }
    const [teacherRes, userRes, courseRes, deptRes] = await Promise.all([
      supabase.from("teachers").select("*, users(name, email), courses(id, name, department_id, departments(name))"),
      supabase.from("users").select("*").eq("role", "teacher"),
      supabase.from("courses").select("*, departments(name)"),
      supabase.from("departments").select("*").order("name", { ascending: true }),
    ]);
    if (!teacherRes.error) setTeachers(teacherRes.data || []);
    if (!userRes.error) setUsers(userRes.data || []);
    if (!courseRes.error) setCourses(courseRes.data || []);
    if (!deptRes.error) setDepartments(deptRes.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = () => {
    setUserId("");
    setCourseId("");
    setName("");
    setEmail("");
    setPassword("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (!supabase) return;
    if (userId && courseId) {
      const existing = teachers.find((t) => t.user_id === userId && t.course_id === courseId);
      if (existing) return alert("This teacher is already assigned to this course.");
      await supabase.from("teachers").insert([{ user_id: userId, course_id: courseId }]);
    } else if (name && email && password && courseId) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (authErr) return alert(authErr.message);
      const { data: userData } = await supabase.from("users").insert([{ auth_id: authData.user.id, name, email, role: "teacher" }]).select().single();
      if (userData) {
        await supabase.from("teachers").insert([{ user_id: userData.id, course_id: courseId }]);
      }
    }
    fetchData();
    handleClose();
  };

  const handleRemoveFromCourse = async (teacherId) => {
    if (!window.confirm("Remove this teacher from the course?") || !supabase) return;
    await supabase.from("teachers").delete().eq("id", teacherId);
    fetchData();
  };

  const canSave = supabase && ((userId && courseId) || (name && email && password && courseId));

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      const user = t.users || users.find((u) => u.id === t.user_id) || {};
      const course = t.courses || courses.find((c) => c.id === t.course_id) || {};
      const departmentName = course.departments?.name || departments.find((d) => d.id === course.department_id)?.name || "";
      const matchesSearch = !q || [user.name, user.email, course.name, departmentName].some((value) =>
        String(value || "").toLowerCase().includes(q)
      );
      const matchesDepartment = !departmentFilter || course.department_id === departmentFilter;
      const matchesCourse = !courseFilter || t.course_id === courseFilter;
      return matchesSearch && matchesDepartment && matchesCourse;
    });
  }, [teachers, users, courses, departments, search, departmentFilter, courseFilter]);

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Teachers</Typography>
          <Typography variant="body1" color="text.secondary">Create teacher accounts and assign them to courses.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpen} disabled={!supabase}>
          Add Teacher
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" }, gap: 2 }}>
          <TextField label="Search teachers" value={search} onChange={(e) => setSearch(e.target.value)} size="small" />
          <FormControl size="small">
            <InputLabel>Department</InputLabel>
            <Select value={departmentFilter} label="Department" onChange={(e) => setDepartmentFilter(e.target.value)}>
              <MenuItem value="">All departments</MenuItem>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Course</InputLabel>
            <Select value={courseFilter} label="Course" onChange={(e) => setCourseFilter(e.target.value)}>
              <MenuItem value="">All courses</MenuItem>
              {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Assigned Course</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeachers.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.users?.name || users.find((u) => u.id === t.user_id)?.name}</TableCell>
                <TableCell>{t.users?.email || users.find((u) => u.id === t.user_id)?.email}</TableCell>
                <TableCell>{t.courses?.departments?.name || departments.find((d) => d.id === t.courses?.department_id)?.name || "—"}</TableCell>
                <TableCell><Chip label={t.courses?.name || courses.find((c) => c.id === t.course_id)?.name} size="small" /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleRemoveFromCourse(t.id)} title="Remove from course">
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
        <DialogTitle>Add Teacher</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Existing Teacher</InputLabel>
            <Select value={userId} label="Existing Teacher" onChange={(e) => setUserId(e.target.value)}>
              <MenuItem value="">Create new teacher</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!userId && (
            <>
              <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
              {supabase && <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />}
            </>
          )}
          <FormControl fullWidth>
            <InputLabel>Assign to Course</InputLabel>
            <Select value={courseId} label="Assign to Course" onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

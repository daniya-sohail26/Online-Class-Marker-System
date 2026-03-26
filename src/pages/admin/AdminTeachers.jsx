import React, { useState, useEffect } from "react";
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
      return;
    }
    const [teacherRes, userRes, courseRes] = await Promise.all([
      supabase.from("teachers").select("*, users(name, email), courses(name)"),
      supabase.from("users").select("*").eq("role", "teacher"),
      supabase.from("courses").select("*"),
    ]);
    if (!teacherRes.error) setTeachers(teacherRes.data || []);
    if (!userRes.error) setUsers(userRes.data || []);
    if (!courseRes.error) setCourses(courseRes.data || []);
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

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Assigned Course</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.users?.name || users.find((u) => u.id === t.user_id)?.name}</TableCell>
                <TableCell>{t.users?.email || users.find((u) => u.id === t.user_id)?.email}</TableCell>
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

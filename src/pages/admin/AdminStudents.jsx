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
} from "@mui/material";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");

  const fetchData = async () => {
    if (!supabase) {
      setStudents([]);
      setCourses([]);
      return;
    }
    const [studentRes, courseRes] = await Promise.all([
      supabase.from("students").select("*, users(name, email), courses(name)"),
      supabase.from("courses").select("*"),
    ]);
    if (!studentRes.error) setStudents(studentRes.data || []);
    if (!courseRes.error) setCourses(courseRes.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = () => {
    setName("");
    setEmail("");
    setPassword("");
    setCourseId("");
    setEnrollmentNumber("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (!name || !email || !courseId || !enrollmentNumber || !supabase) return;
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: password || "changeme123", options: { data: { name } } });
    if (authErr) return alert(authErr.message);
    const { data: userData } = await supabase.from("users").insert([{ auth_id: authData.user.id, name, email, role: "student" }]).select().single();
    if (userData) {
      await supabase.from("students").insert([{ user_id: userData.id, course_id: courseId, enrollment_number: enrollmentNumber.trim() }]);
    }
    fetchData();
    handleClose();
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Students</Typography>
          <Typography variant="body1" color="text.secondary">Create student accounts and enroll them in courses.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate("/admin/bulk-upload")}>Bulk Upload</Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpen} disabled={!supabase}>
            Add Student
          </Button>
        </Box>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Enrollment #</TableCell>
              <TableCell>Course</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.users?.name}</TableCell>
                <TableCell>{s.users?.email}</TableCell>
                <TableCell>{s.enrollment_number}</TableCell>
                <TableCell>{s.courses?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          {supabase && <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional" sx={{ mb: 2 }} />}
          <TextField fullWidth label="Enrollment Number" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select value={courseId} label="Course" onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!supabase || !name || !email || !courseId || !enrollmentNumber}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

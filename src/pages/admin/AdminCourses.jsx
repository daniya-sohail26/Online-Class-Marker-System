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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../../server/config/supabaseClient"; // <-- Added Supabase import

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const fetchData = async () => {
    if (!supabase) {
      setDepartments([]);
      setCourses([]);
      return;
    }
    const [deptRes, courseRes] = await Promise.all([
      supabase.from("departments").select("*"),
      supabase.from("courses").select("*, departments(name)").order("created_at", { ascending: false }),
    ]);
    if (!deptRes.error) setDepartments(deptRes.data || []);
    if (!courseRes.error) setCourses(courseRes.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (course = null) => {
    setEditing(course);
    setName(course?.name || "");
    setDescription(course?.description || "");
    setDepartmentId(course?.department_id || (departments[0]?.id || ""));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setName("");
    setDescription("");
    setDepartmentId("");
  };

  const handleSave = async () => {
    if (!name.trim() || !departmentId || !supabase) return;
    if (editing) {
      await supabase.from("courses").update({ name: name.trim(), description: description.trim(), department_id: departmentId }).eq("id", editing.id);
    } else {
      await supabase.from("courses").insert([{ name: name.trim(), description: description.trim(), department_id: departmentId }]);
    }
    fetchData();
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?") || !supabase) return;
    await supabase.from("courses").delete().eq("id", id);
    fetchData();
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Courses</Typography>
          <Typography variant="body1" color="text.secondary">Create and manage courses by department.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpen()} disabled={!supabase || departments.length === 0}>
          Add Course
        </Button>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.description || "—"}</TableCell>
                <TableCell>{course.departments?.name || departments.find((d) => d.id === course.department_id)?.name || "—"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(course)}><Pencil size={18} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(course.id)}><Trash2 size={18} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
        <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select value={departmentId} label="Department" onChange={(e) => setDepartmentId(e.target.value)}>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Course Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

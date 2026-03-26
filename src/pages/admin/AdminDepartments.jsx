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
} from "@mui/material";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../../server/config/supabaseClient"; // <-- Added Supabase import  

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    if (!supabase) {
      setDepartments([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("departments").select("*").order("created_at", { ascending: false });
    if (!error) setDepartments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpen = (dept = null) => {
    setEditing(dept);
    setName(dept?.name || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setName("");
  };

  const handleSave = async () => {
    if (!name.trim() || !supabase) return;
    if (editing) {
      await supabase.from("departments").update({ name: name.trim() }).eq("id", editing.id);
    } else {
      await supabase.from("departments").insert([{ name: name.trim() }]);
    }
    fetchDepartments();
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?") || !supabase) return;
    await supabase.from("departments").delete().eq("id", id);
    fetchDepartments();
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Departments</Typography>
          <Typography variant="body1" color="text.secondary">Manage institutional departments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpen()} disabled={!supabase}>
          Add Department
        </Button>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id} hover>
                <TableCell>{dept.name}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(dept)}><Pencil size={18} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(dept.id)}><Trash2 size={18} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
        <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Department Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

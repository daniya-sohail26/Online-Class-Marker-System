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

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSessions = async () => {
    if (!supabase) {
      setSessions([]);
      return;
    }
    const { data, error } = await supabase.from("academic_sessions").select("*").order("start_date", { ascending: false });
    if (!error) setSessions(data || []);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpen = (session = null) => {
    setEditing(session);
    setName(session?.name || "");
    setStartDate(session?.start_date?.slice(0, 10) || "");
    setEndDate(session?.end_date?.slice(0, 10) || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setName("");
    setStartDate("");
    setEndDate("");
  };

  const handleSave = async () => {
    if (!name.trim() || !startDate || !endDate || !supabase) return;
    const payload = { name: name.trim(), start_date: startDate, end_date: endDate };
    if (editing) {
      await supabase.from("academic_sessions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("academic_sessions").insert([payload]);
    }
    fetchSessions();
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this session?") || !supabase) return;
    await supabase.from("academic_sessions").delete().eq("id", id);
    fetchSessions();
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Academic Sessions</Typography>
          <Typography variant="body1" color="text.secondary">Define academic terms (e.g., Fall 2025, Spring 2026).</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpen()} disabled={!supabase}>
          Add Session
        </Button>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.start_date}</TableCell>
                <TableCell>{s.end_date}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(s)}><Pencil size={18} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><Trash2 size={18} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
        <DialogTitle>{editing ? "Edit Session" : "Add Academic Session"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Session Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fall 2025" sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
          <TextField fullWidth type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

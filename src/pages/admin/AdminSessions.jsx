import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Alert,
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
  const [errorMsg, setErrorMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSessions = async () => {
    setErrorMsg("");
    if (!supabase) {
      setSessions([]);
      setErrorMsg("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your root .env.");
      return;
    }
    const { data, error } = await supabase
      .from("academic_sessions")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[AdminSessions] fetch failed:", error);
      if (error.code === "PGRST205" || error.message?.includes("404")) {
        setErrorMsg(
          "Academic sessions table was not found (404). Run the initial Supabase migration and confirm your .env points to the correct Supabase project."
        );
      } else {
        setErrorMsg(error.message || "Failed to load academic sessions.");
      }
      setSessions([]);
      return;
    }

    setSessions(data || []);
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
    setErrorMsg("");
    const payload = { name: name.trim(), start_date: startDate, end_date: endDate };

    let error = null;
    if (editing) {
      const result = await supabase
        .from("academic_sessions")
        .update(payload)
        .eq("id", editing.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("academic_sessions")
        .insert([payload]);
      error = result.error;
    }

    if (error) {
      console.error("[AdminSessions] save failed:", error);
      if (error.code === "PGRST205" || error.message?.includes("404")) {
        setErrorMsg(
          "Could not save session (404). The academic_sessions table is missing in the connected Supabase project."
        );
      } else {
        setErrorMsg(error.message || "Failed to save session.");
      }
      return;
    }

    fetchSessions();
    handleClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this session?") || !supabase) return;
    setErrorMsg("");
    const { error } = await supabase.from("academic_sessions").delete().eq("id", id);
    if (error) {
      console.error("[AdminSessions] delete failed:", error);
      setErrorMsg(error.message || "Failed to delete session.");
      return;
    }
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
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

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

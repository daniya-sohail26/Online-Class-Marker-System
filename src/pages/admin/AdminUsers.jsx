import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Avatar,
} from "@mui/material";
import { UserCheck, UserX } from "lucide-react";
import { supabase } from "../../../server/config/supabaseClient"; // <-- Added Supabase import

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    if (!supabase) {
      setUsers([]);
      return;
    }
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user) => {
    if (!supabase) return;
    const newActive = !(user.is_active ?? true);
    await supabase.from("users").update({ is_active: newActive }).eq("id", user.id);
    fetchUsers();
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "error";
    if (role === "teacher") return "primary";
    return "default";
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" mb={1}>Users</Typography>
        <Typography variant="body1" color="text.secondary">Activate or deactivate user accounts across the institution.</Typography>
      </Box>

      <Card sx={{ overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>{u.name?.[0] || "?"}</Avatar>
                  {u.name}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Chip label={u.role} size="small" color={getRoleColor(u.role)} /></TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ?? true ? "Active" : "Inactive"}
                    size="small"
                    color={u.is_active ?? true ? "success" : "default"}
                    sx={{ bgcolor: (u.is_active ?? true) ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)" }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Switch
                    checked={u.is_active ?? true}
                    onChange={() => handleToggleActive(u)}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

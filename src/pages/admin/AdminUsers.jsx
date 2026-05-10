import React, { useState, useEffect, useMemo } from "react";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { UserCheck, UserX } from "lucide-react";
import { supabase } from "../../../server/config/supabaseClient"; // <-- Added Supabase import

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const active = u.is_active ?? true;
      const matchesSearch = !q || [u.name, u.email, u.role].some((value) =>
        String(value || "").toLowerCase().includes(q)
      );
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? active : !active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" mb={1}>Users</Typography>
        <Typography variant="body1" color="text.secondary">Activate or deactivate user accounts across the institution.</Typography>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" }, gap: 2 }}>
          <TextField label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} size="small" />
          <FormControl size="small">
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="">All roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

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
            {filteredUsers.map((u) => (
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

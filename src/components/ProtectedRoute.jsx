import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

/**
 * Protects admin routes: requires auth + profile.role === "admin"
 */
export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== "admin") {
    return <Navigate to={profile?.role === "teacher" ? "/teacher/dashboard" : "/login"} replace />;
  }

  return children;
}

/**
 * Protects teacher routes: requires auth + profile.role === "teacher"
 */
export function TeacherRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== "teacher") {
    return <Navigate to={profile?.role === "admin" ? "/admin/dashboard" : "/login"} replace />;
  }

  return children;
}

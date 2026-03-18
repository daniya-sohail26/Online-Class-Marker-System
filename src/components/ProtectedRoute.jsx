import React from "react";
import { Navigate } from "react-router-dom";
import { USER_ROLES } from "../services/authService";

/**
 * Protected Route Component
 * Since login is removed, this now just handles role-based routing
 */
export default function ProtectedRoute({
  children,
  requiredRoles = null
}) {
  // For now, assume user is always authenticated as teacher
  // You can modify this logic based on your needs
  const userRole = USER_ROLES.TEACHER;

  // Check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === USER_ROLES.ADMIN) {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRole === USER_ROLES.TEACHER) {
        return <Navigate to="/teacher/dashboard" replace />;
      } else if (userRole === USER_ROLES.STUDENT) {
        return <Navigate to="/student/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

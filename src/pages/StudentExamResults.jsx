import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, IconButton, Alert, Button } from "@mui/material";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import ExamReportView from "../components/ExamReportView";
import { authFetch } from "../utils/authFetch";
import { useAuth } from "../contexts/AuthContext";

/**
 * Student-facing results: same report prototype as the teacher view, filled with their attempt only.
 */
export default function StudentExamResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !attemptId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const res = await authFetch(`/api/reports/${attemptId}`);
        const ct = res.headers.get("content-type");
        if (!ct || !ct.includes("application/json")) {
          throw new Error("Invalid response from server.");
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load results.");
        setReport(data.report);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load exam results.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, user]);

  if (!user) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: "auto", textAlign: "center" }}>
        <Typography sx={{ mb: 2 }}>Sign in to view your test report.</Typography>
        <Button variant="contained" onClick={() => navigate("/login")} sx={{ borderRadius: 2 }}>
          Log in
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress size={56} sx={{ color: "#00DDB3" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center", maxWidth: 480, mx: "auto" }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, margin: "0 auto", p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Your results
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Same report layout your instructor uses for review — with explanations where provided.
          </Typography>
        </Box>
      </Box>
      <ExamReportView report={report} />
    </Box>
  );
}

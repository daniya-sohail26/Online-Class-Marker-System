import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { ArrowLeft, Eye, Download } from "lucide-react";
import ExamReportView from "../components/ExamReportView";
import { authFetch } from "../utils/authFetch";
import { generateReportPdf } from "../utils/generateReportPdf";

export default function EvaluationDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [attempts, setAttempts] = useState([]);
  const [report, setReport] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfLoadingAttemptId, setPdfLoadingAttemptId] = useState(null);
  const [error, setError] = useState("");

  const glassCardStyle = {
    p: 4,
    bgcolor: "rgba(22, 31, 61, 0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  };

  const fetchMainPageData = useCallback(async () => {
    setError("");
    try {
      const response = await authFetch("/api/teacher/evaluation");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON. Check that the API is running and the Vite proxy is configured.");
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || `Failed to fetch attempts (HTTP ${response.status})`);
      }
      const data = await response.json();
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMainPageData();
  }, [fetchMainPageData]);

  useEffect(() => {
    if (view !== "list") return undefined;
    const id = setInterval(fetchMainPageData, 4000);
    return () => clearInterval(id);
  }, [view, fetchMainPageData]);

  const handleViewDetails = async (attemptId) => {
    setDetailLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/teacher/evaluation/${attemptId}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON.");
      }
      if (!response.ok) throw new Error("Failed to fetch evaluation details");
      const data = await response.json();
      setReport(data.report);
      setView("details");
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setReport(null);
    fetchMainPageData();
  };

  const handleDownloadPdf = async (attemptId, fallbackStudentName) => {
    setPdfLoadingAttemptId(attemptId);
    setError("");
    try {
      const response = await authFetch(`/api/teacher/evaluation/${attemptId}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON.");
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || `Failed to download PDF report (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!data?.report) {
        throw new Error("Report payload is missing.");
      }
      const safeReport = {
        ...data.report,
        student: {
          ...(data.report.student || {}),
          displayName: data.report.student?.displayName || fallbackStudentName || "Student",
        },
      };
      generateReportPdf(safeReport);
    } catch (err) {
      setError(err.message || "Failed to download report PDF");
    } finally {
      setPdfLoadingAttemptId(null);
    }
  };

  if (listLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Button
          onClick={view === "details" ? handleBackToList : () => navigate("/teacher/dashboard")}
          startIcon={<ArrowLeft size={20} />}
          sx={{ color: "#00DDB3", textTransform: "none", fontSize: "1rem" }}
        >
          Back
        </Button>
        <Typography variant="h3" sx={{ fontWeight: 800, color: "#fff" }}>
          {view === "list" ? "Evaluation dashboard" : "Attempt report"}
        </Typography>
        {view === "list" && (
          <Chip
            label="Live scores (refresh every 4s)"
            size="small"
            sx={{ ml: 1, bgcolor: "rgba(0,221,179,0.12)", color: "#00DDB3", fontWeight: 600 }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {view === "list" && (
        <Card sx={glassCardStyle}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["Test", "Student", "Enrollment", "Status", "Score", "Result", "IP Tracking", "Action"].map((head) => (
                    <TableCell
                      key={head}
                      sx={{ color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: "rgba(255,255,255,0.5)", py: 4, borderBottom: "none" }}>
                      No attempts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.attempt_id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                      <TableCell sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.test_name}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.student_name}
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.enrollment_number}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.in_progress ? (
                          <Chip label="In progress" size="small" sx={{ bgcolor: "rgba(6,182,212,0.15)", color: "#67e8f9" }} />
                        ) : (
                          <Chip label="Submitted" size="small" sx={{ bgcolor: "rgba(0,221,179,0.12)", color: "#00DDB3" }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: "#00DDB3", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.total_score ?? "—"}
                        {attempt.score_percent != null && (
                          <Typography variant="caption" display="block" sx={{ color: "rgba(255,255,255,0.35)" }}>
                            {Number(attempt.score_percent).toFixed(1)}%
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.passed === true && (
                          <Chip label="Pass" size="small" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 800 }} />
                        )}
                        {attempt.passed === false && (
                          <Chip label="Fail" size="small" sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 800 }} />
                        )}
                        {attempt.passed == null && (
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                            {attempt.initial_ip || "—"}
                          </Typography>
                          {attempt.last_ip && attempt.last_ip !== attempt.initial_ip && (
                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#67e8f9", fontSize: "11px" }}>
                              → {attempt.last_ip}
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            <Chip
                              label={`IP changes: ${attempt.ip_change_count ?? 0}`}
                              size="small"
                              sx={{ bgcolor: "rgba(6,182,212,0.12)", color: "#67e8f9", fontWeight: 700, fontSize: "10px", height: 20 }}
                            />
                            {(attempt.vpn_detected === true) && (
                              <Chip
                                label="VPN detected"
                                size="small"
                                sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 800, fontSize: "10px", height: 20 }}
                              />
                            )}
                          </Box>
                          {attempt.ip_locked && (
                            <Chip label="IP FLAGGED" size="small" sx={{ bgcolor: "rgba(239,68,68,0.12)", color: "#f87171", fontWeight: 800, fontSize: "10px", height: 20 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button
                            onClick={() => handleViewDetails(attempt.attempt_id)}
                            startIcon={<Eye size={16} />}
                            sx={{
                              background: "linear-gradient(135deg, rgba(0,221,179,0.1), rgba(6,182,212,0.1))",
                              color: "#00DDB3",
                              textTransform: "none",
                              borderRadius: "8px",
                              "&:hover": {
                                background: "linear-gradient(135deg, rgba(0,221,179,0.2), rgba(6,182,212,0.2))",
                              },
                            }}
                          >
                            Review
                          </Button>
                          <Button
                            onClick={() => handleDownloadPdf(attempt.attempt_id, attempt.student_name)}
                            startIcon={<Download size={16} />}
                            disabled={pdfLoadingAttemptId === attempt.attempt_id}
                            sx={{
                              background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(124,58,237,0.12))",
                              color: "#c4b5fd",
                              textTransform: "none",
                              borderRadius: "8px",
                              "&:hover": {
                                background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.2))",
                              },
                            }}
                          >
                            {pdfLoadingAttemptId === attempt.attempt_id ? "Preparing..." : "PDF"}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {view === "details" && detailLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#00DDB3" }} />
        </Box>
      )}
      {view === "details" && !detailLoading && report && (
        <ExamReportView report={report} glassCardStyle={glassCardStyle} />
      )}
    </Box>
  );
}

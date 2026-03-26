import React, { useState, useEffect } from "react";
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
  Chip
} from "@mui/material";
import { ArrowLeft, Eye, CheckCircle, XCircle } from "lucide-react";

export default function EvaluationDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [attempts, setAttempts] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Common glass-morphism style from your template
  const glassCardStyle = {
    p: 4,
    bgcolor: "rgba(22, 31, 61, 0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
  };

  useEffect(() => {
    fetchMainPageData();
  }, []);

  const fetchMainPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/teacher/evaluation');
      
      // Check if the response is actually JSON to prevent the "<!doctype" error
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML instead of JSON. Check your API route or React proxy settings.");
      }

      if (!response.ok) throw new Error('Failed to fetch attempts');
      const data = await response.json();
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (attemptId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/evaluation/${attemptId}`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML instead of JSON.");
      }

      if (!response.ok) throw new Error('Failed to fetch evaluation details');
      const data = await response.json();
      setSelectedDetails(data);
      setView('details');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedDetails(null);
  };

  // Helper function to render the A, B, C, D options in the dark theme
  const renderOptions = (ans) => {
    const options = [
      { letter: 'A', text: ans.option_a },
      { letter: 'B', text: ans.option_b },
      { letter: 'C', text: ans.option_c },
      { letter: 'D', text: ans.option_d }
    ].filter(opt => opt.text);

    const studentChoice = ans.student_answer?.toUpperCase();
    const correctChoice = ans.expected_answer?.toUpperCase();

    return (
      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {options.map((opt) => {
          const isStudentChoice = opt.letter === studentChoice;
          const isCorrectChoice = opt.letter === correctChoice;

          let optionStyle = {
            p: 2,
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.05)",
            bgcolor: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255,255,255,0.8)"
          };

          if (isCorrectChoice) {
            optionStyle.bgcolor = "rgba(0, 221, 179, 0.1)"; // Using your brand cyan/green
            optionStyle.border = "1px solid rgba(0, 221, 179, 0.4)";
            optionStyle.color = "#00DDB3";
          } else if (isStudentChoice && !isCorrectChoice) {
            optionStyle.bgcolor = "rgba(244, 67, 54, 0.1)"; // Red for wrong
            optionStyle.border = "1px solid rgba(244, 67, 54, 0.4)";
            optionStyle.color = "#f44336";
          }

          return (
            <Box key={opt.letter} sx={optionStyle}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 800, width: "30px" }}>{opt.letter}.</Typography>
                <Typography>{opt.text}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {isStudentChoice && <Chip label="Student Pick" size="small" sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }} />}
                {isCorrectChoice && <Chip label="Correct Answer" size="small" sx={{ bgcolor: "#00DDB3", color: "#000", fontWeight: 700 }} />}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Button
          onClick={view === 'details' ? handleBackToList : () => navigate("/teacher/dashboard")}
          startIcon={<ArrowLeft size={20} />}
          sx={{ color: "#00DDB3", textTransform: "none", fontSize: "1rem" }}
        >
          Back
        </Button>
        <Typography variant="h3" sx={{ fontWeight: 800, color: "#fff" }}>
          {view === 'list' ? 'Evaluation Dashboard' : 'Attempt Details'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* VIEW 1: Main List */}
      {view === 'list' && (
        <Card sx={glassCardStyle}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['Test Name', 'Student ID', 'Submitted At', 'AI Score', 'Action'].map((head) => (
                    <TableCell key={head} sx={{ color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "rgba(255,255,255,0.5)", py: 4, borderBottom: "none" }}>
                      No attempts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.attempt_id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                      <TableCell sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{attempt.test_name}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{attempt.enrollment_number}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {new Date(attempt.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: "#00DDB3", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attempt.total_score}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Button
                          onClick={() => handleViewDetails(attempt.attempt_id)}
                          startIcon={<Eye size={16} />}
                          sx={{
                            background: "linear-gradient(135deg, rgba(0,221,179,0.1), rgba(6,182,212,0.1))",
                            color: "#00DDB3",
                            textTransform: "none",
                            borderRadius: "8px",
                            "&:hover": { background: "linear-gradient(135deg, rgba(0,221,179,0.2), rgba(6,182,212,0.2))" }
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* VIEW 2: Drill Down */}
      {view === 'details' && selectedDetails && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          
          {/* Summary Banner */}
          <Card sx={{ ...glassCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 1 }}>
                {selectedDetails.summary.test_name}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                Student ID: <span style={{ color: "#fff" }}>{selectedDetails.summary.enrollment_number}</span>
              </Typography>
              {selectedDetails.summary.violations > 0 && (
                <Chip 
                  label={`⚠️ ${selectedDetails.summary.violations} Proctoring Violations`} 
                  color="error" 
                  size="small" 
                  sx={{ mt: 1 }} 
                />
              )}
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textTransform: "uppercase" }}>
                Total Score
              </Typography>
              <Typography sx={{ color: "#00DDB3", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 }}>
                {selectedDetails.summary.total_score}
              </Typography>
            </Box>
          </Card>

          {/* Question List */}
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 2 }}>Question Breakdown</Typography>
          
          {selectedDetails.evaluated_answers.map((ans, index) => (
            <Card key={ans.answer_id} sx={{ ...glassCardStyle, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Typography sx={{ color: "#fff", fontSize: "1.1rem", fontWeight: 500 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", marginRight: "8px" }}>Q{index + 1}.</span>
                  {ans.question_text}
                </Typography>
                <Chip 
                  icon={ans.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  label={`${ans.is_correct ? 'Correct' : 'Incorrect'} (${ans.marks_awarded} pts)`}
                  sx={{ 
                    bgcolor: ans.is_correct ? "rgba(0, 221, 179, 0.1)" : "rgba(244, 67, 54, 0.1)", 
                    color: ans.is_correct ? "#00DDB3" : "#f44336",
                    fontWeight: 600,
                    border: `1px solid ${ans.is_correct ? "rgba(0, 221, 179, 0.3)" : "rgba(244, 67, 54, 0.3)"}`
                  }}
                />
              </Box>
              
              {renderOptions(ans)}
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
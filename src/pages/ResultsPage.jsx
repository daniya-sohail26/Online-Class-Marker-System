import React, { useEffect, useState } from "react";
import {
  Box, Card, Typography, CircularProgress, Button,
  Divider, Chip, Grid, Paper, Container,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAttemptResults } from "../api/studentApi";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function ResultsPage() {
  const { attemptId } = useParams();
  const navigate      = useNavigate();

  const [loading, setLoading]         = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [releaseAt, setReleaseAt]     = useState(null);
  const [attempt, setAttempt]         = useState(null);
  const [answers, setAnswers]         = useState([]);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!attemptId) {
      setError("Missing attempt ID");
      setLoading(false);
      return;
    }
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      const payload = await fetchAttemptResults(attemptId);
      const attemptRow = payload?.attempt || null;
      const detailReleased = Boolean(payload?.detailed_results_released);
      const releaseAtIso = payload?.results_release_at || null;

      if (!attemptRow) {
        throw new Error("Attempt data not found");
      }

      setAttempt(attemptRow);
      setShowResults(detailReleased);
      setReleaseAt(releaseAtIso ? new Date(releaseAtIso) : null);
      setAnswers(Array.isArray(payload?.answers) ? payload.answers : []);
    } catch (err) {
      console.error("[Results] load error:", err);
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOptionText = (question, letter) => {
    if (!question || !letter) return letter ?? "N/A";
    const map = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d,
    };
    return map[letter.toUpperCase()] ?? letter;
  };

  const correctCount   = answers.filter((a) => a.is_correct === true).length;
  const totalMarks     = answers.reduce((sum, a) => sum + (Number(a.marks_awarded) || 0), 0);
  const totalQuestions = answers.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
      </Box>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: 4, bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", textAlign: "center" }}>
          <Typography sx={{ fontSize: "48px", mb: 2, color: "#EF4444" }}>⚠</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 2 }}>Error Loading Results</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 4 }}>{error}</Typography>
          <Button variant="contained" onClick={() => navigate("/student/dashboard")}
            sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", textTransform: "none", fontWeight: 600 }}>
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // ── Results hidden (score-only until end time) ──────────────────────────
  if (!showResults) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper elevation={0} sx={{ p: 4, bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", textAlign: "center" }}>
          <Typography sx={{ fontSize: "48px", mb: 2, color: "#00DDB3", fontWeight: 700 }}>✓</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 2 }}>Test Submitted</Typography>
          <Typography sx={{ color: "#22D3EE", fontWeight: 700, mb: 1.2 }}>
            Score: {attempt?.score ?? 0} / {attempt?.max_score ?? 0}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 4, lineHeight: 1.6 }}>
            Your answers are recorded. Full correct/incorrect review with explanations unlocks after the test ends.
            {releaseAt ? ` Release time: ${releaseAt.toLocaleString()}.` : ""}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/student/dashboard")}
            sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", textTransform: "none", fontWeight: 600 }}>
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // ── Full results ──────────────────────────────────────────────────────────
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", mb: 1, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Test Results
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
          {attempt?.test_name ?? "Assessment"}
        </Typography>
      </Box>

      {/* Stats */}
<Grid container spacing={2} sx={{ mb: 4, display: "flex" }}>
  {[
    { 
      label: "Total Score",
      value: `${attempt?.score ?? 0} / ${attempt?.max_score ?? 0}`,
      color: "#00DDB3" 
    },
    { label: "Correct Answers",  value: correctCount,                color: "#22D3EE" },
    { label: "Total Questions",  value: totalQuestions,              color: "#F59E0B" },
    { label: "Marks Awarded", value: totalMarks,       color: "#06B6D4" },
    { label: "Status", value: attempt?.passed ? "Passed" : "Failed", color: attempt?.passed ? "#00DDB3" : "#EF4444" },
  ].map((stat, i) => (
    <Grid item xs={12} sm={6} sx={{ flex: 1, minWidth: 0 }} key={i}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", textAlign: "center", minHeight: "140px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography sx={{ fontSize: "28px", fontWeight: 800, color: stat.color, mb: 1 }}>{stat.value}</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{stat.label}</Typography>
      </Paper>
    </Grid>
  ))}
</Grid>

      <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />

      <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", mb: 3 }}>Question Review</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {answers.length === 0 ? (
          <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", py: 4 }}>No answers recorded</Typography>
        ) : (
          answers.map((answer, index) => (
            <Card key={answer.id} sx={{ bgcolor: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", p: 3, "&:hover": { border: answer.is_correct ? "1px solid rgba(0,221,179,0.3)" : "1px solid rgba(239,68,68,0.3)" } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, color: "#fff", mb: 1 }}>Question {index + 1}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", mb: 2 }}>
                    {answer.question?.question_text ?? "Text not available"}
                  </Typography>
                </Box>
                <Box sx={{ ml: 2 }}>
                  {answer.is_correct === true
                    ? <Chip icon={<CheckCircleIcon />} label="Correct"   sx={{ bgcolor: "rgba(0,221,179,0.15)",  color: "#00DDB3", fontWeight: 600 }} />
                    : <Chip icon={<CancelIcon />}       label="Incorrect" sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444", fontWeight: 600 }} />
                  }
                </Box>
              </Box>

              {answer.question && (
                <Box sx={{ mb: 3 }}>
                  {["A", "B", "C", "D"].map((letter) => {
                    const isSelected = answer.selected_option?.toUpperCase() === letter;
                    const isCorrect  = answer.question?.correct_option?.toUpperCase() === letter;

                    let bgColor     = "rgba(255,255,255,0.05)";
                    let borderColor = "rgba(255,255,255,0.1)";
                    let textColor   = "rgba(255,255,255,0.7)";

                    if (isSelected) {
                      bgColor     = isCorrect ? "rgba(0,221,179,0.15)"  : "rgba(239,68,68,0.15)";
                      borderColor = isCorrect ? "rgba(0,221,179,0.3)"   : "rgba(239,68,68,0.3)";
                      textColor   = isCorrect ? "#00DDB3" : "#EF4444";
                    } else if (isCorrect) {
                      bgColor     = "rgba(59,130,246,0.15)";
                      borderColor = "rgba(59,130,246,0.3)";
                      textColor   = "#3B82F6";
                    }

                    return (
                      <Box key={letter} sx={{ p: 2, mb: 1, bgcolor: bgColor, border: `1px solid ${borderColor}`, borderRadius: "8px" }}>
                        <Typography sx={{ color: textColor, fontWeight: isSelected ? 600 : 500 }}>
                          <strong>{letter}.</strong> {getOptionText(answer.question, letter)}
                          {isSelected && " (Your Choice)"}
                          {isCorrect && !isSelected && " (Correct Answer)"}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {answer.question?.explanation && (
                <Box sx={{ p: 2, bgcolor: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "8px" }}>
                  <Typography sx={{ color: "#22D3EE", fontSize: "14px", fontWeight: 600, mb: 0.5 }}>Explanation</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{answer.question.explanation}</Typography>
                </Box>
              )}
            </Card>
          ))
        )}
      </Box>

      <Box sx={{ mt: 6, display: "flex", gap: 2, justifyContent: "center" }}>
        <Button variant="contained" onClick={() => navigate("/student/dashboard")}
          sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", textTransform: "none", px: 4 }}>
          Back to Dashboard
        </Button>
        
      </Box>
    </Container>
  );
}
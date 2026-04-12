import React from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  Stack,
  Paper,
  Avatar,
} from "@mui/material";
import { CheckCircle, XCircle, Flag, Trophy, BookOpen } from "lucide-react";

/**
 * Shared “fixed template” UI for teacher drill-down and student post-test results.
 * Data shape comes from the server-side ExamReportPrototype builder.
 */
export default function ExamReportView({ report, glassCardStyle }) {
  if (!report) return null;

  const baseGlass =
    glassCardStyle || {
      p: 4,
      bgcolor: "rgba(22, 31, 61, 0.6)",
      backdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
    };

  const { test, student, attempt, stats, questions } = report;
  const showEmail = report.audience === "teacher" && student?.email;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Card
        sx={{
          ...baseGlass,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 1 }}>
            {test?.name}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
            {student?.displayName}
            {student?.enrollmentNumber && student.enrollmentNumber !== "—" && (
              <span> · #{student.enrollmentNumber}</span>
            )}
          </Typography>
          {showEmail && (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
              {student.email}
            </Typography>
          )}
          {attempt?.inProgress && (
            <Chip label="In progress — score updates live" size="small" sx={{ mt: 1, bgcolor: "rgba(6,182,212,0.2)", color: "#67e8f9" }} />
          )}
          {attempt?.violations > 0 && (
            <Chip
              label={`${attempt.violations} proctoring flag(s)`}
              color="error"
              size="small"
              sx={{ mt: 1, ml: attempt?.inProgress ? 1 : 0 }}
            />
          )}
        </Box>
        <Box sx={{ textAlign: "right" }}>
          {attempt?.passed != null && (
            <Chip
              label={attempt.passed ? "PASS" : "FAIL"}
              size="small"
              sx={{
                mb: 1,
                fontWeight: 900,
                bgcolor: attempt.passed ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                color: attempt.passed ? "#4ade80" : "#f87171",
                border: `1px solid ${attempt.passed ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
              }}
            />
          )}
          {attempt?.scorePercent != null && (
            <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.45)", mb: 0.5 }}>
              {attempt.scorePercent}% · pass threshold {attempt.passingPercentage ?? "—"}%
            </Typography>
          )}
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            Score {test?.totalMarks != null ? `(of ${test.totalMarks})` : ""}
          </Typography>
          <Typography sx={{ color: "#00DDB3", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1 }}>
            {attempt?.score ?? "—"}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
            {attempt?.submittedAt
              ? new Date(attempt.submittedAt).toLocaleString()
              : attempt?.startedAt
                ? `Started ${new Date(attempt.startedAt).toLocaleString()}`
                : ""}
          </Typography>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...baseGlass, textAlign: "center", py: 3 }}>
            <Avatar sx={{ width: 56, height: 56, margin: "0 auto", mb: 2, bgcolor: "#0ea5e9", color: "#fff" }}>
              <Trophy size={28} />
            </Avatar>
            <Typography variant="h3" fontWeight={900} color="#0ea5e9">
              {attempt?.score ?? "—"}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Total score
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...baseGlass, textAlign: "center", py: 3 }}>
            <Typography variant="h3" fontWeight={900} color="#22c55e" sx={{ mt: 1 }}>
              {stats?.accuracyPct ?? 0}%
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Accuracy
            </Typography>
            <Typography variant="body2" sx={{ color: "#16a34a", mt: 1 }}>
              {stats?.correctCount ?? 0} correct · {stats?.wrongCount ?? 0} incorrect
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              ...baseGlass,
              textAlign: "center",
              py: 3,
              border: attempt?.violations > 0 ? "1px solid rgba(248,113,113,0.4)" : baseGlass.border,
            }}
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                margin: "0 auto",
                mb: 1,
                bgcolor: attempt?.violations > 0 ? "#fee2e2" : "rgba(255,255,255,0.06)",
                color: attempt?.violations > 0 ? "#ef4444" : "#94a3b8",
              }}
            >
              <Flag size={26} />
            </Avatar>
            <Typography variant="h4" fontWeight={900} color={attempt?.violations > 0 ? "#ef4444" : "text.secondary"}>
              {attempt?.violations ?? 0}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Proctor flags
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 1 }}>
        Question breakdown
      </Typography>

      <Stack spacing={3}>
        {(questions || []).map((q) => (
          <Card key={q.answerId || q.index} sx={{ ...baseGlass, p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 2 }}>
              <Typography sx={{ color: "#fff", fontSize: "1.05rem", fontWeight: 500 }}>
                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: 8 }}>Q{q.index}.</span>
                {q.questionText}
              </Typography>
              <Chip
                icon={q.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                label={
                  q.marksAwarded != null
                    ? `${q.isCorrect ? "Correct" : "Incorrect"} (${q.marksAwarded} pts)`
                    : q.isCorrect
                      ? "Correct"
                      : "Incorrect"
                }
                sx={{
                  bgcolor: q.isCorrect ? "rgba(0, 221, 179, 0.1)" : "rgba(244, 67, 54, 0.1)",
                  color: q.isCorrect ? "#00DDB3" : "#f44336",
                  fontWeight: 600,
                  border: `1px solid ${q.isCorrect ? "rgba(0, 221, 179, 0.3)" : "rgba(244, 67, 54, 0.3)"}`,
                  flexShrink: 0,
                }}
              />
            </Box>

            <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.06)" }} />

            <Grid container spacing={2}>
              {(q.options || []).map((opt) => {
                const letter = opt.letter?.toUpperCase();
                const selected = q.selectedOption === letter;
                const correct = q.correctOption === letter;

                let bgcolor = "rgba(0,0,0,0.2)";
                let border = "1px solid rgba(255,255,255,0.05)";
                let icon = null;

                if (selected && correct) {
                  bgcolor = "rgba(0, 221, 179, 0.1)";
                  border = "1px solid rgba(0, 221, 179, 0.4)";
                  icon = <CheckCircle size={18} color="#16a34a" />;
                } else if (selected && !correct) {
                  bgcolor = "rgba(244, 67, 54, 0.1)";
                  border = "1px solid rgba(244, 67, 54, 0.4)";
                  icon = <XCircle size={18} color="#ef4444" />;
                } else if (!selected && correct) {
                  bgcolor = "rgba(0, 221, 179, 0.06)";
                  border = "1px dashed rgba(0, 221, 179, 0.35)";
                  icon = <CheckCircle size={18} color="#4ade80" />;
                }

                return (
                  <Grid item xs={12} sm={6} key={letter}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor,
                        border,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ minWidth: 22 }}>
                        {letter}.
                      </Typography>
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: selected || correct ? 700 : 400 }}>
                        {opt.text}
                      </Typography>
                      {icon}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {q.explanation && String(q.explanation).trim() !== "" && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "rgba(6,182,212,0.06)",
                  border: "1px solid rgba(6,182,212,0.15)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <BookOpen size={18} color="#67e8f9" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#67e8f9", fontWeight: 700, mb: 0.5 }}>
                      Justification
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                      {q.explanation}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

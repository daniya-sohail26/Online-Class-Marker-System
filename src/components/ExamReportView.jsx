import React, { useState } from "react";
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
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { CheckCircle, XCircle, Flag, Trophy, BookOpen, Download, Shield, ChevronDown, ChevronUp, Wifi, WifiOff } from "lucide-react";
import { generateReportPdf } from "../utils/generateReportPdf";
import { toPKTDisplay } from "../utils/pktTime";

/**
 * Shared “fixed template” UI for teacher drill-down and student post-test results.
 * Data shape comes from the server-side ExamReportPrototype builder.
 */
export default function ExamReportView({ report, glassCardStyle }) {
  const [ipExpanded, setIpExpanded] = useState(false);
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

  const { test, student, attempt, stats, questions, proctor = {} } = report;
  const showEmail = report.audience === "teacher" && student?.email;
  const hasViolation = Boolean(proctor?.hasViolation || (attempt?.violations ?? 0) > 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Download PDF Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<Download size={18} />}
          onClick={() => generateReportPdf(report)}
          sx={{
            background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)",
            color: "#fff",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1,
            boxShadow: "0 4px 15px rgba(168,85,247,0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #9333EA 0%, #6D28D9 100%)",
              transform: "translateY(-1px)",
              boxShadow: "0 6px 20px rgba(168,85,247,0.4)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Download PDF Report
        </Button>
      </Box>

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
          {hasViolation && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <Chip
                label="Violation Detected"
                color="error"
                size="small"
                sx={{ fontWeight: 800 }}
              />
              <Chip
                label={`${attempt?.violations ?? 0} proctoring flag(s)`}
                color="error"
                size="small"
                variant="outlined"
                sx={{ borderColor: "rgba(248,113,113,0.35)", color: "#f87171" }}
              />
              {proctor.tabSwitchViolations > 0 && (
                <Chip
                  label={`Tab Switch ${proctor.tabSwitchViolations}`}
                  size="small"
                  sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "#F59E0B", fontWeight: 700 }}
                />
              )}
              {proctor.ipViolations > 0 && (
                <Chip
                  label={`IP Flag ${proctor.ipViolations}`}
                  size="small"
                  sx={{ bgcolor: "rgba(56,189,248,0.12)", color: "#38BDF8", fontWeight: 700 }}
                />
              )}
            </Stack>
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
              ? toPKTDisplay(attempt.submittedAt)
              : attempt?.startedAt
                ? `Started ${toPKTDisplay(attempt.startedAt)}`
                : ""}
          </Typography>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ ...baseGlass, textAlign: "center", py: 3, border: hasViolation ? "1px solid rgba(248,113,113,0.25)" : baseGlass.border }}>
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
          <Card sx={{ ...baseGlass, textAlign: "center", py: 3, border: hasViolation ? "1px solid rgba(248,113,113,0.25)" : baseGlass.border }}>
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
              border: hasViolation ? "1px solid rgba(248,113,113,0.4)" : baseGlass.border,
            }}
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                margin: "0 auto",
                mb: 1,
                bgcolor: hasViolation ? "#fee2e2" : "rgba(255,255,255,0.06)",
                color: hasViolation ? "#ef4444" : "#94a3b8",
              }}
            >
              <Flag size={26} />
            </Avatar>
            <Typography variant="h4" fontWeight={900} color={hasViolation ? "#ef4444" : "text.secondary"}>
              {attempt?.violations ?? 0}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Proctor flags
            </Typography>
            {proctor.tabSwitchViolations > 0 && (
              <Typography variant="caption" sx={{ color: "#F59E0B", display: "block", mt: 0.5 }}>
                Tab switches: {proctor.tabSwitchViolations}
              </Typography>
            )}
            {proctor.ipViolations > 0 && (
              <Typography variant="caption" sx={{ color: "#38BDF8", display: "block", mt: 0.25 }}>
                IP flags: {proctor.ipViolations}
              </Typography>
            )}
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

      {/* IP Proctor Audit — Teacher-only */}
      {report.audience === "teacher" && report.ipAudit && (
        <Card sx={{ ...baseGlass, p: 3, border: report.ipAudit.ipLocked ? "1px solid rgba(239,68,68,0.4)" : baseGlass.border }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: report.ipAudit.ipLocked ? "rgba(239,68,68,0.15)" : "rgba(0,221,179,0.1)", color: report.ipAudit.ipLocked ? "#ef4444" : "#00DDB3" }}>
                <Shield size={22} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>IP Proctor Audit</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>Network integrity check</Typography>
              </Box>
            </Box>
            {report.ipAudit.ipLocked && (
              <Chip label="IP CHANGED — AUTO SUBMITTED" size="small" sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 800, border: "1px solid rgba(239,68,68,0.3)" }} />
            )}
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>TAB SWITCH FLAGS</Typography>
                <Typography sx={{ color: proctor.tabSwitchViolations > 0 ? "#F59E0B" : "#00DDB3", fontWeight: 900, fontSize: "20px" }}>{proctor.tabSwitchViolations ?? 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>INITIAL IP</Typography>
                <Typography sx={{ color: "#00DDB3", fontWeight: 700, fontFamily: "monospace", fontSize: "13px" }}>{report.ipAudit.initialIp || "—"}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>IP FLAGS</Typography>
                <Typography sx={{ color: report.ipAudit.ipChangeCount > 0 ? "#ef4444" : "#00DDB3", fontWeight: 900, fontSize: "20px" }}>{report.ipAudit.ipChangeCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>VPN DETECTED</Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                  {report.ipAudit.vpnDetected ? <WifiOff size={16} color="#ef4444" /> : <Wifi size={16} color="#00DDB3" />}
                  <Typography sx={{ color: report.ipAudit.vpnDetected ? "#ef4444" : "#00DDB3", fontWeight: 700 }}>{report.ipAudit.vpnDetected ? "Yes" : "No"}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, mb: 0.5 }}>STATUS</Typography>
                <Typography sx={{ color: report.ipAudit.ipLocked ? "#ef4444" : "#4ade80", fontWeight: 700 }}>{report.ipAudit.ipLocked ? "Flagged" : "Clean"}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Expandable IP Log Table */}
          {report.ipAudit.logs && report.ipAudit.logs.length > 0 && (
            <Box>
              <Button
                onClick={() => setIpExpanded(!ipExpanded)}
                endIcon={ipExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none", fontWeight: 600, mb: 1 }}
              >
                {ipExpanded ? "Hide" : "Show"} IP Log ({report.ipAudit.logs.length} entries)
              </Button>
              <Collapse in={ipExpanded}>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "11px" }}>TIME (PKT)</TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "11px" }}>IP ADDRESS</TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "11px" }}>ACTION</TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "11px" }}>VPN</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.ipAudit.logs.map((log, i) => (
                        <TableRow key={log.id || i} sx={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{toPKTDisplay(log.created_at)}</TableCell>
                          <TableCell sx={{ color: "#00DDB3", fontFamily: "monospace", fontSize: "12px", fontWeight: 600 }}>{log.ip_address}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.action}
                              size="small"
                              sx={{
                                fontSize: "10px",
                                fontWeight: 700,
                                bgcolor: log.action === "ip_change" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                                color: log.action === "ip_change" ? "#f87171" : "rgba(255,255,255,0.6)",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: log.is_vpn ? "#ef4444" : "rgba(255,255,255,0.4)", fontSize: "12px" }}>{log.is_vpn ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}

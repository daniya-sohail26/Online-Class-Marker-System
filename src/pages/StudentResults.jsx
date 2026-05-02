import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../server/config/supabaseClient";
import { toPKTDate } from "../utils/pktTime";

export default function StudentResults() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, [profile?.user_id]);

  const fetchAttempts = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from("attempts")
        .select("*, tests(*)")
        .eq("student_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (err) {
      console.error("Error fetching attempts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress sx={{ color: "#A855F7" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: "#fff",
          mb: 3,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        My Results
      </Typography>

      <Card
        sx={{
          bgcolor: "rgba(15, 23, 42, 0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {attempts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
              No test results yet
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(255,255,255,0.05)" }}>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Test Name
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Score
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attempts.map((attempt) => {
                  const score = attempt.score || 0;
                  const status = attempt.passed ? "Passed" : "Failed";
                  const statusColor = attempt.passed ? "#00DDB3" : "#EF4444";

                  return (
                    <TableRow
                      key={attempt.id}
                      onClick={() => navigate(`/student/results/${attempt.id}`)}
                      sx={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: "rgba(168, 85, 247, 0.1)",
                        },
                      }}
                    >
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                        {attempt.tests?.name || "Unknown Test"}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {score}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status}
                          sx={{
                            bgcolor: `${statusColor}20`,
                            color: statusColor,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {toPKTDate(attempt.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}

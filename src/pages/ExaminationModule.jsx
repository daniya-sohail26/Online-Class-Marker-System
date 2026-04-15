import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { supabase } from "../../server/config/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { scoreAttempt, scoreAttemptEdge } from "../api/attemptApi";

function hashSeed(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

function seededRandom(seedText) {
  let h = hashSeed(seedText);
  return () => {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    return (h >>> 0) / 0xffffffff;
  };
}

function seededShuffle(arr, seedText) {
  const copy = [...arr];
  const rand = seededRandom(seedText);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isWindowActive(start, end) {
  const now = new Date();
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

const MAX_TAB_VIOLATIONS = 3;

export default function ExaminationModule() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [attemptId, setAttemptId] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [answerRowIds, setAnswerRowIds] = useState({});
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState({});
  const [lockedQuestions, setLockedQuestions] = useState(new Set());
  const [proctorViolations, setProctorViolations] = useState(0);

  const submittedRef = useRef(false);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const endTimeRef = useRef(null);
  const lastViolationAtRef = useRef(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] ?? null;
  const timePerQuestionSeconds = Number(meta?.timePerQuestionSeconds ?? 0);
  const lockSectionNavigation = Boolean(meta?.lockSectionNavigation);
  const preventTabSwitch = Boolean(meta?.preventTabSwitch);
  const strictProctoring = Boolean(meta?.strictProctoring);
  const currentQuestionTimeLeft = currentQuestion ? questionTimeRemaining[currentQuestion.id] : null;
  const isCurrentLocked = currentQuestion ? lockedQuestions.has(currentQuestion.id) : false;

  const attemptedCount = useMemo(
    () => Object.values(selectedOptions).filter(Boolean).length,
    [selectedOptions],
  );

  const progressPct = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((attemptedCount / totalQuestions) * 100);
  }, [attemptedCount, totalQuestions]);

  const loadTemplate = useCallback(async (templateId) => {
    if (!templateId) return null;

    const templateColumns = [
      "id",
      "duration_minutes",
      "max_attempts",
      "shuffle_questions",
      "shuffle_options",
      "show_results_immediately",
        "lock_section_navigation",
        "time_per_question",
        "strict_proctoring",
        "prevent_tab_switch",
    ].join(",");

    const templatesRes = await supabase
      .from("templates")
      .select(templateColumns)
      .eq("id", templateId)
      .maybeSingle();

    if (!templatesRes.error && templatesRes.data) {
      return templatesRes.data;
    }

    const fallbackRes = await supabase
      .from("test_templates")
      .select(templateColumns)
      .eq("id", templateId)
      .maybeSingle();

    if (fallbackRes.error) {
      return null;
    }

    return fallbackRes.data;
  }, []);

  const navigateToResults = useCallback(
    (finalAttemptId) => {
      navigate(`/student/results/${finalAttemptId}?testId=${testId}`, { replace: true });
    },
    [navigate, testId],
  );

  const submitAttempt = useCallback(
    async (auto = false) => {
      if (!attemptId || submittedRef.current) return;

      const unansweredCount = questions.filter((q) => !selectedOptions[q.id]).length;
      if (!auto && unansweredCount > 0) {
        const proceed = window.confirm(
          `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}. Submit anyway?`,
        );
        if (!proceed) return;
      }

      submittedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      try {
        setSubmitting(true);
        const nowIso = new Date().toISOString();

        const { error: submitErr } = await supabase
          .from("attempts")
          .update({ submitted_at: nowIso })
          .eq("id", attemptId);

        if (submitErr) throw submitErr;

        try {
          await scoreAttempt(attemptId);
        } catch (apiErr) {
          console.warn("API scoring failed, falling back to Edge Function scoring", apiErr);
          await scoreAttemptEdge(attemptId);
        }

        navigateToResults(attemptId);
      } catch (submitError) {
        console.error("Submit failed:", submitError);
        submittedRef.current = false;
        setSubmitting(false);
        setError(submitError.message || "Failed to submit exam.");
      }
    },
    [attemptId, navigateToResults, questions, selectedOptions],
  );

  const registerViolation = useCallback(async () => {
    if (!attemptId || submittedRef.current || !(preventTabSwitch || strictProctoring)) return;

    const now = Date.now();
    if (now - lastViolationAtRef.current < 500) return;
    lastViolationAtRef.current = now;

    setProctorViolations((prev) => {
      const next = prev + 1;
      supabase.from("attempts").update({ violations: next }).eq("id", attemptId).then(() => {});

      if (next >= MAX_TAB_VIOLATIONS) {
        submitAttempt(true);
      } else {
        window.alert(
          `Warning: you switched away from the exam. Violation ${next} of ${MAX_TAB_VIOLATIONS}.`,
        );
      }
      return next;
    });
  }, [attemptId, preventTabSwitch, strictProctoring, submitAttempt]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!testId || !profile?.user_id) {
        setLoading(false);
        setError("Missing test or student context.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data: test, error: testErr } = await supabase
          .from("tests")
          .select("id, name, total_marks, template_id, is_published")
          .eq("id", testId)
          .maybeSingle();

        if (testErr || !test) {
          throw new Error(testErr?.message || "Test not found.");
        }

        if (!test.is_published) {
          throw new Error("This test is not published yet.");
        }

        const { data: scheduleRow, error: scheduleErr } = await supabase
          .from("test_schedules")
          .select("availability_start, availability_end")
          .eq("test_id", testId)
          .eq("is_active", true)
          .order("availability_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (scheduleErr) {
          throw new Error(scheduleErr.message || "Could not load test schedule.");
        }

        const availabilityStart = scheduleRow?.availability_start ? new Date(scheduleRow.availability_start) : null;
        const availabilityEnd = scheduleRow?.availability_end ? new Date(scheduleRow.availability_end) : null;

        if (!availabilityStart || !availabilityEnd) {
          throw new Error("This test does not have an active availability window.");
        }

        if (!isWindowActive(availabilityStart, availabilityEnd)) {
          throw new Error("This test is currently not available.");
        }

        const template = await loadTemplate(test.template_id);
        const durationMinutes = Number(template?.duration_minutes ?? 60);
        const maxAttempts = Number(template?.max_attempts ?? 1);
        const templateTimePerQuestionSeconds = Number(template?.time_per_question ?? 0) * 60;
        const templateLockSectionNavigation = Boolean(template?.lock_section_navigation);
        const templatePreventTabSwitch = Boolean(template?.prevent_tab_switch);
        const templateStrictProctoring = Boolean(template?.strict_proctoring);

        const { data: testQuestions, error: tqErr } = await supabase
          .from("test_questions")
          .select("question_id, marks")
          .eq("test_id", testId);

        if (tqErr) {
          throw new Error(tqErr.message || "Could not load test questions.");
        }

        if (!testQuestions?.length) {
          throw new Error("No questions are linked to this test.");
        }

        const questionIds = testQuestions.map((tq) => tq.question_id);
        const marksByQuestionId = {};
        testQuestions.forEach((tq) => {
          marksByQuestionId[tq.question_id] = Number(tq.marks ?? 1);
        });

        const { data: rows, error: questionsErr } = await supabase
          .from("questions")
          .select("id, question_text, option_a, option_b, option_c, option_d")
          .in("id", questionIds);

        if (questionsErr) {
          throw new Error(questionsErr.message || "Could not load question details.");
        }

        const questionMap = new Map((rows ?? []).map((q) => [q.id, q]));
        let orderedQuestions = questionIds
          .map((qid) => questionMap.get(qid))
          .filter(Boolean)
          .map((q) => ({
            ...q,
            marks: marksByQuestionId[q.id] ?? 1,
          }));

        const { data: attempts, error: attemptsErr } = await supabase
          .from("attempts")
          .select("id, started_at, submitted_at, created_at")
          .eq("test_id", testId)
          .eq("student_id", profile.user_id)
          .order("created_at", { ascending: false });

        if (attemptsErr) {
          throw new Error(attemptsErr.message || "Could not load attempt history.");
        }

        const submittedAttempts = (attempts ?? []).filter((a) => a.submitted_at);
        let activeAttempt = (attempts ?? []).find((a) => !a.submitted_at);

        if (!activeAttempt && submittedAttempts.length > 0) {
          const latestSubmitted = submittedAttempts[0];
          navigateToResults(latestSubmitted.id);
          return;
        }

        const hydrateAttempt = async (attemptRow) => {
          const { data: savedAnswers, error: answersErr } = await supabase
            .from("answers")
            .select("id, question_id, selected_option")
            .eq("attempt_id", attemptRow.id);

          if (answersErr) {
            throw new Error(answersErr.message || "Could not load saved answers.");
          }

          const selectionMap = {};
          const rowIdMap = {};
          (savedAnswers ?? []).forEach((row) => {
            selectionMap[row.question_id] = row.selected_option;
            rowIdMap[row.question_id] = row.id;
          });

          if (!cancelled) {
            setMeta({
              id: test.id,
              name: test.name,
              totalMarks: test.total_marks,
              durationMinutes,
              timePerQuestionSeconds: templateTimePerQuestionSeconds,
              lockSectionNavigation: templateLockSectionNavigation,
              preventTabSwitch: templatePreventTabSwitch,
              strictProctoring: templateStrictProctoring,
              showResultsImmediately: Boolean(template?.show_results_immediately),
              maxAttempts,
            });
            setAttemptId(attemptRow.id);
            setSelectedOptions(selectionMap);
            setAnswerRowIds(rowIdMap);
            setQuestions(orderedQuestions);
            setCurrentIndex(0);
            setQuestionTimeRemaining(
              templateTimePerQuestionSeconds > 0
                ? orderedQuestions.reduce((acc, q) => ({ ...acc, [q.id]: templateTimePerQuestionSeconds }), {})
                : {},
            );
            setLockedQuestions(new Set());
            setProctorViolations(0);
            endTimeRef.current = availabilityEnd;
          }
        };

        const upsertAttempt = async () => {
          const nowIso = new Date().toISOString();
          const { error: upsertErr } = await supabase.from("attempts").upsert(
            {
              test_id: testId,
              student_id: profile.user_id,
              started_at: nowIso,
              submitted_at: null,
              violations: 0,
            },
            {
              onConflict: "student_id,test_id",
              ignoreDuplicates: true,
            },
          );

          if (upsertErr) {
            throw new Error(upsertErr.message || "Unable to start attempt.");
          }

          const { data: createdOrExisting, error: fetchErr } = await supabase
            .from("attempts")
            .select("id, started_at, submitted_at")
            .eq("test_id", testId)
            .eq("student_id", profile.user_id)
            .maybeSingle();

          if (fetchErr || !createdOrExisting) {
            throw new Error(fetchErr?.message || "Unable to start attempt.");
          }

          return createdOrExisting;
        };

        if (!activeAttempt) {
          activeAttempt = await upsertAttempt();
        }

        if (template?.shuffle_questions) {
          orderedQuestions = seededShuffle(orderedQuestions, activeAttempt.id);
        }

        if (template?.shuffle_options) {
          orderedQuestions = orderedQuestions.map((q) => {
            const orderedLetters = seededShuffle(["A", "B", "C", "D"], `${activeAttempt.id}:${q.id}`);
            return {
              ...q,
              optionOrder: orderedLetters,
            };
          });
        } else {
          orderedQuestions = orderedQuestions.map((q) => ({
            ...q,
            optionOrder: ["A", "B", "C", "D"],
          }));
        }

        const elapsedSecs = Math.floor(
          (Date.now() - new Date(activeAttempt.started_at || Date.now()).getTime()) / 1000,
        );

        const totalDurationSecs = Math.max(durationMinutes, 1) * 60;
        const absoluteDeadlineSecs = availabilityEnd
          ? Math.max(Math.floor((availabilityEnd.getTime() - Date.now()) / 1000), 0)
          : totalDurationSecs;
        const initialRemaining = Math.max(Math.min(totalDurationSecs, absoluteDeadlineSecs) - Math.max(elapsedSecs, 0), 0);

        if (initialRemaining <= 0) {
          await supabase.from("answers").delete().eq("attempt_id", activeAttempt.id);
          const nowIso = new Date().toISOString();
          const { data: replacementAttempt, error: replaceErr } = await supabase
            .from("attempts")
            .update({
              started_at: nowIso,
              submitted_at: null,
              violations: 0,
              score: null,
            })
            .eq("id", activeAttempt.id)
            .select("id, started_at, submitted_at")
            .single();

          if (replaceErr || !replacementAttempt) {
            throw new Error(replaceErr?.message || "Your previous attempt expired, but it could not be reset.");
          }

          activeAttempt = replacementAttempt;
          const replacementRemaining = Math.max(Math.min(totalDurationSecs, absoluteDeadlineSecs), 0);

          if (!cancelled) {
            setRemainingTime(replacementRemaining);
          }

          await hydrateAttempt(activeAttempt);

          return;
        }

        if (!cancelled) {
          setRemainingTime(initialRemaining);
        }

        await hydrateAttempt(activeAttempt);
        return;
      } catch (bootErr) {
        console.error("Exam bootstrap failed:", bootErr);
        if (!cancelled) {
          setError(bootErr.message || "Unable to prepare examination module.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadTemplate, profile?.user_id, testId]);

  useEffect(() => {
    if (loading || submitting || !attemptId) return undefined;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attemptId, loading, submitting]);

  useEffect(() => {
    if (loading || submitting || !attemptId || !timePerQuestionSeconds || !currentQuestion) return undefined;

    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        const currentRemaining = prev[currentQuestion.id] ?? timePerQuestionSeconds;
        if (currentRemaining <= 1) {
          const next = { ...prev, [currentQuestion.id]: 0 };
          setLockedQuestions((existing) => {
            const nextSet = new Set(existing);
            if (lockSectionNavigation) nextSet.add(currentQuestion.id);
            return nextSet;
          });

          if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
          } else {
            submitAttempt(true);
          }

          return next;
        }

        return { ...prev, [currentQuestion.id]: currentRemaining - 1 };
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [attemptId, currentIndex, currentQuestion, loading, lockSectionNavigation, submitAttempt, submitting, timePerQuestionSeconds, totalQuestions]);

  useEffect(() => {
    if (!attemptId || submittedRef.current || !(preventTabSwitch || strictProctoring)) return undefined;

    const handleVisibility = () => {
      if (document.hidden) registerViolation();
    };

    const handleBlur = () => registerViolation();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [attemptId, preventTabSwitch, registerViolation, strictProctoring]);

  useEffect(() => {
    if (!attemptId) return undefined;

    const channel = supabase
      .channel(`test-schedule-live-${testId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "test_schedules", filter: `test_id=eq.${testId}` },
        (payload) => {
          if (!payload.new?.is_active) return;

          const updatedEnd = payload.new?.availability_end ? new Date(payload.new.availability_end) : null;
          const previousEnd = endTimeRef.current;
          if (!updatedEnd) return;

          endTimeRef.current = updatedEnd;
          const now = new Date();
          if (updatedEnd <= now) {
            submitAttempt(true);
            return;
          }

          if (previousEnd) {
            const deltaSeconds = Math.floor((updatedEnd.getTime() - previousEnd.getTime()) / 1000);
            if (deltaSeconds !== 0) {
              setRemainingTime((prev) => Math.max(prev + deltaSeconds, 0));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId, submitAttempt, testId]);

  useEffect(() => {
    if (loading || submitting) return;
    if (remainingTime === 0 && attemptId && !submittedRef.current) {
      submitAttempt(true);
    }
  }, [attemptId, loading, remainingTime, submitAttempt, submitting]);

  const saveAnswer = useCallback(
    async (questionId, optionLetter) => {
      if (!attemptId) return;

      try {
        const existingRowId = answerRowIds[questionId];

        if (existingRowId) {
          const { error: updateErr } = await supabase
            .from("answers")
            .update({
              selected_option: optionLetter,
              answered_at: new Date().toISOString(),
            })
            .eq("id", existingRowId);

          if (updateErr) throw updateErr;
          return;
        }

        const { data: inserted, error: insertErr } = await supabase
          .from("answers")
          .insert({
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: optionLetter,
            answered_at: new Date().toISOString(),
          })
          .select("id, question_id")
          .single();

        if (insertErr) throw insertErr;

        setAnswerRowIds((prev) => ({
          ...prev,
          [inserted.question_id]: inserted.id,
        }));
      } catch (saveErr) {
        console.error("Failed to save answer", saveErr);
      }
    },
    [answerRowIds, attemptId],
  );

  const handleSelectOption = async (questionId, optionLetter) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));

    await saveAnswer(questionId, optionLetter);
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const canGoPrevious = currentIndex > 0 && !lockSectionNavigation;

  const jumpToQuestion = (index) => {
    if (index < currentIndex && lockSectionNavigation) return;
    setCurrentIndex(index);
  };

  const optionText = (q, letter) => {
    const key = `option_${letter.toLowerCase()}`;
    return q[key] ?? "";
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "65vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: "#00DDB3" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
            Preparing your exam environment...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 760, mx: "auto", py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate("/student/dashboard")}>Back to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1300, mx: "auto" }}>
      <Card
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2.5,
          background: "rgba(10, 15, 30, 0.72)",
          border: "1px solid rgba(0,221,179,0.15)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", mb: 0.5 }}>
              {meta?.name || "Examination"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
              Answer all MCQs before final submission. Auto-submit will trigger when the timer reaches zero.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<AccessTimeRoundedIcon />}
              label={`Time Left: ${formatClock(remainingTime)}`}
              sx={{
                bgcolor: remainingTime <= 60 ? "rgba(239,68,68,0.16)" : "rgba(6,182,212,0.16)",
                color: remainingTime <= 60 ? "#F87171" : "#22D3EE",
                border: remainingTime <= 60 ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(34,211,238,0.35)",
                fontWeight: 800,
              }}
            />
            <Chip
              icon={<TaskAltRoundedIcon />}
              label={`Progress: ${attemptedCount}/${totalQuestions}`}
              sx={{
                bgcolor: "rgba(16,185,129,0.14)",
                color: "#34D399",
                border: "1px solid rgba(52,211,153,0.35)",
                fontWeight: 800,
              }}
            />
            {timePerQuestionSeconds > 0 && currentQuestion && (
              <Chip
                label={`Q Time: ${formatClock(currentQuestionTimeLeft ?? timePerQuestionSeconds)}`}
                sx={{
                  bgcolor: "rgba(245,158,11,0.14)",
                  color: "#FBBF24",
                  border: "1px solid rgba(251,191,36,0.35)",
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        </Stack>
        <Box sx={{ mt: 1.8 }}>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.07)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
              },
            }}
          />
        </Box>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8.3}>
          <Card
            sx={{
              p: { xs: 2, md: 2.5 },
              minHeight: 420,
              background: "rgba(10, 15, 30, 0.72)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Question {currentIndex + 1} of {totalQuestions}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={`${currentQuestion?.marks ?? 1} mark${(currentQuestion?.marks ?? 1) > 1 ? "s" : ""}`}
                  sx={{ bgcolor: "rgba(255,255,255,0.09)", color: "#cbd5e1" }}
                />
                <Button
                  size="small"
                  onClick={() => toggleFlag(currentQuestion?.id)}
                  startIcon={<FlagOutlinedIcon />}
                  sx={{
                    color: flagged.has(currentQuestion?.id) ? "#FBBF24" : "rgba(255,255,255,0.6)",
                    border: `1px solid ${flagged.has(currentQuestion?.id) ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.18)"}`,
                  }}
                >
                  {flagged.has(currentQuestion?.id) ? "Flagged" : "Flag"}
                </Button>
              </Stack>
            </Stack>

            <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 700, mb: 2.5, lineHeight: 1.4 }}>
              {currentQuestion?.question_text}
            </Typography>

            <Stack spacing={1.3}>
              {(currentQuestion?.optionOrder || ["A", "B", "C", "D"]).map((letter) => {
                const text = optionText(currentQuestion, letter);
                if (!text) return null;

                const selected = selectedOptions[currentQuestion.id] === letter;
                return (
                  <Button
                    key={`${currentQuestion.id}-${letter}`}
                    onClick={() => handleSelectOption(currentQuestion.id, letter)}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      p: 1.6,
                      borderRadius: 2,
                      textTransform: "none",
                      color: selected ? "#E6FFFA" : "#E2E8F0",
                      border: selected ? "1px solid rgba(0,221,179,0.6)" : "1px solid rgba(255,255,255,0.14)",
                      bgcolor: selected ? "rgba(0,221,179,0.16)" : "rgba(255,255,255,0.03)",
                      "&:hover": {
                        bgcolor: selected ? "rgba(0,221,179,0.2)" : "rgba(255,255,255,0.06)",
                        borderColor: selected ? "rgba(0,221,179,0.7)" : "rgba(255,255,255,0.28)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.25)",
                        display: "grid",
                        placeItems: "center",
                        mr: 1.5,
                        fontWeight: 800,
                        fontSize: 12,
                        flexShrink: 0,
                        color: selected ? "#00DDB3" : "#94a3b8",
                      }}
                    >
                      {letter}
                    </Box>
                    <Typography sx={{ fontWeight: 600 }}>{text}</Typography>
                  </Button>
                );
              })}
            </Stack>

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3.2 }}>
              <Button
                  disabled={!canGoPrevious}
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                sx={{ border: "1px solid rgba(255,255,255,0.25)", color: "#cbd5e1" }}
              >
                Previous
              </Button>
              <Stack direction="row" spacing={1.2}>
                <Button
                  onClick={() => submitAttempt(false)}
                  disabled={submitting}
                  sx={{ border: "1px solid rgba(16,185,129,0.45)", color: "#34D399" }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  variant="contained"
                  disabled={currentIndex >= totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={3.7}>
          <Card
            sx={{
              p: 2,
              position: { md: "sticky" },
              top: { md: 16 },
              background: "rgba(10, 15, 30, 0.72)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>Question Palette</Typography>
            <Grid container spacing={1}>
              {questions.map((q, idx) => {
                const answered = Boolean(selectedOptions[q.id]);
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <Grid item xs={3} sm={2.4} md={3} key={q.id}>
                    <Button
                      onClick={() => jumpToQuestion(idx)}
                      sx={{
                        minWidth: 0,
                        width: "100%",
                        height: 40,
                        borderRadius: 2,
                        fontWeight: 800,
                        color: isCurrent ? "#0b1220" : "#e2e8f0",
                        border: `1px solid ${
                          isCurrent
                            ? "rgba(6,182,212,0.9)"
                            : isFlagged
                              ? "rgba(251,191,36,0.4)"
                              : "rgba(255,255,255,0.16)"
                        }`,
                        bgcolor: isCurrent
                          ? "#22D3EE"
                          : answered
                            ? "rgba(16,185,129,0.22)"
                            : "rgba(255,255,255,0.04)",
                        opacity: lockSectionNavigation && idx < currentIndex && lockedQuestions.has(q.id) ? 0.45 : 1,
                        pointerEvents: lockSectionNavigation && idx < currentIndex && lockedQuestions.has(q.id) ? "none" : "auto",
                        "&:hover": {
                          bgcolor: isCurrent ? "#22D3EE" : "rgba(255,255,255,0.1)",
                        },
                      }}
                    >
                      {idx + 1}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>

            <Stack spacing={0.8} sx={{ mt: 2 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Active attempt: <span style={{ color: "#fff", fontWeight: 700 }}>{attemptId}</span>
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Total marks: <span style={{ color: "#fff", fontWeight: 700 }}>{meta?.totalMarks ?? "-"}</span>
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Duration: <span style={{ color: "#fff", fontWeight: 700 }}>{meta?.durationMinutes ?? 0} min</span>
              </Typography>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

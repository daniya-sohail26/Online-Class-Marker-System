// src/pages/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Card, Grid, Chip, Divider, Stack, 
    CircularProgress, Paper, Avatar, IconButton 
} from '@mui/material';
import { 
    CheckCircle, XCircle, AlertTriangle, ArrowLeft, Trophy, Flag 
} from 'lucide-react';

// Adjust the import path for Supabase based on your project structure
import { supabase } from "../../server/config/supabaseClient";

export default function StudentResults() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Fetch the attempt, test details, and evaluated answers
                const { data, error: fetchError } = await supabase
                    .from('attempts')
                    .select(`
                        id, score, violations, submitted_at,
                        tests ( 
                            name, 
                            templates ( name, marks_per_question, negative_marking_penalty ) 
                        ),
                        answers (
                            id, selected_option, is_correct, marks_awarded,
                            questions ( question_text, option_a, option_b, option_c, option_d, correct_option )
                        )
                    `)
                    .eq('id', attemptId)
                    .single();

                if (fetchError) throw fetchError;
                setResultData(data);
            } catch (err) {
                console.error("Failed to load results:", err);
                setError("Could not load exam results. Please contact your instructor.");
            } finally {
                setLoading(false);
            }
        };

        if (attemptId) fetchResults();
    }, [attemptId]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress size={60} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Typography variant="h5" color="error">{error}</Typography>
        </Box>
    );

    // Calculate stats safely
    const answers = resultData?.answers || [];
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return (
        <Box sx={{ maxWidth: '900px', margin: '0 auto', p: { xs: 2, md: 4 } }}>
            
            {/* HEADER */}
            <Stack direction="row" alignItems="center" spacing={2} mb={4}>
                <IconButton onClick={() => navigate('/dashboard')} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
                    <ArrowLeft size={20} />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={900}>Exam Results</Typography>
                    <Typography color="text.secondary">{resultData.tests?.name || "Test"}</Typography>
                </Box>
            </Stack>

            {/* SCORE HUD */}
            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                        <Avatar sx={{ width: 64, height: 64, margin: '0 auto', mb: 2, bgcolor: '#0ea5e9', color: '#fff' }}>
                            <Trophy size={32} />
                        </Avatar>
                        <Typography variant="h2" fontWeight={900} color="#0ea5e9">{resultData.score || 0}</Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">Total Score</Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '24px', height: '100%' }}>
                        <Typography variant="h3" fontWeight={900} color="#22c55e" mt={2}>{accuracy}%</Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">Accuracy</Typography>
                        <Typography variant="body2" color="#16a34a" mt={1}>{correctAnswers} Correct / {wrongAnswers} Wrong</Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: resultData.violations > 0 ? '#fef2f2' : '#f8fafc', border: resultData.violations > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: '24px', height: '100%' }}>
                        <Avatar sx={{ width: 56, height: 56, margin: '0 auto', mb: 1, bgcolor: resultData.violations > 0 ? '#fee2e2' : '#f1f5f9', color: resultData.violations > 0 ? '#ef4444' : '#94a3b8' }}>
                            <Flag size={28} />
                        </Avatar>
                        <Typography variant="h4" fontWeight={900} color={resultData.violations > 0 ? "#ef4444" : "text.secondary"}>
                            {resultData.violations}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">Proctor Flags</Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* QUESTION BREAKDOWN */}
            <Typography variant="h5" fontWeight={900} mb={3}>Question Breakdown</Typography>
            
            <Stack spacing={3}>
                {answers.map((answer, index) => {
                    const q = answer.questions;
                    if (!q) return null;

                    const isCorrect = answer.is_correct;
                    const hasPenalty = !isCorrect && answer.marks_awarded < 0;

                    return (
                        <Paper key={answer.id} sx={{ p: 3, borderRadius: '16px', borderLeft: `6px solid ${isCorrect ? '#22c55e' : '#ef4444'}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Typography variant="h6" fontWeight={800} sx={{ maxWidth: '80%' }}>
                                    {index + 1}. {q.question_text}
                                </Typography>
                                
                                <Chip 
                                    label={`${answer.marks_awarded > 0 ? '+' : ''}${answer.marks_awarded} Marks`}
                                    sx={{ 
                                        bgcolor: isCorrect ? '#dcfce7' : (hasPenalty ? '#fee2e2' : '#f1f5f9'), 
                                        color: isCorrect ? '#16a34a' : (hasPenalty ? '#ef4444' : '#64748b'),
                                        fontWeight: 900 
                                    }} 
                                />
                            </Stack>

                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                {['a', 'b', 'c', 'd'].map(letter => {
                                    const optionText = q[`option_${letter}`];
                                    if (!optionText) return null;

                                    const isSelected = answer.selected_option === letter;
                                    const isActuallyCorrect = q.correct_option === letter;

                                    let bgcolor = '#f8fafc';
                                    let border = '1px solid #e2e8f0';
                                    let icon = null;

                                    if (isSelected && isActuallyCorrect) {
                                        bgcolor = '#dcfce7'; border = '1px solid #4ade80';
                                        icon = <CheckCircle size={18} color="#16a34a" />;
                                    } else if (isSelected && !isActuallyCorrect) {
                                        bgcolor = '#fee2e2'; border = '1px solid #f87171';
                                        icon = <XCircle size={18} color="#ef4444" />;
                                    } else if (!isSelected && isActuallyCorrect) {
                                        bgcolor = '#f0fdf4'; border = '1px dashed #4ade80';
                                        icon = <CheckCircle size={18} color="#4ade80" />;
                                    }

                                    return (
                                        <Grid item xs={12} sm={6} key={letter}>
                                            <Box sx={{ 
                                                p: 1.5, borderRadius: '12px', bgcolor, border,
                                                display: 'flex', alignItems: 'center', gap: 1.5
                                            }}>
                                                <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                                    {letter}.
                                                </Typography>
                                                <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: isSelected || isActuallyCorrect ? 700 : 400 }}>
                                                    {optionText}
                                                </Typography>
                                                {icon}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}
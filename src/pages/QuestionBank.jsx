import React, { useState } from "react";
import { Box, Typography, Grid, Card, TextField, Button, Tabs, Tab, Divider, Chip, Stack } from "@mui/material";
import { Sparkles, Settings2, Database, Save, Plus } from "lucide-react";
import AIQuestionGenerator from "../components/AIQuestionGenerator";

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Question Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Generate, customize, and manage your examination library.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
          <Tab icon={<Sparkles size={18} />} label="AI Generator" iconPosition="start" />
          <Tab icon={<Settings2 size={18} />} label="Customize Template" iconPosition="start" />
          <Tab icon={<Database size={18} />} label="Question Library" iconPosition="start" />
        </Tabs>
      </Box>

      {/* TAB 0: AI GENERATOR */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <AIQuestionGenerator />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, height: '100%', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Generation History</Typography>
              <Stack spacing={2}>
                {["React Hooks", "Database Normalization", "TCP/IP Protocol"].map((item, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item}</Typography>
                    <Typography variant="caption" color="text.secondary">Generated 2 days ago • 20 MCQs</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: CUSTOMIZE TEMPLATE */}
      {activeTab === 1 && (
        <Card sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>Exam Template Configuration</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Template Name" defaultValue="Final Semester Standard" variant="filled" sx={{ mb: 3 }} />
              <TextField fullWidth label="Time Limit (Minutes)" type="number" defaultValue="60" variant="filled" sx={{ mb: 3 }} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="Positive Marks" type="number" defaultValue="2" variant="filled" />
                <TextField fullWidth label="Negative Marks" type="number" defaultValue="0.5" variant="filled" />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
               <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(0,221,179,0.05)', border: '1px dashed #00DDB3' }}>
                  <Typography variant="subtitle2" sx={{ color: '#00DDB3', mb: 2 }}>Template Behavior</Typography>
                  <Stack spacing={2}>
                    <Chip label="Shuffle Questions Enabled" color="primary" variant="outlined" />
                    <Chip label="Tab-Switch Detection Active" color="primary" variant="outlined" />
                    <Chip label="Auto-Submit on Timer End" color="primary" variant="outlined" />
                  </Stack>
               </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Button variant="contained" startIcon={<Save size={18} />}>Save Template Changes</Button>
        </Card>
      )}

      {/* TAB 2: QUESTION LIBRARY */}
      {activeTab === 2 && (
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Stored Questions (1,240)</Typography>
            <Button variant="outlined" size="small" startIcon={<Plus size={16} />}>Manual Add</Button>
          </Box>
          <Box sx={{ px: 3, pb: 3 }}>
             {/* Replace with a Table or DataGrid later */}
             <Typography color="text.secondary">Library is healthy. No duplicates found.</Typography>
          </Box>
        </Card>
      )}
    </Box>
  );
}
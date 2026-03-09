import { Box, Grid, Typography, Button } from "@mui/material";
import { FileQuestion, Target, Users, UploadCloud, ArrowRight } from "lucide-react";
import StatCard from "../components/StatCard";
import AIQuestionGenerator from "../components/AIQuestionGenerator";
import LiveMonitoring from "../components/LiveMonitoring";

export default function Dashboard() {
  return (
    <Box sx={{ width: "100%", animation: "fadeIn 0.5s ease" }}>
      
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 1 }}>Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your assessments today.
          </Typography>
        </Box>
        <Button variant="contained" endIcon={<ArrowRight size={18} />} sx={{ borderRadius: 3, px: 3 }}>
          Create New Exam
        </Button>
      </Box>

      {/* Rich Stat Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="TOTAL QUESTIONS" value="1,240" icon={<FileQuestion size={24} />} gradient />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="ACTIVE EXAMS" value="5" icon={<Target size={24} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="STUDENTS ONLINE" value="82" icon={<Users size={24} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="SUBMISSIONS" value="340" icon={<UploadCloud size={24} />} />
        </Grid>
      </Grid>

      {/* Main Content Tools Area (Updated layout for stability) */}
      <Grid container spacing={4} alignItems="stretch">
        <Grid item xs={12} lg={7.5}>
          <AIQuestionGenerator sx={{ height: "100%" }} />
        </Grid>
        <Grid item xs={12} lg={4.5}>
          <LiveMonitoring sx={{ height: "100%" }} />
        </Grid>
      </Grid>
      
    </Box>
  );
}
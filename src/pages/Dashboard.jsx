import { Grid, Typography, Box } from "@mui/material";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
        Your institutional performance at a glance.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="TOTAL QUESTIONS" value="1,240" gradient /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="ACTIVE EXAMS" value="5" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="STUDENTS ONLINE" value="82" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="AVG. SCORE" value="76%" /></Grid>
      </Grid>
    </Box>
  );
}
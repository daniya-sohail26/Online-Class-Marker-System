import { Box, Grid, Typography, Card, Button, Avatar, Table, TableBody, TableCell, TableHead, TableRow, Chip } from "@mui/material";
import { Users, BookOpen, Building2, UploadCloud, Plus } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Students", value: "4,521", icon: <Users />, color: "#6366f1" },
    { label: "Active Teachers", value: "112", icon: <BookOpen />, color: "#8b5cf6" },
    { label: "Departments", value: "8", icon: <Building2 />, color: "#10b981" },
  ];

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
        <Box>
          <Typography variant="h4" mb={1}>Institution Overview</Typography>
          <Typography variant="body1" color="text.secondary">Manage departments, courses, and user accounts.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" startIcon={<UploadCloud size={18} />}>Bulk Upload Students</Button>
          <Button variant="contained" startIcon={<Plus size={18} />}>Add Teacher</Button>
        </Box>
      </Box>

      {/* High-Level Stats */}
      <Grid container spacing={3} mb={5}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h3">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: 1 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Registrations Table */}
      <Card sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6">Recent Enrollments</Typography>
        </Box>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Example Data Row */}
            <TableRow hover>
              <TableCell sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar src="/avatar1.png" sx={{ width: 32, height: 32 }} />
                Hasan Tariq
              </TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Computer Science</TableCell>
              <TableCell><Chip label="Active" size="small" color="success" sx={{ bgcolor: "#10b98120" }} /></TableCell>
            </TableRow>
             <TableRow hover>
              <TableCell sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>M</Avatar>
                Dr. Muneeb
              </TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Physics</TableCell>
              <TableCell><Chip label="Active" size="small" color="success" sx={{ bgcolor: "#10b98120" }} /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
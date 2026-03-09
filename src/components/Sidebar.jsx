import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Avatar } from "@mui/material";
import { LayoutDashboard, BookOpen, Activity, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: "Dashboard", icon: <LayoutDashboard size={22} />, path: "/teacher/dashboard" },
    { text: "Question Bank", icon: <BookOpen size={22} />, path: "/teacher/question-bank" },
    { text: "Live Monitoring", icon: <Activity size={22} />, path: "/teacher/live-monitoring" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 280,
          background: "rgba(10, 15, 30, 0.8)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          p: 2,
        },
      }}
    >
      <Box sx={{ p: 2, mb: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ background: "linear-gradient(135deg, #00DDB3, #06B6D4)", fontWeight: 800 }}>CM</Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
          Class<Box component="span" sx={{ color: "#00DDB3" }}>Marker</Box>
        </Typography>
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItemButton 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{ 
              borderRadius: 3, mb: 1,
              "&.Mui-selected": {
                bgcolor: "rgba(0, 221, 179, 0.12)",
                color: "#00DDB3",
                "& .MuiListItemIcon-root": { color: "#00DDB3" }
              }
            }}
          >
            <ListItemIcon sx={{ color: "text.secondary", minWidth: 45 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
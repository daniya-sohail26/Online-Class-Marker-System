import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Avatar } from "@mui/material";
import { Sparkles, BookOpen, Activity, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { text: "Dashboard", icon: <LayoutDashboard size={20} />, active: true },
    { text: "AI Generator", icon: <Sparkles size={20} /> },
    { text: "Question Bank", icon: <BookOpen size={20} /> },
    { text: "Live Monitoring", icon: <Activity size={20} /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 280,
          background: "rgba(16, 22, 42, 0.8)", // Semi-transparent Sidebar
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          p: 2,
        },
      }}
    >
      <Box sx={{ p: 2, mb: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Update logo background for the new theme */}
        <Avatar sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #00DDB3, #06B6D4)", color: "#fff", fontWeight: 800 }}>T</Avatar>
        <Typography variant="h5" sx={{ letterSpacing: "-0.5px" }}>Teacher<Box component="span" sx={{ color: "primary.main" }}>AI</Box></Typography>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton 
            key={item.text} 
            sx={{ 
              borderRadius: 3, 
              mb: 1,
              // Update active backgrounds for the new theme
              bgcolor: item.active ? "rgba(0, 221, 179, 0.08)" : "transparent",
              color: item.active ? "primary.main" : "text.secondary",
              border: item.active ? "1px solid rgba(0, 221, 179, 0.3)" : "1px solid transparent",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.03)" }
            }}
          >
            <ListItemIcon sx={{ color: item.active ? "primary.main" : "inherit", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: item.active ? 600 : 400 }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
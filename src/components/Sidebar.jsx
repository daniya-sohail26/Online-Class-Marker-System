import React from "react";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider } from "@mui/material";
import { LayoutDashboard, BookOpen, Activity, Sparkles, LogOut } from "lucide-react"; // Added LogOut icon
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import the hook

// --- CUSTOM SVG LOGO COMPONENT (Untouched) ---
const ClassMarkerLogo = ({ size = 48, transparent = false }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#00DDB3" stopOpacity="0.0" />
      </linearGradient>
      <linearGradient id="leftLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="rightLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#00DDB3" />
      </linearGradient>
      <filter id="foldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-2" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {!transparent && <rect width="256" height="256" rx="60" fill="url(#bgGrad)" />}
    <circle cx="128" cy="128" r="96" fill="none" stroke="url(#gridGrad)" strokeWidth="2" />
    <circle cx="128" cy="128" r="64" fill="none" stroke="url(#gridGrad)" strokeWidth="1" strokeDasharray="4 6" />
    <path d="M 56 180 L 92 108 L 140 172 L 200 76" fill="none" stroke="#00DDB3" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" filter="url(#glow)" />
    <path d="M 56 180 L 92 108 L 128 156" fill="none" stroke="url(#leftLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 104 124 L 140 172 L 200 76" fill="none" stroke="url(#rightLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" filter="url(#foldShadow)" />
    <circle cx="200" cy="76" r="6" fill="#FFFFFF" filter="url(#glow)" />
  </svg>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth(); // Access signout from context

  const menuItems = [
    { text: "Dashboard", icon: <LayoutDashboard size={22} />, path: "/teacher/dashboard" },
    { text: "Test Template Builder", icon: <Sparkles size={22} />, path: "/teacher/template-builder" },
    { text: "Question Bank", icon: <BookOpen size={22} />, path: "/teacher/question-bank" },
    { text: "Live Monitoring", icon: <Activity size={22} />, path: "/teacher/live-monitoring" },
    { text: "Evaluation Panel", icon: <BookOpen size={22} />, path: "/teacher/evaluation" }
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
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between" // Pushes Logout to bottom
        },
      }}
    >
      <Box>
        <Box sx={{ p: 2, mb: 4, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate("/")}>
          <ClassMarkerLogo size={36} transparent={true} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
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
                borderRadius: 3, 
                mb: 1,
                color: "text.secondary",
                "&.Mui-selected": {
                  bgcolor: "rgba(0, 221, 179, 0.12)",
                  color: "#00DDB3",
                  "& .MuiListItemIcon-root": { color: "#00DDB3" }
                }
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 45 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* --- LOGOUT BUTTON AT BOTTOM --- */}
      <Box sx={{ mb: 2 }}>
        <Divider sx={{ mb: 2, opacity: 0.1 }} />
        <ListItemButton 
          onClick={signOut}
          sx={{ 
            borderRadius: 3, 
            color: "#EF4444", // Red color
            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" }
          }}
        >
          <ListItemIcon sx={{ color: "#EF4444", minWidth: 45 }}>
            <LogOut size={22} />
          </ListItemIcon>
          <ListItemText primary="Log Out" primaryTypographyProps={{ fontWeight: 700 }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
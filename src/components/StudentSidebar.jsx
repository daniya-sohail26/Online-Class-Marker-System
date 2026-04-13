import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  GradeOutlined as GradeIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

export default function StudentSidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: <DashboardIcon />,
      path: "/student/dashboard",
    },
    
    {
      label: "Results",
      icon: <GradeIcon />,
      path: "/student/results",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            w: 40,
            h: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #A855F7, #7C3AED)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          {profile?.name?.charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: "#fff" }}>
            {profile?.name || "Student"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.6)" }}
          >
            {profile?.enrollment_number || "Student"}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItem
              disablePadding
              sx={{
                px: 1,
                mb: 1,
                "&:hover": {
                  "& .MuiListItemButton-root": {
                    bgcolor: "rgba(168, 85, 247, 0.2)",
                  },
                },
              }}
            >
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: "12px",
                  color: "rgba(255,255,255,0.7)",
                  transition: "all 0.3s",
                  "&:hover": {
                    color: "#A855F7",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    "& .MuiTypography-root": {
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={signOut}
          sx={{
            borderColor: "rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "12px",
            py: 1.5,
            "&:hover": {
              borderColor: "#EF4444",
              color: "#EF4444",
              bgcolor: "rgba(239, 68, 68, 0.1)",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 1300,
            bgcolor: "rgba(15, 23, 42, 0.8)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            "&:hover": { bgcolor: "rgba(15, 23, 42, 0.95)" },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {isMobile ? (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              bgcolor: "transparent",
              backgroundImage: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Box
          component="nav"
          sx={{
            width: 280,
            flexShrink: 0,
            height: "100vh",
            position: "sticky",
            top: 0,
            overflowY: "auto",    // sidebar scrolls itself if menu is too tall
            borderRight: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {drawerContent}
        </Box>
      )}
    </>
  );
}

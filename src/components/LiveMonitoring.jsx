import { Box, Card, Typography, LinearProgress, Avatar, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function LiveMonitoring() {
  const students = [
    { name: "Ali Khan", progress: 75, status: 'Online', color: "#A855F7", avatar: "A" },
    { name: "Sara Ahmed", progress: 40, status: 'Online', color: "#06B6D4", avatar: "S" },
    { name: "Hasan Tariq", progress: 15, status: 'Warning', color: "#F59E0B", avatar: "H" },
    { name: "Ayesha Ali", progress: 100, status: 'Completed', color: "#10B981", avatar: "A" }
  ];

  return (
    <Card sx={{ 
      p: { xs: 3, md: 4 }, 
      height: "100%",
      background: "linear-gradient(180deg, rgba(10, 10, 30, 0.6) 0%, rgba(3, 0, 20, 0.8) 100%)",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
          <Activity size={24} color="#06B6D4" />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ color: "#fff" }}>Live Monitoring</Typography>
          <Typography variant="body2" color="text.secondary">Real-time exam tracking.</Typography>
        </Box>
      </Box>
      
      <Stack spacing={3.5}>
        {students.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }} // Staggered entrance
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ 
                    width: 36, 
                    height: 36, 
                    fontSize: '0.9rem', 
                    fontWeight: 700,
                    bgcolor: "rgba(255,255,255,0.03)", 
                    border: `1px solid ${s.color}40`,
                    color: s.color
                  }}>
                    {s.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#fff" }}>{s.name}</Typography>
                    <Typography variant="caption" sx={{ color: s.color, display: "flex", alignItems: "center", gap: 0.5 }}>
                      {/* Pulsing Dot for Online Status */}
                      {s.status === 'Online' && (
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: s.color, animation: "pulse 2s infinite" }} />
                      )}
                      {s.status}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>
                  {s.progress}%
                </Typography>
              </Box>
              
              {/* Custom Styled Progress Bar */}
              <Box sx={{ position: "relative", height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    borderRadius: 3,
                    background: s.progress === 100 
                      ? "#10B981" 
                      : `linear-gradient(90deg, ${s.color}40 0%, ${s.color} 100%)`,
                    boxShadow: `0 0 10px ${s.color}80`
                  }}
                />
              </Box>
            </Box>
          </motion.div>
        ))}
      </Stack>

      {/* CSS for the pulsing dot */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.5; }
          }
        `}
      </style>
    </Card>
  );
}
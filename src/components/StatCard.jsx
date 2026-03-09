import { Card, CardContent, Typography, Box } from "@mui/material";
import { motion } from "framer-motion";

export default function StatCard({ title, value, gradient }) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card sx={{
        position: "relative",
        overflow: "hidden",
        // Gradient head update for new Aquamarine Gemstone theme
        background: gradient 
          ? "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)" 
          : "rgba(255,255,255,0.03)",
        border: gradient ? "1px solid rgba(0, 221, 179, 0.3)" : "1px solid rgba(255,255,255,0.05)",
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="overline" sx={{ color: gradient ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: gradient ? "#fff" : "#fff", mt: 1 }}>
            {value}
          </Typography>
          <Box sx={{ 
            position: "absolute", right: -20, bottom: -20, 
            width: 100, height: 100, borderRadius: "50%", 
            background: "rgba(255,255,255,0.05)" 
          }} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
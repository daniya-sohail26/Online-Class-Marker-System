import { useState } from "react";
import { Box, Card, Typography, TextField, Button, Chip, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { Sparkles, Plus, Copy, CheckCircle2 } from "lucide-react";

export default function AIQuestionGenerator() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock generation effect
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <Card sx={{ 
      p: { xs: 3, md: 4 }, 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      background: "linear-gradient(180deg, rgba(10, 10, 30, 0.6) 0%, rgba(3, 0, 20, 0.8) 100%)",
    }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
          <Sparkles size={24} color="#A855F7" />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ color: "#fff" }}>AI Question Engine</Typography>
          <Typography variant="body2" color="text.secondary">Generate context-aware MCQs instantly.</Typography>
        </Box>
      </Box>

      {/* Input Section */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        gap: 2, 
        p: 1.5, 
        mb: 4,
        background: "rgba(0,0,0,0.3)", 
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)"
      }}>
        <TextField
          fullWidth
          placeholder="Enter Topic (e.g., React Hooks, Thermodynamics...)"
          variant="standard"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          InputProps={{ 
            disableUnderline: true, 
            sx: { px: 2, py: 1, color: "#fff", fontSize: "1.1rem" } 
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleGenerate}
          disabled={isGenerating}
          sx={{ 
            px: 4, 
            py: { xs: 1.5, sm: 0 }, 
            borderRadius: 3, 
            minWidth: 140 
          }}
        >
          {isGenerating ? "Working..." : "Generate"}
        </Button>
      </Box>

      {/* Results Section */}
      <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2, pl: 1 }}>
        LATEST GENERATION
      </Typography>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          p: 3, 
          background: "rgba(255,255,255,0.02)", 
          borderRadius: 4, 
          border: "1px dashed rgba(168, 85, 247, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle glow behind the result card */}
          <Box sx={{ position: "absolute", top: -50, right: -50, width: 100, height: 100, background: "rgba(168, 85, 247, 0.2)", filter: "blur(40px)", borderRadius: "50%" }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, position: "relative", zIndex: 1 }}>
            <Typography variant="h6" sx={{ color: "#fff", lineHeight: 1.4, maxWidth: "80%" }}>
              What is the primary purpose of the useEffect hook in React?
            </Typography>
            <Chip 
              label="Medium" 
              size="small" 
              sx={{ background: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", fontWeight: 600, border: "1px solid rgba(6, 182, 212, 0.2)" }} 
            />
          </Box>

          <Box sx={{ display: "flex", gap: 3, mb: 3, position: "relative", zIndex: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle2 size={14} color="#10B981" /> Marks: 2
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Negative: -0.5
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, position: "relative", zIndex: 1 }}>
            <Button size="small" variant="outlined" startIcon={<Plus size={16} />} sx={{ borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
              Add to Bank
            </Button>
            <IconButton size="small" sx={{ border: "1px solid rgba(255,255,255,0.1)", color: "text.secondary" }}>
              <Copy size={16} />
            </IconButton>
          </Box>
        </Box>
      </motion.div>
    </Card>
  );
}
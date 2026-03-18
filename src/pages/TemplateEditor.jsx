import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
} from "@mui/material";
import { ArrowLeft, Save } from "lucide-react";
import { getTemplateById, updateTemplate } from "../api/templateApi";

export default function TemplateEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        // Fetch template data - you may need to implement getTemplateById in templateApi
        const templateData = await getTemplateById(templateId);
        setTemplate(templateData);
        setFormData(templateData);
      } catch (err) {
        setError("Failed to load template: " + (err.message || "Unknown error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await updateTemplate(templateId, formData);
      setSuccess("Template updated successfully!");
      setUnsavedChanges(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save template: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate("/teacher/dashboard");
      }
    } else {
      navigate("/teacher/dashboard");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#00DDB3" }} />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Template not found</Alert>
        <Button onClick={() => navigate("/teacher/dashboard")} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease", pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowLeft size={20} />}
          sx={{ color: "#00DDB3", textTransform: "none", fontSize: "1rem" }}
        >
          Back
        </Button>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Edit Template
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Editor Form */}
      <Card sx={{ p: 4, bgcolor: "rgba(22, 31, 61, 0.6)", backdropFilter: "blur(20px)" }}>
        {/* Basic Info */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#00DDB3" }}>
          Basic Information
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Template Name
            </Typography>
            <TextField
              fullWidth
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Template Type
            </Typography>
            <TextField
              fullWidth
              name="type"
              value={formData.type || "Quiz"}
              onChange={handleInputChange}
              variant="filled"
              select
              SelectProps={{ native: true }}
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            >
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Practice">Practice</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Total Questions
            </Typography>
            <TextField
              fullWidth
              name="totalQuestions"
              type="number"
              value={formData.totalQuestions || 0}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Duration (minutes)
            </Typography>
            <TextField
              fullWidth
              name="duration"
              type="number"
              value={formData.duration || 60}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, opacity: 0.1 }} />

        {/* Scoring */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#06B6D4" }}>
          Scoring Configuration
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Marks Per Question
            </Typography>
            <TextField
              fullWidth
              name="marksPerQuestion"
              type="number"
              step="0.5"
              value={formData.marksPerQuestion || 1}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Passing Percentage
            </Typography>
            <TextField
              fullWidth
              name="passingPercentage"
              type="number"
              value={formData.passingPercentage || 50}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="negativeMarking"
                  checked={formData.negativeMarking || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }}
                />
              }
              label="Enable Negative Marking"
            />
          </Grid>

          {formData.negativeMarking && (
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
                Penalty Per Wrong Answer
              </Typography>
              <TextField
                fullWidth
                name="negativeMarkingPenalty"
                type="number"
                step="0.5"
                value={formData.negativeMarkingPenalty || 0.5}
                onChange={handleInputChange}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
                }}
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 4, opacity: 0.1 }} />

        {/* Behavior & Security */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#ec4899" }}>
          Behavior & Security
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }}
                />
              }
              label="Shuffle Questions"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="shuffleOptions"
                  checked={formData.shuffleOptions || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }}
                />
              }
              label="Shuffle Options"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="allowReview"
                  checked={formData.allowReview || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }}
                />
              }
              label="Allow Review Before Submit"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="preventTabSwitch"
                  checked={formData.preventTabSwitch || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#f59e0b" } }}
                />
              }
              label="Prevent Tab Switching"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="strictProctoring"
                  checked={formData.strictProctoring || false}
                  onChange={handleInputChange}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#ec4899" } }}
                />
              }
              label="Strict Proctoring (Webcam)"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Max Attempts
            </Typography>
            <TextField
              fullWidth
              name="maxAttempts"
              type="number"
              value={formData.maxAttempts || 1}
              onChange={handleInputChange}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !unsavedChanges}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            sx={{
              background: "linear-gradient(135deg, #00DDB3, #06B6D4)",
              color: "#000",
              fontWeight: 800,
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

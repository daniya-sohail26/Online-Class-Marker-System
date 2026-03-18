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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from "@mui/material";
import { ArrowLeft, Save } from "lucide-react";
import { getTestById, updateTest } from "../api/testApi";

export default function TestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        // Fetch test data - you may need to implement getTestById in testApi
        const testData = await getTestById(testId);
        setTest(testData);
        // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
        const formattedData = {
          ...testData,
          startTime: testData.start_time ? new Date(testData.start_time).toISOString().slice(0, 16) : "",
          endTime: testData.end_time ? new Date(testData.end_time).toISOString().slice(0, 16) : ""
        };
        setFormData(formattedData);
      } catch (err) {
        setError("Failed to load test: " + (err.message || "Unknown error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadTest();
    }
  }, [testId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await updateTest(testId, formData);
      setSuccess("Test updated successfully!");
      setUnsavedChanges(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save test: " + (err.message || "Unknown error"));
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

  if (!test) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Test not found</Alert>
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
          Edit Test
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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 4 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Test Name
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
          </Box>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <FormControlLabel
              control={
                <Switch
                  name="is_published"
                  checked={formData.is_published || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DDB3" } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  Publish Test (Make it visible to students)
                </Typography>
              }
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              Start Date & Time
            </Typography>
            <TextField
              fullWidth
              name="startTime"
              type="datetime-local"
              value={formData.startTime || ""}
              onChange={handleInputChange}
              variant="filled"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
              End Date & Time
            </Typography>
            <TextField
              fullWidth
              name="endTime"
              type="datetime-local"
              value={formData.endTime || ""}
              onChange={handleInputChange}
              variant="filled"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
              }}
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block" }}>
            Description
          </Typography>
          <TextField
            fullWidth
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            variant="filled"
            multiline
            rows={4}
            InputProps={{
              disableUnderline: true,
              sx: { borderRadius: "12px", bgcolor: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" },
            }}
          />
        </Box>

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

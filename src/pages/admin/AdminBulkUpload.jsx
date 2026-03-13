import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { UploadCloud, FileSpreadsheet, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";

const CSV_TEMPLATE = "name,email,enrollment_number,course_id\nJohn Doe,john@uni.edu,2025-CS-001,\nJane Smith,jane@uni.edu,2025-CS-002,";

export default function AdminBulkUpload() {
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState([]);

  React.useEffect(() => {
    if (!supabase) {
      setCourses([]);
      return;
    }
    supabase.from("courses").select("id, name").then(({ data }) => setCourses(data || []));
  }, []);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || "" }), {});
    }).filter((r) => r.name || r.email);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(reader.result);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file || !courseId || !supabase) return;
    setUploading(true);
    setResult(null);
    const text = await file.text();
    const rows = parseCSV(text);
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const row of rows) {
      const { name, email, enrollment_number } = row;
      const enr = enrollment_number || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (!name || !email) {
        failed++;
        errors.push(`Skipped: ${name || "?"} / ${email || "?"}`);
        continue;
      }
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: "changeme123",
        options: { data: { name }, emailRedirectTo: window.location.origin },
      });
      if (authErr) {
        failed++;
        errors.push(`${email}: ${authErr.message}`);
        continue;
      }
      const { data: userData } = await supabase.from("users").insert([{ auth_id: authData.user.id, name, email, role: "student" }]).select().single();
      if (userData) {
        const { error: studErr } = await supabase.from("students").insert([{ user_id: userData.id, course_id: courseId, enrollment_number: enr }]);
        if (studErr) {
          failed++;
          errors.push(`${email}: ${studErr.message}`);
        } else success++;
      } else failed++;
    }
    setResult({ success, failed, total: rows.length, errors: errors.slice(0, 10) });
    setUploading(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "students_template.csv";
    a.click();
  };

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" mb={1}>Bulk Upload Students</Typography>
        <Typography variant="body1" color="text.secondary">Upload a CSV file to create multiple student accounts at once.</Typography>
      </Box>

      <Card sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>CSV Format</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your CSV must have columns: <code>name</code>, <code>email</code>, <code>enrollment_number</code>, <code>course_id</code>. Download the template below.
        </Typography>
        <Button variant="outlined" startIcon={<Download size={18} />} onClick={downloadTemplate} sx={{ mb: 4 }}>
          Download Template
        </Button>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Target Course</InputLabel>
          <Select value={courseId} label="Target Course" onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" component="label" startIcon={<UploadCloud size={18} />} sx={{ mr: 2 }}>
          Select CSV
          <input type="file" accept=".csv" hidden onChange={handleFileChange} />
        </Button>
        {file && (
          <Typography component="span" variant="body2" color="text.secondary">
            {file.name}
          </Typography>
        )}

        {uploading && <LinearProgress sx={{ mt: 3 }} />}
        {result && (
          <Alert severity={result.failed > 0 ? "warning" : "success"} sx={{ mt: 3 }}>
            Uploaded {result.success} of {result.total}. Failed: {result.failed}.
            {result.errors?.length > 0 && (
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}

        <Button variant="contained" sx={{ mt: 3, display: "block" }} onClick={handleUpload} disabled={!supabase || !file || !courseId || uploading}>
          Upload
        </Button>
      </Card>

      {preview.length > 0 && (
        <Card sx={{ overflow: "hidden" }}>
          <Typography variant="subtitle2" sx={{ p: 2 }}>Preview (first 5 rows)</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Enrollment #</TableCell></TableRow></TableHead>
            <TableBody>
              {preview.map((r, i) => (
                <TableRow key={i}><TableCell>{r.name}</TableCell><TableCell>{r.email}</TableCell><TableCell>{r.enrollment_number || "—"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}

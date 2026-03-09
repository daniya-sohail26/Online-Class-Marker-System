import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Mock Data
let questionBank = [];
let liveStudents = [
  { id: 1, name: "Ahmed Raza", progress: 65, lastAnswer: "B", status: "Active" },
  { id: 2, name: "Syeda Fatima", progress: 92, lastAnswer: "D", status: "Active" },
  { id: 3, name: "Zainab Ali", progress: 15, lastAnswer: "A", status: "Active" }
];

// --- AI GENERATION ---
app.post('/api/ai/generate', upload.single('material'), (req, res) => {
  const { topic } = req.body;
  const fileName = req.file ? req.file.originalname : null;

  const mockQ = {
    id: Date.now(),
    text: fileName ? `Based on ${fileName}, what is the primary conclusion?` : `Explain the core concept of ${topic}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    topic: topic || "General",
    marks: 5,
    negativeMarking: 1
  };
  res.json(mockQ);
});

// --- DATA PERSISTENCE ---
app.get('/api/questions', (req, res) => res.json(questionBank));
app.post('/api/questions', (req, res) => {
  questionBank.push(req.body);
  res.status(201).json({ message: "Saved" });
});

// --- MONITORING ---
app.get('/api/live-monitor', (req, res) => res.json(liveStudents));

app.listen(5000, () => console.log('🚀 Daniya Engine Live on Port 5000'));
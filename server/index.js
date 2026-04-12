import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';

// Import Custom Services & Routes
import liveMonitorService from './services/LiveMonitorService.js';
import { QuestionGeneratorFactory } from './services/QuestionFactory.js'; 
import courseRoutes from './routes/courseRoutes.js';
import templateRoutes from './routes/templates.js'; 
import questionRoutes from './routes/questionRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js'; // New route for evaluation endpoints 
import studentRoutes from './routes/studentRoutes.js'; // Student routes 

// Environment Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') }); 

const app = express();
app.use(cors());
app.use(express.json());

// --- 🌟 OBSERVER PATTERN INITIALIZATION 🌟 ---
const httpServer = createServer(app);
liveMonitorService.initialize(httpServer);

// Register standard REST routes
app.use('/api/courses', courseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/teacher', evaluationRoutes); // Reuse questionRoutes for evaluation endpoints
app.use('/api/students', studentRoutes); // Student endpoints

// --- Initialize Supabase ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("⚠️ WARNING: Supabase keys not found in process.env");
} else {
    console.log("✅ Supabase keys loaded successfully");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const upload = multer({ storage: multer.memoryStorage() });


// --- FACTORY-POWERED ENDPOINT ---
app.post('/api/generate-questions', upload.array('files'), async (req, res) => {
    try {
        const { sourceType, prompt, count, difficulty } = req.body;
        console.log(`\n=== NEW REQUEST: Source: ${sourceType} | Count: ${count} ===`);

        const generator = QuestionGeneratorFactory.create(sourceType);
        const questions = await generator.generate({
            prompt: prompt,
            count: parseInt(count, 10),
            difficulty: difficulty,
            files: req.files
        });

        console.log(`=== SUCCESS: Sending ${questions.length} questions back to React ===\n`);
        res.status(200).json(questions);

    } catch (error) {
        console.error("\n>>> BACKEND CRASH ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to generate questions." });
    }
});

// --- 🌟 STUDENT ACTION API (Trigger) 🌟 ---
// --- REAL-TIME ACTION TRIGGER ---
// --- 🌟 REAL-TIME STUDENT ACTION ENDPOINT 🌟 ---
app.post('/api/student-action', async (req, res) => {
    try {
        const { courseId, studentId, studentName, email, actionType, currentViolations, currentQuestionsAnswered } = req.body;

        const isViolation = actionType === 'tab_switch';
        const isSubmit = actionType === 'submit';
        
        const payload = {
            id: studentId,
            name: studentName,
            email: email,
            status: isSubmit ? 'Submitted' : (isViolation ? 'Suspicious' : 'Active'),
            statusColor: isSubmit ? '#06B6D4' : (isViolation ? '#ef4444' : '#00DDB3'),
            violations: isViolation ? (currentViolations + 1) : currentViolations,
            questionsAnswered: currentQuestionsAnswered || 0,
            totalQuestions: 10
        };

        // 🔄 OBSERVER PATTERN: Notify the LiveMonitorService
        liveMonitorService.notifyStudentUpdate(courseId, payload);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- MUST use httpServer.listen() instead of app.listen() for WebSockets ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket API active and waiting for Teacher connections...`);
});
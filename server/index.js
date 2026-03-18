import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
// Import our new Factory
import { QuestionGeneratorFactory } from './services/QuestionFactory.js';
// Import routes
import templateRoutes from './routes/templates.js';
import testRoutes from './routes/tests.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer to keep files in memory for Gemini
const upload = multer({ storage: multer.memoryStorage() });

// --- THE FACTORY-POWERED ENDPOINT ---
app.post('/api/generate-questions', upload.array('files'), async (req, res) => {
    try {
        // 1. Extract parameters from the React Frontend
        const { sourceType, prompt, count, difficulty } = req.body;

        console.log(`\n=== NEW REQUEST: Source: ${sourceType} | Count: ${count} ===`);

        // 2. Ask the Factory to give us the correct Generator (AI, Bank, or Hybrid)
        const generator = QuestionGeneratorFactory.create(sourceType);

        // 3. Tell the generator to do its job! We don't care HOW it does it.
        const questions = await generator.generate({
            prompt: prompt,
            count: parseInt(count, 10),
            difficulty: difficulty,
            files: req.files
        });

        console.log(`=== SUCCESS: Sending ${questions.length} questions back to React ===\n`);

        // 4. Send the result back to React
        res.status(200).json(questions);

    } catch (error) {
        console.error("\n>>> BACKEND CRASH ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to generate questions." });
    }
});

// --- TEMPLATE ROUTES ---
app.use('/api/templates', templateRoutes);

// --- TEST ROUTES ---
app.use('/api/tests', testRoutes);

// --- QUESTION ROUTES ---
import questionRoutes from './routes/questionRoutes.js';
app.use('/api/questions', questionRoutes);

// --- COURSE ROUTES ---
import courseRoutes from './routes/courseRoutes.js';
app.use('/api/courses', courseRoutes);

// --- STUDENT ROUTES ---
import studentRoutes from './routes/studentRoutes.js';
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
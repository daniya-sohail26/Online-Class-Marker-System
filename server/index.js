import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// --- NEW: Tools to find the exact file path ---
import path from 'path';
import { fileURLToPath } from 'url';

// Import our new Factory
import { QuestionGeneratorFactory } from './services/QuestionFactory.js'; 

// --- NEW: Bulletproof .env loader ---
// This forces Node to look in the 'server' folder for the .env file,
// no matter what terminal folder you started the server from!
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') }); 

const app = express();
app.use(cors());
app.use(express.json());

// --- Initialize Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// We initialize it here. If the .env variables are missing, it won't crash the whole server.
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


// Set up Multer to keep files in memory for Gemini
const upload = multer({ storage: multer.memoryStorage() });


// --- THE FACTORY-POWERED ENDPOINT (Untouched) ---
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


// --- THE LIVE MONITORING ENDPOINT (Untouched) ---
app.get('/api/live-monitoring', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: "Supabase client not initialized. Check your .env file." });
        }

        // Note: In a real app, courseId and testId would come from req.query (e.g., ?testId=123)
        // For testing, we are fetching all attempts and their related user data
        
        // 1. Fetch all attempts with related user and answers data
        const { data: attempts, error: attemptsError } = await supabase
            .from('attempts')
            .select(`
                id, started_at, submitted_at, score, violations,
                student_id,
                users ( name, email ),
                answers ( id )
            `);

        if (attemptsError) throw attemptsError;

        // 2. Format the data to match what the React frontend expects
        const formattedData = attempts.map(attempt => {
            let status = 'Active';
            let statusColor = '#10B981'; // Green

            if (attempt.submitted_at) {
                status = 'Submitted';
                statusColor = '#06B6D4'; // Cyan
            } else if (attempt.violations > 5) {
                status = 'Critical Warning';
                statusColor = '#EF4444'; // Red
            } else if (attempt.violations > 0) {
                status = 'Suspicious';
                statusColor = '#F59E0B'; // Yellow
            }

            return {
                id: attempt.student_id,
                name: attempt.users.name,
                email: attempt.users.email,
                startTime: attempt.started_at,
                submittedAt: attempt.submitted_at,
                violations: attempt.violations,
                questionsAnswered: attempt.answers ? attempt.answers.length : 0,
                status: status,
                statusColor: statusColor
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error("Live Monitoring Error:", error);
        res.status(500).json({ error: 'Failed to fetch live data' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
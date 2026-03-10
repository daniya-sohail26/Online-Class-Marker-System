import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer to keep files in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/generate-questions', upload.array('files'), async (req, res) => {
    try {
        console.log("1. Request received. Files attached:", req.files?.length || 0);
        
        const { prompt, count, difficulty } = req.body;
        
        // This array will hold the PDF files AND our text instructions
        const promptParts = [];

        // 1. Pass the raw PDFs directly to Gemini!
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.mimetype === 'application/pdf') {
                    console.log(`Attaching PDF directly to Gemini: ${file.originalname}`);
                    promptParts.push({
                        inlineData: {
                            data: file.buffer.toString("base64"),
                            mimeType: "application/pdf"
                        }
                    });
                }
            }
        }

        console.log("2. Files processed. Constructing prompt...");

        const systemInstruction = `
            You are an expert academic examiner. Generate multiple-choice questions based on the attached document(s) and prompt.
            Return a raw JSON array ONLY. DO NOT wrap it in markdown blockquotes (\`\`\`json).
            
            Schema per object:
            {
                "text": "The question statement",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": 0, // The index of the correct option (0, 1, 2, or 3)
                "explanation": "Why this answer is correct.",
                "tags": ["tag1", "tag2"],
                "difficulty": "${difficulty || 'Medium'}",
                "points": 2.0,
                "isAiGenerated": true
            }
        `;

        const userPrompt = `
            Generate ${count || 5} questions. 
            Instructions: ${prompt || 'Focus on the core concepts in the attached documents.'}
        `;

        // Add the text instructions to the payload
        promptParts.push({ text: systemInstruction + "\n\n" + userPrompt });

        console.log("3. Contacting Gemini Multimodal API...");

        // Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: promptParts }],
            config: {
                responseMimeType: "application/json",
            }
        });

        console.log("4. Received response from Gemini. Parsing JSON...");

        // Robust JSON Parsing
        let rawText = response.text;
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const generatedQuestions = JSON.parse(rawText);
        
        // Add unique IDs
        const questionsWithIds = generatedQuestions.map((q, index) => ({
            ...q,
            id: `ai-${Date.now()}-${index}`
        }));

        console.log(`5. Success! Sending ${questionsWithIds.length} questions to frontend.`);
        res.status(200).json(questionsWithIds);

    } catch (error) {
        console.error(">>> BACKEND CRASH ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to generate questions." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
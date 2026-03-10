import { GoogleGenAI } from '@google/genai';

// --- 1. BASE INTERFACE ---
class IQuestionGenerator {
    async generate(params) {
        throw new Error("Method 'generate()' must be implemented.");
    }
}

// --- 2. AI GENERATOR (Gemini Multimodal) ---
class AIQuestionGenerator extends IQuestionGenerator {
    constructor() {
        super();
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async generate({ prompt, count, difficulty, files }) {
        console.log(`--> [AI Generator] Creating ${count} ${difficulty} questions...`);
        
        const promptParts = [];

        if (files && files.length > 0) {
            for (const file of files) {
                if (file.mimetype === 'application/pdf') {
                    console.log(`--> [AI Generator] Attaching PDF: ${file.originalname}`);
                    promptParts.push({
                        inlineData: { data: file.buffer.toString("base64"), mimeType: "application/pdf" }
                    });
                }
            }
        }

        const systemInstruction = `
            You are an expert academic examiner. Generate multiple-choice questions based on the attached document(s) and prompt.
            Return a raw JSON array ONLY. DO NOT wrap it in markdown blockquotes (\`\`\`json).
            ABSOLUTELY NO TRAILING COMMAS in the JSON.
            
            Schema per object:
            {
                "text": "The question statement",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": 0,
                "explanation": "Why this answer is correct.",
                "tags": ["AI-Generated", "${difficulty}"],
                "difficulty": "${difficulty || 'Medium'}",
                "points": 2.0,
                "isAiGenerated": true
            }
        `;

        const userPrompt = `Generate ${count || 5} questions. Instructions: ${prompt || 'Focus on the core concepts.'}`;
        promptParts.push({ text: systemInstruction + "\n\n" + userPrompt });

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: promptParts }],
            config: { responseMimeType: "application/json" }
        });

        // ROBUST JSON PARSING & CLEANUP
        let rawText = response.text;
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // FIX: Regex to remove trailing commas before closing brackets/braces (Solves the crash!)
        rawText = rawText.replace(/,\s*([\]}])/g, '$1'); 

        let generatedQuestions;
        try {
            generatedQuestions = JSON.parse(rawText);
        } catch (e) {
            console.error("\n[CRITICAL ERROR] LLM returned malformed JSON even after cleanup. Raw string below:\n", rawText);
            throw new Error("LLM failed to return proper JSON format.");
        }
        
        return generatedQuestions.map((q, index) => ({ ...q, id: `ai-${Date.now()}-${index}` }));
    }
}

// --- 3. MANUAL GENERATOR (Generates Blank Templates) ---
class ManualQuestionGenerator extends IQuestionGenerator {
    async generate({ count, difficulty }) {
        console.log(`--> [Manual Generator] Creating ${count} blank template cards...`);
        
        const manualCards = [];
        for (let i = 0; i < count; i++) {
            manualCards.push({
                id: `manual-batch-${Date.now()}-${i}`,
                text: "", // Blank for teacher to fill
                options: ["", "", "", ""],
                correct: null,
                explanation: "",
                tags: ["Manual Entry"],
                difficulty: difficulty || "Medium",
                points: 1.0,
                isAiGenerated: false
            });
        }
        
        // Slight simulated delay for UI smoothness
        await new Promise(resolve => setTimeout(resolve, 300)); 
        return manualCards;
    }
}

// --- 4. HYBRID GENERATOR (Combines AI and Manual Blanks) ---
class HybridGenerator extends IQuestionGenerator {
    constructor() {
        super();
        this.aiGenerator = new AIQuestionGenerator();
        this.manualGenerator = new ManualQuestionGenerator();
    }

    async generate(params) {
        console.log("--> [Hybrid Generator] Initializing Split Generation (AI + Manual Blanks)...");
        
        const totalCount = parseInt(params.count) || 5;
        const manualCount = Math.floor(totalCount / 2);
        const aiCount = totalCount - manualCount; 

        // Execute both generators in parallel
        const [manualQuestions, aiQuestions] = await Promise.all([
            this.manualGenerator.generate({ ...params, count: manualCount }),
            this.aiGenerator.generate({ ...params, count: aiCount })
        ]);

        const combined = [...aiQuestions, ...manualQuestions];
        return combined; 
    }
}

// --- 5. THE EXPORTED FACTORY ---
export class QuestionGeneratorFactory {
    static create(type) {
        switch (type?.toUpperCase()) {
            case 'AI':
                return new AIQuestionGenerator();
            case 'MANUAL':
                return new ManualQuestionGenerator();
            case 'HYBRID':
                return new HybridGenerator();
            default:
                console.warn(`[Factory] Unknown source type '${type}'. Defaulting to AI.`);
                return new AIQuestionGenerator();
        }
    }
}
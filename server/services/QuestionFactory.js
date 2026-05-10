import { GoogleGenAI } from '@google/genai';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiGenerationError extends Error {
    constructor(message, { status = 500, code = 'GEMINI_ERROR', retryable = false, details = null } = {}) {
        super(message);
        this.name = 'GeminiGenerationError';
        this.status = status;
        this.code = code;
        this.retryable = retryable;
        this.details = details;
    }
}

function classifyGeminiError(error) {
    const rawMessage = error?.message || String(error);
    const lower = rawMessage.toLowerCase();
    const status = error?.status ?? error?.statusCode ?? error?.response?.status;

    if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate limit')) {
        return new GeminiGenerationError(
            'Gemini is currently rate limited or quota is exhausted. Please wait a minute and try again, or reduce the question count.',
            { status: 429, code: 'GEMINI_RATE_LIMIT', retryable: true, details: rawMessage }
        );
    }

    if (status === 503 || status === 502 || status === 504 || lower.includes('overloaded') || lower.includes('unavailable') || lower.includes('traffic')) {
        return new GeminiGenerationError(
            'Gemini is temporarily busy. Please try again shortly.',
            { status: 503, code: 'GEMINI_BUSY', retryable: true, details: rawMessage }
        );
    }

    if (status === 403 || lower.includes('permission_denied') || lower.includes('api key not valid') || lower.includes('api_key_invalid')) {
        return new GeminiGenerationError(
            'Gemini API key was rejected. Check GEMINI_API_KEY in server/.env and restart the server.',
            { status: 403, code: 'GEMINI_AUTH', retryable: false, details: rawMessage }
        );
    }

    if (lower.includes('safety') || lower.includes('blocked')) {
        return new GeminiGenerationError(
            'Gemini blocked this request. Adjust the prompt or uploaded material and try again.',
            { status: 400, code: 'GEMINI_BLOCKED', retryable: false, details: rawMessage }
        );
    }

    return new GeminiGenerationError(
        'Gemini could not generate questions right now. Please try again.',
        { status: status || 500, code: 'GEMINI_FAILED', retryable: false, details: rawMessage }
    );
}

async function withGeminiRetries(operation, { retries = 2 } = {}) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation(attempt);
        } catch (error) {
            const classified = error instanceof GeminiGenerationError ? error : classifyGeminiError(error);
            lastError = classified;
            if (!classified.retryable || attempt === retries) {
                throw classified;
            }

            const delay = Math.min(8000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 350);
            console.warn(`[Gemini] ${classified.code}; retrying in ${delay}ms (${attempt + 1}/${retries})`);
            await sleep(delay);
        }
    }
    throw lastError;
}

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
        if (!process.env.GEMINI_API_KEY?.trim()) {
            throw new Error(
                'GEMINI_API_KEY is not set. Add it to server/.env (see Google AI Studio) and restart the server.',
            );
        }
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

        const response = await withGeminiRetries(() => this.ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: promptParts }],
            config: { responseMimeType: "application/json" }
        }), {
            retries: Number(process.env.GEMINI_RETRY_COUNT ?? 2),
        });

        // ROBUST JSON PARSING & CLEANUP
        let rawText = response.text || '';
        if (!rawText.trim()) {
            throw new GeminiGenerationError(
                'Gemini returned an empty response. Please try again with a smaller prompt or fewer questions.',
                { status: 502, code: 'GEMINI_EMPTY_RESPONSE', retryable: true }
            );
        }
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // FIX: Regex to remove trailing commas before closing brackets/braces (Solves the crash!)
        rawText = rawText.replace(/,\s*([\]}])/g, '$1'); 

        let generatedQuestions;
        try {
            generatedQuestions = JSON.parse(rawText);
        } catch (e) {
            console.error("\n[CRITICAL ERROR] LLM returned malformed JSON even after cleanup. Raw string below:\n", rawText);
            throw new GeminiGenerationError(
                "Gemini returned malformed JSON. Try again with fewer questions or a clearer prompt.",
                { status: 502, code: 'GEMINI_BAD_JSON', retryable: true, details: e.message }
            );
        }

        if (!Array.isArray(generatedQuestions)) {
            throw new GeminiGenerationError(
                "Gemini response was not a question array. Try again with fewer questions.",
                { status: 502, code: 'GEMINI_BAD_SHAPE', retryable: true }
            );
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
    }

    async generate(params) {
        console.log("--> [Hybrid Generator] Initializing Split Generation (AI + Manual Blanks)...");
        

        const aiCount = Math.max(1, parseInt(params.count, 10) || 5);

        // Execute both generators in parallel
        const [aiQuestions] = await Promise.all([
            this.aiGenerator.generate({ ...params, count: aiCount })
        ]);

        const combined = [...aiQuestions];
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

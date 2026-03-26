// src/api/evaluationApi.js

export const runAutoEvaluation = async (attemptId) => {
    try {
        const response = await fetch('http://localhost:5000/api/evaluate-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId })
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Evaluation failed");
        }
        
        return data;
    } catch (error) {
        console.error("Evaluation API Error:", error);
        throw error;
    }
};
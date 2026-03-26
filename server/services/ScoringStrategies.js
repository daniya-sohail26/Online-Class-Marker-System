// server/services/ScoringStrategies.js

// 1. The Base Strategy Interface
class ScoringStrategy {
    calculate(answers, templateConfig) {
        throw new Error("calculate() must be implemented by subclass");
    }
}

// 2. Standard Scoring (No penalties)
class StandardScoringStrategy extends ScoringStrategy {
    calculate(answers, templateConfig) {
        let totalScore = 0;
        const evaluatedAnswers = answers.map(ans => {
            // Compare selected option with correct option from the questions table
            const isCorrect = ans.selected_option === ans.questions.correct_option;
            
            // Use test_questions marks if available, otherwise fallback to template default
            const marksAvailable = ans.test_questions?.marks || templateConfig.marks_per_question || 1;
            const marksAwarded = isCorrect ? marksAvailable : 0;

            totalScore += marksAwarded;

            return { ...ans, is_correct: isCorrect, marks_awarded: marksAwarded };
        });

        return { totalScore, evaluatedAnswers };
    }
}

// 3. Negative Marking Scoring
class NegativeMarkingStrategy extends ScoringStrategy {
    calculate(answers, templateConfig) {
        let totalScore = 0;
        const penalty = templateConfig.negative_marking_penalty || 0;

        const evaluatedAnswers = answers.map(ans => {
            const isCorrect = ans.selected_option === ans.questions.correct_option;
            const marksAvailable = ans.test_questions?.marks || templateConfig.marks_per_question || 1;
            
            let marksAwarded = 0;

            if (isCorrect) {
                marksAwarded = marksAvailable;
            } else if (ans.selected_option !== null && ans.selected_option !== '') {
                // Apply penalty ONLY if they attempted the question (selected something wrong)
                marksAwarded = -Math.abs(penalty);
            }

            totalScore += marksAwarded;

            return { ...ans, is_correct: isCorrect, marks_awarded: marksAwarded };
        });

        // Optional: Prevent negative total scores (floor at 0)
        totalScore = Math.max(0, totalScore);

        return { totalScore, evaluatedAnswers };
    }
}

export { ScoringStrategy, StandardScoringStrategy, NegativeMarkingStrategy };
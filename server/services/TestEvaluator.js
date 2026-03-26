// server/services/TestEvaluator.js
import { StandardScoringStrategy, NegativeMarkingStrategy } from './ScoringStrategies.js';

class TestEvaluator {
    constructor() {
        this.strategy = null;
    }

    // Set the strategy dynamically based on the DB template
    setStrategyByTemplate(templateConfig) {
        if (templateConfig.negative_marking_enabled) {
            this.strategy = new NegativeMarkingStrategy();
        } else {
            this.strategy = new StandardScoringStrategy();
        }
    }

    // Execute the chosen strategy
    evaluate(answers, templateConfig) {
        if (!this.strategy) {
            throw new Error("Scoring strategy not set!");
        }
        return this.strategy.calculate(answers, templateConfig);
    }
}

export default new TestEvaluator();
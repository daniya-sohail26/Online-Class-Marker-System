/**
 * Test Template Builder Service
 * Implements the Builder Pattern for creating reusable test templates
 * with flexible configuration for scoring, behavior, and structure
 */

// --- 1. TEMPLATE CONFIGURATION INTERFACE ---
class ITemplateConfig {
  validate() {
    throw new Error("Method 'validate()' must be implemented.");
  }

  toJSON() {
    throw new Error("Method 'toJSON()' must be implemented.");
  }
}

// --- 2. SCORING CONFIGURATION ---
class ScoringConfig extends ITemplateConfig {
  constructor() {
    super();
    this.marksPerQuestion = 1;
    this.negativeMarking = 0;
    this.negativeMarkingType = "percentage"; // percentage or fixed
    this.totalMarks = 0;
    this.passingMarks = 0;
  }

  setMarksPerQuestion(marks) {
    if (marks <= 0) throw new Error("Marks per question must be positive");
    this.marksPerQuestion = marks;
    return this;
  }

  setNegativeMarking(value, type = "percentage") {
    if (value < 0) throw new Error("Negative marking cannot be negative");
    if (!["percentage", "fixed"].includes(type)) {
      throw new Error("Invalid negative marking type");
    }
    this.negativeMarking = value;
    this.negativeMarkingType = type;
    return this;
  }

  setTotalMarks(marks) {
    if (marks <= 0) throw new Error("Total marks must be positive");
    this.totalMarks = marks;
    return this;
  }

  setPassingMarks(marks) {
    if (marks < 0) throw new Error("Passing marks cannot be negative");
    this.passingMarks = marks;
    return this;
  }

  validate() {
    if (this.totalMarks <= 0) {
      throw new Error("Total marks must be set");
    }
    if (this.passingMarks > this.totalMarks) {
      throw new Error("Passing marks cannot exceed total marks");
    }
    return true;
  }

  toJSON() {
    return {
      marksPerQuestion: this.marksPerQuestion,
      negativeMarking: this.negativeMarking,
      negativeMarkingType: this.negativeMarkingType,
      totalMarks: this.totalMarks,
      passingMarks: this.passingMarks,
    };
  }
}

// --- 3. BEHAVIOR CONFIGURATION ---
class BehaviorConfig extends ITemplateConfig {
  constructor() {
    super();
    this.shuffleQuestions = true;
    this.shuffleOptions = true;
    this.allowReview = true;
    this.showResultsImmediately = false;
    this.allowPartialMarking = false;
    this.randomizeQuestionOrder = true;
  }

  setShuffleQuestions(value) {
    this.shuffleQuestions = Boolean(value);
    return this;
  }

  setShuffleOptions(value) {
    this.shuffleOptions = Boolean(value);
    return this;
  }

  setAllowReview(value) {
    this.allowReview = Boolean(value);
    return this;
  }

  setShowResultsImmediately(value) {
    this.showResultsImmediately = Boolean(value);
    return this;
  }

  setAllowPartialMarking(value) {
    this.allowPartialMarking = Boolean(value);
    return this;
  }

  setRandomizeQuestionOrder(value) {
    this.randomizeQuestionOrder = Boolean(value);
    return this;
  }

  validate() {
    return true;
  }

  toJSON() {
    return {
      shuffleQuestions: this.shuffleQuestions,
      shuffleOptions: this.shuffleOptions,
      allowReview: this.allowReview,
      showResultsImmediately: this.showResultsImmediately,
      allowPartialMarking: this.allowPartialMarking,
      randomizeQuestionOrder: this.randomizeQuestionOrder,
    };
  }
}

// --- 4. STRUCTURE CONFIGURATION ---
class StructureConfig extends ITemplateConfig {
  constructor() {
    super();
    this.totalQuestions = 0;
    this.duration = 0; // in minutes
    this.timePerQuestion = null; // in seconds, null means no limit
    this.sections = [];
  }

  setTotalQuestions(count) {
    if (count <= 0) throw new Error("Total questions must be positive");
    this.totalQuestions = count;
    return this;
  }

  setDuration(minutes) {
    if (minutes <= 0) throw new Error("Duration must be positive");
    this.duration = minutes;
    return this;
  }

  setTimePerQuestion(seconds) {
    if (seconds && seconds <= 0) {
      throw new Error("Time per question must be positive");
    }
    this.timePerQuestion = seconds;
    return this;
  }

  addSection(section) {
    if (!section.name || !section.questionCount) {
      throw new Error("Section must have name and questionCount");
    }
    this.sections.push({
      id: `section-${Date.now()}-${Math.random()}`,
      name: section.name,
      questionCount: section.questionCount,
      marks: section.marks || this.marksPerQuestion,
      description: section.description || "",
    });
    return this;
  }

  validate() {
    if (this.totalQuestions <= 0) {
      throw new Error("Total questions must be set");
    }
    if (this.duration <= 0) {
      throw new Error("Duration must be set");
    }

    const totalSectionQuestions = this.sections.reduce(
      (sum, s) => sum + s.questionCount,
      0
    );
    if (totalSectionQuestions > 0 && totalSectionQuestions !== this.totalQuestions) {
      throw new Error(
        `Section questions (${totalSectionQuestions}) must match total questions (${this.totalQuestions})`
      );
    }

    return true;
  }

  toJSON() {
    return {
      totalQuestions: this.totalQuestions,
      duration: this.duration,
      timePerQuestion: this.timePerQuestion,
      sections: this.sections,
    };
  }
}

// --- 5. TEST TEMPLATE BUILDER (Main Builder Class) ---
class TestTemplateBuilder {
  constructor() {
    this.id = `template-${Date.now()}`;
    this.name = "";
    this.description = "";
    this.type = ""; // quiz, midterm, final, custom
    this.scoringConfig = new ScoringConfig();
    this.behaviorConfig = new BehaviorConfig();
    this.structureConfig = new StructureConfig();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = true;
  }

  setName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Template name cannot be empty");
    }
    this.name = name.trim();
    return this;
  }

  setDescription(description) {
    this.description = description || "";
    return this;
  }

  setType(type) {
    const validTypes = ["quiz", "midterm", "final", "custom"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid template type. Must be one of: ${validTypes.join(", ")}`);
    }
    this.type = type;
    return this;
  }

  getScoringConfig() {
    return this.scoringConfig;
  }

  getBehaviorConfig() {
    return this.behaviorConfig;
  }

  getStructureConfig() {
    return this.structureConfig;
  }

  setActive(isActive) {
    this.isActive = Boolean(isActive);
    return this;
  }

  validate() {
    if (!this.name) throw new Error("Template name is required");
    if (!this.type) throw new Error("Template type is required");

    this.scoringConfig.validate();
    this.behaviorConfig.validate();
    this.structureConfig.validate();

    return true;
  }

  build() {
    this.validate();
    this.updatedAt = new Date();

    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      scoring: this.scoringConfig.toJSON(),
      behavior: this.behaviorConfig.toJSON(),
      structure: this.structureConfig.toJSON(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return this.build();
  }
}

// --- 6. PRESET TEMPLATES (Factory for Common Templates) ---
class TemplatePresets {
  static createQuizTemplate() {
    const builder = new TestTemplateBuilder();
    builder
      .setName("Quick Quiz")
      .setType("quiz")
      .setDescription("A quick assessment template for classroom quizzes")
      .getScoringConfig()
      .setMarksPerQuestion(1)
      .setNegativeMarking(0)
      .setTotalMarks(10)
      .setPassingMarks(5);

    builder
      .getStructureConfig()
      .setTotalQuestions(10)
      .setDuration(15)
      .setTimePerQuestion(90);

    builder.getBehaviorConfig().setShowResultsImmediately(true);

    return builder;
  }

  static createMidtermTemplate() {
    const builder = new TestTemplateBuilder();
    builder
      .setName("Midterm Exam")
      .setType("midterm")
      .setDescription("Comprehensive midterm examination template")
      .getScoringConfig()
      .setMarksPerQuestion(2)
      .setNegativeMarking(0.5, "percentage")
      .setTotalMarks(50)
      .setPassingMarks(25);

    builder
      .getStructureConfig()
      .setTotalQuestions(25)
      .setDuration(90)
      .addSection({ name: "Section A", questionCount: 10, marks: 2 })
      .addSection({ name: "Section B", questionCount: 15, marks: 2 });

    builder.getBehaviorConfig().setAllowReview(true).setShowResultsImmediately(false);

    return builder;
  }

  static createFinalTemplate() {
    const builder = new TestTemplateBuilder();
    builder
      .setName("Final Exam")
      .setType("final")
      .setDescription("Comprehensive final examination template")
      .getScoringConfig()
      .setMarksPerQuestion(2)
      .setNegativeMarking(1, "fixed")
      .setTotalMarks(100)
      .setPassingMarks(40);

    builder
      .getStructureConfig()
      .setTotalQuestions(50)
      .setDuration(180)
      .addSection({ name: "Part A - Basics", questionCount: 20, marks: 2 })
      .addSection({ name: "Part B - Advanced", questionCount: 20, marks: 2 })
      .addSection({ name: "Part C - Application", questionCount: 10, marks: 2 });

    builder
      .getBehaviorConfig()
      .setShuffleQuestions(true)
      .setShuffleOptions(true)
      .setAllowReview(true)
      .setShowResultsImmediately(false);

    return builder;
  }
}

// --- 7. TEMPLATE MANAGER (CRUD Operations) ---
class TemplateManager {
  constructor() {
    this.templates = new Map();
  }

  createTemplate(builder) {
    if (!(builder instanceof TestTemplateBuilder)) {
      throw new Error("Invalid builder instance");
    }

    const template = builder.build();
    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    return template;
  }

  updateTemplate(templateId, updates) {
    const template = this.getTemplate(templateId);
    const updated = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(templateId, updated);
    return updated;
  }

  deleteTemplate(templateId) {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    this.templates.delete(templateId);
    return true;
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  getTemplatesByType(type) {
    return Array.from(this.templates.values()).filter((t) => t.type === type);
  }

  getActiveTemplates() {
    return Array.from(this.templates.values()).filter((t) => t.isActive);
  }
}

export {
  TestTemplateBuilder,
  ScoringConfig,
  BehaviorConfig,
  StructureConfig,
  TemplatePresets,
  TemplateManager,
};

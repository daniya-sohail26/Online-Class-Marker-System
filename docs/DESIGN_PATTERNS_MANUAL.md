# Design Patterns Manual

This document explains the main design patterns used in the Online Class Marker System codebase, where they are located, and why they are used.

## 1. Factory Pattern

### Where It Is Used

Primary file:

```text
server/services/QuestionFactory.js
```

Used by:

```text
server/index.js
server/services/TestCreationService.js
server/routes/tests.js
src/api/testApi.js
```

### Purpose

The Factory Pattern is used to create different question generator objects without forcing route handlers or UI code to know the exact class names.

The app supports multiple question generation modes:

- AI question generation.
- Manual blank question templates.
- Hybrid generation.

Instead of writing generator selection logic everywhere, the code centralizes it in `QuestionGeneratorFactory.create(type)`.

### Main Classes

In `server/services/QuestionFactory.js`:

- `IQuestionGenerator`
- `AIQuestionGenerator`
- `ManualQuestionGenerator`
- `HybridGenerator`
- `QuestionGeneratorFactory`

### How It Works

The caller sends a source type such as:

```text
AI
MANUAL
HYBRID
```

The factory chooses the correct generator:

```js
const generator = QuestionGeneratorFactory.create(sourceType);
const questions = await generator.generate(params);
```

The route does not need to know whether the selected generator uses Gemini, creates blank cards, or combines multiple generation methods.

### Code Flow

1. Frontend requests question generation.
2. Backend receives `sourceType`.
3. Backend calls `QuestionGeneratorFactory.create(sourceType)`.
4. Factory returns a generator object.
5. The selected object runs its own `generate()` method.
6. Backend returns generated questions to the frontend.

### Benefits

- Keeps question generation logic modular.
- Makes it easy to add new generator types later.
- Avoids repeated `if/else` generator logic in routes.
- Gives all generators the same method shape: `generate(params)`.

### Example Extension

If the system later supports importing questions from CSV, a new class could be added:

```js
class CsvQuestionGenerator extends IQuestionGenerator {
  async generate(params) {
    // parse CSV and return questions
  }
}
```

Then the factory can add:

```js
case 'CSV':
  return new CsvQuestionGenerator();
```

No route handler would need major changes.

## 2. Builder Pattern

### Where It Is Used

Primary file:

```text
server/services/TestTemplateBuilder.js
```

Used by:

```text
server/services/TestCreationService.js
server/routes/tests.js
src/api/templateApi.js
```

### Purpose

The Builder Pattern is used to construct complex test template objects step by step.

Test templates have many configurable parts:

- Name and type.
- Description.
- Scoring rules.
- Negative marking rules.
- Passing marks.
- Duration.
- Total questions.
- Sections.
- Shuffle behavior.
- Result visibility.
- Review permissions.

Building this kind of object directly in one large constructor would be difficult to read and easy to misuse. The builder separates construction into clear methods.

### Main Classes

In `server/services/TestTemplateBuilder.js`:

- `TestTemplateBuilder`
- `ScoringConfig`
- `BehaviorConfig`
- `StructureConfig`
- `TemplatePresets`
- `TemplateManager`

### How It Works

The builder starts with defaults:

```js
const builder = new TestTemplateBuilder();
```

Then configuration is added step by step:

```js
builder.setName("Midterm Exam");
builder.setType("midterm");
builder.getScoringConfig().setMarksPerQuestion(2);
builder.getStructureConfig().setTotalQuestions(25).setDuration(90);
```

Finally, `build()` validates the object and returns the final template.

### Preset Builders

`TemplatePresets` provides ready-made builders for common test types:

- `createQuizTemplate()`
- `createMidtermTemplate()`
- `createFinalTemplate()`

Each preset configures the same builder with different defaults.

### Code Flow

1. A caller asks for a template preset or custom template.
2. `TestCreationService` creates a `TestTemplateBuilder`.
3. The builder receives scoring, behavior, and structure settings.
4. `build()` validates all required values.
5. A complete template object is returned.

### Benefits

- Makes complex template creation readable.
- Keeps validation close to the fields being configured.
- Supports reusable presets.
- Reduces constructor parameter overload.
- Allows method chaining for cleaner setup.

### Important Note

Some live route code persists templates directly to Supabase because the database schema uses snake_case fields. The builder service still documents and implements the intended pattern for building reusable template objects, while route handlers map request fields to database columns.

## 3. Strategy Pattern

### Where It Is Used

Primary files:

```text
server/services/ScoringStrategies.js
server/services/TestEvaluator.js
```

Used by:

```text
server/services/scoreAttemptService.js
server/routes/attemptRoutes.js
supabase/functions/score-attempt/index.ts
```

### Purpose

The Strategy Pattern is used for test scoring.

Different tests can use different marking rules:

- Standard scoring.
- Negative marking.
- Weighted section scoring.

Instead of putting all scoring rules inside one large function, the code defines separate scoring strategies that share a common interface.

### Main Classes and Functions

In `server/services/ScoringStrategies.js`:

- `ScoringStrategy`
- `StandardScoringStrategy`
- `NegativeMarkingStrategy`
- `WeightedSectionScoringStrategy`
- `selectScoringStrategyForAttempt(templateConfig)`
- `createScoringStrategyByName(name)`

In `server/services/TestEvaluator.js`:

- `TestEvaluator`

### How It Works

The evaluator acts as the context object. It stores the currently selected scoring strategy:

```js
TestEvaluator.setStrategyByTemplate(templateConfig);
const result = TestEvaluator.evaluate(answers, templateConfig);
```

The selected strategy is based on template configuration:

- If `has_sections` is true, use `WeightedSectionScoringStrategy`.
- Else if `negative_marking_enabled` is true, use `NegativeMarkingStrategy`.
- Otherwise use `StandardScoringStrategy`.

### Code Flow

1. Student submits an attempt.
2. `scoreAttemptById()` loads the attempt, answers, test, and template.
3. `TestEvaluator.setStrategyByTemplate(templateConfig)` selects the scoring strategy.
4. `TestEvaluator.evaluate()` delegates scoring to the selected strategy.
5. Scores are saved back to `answers` and `attempts`.

### Benefits

- Keeps scoring rules separated.
- Makes adding new scoring methods easier.
- Avoids scattered scoring conditionals in route handlers.
- Allows runtime selection based on template settings.
- Improves testability because each scoring strategy can be tested independently.

### Example Extension

A future partial-credit strategy could be added:

```js
class PartialCreditScoringStrategy extends ScoringStrategy {
  calculate(answers, templateConfig) {
    // custom partial-credit logic
  }
}
```

Then `selectScoringStrategyForAttempt()` could choose it based on a template flag.

## 4. Observer Pattern

### Where It Is Used

Primary file:

```text
server/services/LiveMonitorService.js
```

Used by:

```text
server/index.js
src/components/LiveMonitoring.jsx
server routes that call liveMonitorService.notifyStudentUpdate(...)
```

### Purpose

The Observer Pattern is used for live exam monitoring.

Teachers need to receive real-time updates when students perform exam actions. Instead of forcing teacher dashboards to repeatedly ask the server for every update, the server broadcasts updates to subscribed dashboards using Socket.IO rooms.

### Main Class

In `server/services/LiveMonitorService.js`:

- `LiveMonitorService`

### How It Works

Teacher dashboards subscribe to a course room:

```js
socket.on("subscribe_to_course", (courseId) => {
  socket.join(courseId);
});
```

When a student action happens, the backend notifies all observers in that course room:

```js
this.io.to(courseId).emit("student_update", studentData);
```

### Observer Roles

- Subject/Publisher: `LiveMonitorService`
- Observers/Subscribers: connected teacher dashboard sockets
- Event: `student_update`
- Channel: course-specific Socket.IO room

### Code Flow

1. Teacher opens live monitoring.
2. Frontend connects to Socket.IO.
3. Teacher dashboard subscribes to a course ID.
4. Student performs an exam action.
5. Backend builds an update payload.
6. `LiveMonitorService.notifyStudentUpdate(courseId, payload)` broadcasts to the course room.
7. Teacher dashboard receives the update immediately.

### Benefits

- Enables real-time monitoring.
- Decouples student actions from teacher dashboard UI.
- Supports multiple teacher dashboards watching the same course.
- Avoids excessive polling.

## 5. Singleton-Style Service Instance

### Where It Is Used

Primary files:

```text
server/services/LiveMonitorService.js
server/services/TestEvaluator.js
```

### Purpose

The code exports a single shared instance for services that should keep shared runtime state.

Examples:

```js
const liveMonitorInstance = new LiveMonitorService();
export default liveMonitorInstance;
```

```js
export default new TestEvaluator();
```

### Why It Is Used

`LiveMonitorService` stores the Socket.IO server instance in memory. Exporting one shared service instance lets the server initialize Socket.IO once and lets other modules notify through the same instance.

`TestEvaluator` stores the active scoring strategy. It is exported as one evaluator object used during scoring.

### Benefits

- Central access point for shared service behavior.
- Prevents multiple Socket.IO service instances from being created accidentally.
- Simplifies imports in routes and services.

### Caution

Singleton-style services with mutable state should be used carefully. For request-specific state, prefer local variables. In this codebase, `LiveMonitorService` is a good fit because Socket.IO server state is shared globally. `TestEvaluator` is convenient, but a per-request evaluator instance would be safer if many scoring requests run concurrently.

## 6. Prototype Pattern

### Where It Is Used

Primary file:

```text
server/services/ExamReportPrototype.js
```

Used by:

```text
server/services/attemptReportService.js
src/components/ExamReportView.jsx
src/utils/generateReportPdf.js
```

### Purpose

The Prototype Pattern is used to create a consistent exam report structure for both teacher and student result views.

The app defines one canonical empty report shape, clones it, and then fills it with real attempt data.

### Main Functions

In `server/services/ExamReportPrototype.js`:

- `createEmptyExamReport()`
- `cloneExamReport(base)`
- `buildExamReport(audience, params)`

### How It Works

The empty prototype defines all expected report sections:

- Test details.
- Student details.
- Attempt details.
- Proctoring details.
- Stats.
- Question breakdown.
- IP audit data.

The report builder clones that empty shape:

```js
const report = cloneExamReport(createEmptyExamReport());
```

Then it fills in values from the attempt, test, template, user, answers, and IP audit logs.

### Code Flow

1. Report route requests attempt data.
2. `attemptReportService` loads all required rows from Supabase.
3. `buildExamReport()` clones the empty report prototype.
4. It fills the cloned object with real data.
5. The frontend receives a stable report shape.
6. `ExamReportView` and PDF generation can render the same structure.

### Benefits

- Keeps report output consistent.
- Prevents missing top-level report sections.
- Lets teacher and student reports share the same base structure.
- Makes frontend rendering simpler because the shape is predictable.

## 7. Facade-Like Service Layer

### Where It Is Used

Primary files:

```text
server/services/scoreAttemptService.js
server/services/attemptReportService.js
server/services/IpProctorService.js
src/api/apiClient.js
src/api/*.js
```

### Purpose

Several service files provide a simplified interface over more complex operations. This is similar to the Facade Pattern, even though the code does not label it explicitly.

Examples:

- `scoreAttemptById()` hides the full process of loading attempts, loading answers, selecting a scoring strategy, calculating results, and saving scores.
- `assembleReport()` hides the process of combining attempt data, user data, answer data, proctoring data, and the report prototype.
- Frontend API modules such as `testApi.js`, `courseApi.js`, and `attemptApi.js` hide raw Axios calls from React components.

### Benefits

- Components and routes call simple methods.
- Complex database and business logic stays outside UI components.
- Reusable workflows are easier to maintain.
- API endpoint URLs are centralized in frontend API modules.

### Example

Instead of a route manually doing all scoring steps, it calls:

```js
const result = await scoreAttemptById(supabase, attemptId);
```

That service function handles the workflow internally.

## 8. Adapter/Data Mapper Pattern

### Where It Is Used

Primary files:

```text
server/routes/templates.js
src/api/*.js
src/contexts/AuthContext.jsx
```

### Purpose

The app often needs to convert between different data shapes:

- Database uses snake_case fields, such as `course_id`.
- Frontend often expects camelCase fields, such as `courseId`.
- Supabase Auth uses an auth user object.
- The app uses a custom profile object from `public.users`.

This mapping works like an Adapter or Data Mapper.

### Example

In `server/routes/templates.js`, database fields are mapped to frontend-friendly fields:

```js
courseId: t.course_id,
totalQuestions: t.total_questions,
duration: t.duration_minutes,
passingPercentage: t.passing_percentage
```

In `src/contexts/AuthContext.jsx`, a Supabase Auth session is adapted into an application profile:

```js
setProfile({
  id: userRow.id,
  role: "teacher",
  name: resolvedName,
  email: resolvedEmail
});
```

### Benefits

- Keeps database naming separate from frontend naming.
- Gives components a cleaner data shape.
- Reduces duplicated transformation logic.
- Makes Supabase Auth fit the app's custom role model.

## 9. Repository/Service Module Pattern

### Where It Is Used

Primary frontend files:

```text
src/api/apiClient.js
src/api/courseApi.js
src/api/testApi.js
src/api/templateApi.js
src/api/questionApi.js
src/api/studentApi.js
src/api/attemptApi.js
src/api/labApi.js
```

Primary backend files:

```text
server/services/*.js
server/routes/*.js
```

### Purpose

The frontend API modules act like repositories for server communication. React pages do not need to know exact endpoint strings or Axios configuration.

The backend service modules keep business logic separate from Express route definitions.

### Benefits

- Cleaner React components.
- Cleaner Express routes.
- Better separation between transport logic and business logic.
- Easier future changes if endpoints or persistence logic change.

## 10. Middleware Pattern

### Where It Is Used

Primary file:

```text
server/middleware/auth.js
```

Used by:

```text
server/routes/*.js
```

### Purpose

The Middleware Pattern is used by Express to process requests before route handlers run.

The auth middleware:

1. Reads the Bearer token.
2. Verifies it with Supabase.
3. Loads the matching row from `public.users`.
4. Attaches the app user to `req.user`.
5. Allows or rejects the request.

### Main Functions

- `authenticateToken(req, res, next)`
- `requireRole(...roles)`

### Benefits

- Centralizes authentication.
- Keeps route handlers focused on their main job.
- Makes role checks reusable.
- Prevents repeated token verification logic.

## 11. Pattern Summary Table

| Pattern | Main Location | Main Responsibility |
|---|---|---|
| Factory | `server/services/QuestionFactory.js` | Create the correct question generator based on source type |
| Builder | `server/services/TestTemplateBuilder.js` | Build complex test templates step by step |
| Strategy | `server/services/ScoringStrategies.js`, `TestEvaluator.js` | Select and run scoring algorithms at runtime |
| Observer | `server/services/LiveMonitorService.js` | Broadcast live exam updates to subscribed teacher dashboards |
| Singleton-style Instance | `LiveMonitorService.js`, `TestEvaluator.js` | Share one service instance across modules |
| Prototype | `server/services/ExamReportPrototype.js` | Clone and fill a standard exam report shape |
| Facade-like Service | `scoreAttemptService.js`, `attemptReportService.js`, `src/api/*.js` | Hide complex workflows behind simple functions |
| Adapter/Data Mapper | `server/routes/templates.js`, `AuthContext.jsx` | Convert between database, auth, and frontend data shapes |
| Repository/Service Module | `src/api/*.js`, `server/services/*.js` | Separate data access/business operations from UI/routes |
| Middleware | `server/middleware/auth.js` | Reusable authentication and authorization processing |

## 12. Most Important Patterns for Project Explanation

If you need to explain the project in a presentation or viva, focus on these five:

1. Factory Pattern for question generation.
2. Builder Pattern for test template creation.
3. Strategy Pattern for scoring and negative marking.
4. Observer Pattern for live monitoring.
5. Prototype Pattern for exam reports.

These are the clearest and most intentional pattern implementations in the codebase.

## 13. Suggested Explanation Script

The system uses Factory Pattern to choose the correct question generator, such as AI, manual, or hybrid generation. It uses Builder Pattern to create test templates because templates contain many settings for scoring, behavior, and structure. It uses Strategy Pattern for scoring so standard marking, negative marking, and section-based marking can be selected at runtime. It uses Observer Pattern through Socket.IO so teacher dashboards receive live student activity updates. Finally, it uses Prototype Pattern for exam reports by cloning a standard report object and filling it with attempt data for teacher and student views.

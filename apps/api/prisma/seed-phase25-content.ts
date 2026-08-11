// Phase 25 — first real, non-test-fixture educational content seed.
//
// Scope, deliberately bounded (see docs/phase25-content-production-report.md):
// 6 courses (one module each, from docs/content-library/courses.md's
// approved module breakdown), 37 lessons total (31 instructional/assessment
// + 6 project-brief lessons), 6 quizzes with 5 questions each. This is NOT
// the full ~575-lesson blueprint — it is the first production-quality slice,
// proving the content pipeline end-to-end. Every lesson body was authored
// against docs/content-library/{books,videos,documentation-links,
// resource-verification-report}.md — no fabricated resource appears below.
//
// Idempotency: Course.slug has a real unique constraint (upsert-safe).
// Module and Lesson have NO unique constraint beyond `id` in the current
// schema (only non-unique indexes on [courseId, position] / [moduleId,
// position] — see docs/phase25-content-production-report.md's Database
// Findings section). Safe-to-rerun behavior is therefore implemented at the
// application level: findFirst by (parentId, title) before create, not a
// DB-level upsert. This is a real, disclosed schema gap, not a workaround
// invented to hide it.
//
// Reuses the existing e2e.instructor@phoenix.test fixture as the authoring
// instructor (same convention already established across this project's own
// E2E suite) rather than inventing a new user.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

type QuizQuestionSeed = {
  prompt: string;
  questionType: 'single' | 'multiple' | 'text';
  options?: string[];
  correctAnswer: string[] | string;
};

type LessonSeed = {
  title: string;
  position: number;
  contentType: 'text' | 'quiz';
  body: string;
  durationSeconds: number;
  isPreview?: boolean;
  quiz?: {
    title: string;
    passingScorePercent: number;
    maxAttempts: number;
    questions: QuizQuestionSeed[];
  };
};

type ModuleSeed = {
  title: string;
  position: number;
  description: string;
  lessons: LessonSeed[];
};

type CourseSeed = {
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  priceCents: number;
  modules: ModuleSeed[];
};

// ---------------------------------------------------------------------
// 1. Prompt Engineering: Mastering Large Language Models
// ---------------------------------------------------------------------
const promptEngineering: CourseSeed = {
  slug: 'prompt-engineering-mastering-llms',
  title: 'Prompt Engineering: Mastering Large Language Models',
  description:
    'Treats prompting as an engineering discipline with testable, reproducible outputs, not trial and error. This first production module covers LLM fundamentals and core prompt design patterns; the remaining modules (Few-Shot & Chain-of-Thought, RAG & Tool Calling, Prompt Evaluation) are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'prompt-engineering',
  categoryName: 'Prompt Engineering',
  priceCents: 0,
  modules: [
    {
      title: 'LLM Fundamentals & Prompt Design Patterns',
      position: 1,
      description:
        'How large language models actually generate text, what a reliable prompt looks like, and the first two hands-on projects for the Prompt Engineer path.',
      lessons: [
        {
          title: 'How Large Language Models Actually Generate Text',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Explain, at a working level, how an LLM predicts the next token, and why that explains both its power and its failure modes.

**Prerequisites:** None — this is the entry lesson.

**Instructional content:**
A large language model is trained to do one thing extremely well: given a sequence of tokens, predict the most probable next token. Everything an LLM appears to "do" — answer questions, write code, summarize a document — is that same prediction process applied repeatedly, one token at a time, conditioned on everything written so far (including your prompt).

This single fact explains three things learners consistently get wrong about LLMs:

1. **Why they hallucinate.** The model isn't looking up facts — it's producing the statistically likely continuation of your prompt. If a false statement is a plausible continuation, the model can produce it with the same fluency as a true one.
2. **Why phrasing changes output.** Because generation is conditioned on the literal token sequence you provided, two prompts that mean the same thing to a human can lead the model down different statistical paths.
3. **Why longer, more specific prompts tend to work better.** Every token you add narrows the space of plausible continuations. A vague prompt leaves the model more statistical freedom — which shows up as inconsistency.

**Practical example:** Ask a model "Tell me about Paris" versus "In 3 bullet points, list Paris's population, founding era, and one architectural landmark, citing uncertainty if you're not sure of exact figures." The second prompt constrains the continuation space dramatically — you'll get a more consistent, checkable answer across repeated runs.

**Exercise:** Run the same open-ended prompt ("Tell me about renewable energy") through a chat-based LLM interface three times. Note what changes between runs and what stays the same. This is a direct, observable demonstration of next-token prediction's non-determinism.

**Expected outcome:** You can explain to a non-technical colleague, in plain language, why an LLM sometimes gives a wrong answer confidently, without resorting to "it's just a bug."

**Reading:** OpenAI's own API documentation overview (see Documentation below) frames the model's behavior in exactly these terms — read the "How it works" framing on the docs index before continuing.

**Video resource:** See \`docs/content-library/videos.md\` → Prompt Engineering for the currently-recommended official OpenAI/Anthropic channel content on this topic (specific video selection pending content-roadmap.md Phase C0's live-link pass).

**Documentation links:**
- OpenAI API documentation: https://developers.openai.com/api/docs/overview (live-verified Phase 25 — see docs/content-library/resource-verification-report.md)
- Anthropic API documentation: https://platform.claude.com/docs (live-verified Phase 25)

**Homework:** Write down, in your own words (3-4 sentences), what "next-token prediction" means and one real consequence it has for how you should write prompts. Bring it to the next lesson.`,
        },
        {
          title: 'Anatomy of a Good Prompt',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Write a prompt with a clear role, task, context, and output-format specification.

**Prerequisites:** "How Large Language Models Actually Generate Text" (previous lesson).

**Instructional content:**
A reliable prompt has four parts, and most weak prompts are missing at least one of them:

1. **Role** — who the model should act as ("You are a senior backend engineer reviewing a pull request").
2. **Task** — the specific action to perform, stated as a verb ("identify potential security issues," not "look at this code").
3. **Context** — the information the model actually needs to do the task correctly (the code itself, the language/framework, any constraints).
4. **Output format** — exactly what shape the answer should take (a bulleted list, a JSON object, a specific length).

Vague prompts fail not because the model is incapable, but because they under-specify which of the many plausible continuations you actually want.

**Practical example:**
- Weak: "Review this code."
- Strong: "You are a senior backend engineer. Review the following Python function for security issues only (ignore style). List each issue as a bullet with the line number and a one-sentence fix. If there are no issues, say so explicitly — do not invent one."

Note the strong version also tells the model what to do when there's nothing to report — a common gap that causes models to hallucinate a finding just to have something to say.

**Exercise:** Take the weak prompt "Write me a marketing email" and rewrite it with all four parts (role, task, context, output format) for a specific real scenario of your choosing.

**Expected outcome:** Given any vague prompt, you can identify which of the four parts is missing and fix it.

**Reading:** Review the annotated prompt examples pattern used throughout this lesson — this is the same four-part structure used in every subsequent lesson in this course.

**Documentation links:** OpenAI API documentation (prompting guidance): https://developers.openai.com/api/docs/overview

**Homework:** Write and test 2 original prompts for a task of your choice, each with all four parts. Save both the prompt and the model's output — you'll use these in the Prompt Pattern Library project later in this module.`,
        },
        {
          title: 'Output Formatting & Structured Responses',
          position: 3,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Reliably get structured output (e.g. JSON) from an LLM and validate it before using it in downstream code.

**Prerequisites:** "Anatomy of a Good Prompt."

**Instructional content:**
When an LLM's output feeds into a program (not just a human reader), free-form text is a liability — you need a predictable structure you can parse. Two techniques make this reliable:

1. **Explicit schema in the prompt.** State the exact field names, types, and an example: "Return a JSON object with exactly these fields: \`{"title": string, "priority": "low"|"medium"|"high", "tags": string[]}\`. Return only the JSON, no other text."
2. **Native structured-output / function-calling features**, where the API itself constrains the model to a schema you define, rather than relying on the model to follow instructions in plain text. This is the more reliable approach in production — check the current API's structured-output or tool/function-calling documentation (both OpenAI's and Anthropic's docs cover this, see links below) rather than relying purely on prompt instructions.

**Practical example:** Prompting for a JSON object without a schema often produces valid-looking JSON that's subtly wrong (an extra field, a string where you expected a number). Prompting with an explicit schema and a worked example reduces this dramatically, and using the API's native structured-output mode reduces it further, since the API enforces the shape rather than hoping the model follows an instruction.

**Exercise:** Write a prompt that extracts a person's name, role, and years of experience from an unstructured bio paragraph, returning strictly the 3-field JSON. Run it against 3 different bio paragraphs and check that the output is valid JSON every time.

**Expected outcome:** You can reliably get parseable structured output from an LLM across repeated runs, and you know the difference between "hoping the model follows a format instruction" and "using the API's actual structured-output feature."

**Reading:** OpenAI and Anthropic's own documentation on structured output/function calling — see Documentation links below; this is the authoritative, current source, since the exact feature name and syntax change between API versions.

**Documentation links:**
- https://developers.openai.com/api/docs/overview
- https://platform.claude.com/docs

**Homework:** None — feeds directly into the next lesson's exercises.`,
        },
        {
          title: 'System vs. User Prompts',
          position: 4,
          contentType: 'text',
          durationSeconds: 780,
          body: `**Objective:** Explain the difference between a system prompt and a user prompt, and use each for what it's actually good at.

**Prerequisites:** "Output Formatting & Structured Responses."

**Instructional content:**
Most modern chat-based LLM APIs accept (at minimum) a system message and one or more user messages. The distinction matters:

- **System prompt:** sets standing behavior for the whole conversation — role, tone, constraints, output format rules that should apply to every response. Set once, rarely changed mid-conversation.
- **User prompt:** the specific request for this turn. Changes every message.

A common beginner mistake is putting everything into a single user prompt on every call, re-stating the same role/format instructions every time — this works, but it's wasteful and makes the "standing rules" easy to accidentally omit on one call and not another. Separating standing behavior (system) from the specific ask (user) is both cleaner and more reliable across a multi-call application.

**Practical example:** A customer-support assistant's system prompt might fix the role ("You are a support agent for Product X"), tone ("concise, empathetic, never promise a refund without escalation"), and output constraints ("always end with a clear next step"). Each user message is just the customer's actual question — the standing rules don't need restating every time.

**Exercise:** Take a prompt you wrote in an earlier lesson that mixed standing instructions with a specific request. Split it into a system prompt (standing rules) and a user prompt (the specific ask).

**Expected outcome:** Given any prompt, you can correctly identify which parts belong in a system prompt versus a user prompt, and explain why the separation matters for a multi-turn application specifically (not just a single one-off request).

**Reading:** OpenAI and Anthropic's documentation both define system vs. user roles precisely — terminology and exact API parameter names can differ between providers, so check the current docs rather than assuming they're identical.

**Documentation links:** https://developers.openai.com/api/docs/overview, https://platform.claude.com/docs

**Homework:** Rewrite one of your Lesson 2 prompts as a system+user pair and note what changed.`,
        },
        {
          title: 'Common Prompt Design Patterns',
          position: 5,
          contentType: 'text',
          durationSeconds: 1200,
          body: `**Objective:** Apply three reusable prompt design patterns — Persona, Template, and Constraint-Based — to real tasks.

**Prerequisites:** "System vs. User Prompts."

**Instructional content:**

1. **Persona pattern:** assign the model a specific expert role to bias its output toward that expertise's conventions and vocabulary ("You are a technical writer specializing in API documentation"). Most effective when combined with an explicit task, not used alone.
2. **Template pattern:** give the model a fill-in-the-blank structure to follow exactly, useful when you need consistent output across many similar requests (e.g. a recurring report format).
3. **Constraint-based pattern:** define what the model must NOT do, alongside what it should do — explicit negative constraints ("do not use technical jargon," "do not exceed 100 words," "do not invent statistics — say 'no data available' instead") measurably reduce common failure modes, especially fabrication under uncertainty.

These three patterns compose — a strong production prompt often uses all three together (a persona, filling a template, under explicit constraints).

**Practical example:** "You are a data analyst [persona]. Summarize the following quarterly numbers using exactly this format: Headline (1 sentence) / Key Driver (1 sentence) / Risk (1 sentence) [template]. Do not use the word 'significant' without a number attached. Do not speculate about causes not present in the data [constraints]."

**Exercise:** Design one prompt using all three patterns together for a task relevant to your own work or studies.

**Expected outcome:** You have a personal library of at least 3 reusable prompt patterns you can adapt to new tasks quickly — this is the direct input to this module's beginner project.

**Reading:** Review your own Lesson 2 and Lesson 4 exercises — this lesson explicitly builds on both.

**Homework:** Finalize your prompt library entries (from Lessons 2, 4, and this lesson) — you'll submit them as the Prompt Pattern Library project next.`,
        },
        {
          title: 'Project: Prompt Pattern Library',
          position: 6,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Beginner tier — Prompt Engineer path, per docs/content-library/projects.md).**

**Objective:** Build and test a personal library of 10+ reusable prompt templates across different task types (summarization, extraction, classification, generation).

**Requirements:**
- At least 10 distinct prompt templates, each using the four-part structure from Lesson 2 (role, task, context, output format).
- Each template must be tested against at least 2 different real inputs, with both the input and the model's actual output recorded.
- At least 3 templates must use the structured-output technique from Lesson 3 (parseable JSON output).
- At least 2 templates must apply an explicit constraint-based pattern from Lesson 5 (a stated "do not" rule that measurably changes the output when tested with and without it).

**Expected result:** A written document (your own format) containing all 10+ templates, their test inputs/outputs, and a one-paragraph reflection on which pattern was hardest to get reliable and why.

**Difficulty:** Beginner.

**Skills tested:** prompt structure discipline, output-format reliability, constraint design, systematic testing (not "it worked once so I'm done").

**Suggested implementation steps:**
1. List 10 task types you actually want prompts for (don't invent arbitrary ones — pick real tasks from your own work/study).
2. Draft each using the 4-part structure.
3. Test each against 2 inputs; record exact output.
4. For the 3 structured-output templates, validate the JSON is actually parseable (paste it into a JSON validator, don't eyeball it).
5. For the 2 constraint-based templates, run the SAME prompt once with and once without the constraint, and compare — this is the evidence the constraint did something.

**Evaluation criteria:** reliability across repeated tests (not a single lucky output), correct use of the four-part structure, genuine evidence the constraint-based prompts changed behavior, no fabricated test outputs (submit what the model actually returned, including any imperfect results).`,
        },
        {
          title: 'Project: Evaluation Harness for a Prompted Task',
          position: 7,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Intermediate tier — Prompt Engineer path, per docs/content-library/projects.md).**

**Objective:** Build a systematic evaluation set (inputs + expected properties) for a chosen task and use it to compare 3 different prompt designs objectively.

**Requirements:**
- Choose one task (e.g. sentiment classification, summarization quality, extraction accuracy).
- Build a test set of at least 8 real inputs with a clearly stated expected property for each (not necessarily one "correct" answer — for open-ended tasks, define a checkable property instead, e.g. "summary must be under 50 words and must not introduce a fact absent from the source").
- Design 3 different prompt variants for the same task (e.g. varying the persona, the amount of few-shot example content, or the constraint set).
- Run all 3 variants against all 8+ test inputs and score each output against your stated properties.

**Expected result:** A comparison table (prompt variant × test input × pass/fail against the stated property) and a written conclusion on which variant performed best and why, grounded in the actual recorded results — not a guess.

**Difficulty:** Intermediate.

**Skills tested:** systematic evaluation design (the core discipline this whole module builds toward), avoiding "vibes-based" prompt selection, honest reporting of failures.

**Suggested implementation steps:**
1. Pick a task with a real, checkable success property.
2. Write 8+ test inputs covering both easy and edge cases (don't only test the easy ones — that hides real failure modes).
3. Write 3 prompt variants.
4. Run every variant × input combination, log the actual output.
5. Score against your stated property; total up pass/fail per variant.
6. Write the conclusion from the actual scores, including reporting the variant that performed worst and a hypothesis for why.

**Evaluation criteria:** test-set quality (real edge cases included, not just easy ones), scoring rigor (a stated, checkable property — not "looks good"), honest reporting of the worst-performing variant, not just the best one.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 8,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (LLM Fundamentals & Prompt Design Patterns). Review lessons 1–5 before attempting the final assessment below. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
          quiz: {
            title: 'Module 1 Final Assessment — LLM Fundamentals & Prompt Design Patterns',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt:
                  'An LLM confidently states a false fact in response to a vague question. What is the most accurate explanation, based on how LLMs actually generate text?',
                questionType: 'single',
                options: [
                  'The model has a bug that needs to be reported to the provider',
                  'The false statement was a statistically plausible continuation of the prompt, and the model has no built-in fact-checking step',
                  'The model is deliberately lying to the user',
                  'The model only hallucinates when asked about very obscure topics',
                ],
                correctAnswer: [
                  'The false statement was a statistically plausible continuation of the prompt, and the model has no built-in fact-checking step',
                ],
              },
              {
                prompt: 'Which of the following are among the 4 parts of a well-structured prompt, per this module? (Select all that apply.)',
                questionType: 'multiple',
                options: ['Role', 'Task', 'Output format', 'A guarantee of factual accuracy'],
                correctAnswer: ['Role', 'Task', 'Output format'],
              },
              {
                prompt:
                  'True or False: Using the API\'s native structured-output/function-calling feature is generally more reliable than only instructing the model in plain text to "return JSON."',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['True'],
              },
              {
                prompt:
                  'Scenario: you are building a customer-support chatbot that will handle hundreds of different user questions per day, all following the same tone and escalation rules. Where should the tone and escalation rules go?',
                questionType: 'single',
                options: [
                  'Repeated in full inside every single user message',
                  'In the system prompt, set once for the whole conversation',
                  'They should be hard-coded into the model weights',
                  'They are unnecessary — the model will infer them automatically',
                ],
                correctAnswer: ['In the system prompt, set once for the whole conversation'],
              },
              {
                prompt:
                  'Practical question: you tested a prompt once, got a good result, and want to ship it to production immediately. What does this module\'s content say is the risk of doing that?',
                questionType: 'text',
                correctAnswer:
                  'A single successful run does not demonstrate reliability, since LLM output is not fully deterministic; the prompt should be tested against multiple varied inputs (an evaluation set) before being trusted in production.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// 2. AI Foundations: From Theory to Application
// ---------------------------------------------------------------------
const aiFoundations: CourseSeed = {
  slug: 'ai-foundations-theory-to-application',
  title: 'AI Foundations: From Theory to Application',
  description:
    'What AI actually is (and isn\'t) — search, planning, knowledge representation, intelligent agents — before touching machine learning specifically. This first production module covers the Foundations & History submodule; the remaining 3 modules are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'artificial-intelligence',
  categoryName: 'Artificial Intelligence',
  priceCents: 0,
  modules: [
    {
      title: 'Foundations & History of AI',
      position: 1,
      description: 'A grounded, hype-resistant introduction to what AI systems actually are and how the field got here.',
      lessons: [
        {
          title: 'What Is Artificial Intelligence, Really?',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Define AI precisely enough to distinguish it from both "any software" and "science fiction general intelligence."

**Prerequisites:** Programming Foundations (a general programming background).

**Instructional content:**
"AI" is used loosely enough in marketing that a working definition matters before anything else in this course makes sense. A useful, standard framing: **AI is the study and construction of systems that perform tasks which, when done by humans, are considered to require intelligence** — search, planning, learning from data, language understanding.

This deliberately does NOT require the system to think, understand, or be conscious in any human sense. A chess engine that brute-force-searches millions of positions is AI by this definition, even though it doesn't "understand" chess the way a grandmaster does. This distinction matters because it's the difference between evaluating a system on what it actually does versus what it appears to do.

Two useful sub-distinctions used throughout this course:
- **Narrow AI** (what exists today, exclusively): systems built for a specific class of task.
- **General AI** (a hypothetical, not something any current system achieves): human-level performance across arbitrary tasks.

**Practical example:** A spam filter, a chess engine, and a large language model are all narrow AI systems — each performs a specific class of task well, none has general reasoning across arbitrary domains.

**Exercise:** Take 3 things you've heard described as "AI" recently (in marketing, news, or conversation). For each, identify the specific task it performs and whether that framing changes how impressive/concerning it seems once stated precisely.

**Expected outcome:** You can push back, accurately and specifically, on an overclaimed "AI" marketing statement by naming the actual narrow task being performed.

**Reading:** Artificial Intelligence: A Modern Approach (Russell & Norvig) — the field's standard textbook opens with exactly this definitional question; see docs/content-library/books.md for the citation (NEEDS_VERIFICATION status per docs/content-library/resource-verification-report.md — cited from general knowledge, not yet live-confirmed).

**Homework:** Write a 2-sentence definition of AI in your own words, then test it against the spam-filter/chess-engine/LLM examples above — does your definition correctly include all three?`,
        },
        {
          title: 'A Brief History: From Symbolic AI to Deep Learning',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Explain the shift from symbolic (rule-based) AI to statistical/learning-based AI, and why it happened.

**Prerequisites:** "What Is Artificial Intelligence, Really?"

**Instructional content:**
Early AI (roughly 1950s–1980s) was dominated by **symbolic AI**: systems built on explicit, hand-written rules and logical representations of knowledge (e.g. "if the patient has symptom X and Y, consider diagnosis Z"). These systems were interpretable — you could trace exactly why a conclusion was reached — but brittle: they only handled situations their authors explicitly anticipated.

The shift toward **statistical and learning-based AI** (accelerating through the 1990s–2010s, and dominant today) replaced hand-written rules with systems that learn patterns from data. This traded interpretability for adaptability — a learned system can handle situations never explicitly programmed, at the cost of being harder to fully explain.

This isn't a story of one approach being "solved" and replaced — symbolic techniques (search, planning, logic) remain foundational and are covered later in this course; modern AI systems often combine both (e.g. a learned language model with a symbolic tool-calling layer for precise calculations).

**Practical example:** An early expert system for medical diagnosis needed a human expert to hand-encode every rule. A modern learned model instead trains on many examples of (symptoms → diagnosis) pairs and infers patterns — but can fail unpredictably on inputs unlike anything in its training data, in a way a rule-based system's failure mode (missing rule) doesn't quite match.

**Exercise:** For a task of your choice (e.g. spam detection, fraud detection), sketch how you'd approach it with hand-written rules versus how you'd approach it with a learned model. Note one advantage and one risk of each.

**Expected outcome:** You can explain to a colleague why "just write more rules" stopped being the dominant AI strategy, without dismissing rule-based approaches as obsolete.

**Documentation/reference:** This lesson's framing follows the standard treatment in Artificial Intelligence: A Modern Approach's historical chapters (see Lesson 1's reading).

**Homework:** None — feeds into the next lesson.`,
        },
        {
          title: 'How AI Systems Represent Problems',
          position: 3,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Explain what "state space" and "problem representation" mean, using a concrete search problem.

**Prerequisites:** "A Brief History."

**Instructional content:**
Before an AI system can solve a problem, the problem has to be represented in a form the system can operate on. The classic framing (used throughout the search & planning literature): a problem is a **state space** — a set of possible states, a starting state, one or more goal states, and a set of legal actions that move between states.

This sounds abstract until you apply it: solving a sliding puzzle, planning a delivery route, and playing tic-tac-toe are all, structurally, the same kind of problem — search through a state space for a path from start to goal.

Representation choice matters enormously. A poorly chosen representation can make an easy problem look intractable (too many states to search) or hide information the solver actually needs.

**Practical example:** For a simple 3x3 tic-tac-toe game: the state space is every possible board configuration; the start state is the empty board; a goal state is any board with 3-in-a-row; actions are "place a mark in an empty cell." This is small enough to search exhaustively — chess's state space is vastly larger, which is why chess engines need smarter search strategies than brute force, covered in a later module.

**Exercise:** Pick a simple real-world problem (e.g. planning a 3-stop errand route). Write out: the state (what changes as you make progress), the start state, the goal state, and the legal actions.

**Expected outcome:** Given any new problem, you can identify its state space, start/goal states, and actions as a first step before deciding on a solving strategy.

**Homework:** Apply the same exercise to one problem from your own field of interest (not necessarily technical) — bring it to the next lesson.`,
        },
        {
          title: 'Evaluating AI Capabilities Without the Hype',
          position: 4,
          contentType: 'text',
          durationSeconds: 900,
          body: `**Objective:** Apply a critical, evidence-based framework for evaluating a real AI system's claimed capabilities.

**Prerequisites:** "How AI Systems Represent Problems."

**Instructional content:**
Given how much AI marketing overstates capability, this lesson gives a concrete checklist for evaluating any AI system/product claim:

1. **What specific task does it actually perform?** (Not the marketing description — the literal input/output behavior.)
2. **What's the evidence for the claimed performance?** (A specific benchmark? A vague "state of the art"? No evidence at all?)
3. **What happens on inputs outside its training distribution?** (Does the claim address failure modes, or only the happy path?)
4. **Is a human still required to check the output, and does the product say so?**

This isn't cynicism for its own sake — it's the same rigor applied to any engineering claim, and it's a skill every AI Engineer and Prompt Engineer needs to have about their OWN systems, not just to critique others'.

**Practical example:** A product claims "99% accurate AI-powered resume screening." Applying the checklist: what's the actual task (binary pass/fail classification)? What's the evidence (99% on what test set — is it representative)? What about resumes formatted unusually (a likely out-of-distribution case for many real systems)? Is a human reviewing edge cases?

**Exercise:** Find one real AI product claim (from an ad, a product page, or news coverage) and run it through the 4-question checklist above.

**Expected outcome:** You can evaluate an AI capability claim rigorously rather than accepting or dismissing it based on tone alone — a skill this entire content library holds itself to (see docs/content-library/quality-standards.md's own anti-hallucination discipline, which applies the same logic to this course's own resource citations).

**Homework:** Write up your Exercise findings in 3-4 sentences; bring to the module review.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 5,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (Foundations & History of AI). Review lessons 1–4 before attempting the final assessment below. Passing score: 75%.`,
          quiz: {
            title: 'Module 1 Final Assessment — Foundations & History of AI',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt: 'By the working definition used in this course, which of these counts as "AI"?',
                questionType: 'single',
                options: [
                  'Only systems with human-level general reasoning',
                  'Any system performing a task that, done by a human, would be considered to require intelligence — including narrow, task-specific systems',
                  'Only systems built after the year 2010',
                  'Only systems that use neural networks',
                ],
                correctAnswer: [
                  'Any system performing a task that, done by a human, would be considered to require intelligence — including narrow, task-specific systems',
                ],
              },
              {
                prompt: 'Which of the following are true of symbolic (rule-based) AI systems? (Select all that apply.)',
                questionType: 'multiple',
                options: [
                  'They are generally easier to interpret/trace than learned systems',
                  'They tend to be brittle outside situations their rules anticipated',
                  'They have been completely replaced and are no longer used in any modern AI system',
                  'They rely on hand-written or hand-encoded rules',
                ],
                correctAnswer: [
                  'They are generally easier to interpret/trace than learned systems',
                  'They tend to be brittle outside situations their rules anticipated',
                  'They rely on hand-written or hand-encoded rules',
                ],
              },
              {
                prompt: 'True or False: A well-chosen problem representation can make the difference between a problem being tractable to search or not.',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['True'],
              },
              {
                prompt:
                  'Scenario: a vendor claims their AI tool is "95% accurate." Per this module\'s evaluation framework, what is the single most important follow-up question?',
                questionType: 'single',
                options: [
                  'What color is the product logo?',
                  '95% accurate at what specific task, measured against what evidence/benchmark, and what happens on inputs outside that benchmark?',
                  'How much does the product cost?',
                  'No follow-up is needed — a specific percentage is sufficient evidence on its own',
                ],
                correctAnswer: [
                  '95% accurate at what specific task, measured against what evidence/benchmark, and what happens on inputs outside that benchmark?',
                ],
              },
              {
                prompt: 'Practical question: define, in your own words, what a "state space" is and give one example not used in this module\'s lessons.',
                questionType: 'text',
                correctAnswer:
                  'A state space is the set of all possible configurations (states) a problem could be in, together with a start state, goal state(s), and the legal actions that move between states; any concrete original example demonstrating this structure is acceptable.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// 3. UI/UX Design Foundations
// ---------------------------------------------------------------------
const uiUxFoundations: CourseSeed = {
  slug: 'ui-ux-design-foundations',
  title: 'UI/UX Design Foundations',
  description:
    'Balances craft (visual design fundamentals) with process. This first production module covers Design Fundamentals; the remaining 3 modules (User Research & Wireframing, Prototyping & Accessibility, Design Systems & Usability Testing) are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'ui-ux',
  categoryName: 'UI / UX',
  priceCents: 0,
  modules: [
    {
      title: 'Design Fundamentals',
      position: 1,
      description: 'Color, typography, and layout — the visual vocabulary every later module builds on.',
      lessons: [
        {
          title: 'Color Theory for Interfaces',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Choose and justify a color palette for a real interface using contrast and accessibility as the deciding criteria, not personal taste alone.

**Prerequisites:** None — entry lesson.

**Instructional content:**
Interface color choices should be driven by function first, aesthetics second:

1. **Contrast for readability.** Text against its background must meet a real, checkable contrast ratio — this is a WCAG accessibility requirement (covered in depth in Module 3), not a nice-to-have. A palette that "looks nice" but fails contrast checks is a real defect, not a style choice.
2. **A limited, purposeful palette.** A typical UI needs: one primary (brand/action) color, one or two neutrals (backgrounds, borders, body text), and 2-3 semantic colors (success, warning, error) — that's usually enough. More colors than this tend to dilute meaning rather than add it.
3. **Semantic color is separate from brand/accent color.** A "success" green and an "error" red should be consistent regardless of what the brand's accent color is — mixing them (e.g. using brand purple for both "primary action" and "error") confuses users.

**Practical example:** A common beginner mistake is choosing a light gray-on-white body text combination because it "looks softer" — this frequently fails contrast requirements and is genuinely harder to read, especially for users with low vision. A slightly darker gray usually reads as just as "soft" while being accessible.

**Exercise:** Take an interface you use regularly (any app). Identify its primary color, its neutral palette, and its semantic colors (success/warning/error, if visible). Note whether you can distinguish them at a glance.

**Expected outcome:** Given any color palette, you can identify whether it has a clear primary/neutral/semantic structure, and spot an obvious contrast problem by eye (to be confirmed with a real contrast-checking tool in Module 3).

**Reading:** The Design of Everyday Things (Don Norman) — while not color-specific, its core principle (design should communicate function, not just aesthetics) directly motivates this lesson's framing; see docs/content-library/books.md.

**Homework:** Choose a primary, 2 neutrals, and 3 semantic colors for a hypothetical app of your choosing. Write down why each choice serves a function, not just "I liked it."`,
        },
        {
          title: 'Typography Fundamentals',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Apply a type scale and font pairing that supports readability and clear hierarchy.

**Prerequisites:** "Color Theory for Interfaces."

**Instructional content:**
Typography does two jobs in an interface: it must be **readable** (comfortable at the sizes actually used) and it must establish **hierarchy** (what's most important is visually obvious without the user having to read every word).

Core practical rules:
- **A type scale, not arbitrary sizes.** Pick a small set of sizes (e.g. a consistent ratio like 1.25x between steps) and use only those — arbitrary one-off font sizes make an interface feel inconsistent even if the user can't say exactly why.
- **Line length matters.** Body text set too wide (long line lengths) is measurably harder to read — a common guideline is roughly 50-75 characters per line for body copy.
- **Font pairing:** at most 2 font families in most interfaces (often just one, varied by weight) — a display face for headings if desired, a highly readable face for body text. More than 2 families usually reads as inconsistent rather than intentional.

**Practical example:** A heading set in the same size and weight as body text fails to establish hierarchy — a user scanning the page can't tell what's important. Increasing the heading's size AND weight (not just one) creates a clearer signal.

**Exercise:** Take a body of text (any article) and set it with 3 different line-length constraints (very narrow, roughly 60 characters, very wide). Note which is most comfortable to read for you.

**Expected outcome:** Given an interface with unclear visual hierarchy, you can identify whether the problem is a type-scale issue, a line-length issue, or both.

**Homework:** Define a simple 4-step type scale (e.g. body, subheading, heading, display) for a hypothetical app, with actual pixel or rem values, and justify the ratio you chose.`,
        },
        {
          title: 'Layout, Spacing & Visual Hierarchy',
          position: 3,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Apply consistent spacing and grouping principles to create clear visual hierarchy in a layout.

**Prerequisites:** "Typography Fundamentals."

**Instructional content:**
Two principles do most of the work in layout clarity:

1. **Proximity implies relationship.** Elements that are visually close together are perceived as related; elements far apart are perceived as unrelated — even if that's not what you intended. A form label placed equidistant between two fields creates real ambiguity about which field it labels.
2. **A consistent spacing scale**, like the type scale from the previous lesson — use a small set of spacing values (e.g. 4/8/16/24/32px) rather than arbitrary one-off margins. This is the same discipline as the type scale, applied to space instead of size, and it's what makes a layout feel "designed" rather than ad hoc even to viewers who couldn't articulate why.

**Practical example:** A settings page listing 10 unrelated options with identical spacing between all of them reads as one long undifferentiated list. Grouping related options with smaller spacing within a group and larger spacing between groups (using the same spacing scale, just applied at 2 different scale steps) immediately clarifies structure without adding a single visual divider line.

**Exercise:** Take a form or settings screen you use regularly. Identify whether its fields are visually grouped by relationship, or evenly spaced regardless of relationship. Redesign the grouping (on paper or in a design tool) using the proximity principle.

**Expected outcome:** You can look at any layout and identify whether its spacing is doing the job of communicating structure, or just filling space.

**Homework:** None — this lesson's exercise feeds directly into the Responsive Landing Page project.`,
        },
        {
          title: 'Applying Fundamentals: A Design Critique Exercise',
          position: 4,
          contentType: 'text',
          durationSeconds: 900,
          body: `**Objective:** Critique a real interface using the color, typography, and layout principles from this module, and propose specific, justified fixes.

**Prerequisites:** All 3 prior lessons in this module.

**Instructional content:**
A design critique is not "I don't like this" — it's a specific, justified diagnosis. This lesson combines the module's 3 principles into a single critique framework:

1. **Color:** Is there a clear primary/neutral/semantic structure? Any obvious contrast issues?
2. **Typography:** Is there a consistent type scale? Is hierarchy clear? Are line lengths reasonable?
3. **Layout & Spacing:** Does proximity correctly signal relationships? Is spacing consistent (a scale) or arbitrary?

For every issue identified, a real critique also proposes a specific fix — "the contrast is too low" is a diagnosis; "increase the body text color to at least a 4.5:1 contrast ratio against the background" is an actionable fix.

**Practical example:** A landing page with 5 different font sizes used inconsistently, a primary CTA button the same color as a secondary "learn more" link, and equal spacing between every section — a structured critique would name all 3 issues specifically and propose: consolidate to a 4-step type scale, differentiate primary/secondary actions by color, and apply a 2-tier spacing scale between related vs. unrelated sections.

**Exercise:** Pick any real website or app screen. Write a structured critique covering all 3 categories above, each with a specific, actionable fix — not just "make it better."

**Expected outcome:** You can produce a design critique a real design team would find useful and specific, not vague opinion.

**Homework:** Bring your critique to the Responsive Landing Page project — you'll apply your own fixes to a real build, not just critique someone else's.`,
        },
        {
          title: 'Project: Responsive Landing Page',
          position: 5,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Beginner tier — Frontend Engineer path, per docs/content-library/projects.md).**

**Objective:** Build a fully responsive, accessible marketing landing page applying this module's color, typography, and layout principles.

**Requirements:**
- A primary/neutral/semantic color palette with justified choices (per Lesson 1).
- A defined type scale (at least 4 steps) applied consistently (per Lesson 2).
- Clear visual grouping via proximity and a consistent spacing scale (per Lesson 3).
- The page must be responsive: correctly usable at a mobile width (~375px) and a desktop width (~1280px), not just "doesn't break."
- No placeholder/lorem ipsum copy — write real, specific copy for a real (even if fictional) product or service.

**Expected result:** A live or locally-runnable responsive page (HTML/CSS is sufficient; a framework is optional) plus a short written justification (3-5 sentences) explaining your color and type-scale choices, referencing this module's principles by name.

**Difficulty:** Beginner.

**Skills tested:** applying color/type/layout fundamentals to a real build (not just critiquing someone else's), responsive design basics, writing real copy.

**Suggested implementation steps:**
1. Define your color palette and type scale first, on paper, before touching code.
2. Build the desktop layout first, then adapt for mobile — verify at both widths, don't assume.
3. Run a contrast check on your final color choices (a browser dev-tools contrast checker is sufficient at this stage; full WCAG audit tooling is covered in Module 3).
4. Self-critique your finished page using the Lesson 4 framework before submitting.

**Evaluation criteria:** justified (not arbitrary) color/type choices, consistent spacing scale actually applied (not just described), genuine responsiveness at both target widths, real copy.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 6,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (Design Fundamentals). Review lessons 1–4 before attempting the final assessment below. Passing score: 75%.`,
          quiz: {
            title: 'Module 1 Final Assessment — Design Fundamentals',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt: 'Why should semantic colors (success/warning/error) generally stay consistent regardless of a brand\'s accent color?',
                questionType: 'single',
                options: [
                  'Because semantic colors are legally regulated',
                  'Because mixing brand and semantic color usage confuses users about what a color means in context',
                  'Because it is technically impossible to use brand colors for semantic meaning',
                  'It doesn\'t matter — any consistent-looking palette is fine',
                ],
                correctAnswer: [
                  'Because mixing brand and semantic color usage confuses users about what a color means in context',
                ],
              },
              {
                prompt: 'Which of these are part of a disciplined typography approach per this module? (Select all that apply.)',
                questionType: 'multiple',
                options: [
                  'Using a consistent type scale rather than arbitrary sizes',
                  'Keeping body text line length in a comfortable readable range',
                  'Using as many different font families as possible for variety',
                  'Establishing hierarchy through both size and weight, not size alone',
                ],
                correctAnswer: [
                  'Using a consistent type scale rather than arbitrary sizes',
                  'Keeping body text line length in a comfortable readable range',
                  'Establishing hierarchy through both size and weight, not size alone',
                ],
              },
              {
                prompt: 'True or False: Elements placed close together are generally perceived as related, even if that was not the designer\'s intent.',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['True'],
              },
              {
                prompt:
                  'Scenario: a settings page has 10 options with identical spacing between every single one, some related (e.g. two notification toggles) and some unrelated. What is the most direct fix per this module\'s Layout lesson?',
                questionType: 'single',
                options: [
                  'Add dividing lines between every option',
                  'Apply a 2-tier spacing scale — smaller spacing within related groups, larger spacing between unrelated groups',
                  'Remove half the options',
                  'Change the color of related options',
                ],
                correctAnswer: [
                  'Apply a 2-tier spacing scale — smaller spacing within related groups, larger spacing between unrelated groups',
                ],
              },
              {
                prompt: 'Practical question: what makes a design critique "structured" rather than just an opinion, per this module\'s Lesson 4?',
                questionType: 'text',
                correctAnswer:
                  'A structured critique diagnoses specific issues against named criteria (color/typography/layout principles from the module) and proposes a specific, actionable fix for each issue, rather than a vague preference statement.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// 4. Full-Stack Web Development with Next.js
// ---------------------------------------------------------------------
const webDevelopment: CourseSeed = {
  slug: 'fullstack-web-development-nextjs',
  title: 'Full-Stack Web Development with Next.js',
  description:
    'Mirrors real production patterns rather than toy-app patterns learners have to unlearn later. This first production module covers HTML, CSS & Responsive Layout; the remaining 5 modules are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'web-development',
  categoryName: 'Web Development',
  priceCents: 0,
  modules: [
    {
      title: 'HTML, CSS & Responsive Layout',
      position: 1,
      description: 'Semantic structure and modern CSS layout — the foundation every later module (JavaScript, React, Next.js) builds on.',
      lessons: [
        {
          title: 'Semantic HTML: Structure That Means Something',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Write HTML using elements that describe meaning, not just appearance, and explain why it matters beyond aesthetics.

**Prerequisites:** None — entry lesson of this course.

**Instructional content:**
Semantic HTML means choosing elements based on what content *is*, not how it happens to look. A \`<button>\` and a \`<div>\` styled to look like a button behave very differently: the \`<button>\` is keyboard-focusable, works with screen readers, and triggers form submission correctly by default — the styled \`<div>\` gets none of that for free.

Core semantic elements and what they communicate: \`<nav>\` (navigation), \`<main>\` (the page's primary content, exactly one per page), \`<article>\` (self-contained content), \`<section>\` (a thematic grouping), \`<button>\` vs \`<a>\` (an action vs. a navigation to a new location — a common, meaningful mix-up).

This isn't pedantry — semantic HTML is the foundation accessibility tools (screen readers), search engines, and browser features (like "reader mode") all rely on. Getting it right here means Module 3 (Accessibility, in the UI/UX course) and any future work is building on a correct foundation rather than retrofitting it.

**Practical example:** A clickable "Delete" action implemented as \`<div onclick="...">Delete</div>\` is invisible to keyboard navigation and screen readers by default. The same action as \`<button onclick="...">Delete</button>\` gets correct keyboard/screen-reader behavior with zero extra code, because the browser already knows what a button is supposed to do.

**Exercise:** Take a page you use regularly and open its HTML (browser dev tools → Elements/Inspector). Find one place where a \`<div>\` is being used for something that should arguably be a \`<button>\`, \`<nav>\`, or other semantic element.

**Expected outcome:** Given a page's HTML source, you can identify non-semantic markup and explain specifically what real functionality it's missing as a result.

**Reading:** MDN Web Docs — HTML element reference: https://developer.mozilla.org (live-verified Phase 25; navigate to Web → HTML for the element reference).

**Homework:** Sketch (in HTML, no styling needed yet) the semantic structure of a simple blog post page: header/nav, main article content, and a footer. Use real semantic elements throughout, not divs.`,
        },
        {
          title: 'CSS Box Model & Layout Fundamentals',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Correctly predict how an element's size and spacing are computed under the CSS box model.

**Prerequisites:** "Semantic HTML."

**Instructional content:**
Every element in CSS is a box made of 4 layers, from inside out: **content**, **padding**, **border**, **margin**. A box's total visible footprint is the sum of all 4 — a common source of layout bugs is forgetting that padding and border add to an element's width by default (\`box-sizing: content-box\`, the historical default) unless you explicitly opt into \`box-sizing: border-box\`, which most modern projects set globally because it's more predictable (padding/border are included within the stated width, not added on top).

Also critical: **margin collapsing** — vertical margins between adjacent block elements can combine into a single margin (the larger of the two) rather than adding together, a frequent source of "why is there less space here than I specified" confusion.

**Practical example:** An element with \`width: 200px; padding: 20px; border: 2px solid;\` under \`content-box\` (default) actually renders 244px wide (200 + 20+20 padding + 2+2 border) — a common cause of unexpected layout breakage. Under \`border-box\`, it renders exactly 200px wide, with padding/border eating into the content area instead.

**Exercise:** In a browser's dev tools, inspect any element and find its computed box model diagram (most browsers show this directly in the inspector). Verify the padding/border/margin values match what you'd expect from the CSS.

**Expected outcome:** Given an element's CSS, you can correctly predict its rendered footprint, and you know to set \`box-sizing: border-box\` deliberately rather than being surprised by the default.

**Reading:** MDN Web Docs — "The box model": https://developer.mozilla.org (Web → CSS → box model).

**Homework:** None — feeds into Lesson 3's layout exercises.`,
        },
        {
          title: 'Flexbox and Grid for Real Layouts',
          position: 3,
          contentType: 'text',
          durationSeconds: 1200,
          body: `**Objective:** Choose correctly between Flexbox and Grid for a given layout problem, and implement a real multi-item layout with each.

**Prerequisites:** "CSS Box Model & Layout Fundamentals."

**Instructional content:**
Both are modern CSS layout systems; the practical distinction that matters for choosing between them:

- **Flexbox** is one-dimensional — it excels at laying out items in a single row or column (a navbar's links, a row of buttons, a vertically stacked form).
- **Grid** is two-dimensional — it excels at layouts with both rows and columns that need to align together (a card gallery, a page's overall header/sidebar/content/footer structure).

A common beginner mistake is forcing Grid to do a simple one-directional layout (unnecessary complexity) or forcing Flexbox to do a real 2D grid (fighting the tool, usually via nested flex containers that get fragile). Picking correctly up front avoids both.

**Practical example:** A row of navigation links: Flexbox, 'display: flex; gap: 16px;' — done in 2 lines. A photo gallery that needs to align into rows and columns responsively: Grid, 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;' — handles wrapping and alignment Flexbox would need much more code to replicate correctly.

**Exercise:** Build a simple 3-column card layout (title + description in each card) using Grid, then build a horizontal button toolbar using Flexbox. Compare how much code each took for its respective job.

**Expected outcome:** Given a layout mockup, you can identify whether it's fundamentally 1D or 2D and choose the right tool immediately, rather than trial-and-error.

**Reading:** MDN Web Docs — CSS Flexbox and CSS Grid guides: https://developer.mozilla.org.

**Homework:** None — feeds directly into Lesson 4 (making these layouts responsive).`,
        },
        {
          title: 'Responsive Design & Media Queries',
          position: 4,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Make a layout adapt correctly across mobile, tablet, and desktop widths using media queries and a mobile-first approach.

**Prerequisites:** "Flexbox and Grid for Real Layouts."

**Instructional content:**
**Mobile-first** means writing your base CSS for the smallest/simplest layout, then adding complexity for larger screens via \`min-width\` media queries — not the reverse. This tends to produce simpler CSS overall, since most content naturally simplifies well on mobile, while going the other direction (desktop-first, overriding down) tends to require more overrides.

A media query like \`@media (min-width: 768px) { ... }\` applies its rules only when the viewport is at least 768px wide — the exact breakpoint values should come from where your OWN content actually breaks (test by resizing), not from copying a generic framework's defaults blindly.

**Practical example:** The Lesson 3 card Grid (\`repeat(auto-fill, minmax(200px, 1fr))\`) is actually already responsive without a single media query — it automatically adjusts column count based on available width. Not every responsive problem needs a media query; modern CSS layout functions solve many of them intrinsically. Media queries remain necessary for structural changes (e.g. a sidebar that becomes a bottom nav on mobile) that intrinsic layout can't express alone.

**Exercise:** Take your Lesson 3 card layout and toolbar. Resize the browser window from mobile to desktop width and identify any point where the layout looks broken or cramped — that's your real breakpoint, not a generic 768px guess.

**Expected outcome:** Given a design that needs to work across device sizes, you can identify which parts need genuine structural changes (media queries) versus which parts are already handled by modern intrinsic layout.

**Reading:** MDN Web Docs — "Responsive design" and "Using media queries": https://developer.mozilla.org.

**Homework:** Finalize the responsive behavior of your Lesson 3 layouts — you'll extend this into the Component-Based Dashboard project next.`,
        },
        {
          title: 'Project: Component-Based Dashboard',
          position: 5,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Intermediate tier — Frontend Engineer path, per docs/content-library/projects.md).**

**Objective:** Build a data dashboard with real client-side state and at least 3 reusable components, applying this module's HTML/CSS foundations (a frontend framework such as React is recommended but not required to be introduced until a later module — this project can be done in plain HTML/CSS/JS at this stage, framework version optional).

**Requirements:**
- At least 3 genuinely reusable components (e.g. a stat card, a data table row, a filter control) — "reusable" means used more than once with different data, not copy-pasted with edits.
- A responsive layout using the Flexbox/Grid choices from Lesson 3, correctly mobile-first per Lesson 4.
- Semantic HTML throughout (per Lesson 1) — dashboards are especially prone to div-soup; this project explicitly tests avoiding that.
- Real (even if mocked/static) data — no lorem ipsum, use plausible realistic values for whatever the dashboard is about.

**Expected result:** A working dashboard (locally runnable) plus a short written note (3-5 sentences) identifying which 3+ elements you built as reusable components and why.

**Difficulty:** Intermediate.

**Skills tested:** component thinking (identifying genuine reuse, not just visual repetition), responsive layout applied to a denser, more complex UI than the earlier landing-page project, semantic HTML discipline under complexity.

**Suggested implementation steps:**
1. Sketch the dashboard's content first — what data, how many of each repeating element.
2. Identify your 3+ reusable pieces before writing CSS.
3. Build mobile-first, verify at both mobile and desktop widths as you go, not only at the end.
4. Self-check semantic HTML: open dev tools and confirm no div is standing in for a button/nav/etc.

**Evaluation criteria:** genuine component reuse (not just visually similar one-off blocks), correct responsive behavior at both target widths, semantic markup, real/plausible data.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 6,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (HTML, CSS & Responsive Layout). Review lessons 1–4 before attempting the final assessment below. Passing score: 75%.`,
          quiz: {
            title: 'Module 1 Final Assessment — HTML, CSS & Responsive Layout',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt: 'Why does using a `<button>` instead of a styled `<div>` for a clickable action matter functionally, not just semantically?',
                questionType: 'single',
                options: [
                  'It doesn\'t matter functionally, only for code readability',
                  'A `<button>` gets keyboard focusability and screen-reader behavior by default; a styled `<div>` does not, without extra work',
                  '`<div>` elements cannot be styled to look like buttons',
                  'Browsers render `<button>` elements faster',
                ],
                correctAnswer: [
                  'A `<button>` gets keyboard focusability and screen-reader behavior by default; a styled `<div>` does not, without extra work',
                ],
              },
              {
                prompt: 'Under `box-sizing: border-box`, if an element has `width: 200px; padding: 20px; border: 2px solid;`, what is its rendered width?',
                questionType: 'single',
                options: ['200px', '244px', '220px', '242px'],
                correctAnswer: ['200px'],
              },
              {
                prompt: 'Which layout problems are typically a better fit for CSS Grid than Flexbox? (Select all that apply.)',
                questionType: 'multiple',
                options: [
                  'A photo gallery that needs items aligned in both rows and columns',
                  'A single horizontal row of navigation links',
                  'A page\'s overall header/sidebar/content/footer structure',
                  'A vertical stack of form fields',
                ],
                correctAnswer: [
                  'A photo gallery that needs items aligned in both rows and columns',
                  'A page\'s overall header/sidebar/content/footer structure',
                ],
              },
              {
                prompt: 'True or False: "Mobile-first" means writing the base CSS for the smallest layout and adding complexity for larger screens via `min-width` media queries.',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['True'],
              },
              {
                prompt: 'Practical question: how should you determine a real media-query breakpoint value for a specific layout, per this module?',
                questionType: 'text',
                correctAnswer:
                  'By resizing the actual layout and observing the specific width at which it visually breaks, rather than copying a generic framework default breakpoint blindly.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// 5. Computer Networking Foundations
// ---------------------------------------------------------------------
const networkingFoundations: CourseSeed = {
  slug: 'computer-networking-foundations',
  title: 'Computer Networking Foundations',
  description:
    'Grounds every abstract model in a concrete, observable exercise. This first production module covers OSI/TCP-IP Models & IP Addressing; the remaining 2 modules (Routing/Switching/DNS, HTTP/VPNs/Troubleshooting) are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'networking',
  categoryName: 'Networking',
  priceCents: 0,
  modules: [
    {
      title: 'OSI/TCP-IP Models & IP Addressing',
      position: 1,
      description: 'The layered models every networking concept is described in terms of, plus practical IP addressing.',
      lessons: [
        {
          title: 'Why We Need Networking Models: The OSI & TCP/IP Frameworks',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Explain why networking is described in layers, and map a real network action (loading a webpage) onto the TCP/IP model's 4 layers.

**Prerequisites:** None — entry lesson.

**Instructional content:**
Networking is broken into layers so that each layer can change independently without breaking the others — your browser doesn't need to know whether you're on WiFi or Ethernet, and your WiFi hardware doesn't need to know anything about HTTP. This separation of concerns is the entire reason the model exists, not an academic formality.

Two models are commonly referenced: the 7-layer **OSI model** (a teaching/reference model) and the 4-layer **TCP/IP model** (what's actually implemented in real systems). This course uses TCP/IP's 4 layers as the primary working model, referencing OSI's more granular layers where it adds clarity:

1. **Application layer** (HTTP, DNS — what your browser/apps directly use)
2. **Transport layer** (TCP, UDP — reliable vs. unreliable delivery)
3. **Internet layer** (IP — addressing and routing between networks)
4. **Network access layer** (Ethernet, WiFi — the actual physical/link-level transmission)

**Practical example:** Loading a webpage: your browser makes an HTTP request (**application**), which gets broken into TCP segments (**transport**, ensuring reliable, ordered delivery), each wrapped in an IP packet addressed to the server (**internet**), which is physically transmitted over your WiFi or Ethernet connection (**network access**). Each layer only needs to know how to talk to the layer directly above and below it.

**Exercise:** For a different action (e.g. sending an email), identify what's happening at each of the 4 layers, using the webpage example as a template.

**Expected outcome:** Given any networked action, you can decompose it into what's happening at each of the 4 TCP/IP layers.

**Reading:** Computer Networking: A Top-Down Approach (Kurose & Ross) — this course's overall structure (application layer first, working down) follows this textbook's well-established pedagogical approach; see docs/content-library/books.md.

**Homework:** Write your Lesson 1 exercise (the email example) as a short paragraph, one sentence per layer.`,
        },
        {
          title: 'IP Addressing Fundamentals',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Read and interpret an IPv4 address and its associated subnet mask correctly.

**Prerequisites:** "Why We Need Networking Models."

**Instructional content:**
An IPv4 address (e.g. \`192.168.1.10\`) is a 32-bit number, written as 4 decimal numbers (0-255) separated by dots for human readability. It has two conceptual parts: a **network portion** (which network this device is on) and a **host portion** (which specific device on that network) — where the split happens is determined by the **subnet mask**.

A subnet mask like \`255.255.255.0\` (equivalently written \`/24\`) means the first 24 bits are the network portion and the remaining 8 bits are the host portion — giving 256 possible addresses on that network (254 usable, since the first and last are reserved).

**Private vs. public addresses:** certain ranges (e.g. \`192.168.0.0/16\`, \`10.0.0.0/8\`) are reserved for private networks (your home/office network) and are never routed on the public internet directly — this is why your home router does Network Address Translation (NAT) to let multiple private devices share one public address.

**Practical example:** \`192.168.1.10/24\` and \`192.168.1.20/24\` are on the same network (same first 24 bits: \`192.168.1\`) and can communicate directly. \`192.168.1.10/24\` and \`192.168.2.10/24\` are on DIFFERENT networks (the 3rd octet differs) and need a router to communicate, even though they look superficially similar.

**Exercise:** Check your own device's IP address and subnet mask (most OSes show this in network settings, or via \`ipconfig\`/\`ifconfig\` in a terminal). Identify whether your address is in a private range.

**Expected outcome:** Given two IP addresses and a subnet mask, you can correctly determine whether they're on the same network.

**Reading:** This lesson's framing on addressing scope (private vs. public, network vs. host portion) is standard across networking references, including Kurose & Ross's textbook (Lesson 1's reading).

**Homework:** None — feeds directly into Lesson 3 (subnetting).`,
        },
        {
          title: 'Subnetting: Dividing Networks Correctly',
          position: 3,
          contentType: 'text',
          durationSeconds: 1200,
          body: `**Objective:** Divide a given network address range into smaller subnets that meet a stated host-count requirement.

**Prerequisites:** "IP Addressing Fundamentals."

**Instructional content:**
Subnetting means taking a larger network and dividing it into smaller ones — useful for organizing a network by department, location, or security zone, and for not wasting address space on a network that doesn't need hundreds of host addresses.

The core relationship: each bit you "borrow" from the host portion for the network portion halves the number of hosts per subnet but doubles the number of subnets. A \`/24\` (254 usable hosts) split into 4 subnets becomes four \`/26\`s (62 usable hosts each): you borrowed 2 bits (2^2 = 4 subnets), leaving 6 host bits (2^6 - 2 = 62 usable hosts).

**Practical example:** Given \`192.168.1.0/24\` and a requirement for 4 separate subnets each supporting up to 50 hosts: a \`/26\` gives 62 usable hosts per subnet (enough) and exactly 4 subnets from a \`/24\` — a correct fit. The four subnets are \`192.168.1.0/26\`, \`192.168.1.64/26\`, \`192.168.1.128/26\`, \`192.168.1.192/26\`.

**Exercise:** Given \`10.0.0.0/24\` and a requirement for 8 subnets, determine the correct subnet mask and list the resulting subnet addresses (you do not need every host address, just the subnet boundaries).

**Expected outcome:** Given a network address and a subnet/host-count requirement, you can correctly calculate the subnet mask and resulting subnet ranges — a directly practical, checkable skill (not just conceptual understanding).

**Homework:** Complete the Exercise fully (all 8 subnet addresses) — this is checked in the module's final assessment.`,
        },
        {
          title: 'Tracing a Real Request: DNS, TCP, and HTTP Together',
          position: 4,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Trace, step by step, everything that happens between typing a URL and a webpage rendering — connecting this module's layers to the application-level protocols covered in later modules.

**Prerequisites:** "Subnetting" and Lesson 1's layer model.

**Instructional content:**
This lesson connects the module's addressing/layer content to a concrete, observable end-to-end sequence:

1. **DNS resolution:** your browser needs the server's IP address, and the domain name you typed isn't it — a DNS lookup translates the human-readable name to an IP address (covered in depth in Module 2).
2. **TCP connection (and TLS if HTTPS):** a reliable connection is established with the server at that IP address, on port 443 (HTTPS) or 80 (HTTP) — this is the transport layer from Lesson 1, in action.
3. **HTTP request/response:** your browser sends an HTTP request over that connection; the server responds with the page content — this is the application layer.
4. **Rendering:** the browser parses and displays what it received — outside networking's scope, but the point where the user actually sees the result of everything above.

**Practical example:** Using your browser's Network tab (dev tools), load any webpage and observe: a DNS lookup time, a connection time, and separate request/response entries for the HTML, then for every additional resource (images, CSS, JS) the HTML references — each one repeats a version of this same sequence.

**Exercise:** Open your browser's dev tools Network tab, load a real website, and identify: how many separate requests were made, and roughly how the total load time breaks down between DNS/connection/request-response for the first (HTML) request.

**Expected outcome:** You can explain, from memory and without notes, the full sequence from typing a URL to seeing a rendered page, correctly naming which layer/protocol is responsible for each step.

**Reading:** MDN Web Docs — "How does the Internet work?": https://developer.mozilla.org.

**Homework:** Write up your Exercise findings (request count, approximate timing breakdown) — bring to the module review.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 5,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (OSI/TCP-IP Models & IP Addressing). Review lessons 1–4 before attempting the final assessment below. Passing score: 75%.`,
          quiz: {
            title: 'Module 1 Final Assessment — OSI/TCP-IP Models & IP Addressing',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt: 'What is the primary reason networking is described using layered models?',
                questionType: 'single',
                options: [
                  'It is required by international law',
                  'So each layer can change independently without breaking the others (separation of concerns)',
                  'It makes networking hardware cheaper to manufacture',
                  'It is purely a historical convention with no practical benefit today',
                ],
                correctAnswer: [
                  'So each layer can change independently without breaking the others (separation of concerns)',
                ],
              },
              {
                prompt: 'Two devices have IP addresses 192.168.1.10/24 and 192.168.2.10/24. Are they on the same network?',
                questionType: 'single',
                options: [
                  'Yes, because the first two octets match',
                  'No, because the third octet differs, meaning the network portions differ under a /24 mask',
                  'Yes, all 192.168.x.x addresses are always the same network',
                  'Cannot be determined without more information',
                ],
                correctAnswer: [
                  'No, because the third octet differs, meaning the network portions differ under a /24 mask',
                ],
              },
              {
                prompt: 'Which of the following are true about subnetting? (Select all that apply.)',
                questionType: 'multiple',
                options: [
                  'Borrowing more bits for the network portion increases the number of subnets',
                  'Borrowing more bits for the network portion decreases the number of usable hosts per subnet',
                  'A /26 subnet has more usable host addresses than a /24 subnet',
                  'Splitting a /24 into 4 equal subnets results in four /26 subnets',
                ],
                correctAnswer: [
                  'Borrowing more bits for the network portion increases the number of subnets',
                  'Borrowing more bits for the network portion decreases the number of usable hosts per subnet',
                  'Splitting a /24 into 4 equal subnets results in four /26 subnets',
                ],
              },
              {
                prompt: 'True or False: DNS resolution happens at the TCP/IP model\'s transport layer.',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['False'],
              },
              {
                prompt: 'Practical question: list, in order, the 4 major steps that happen between typing a URL and seeing a rendered page, per this module\'s Lesson 4.',
                questionType: 'text',
                correctAnswer:
                  'DNS resolution (translating the domain name to an IP address); establishing a TCP connection (with TLS if HTTPS); sending the HTTP request and receiving the HTTP response; the browser parsing and rendering the received content.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// 6. DevOps Foundations: CI/CD, Containers & Infrastructure
// ---------------------------------------------------------------------
const devopsFoundations: CourseSeed = {
  slug: 'devops-foundations-cicd-containers',
  title: 'DevOps Foundations: CI/CD, Containers & Infrastructure',
  description:
    'Builds one real pipeline incrementally. This first production module covers CI/CD Fundamentals; the remaining 4 modules (Containers, Kubernetes, IaC, Monitoring/SRE) are scoped in docs/content-library/content-roadmap.md and not yet seeded.',
  categorySlug: 'devops',
  categoryName: 'DevOps',
  priceCents: 0,
  modules: [
    {
      title: 'CI/CD Fundamentals',
      position: 1,
      description: 'What CI/CD actually solves, the anatomy of a real pipeline, and two hands-on projects for the DevOps Engineer path.',
      lessons: [
        {
          title: 'What CI/CD Actually Solves',
          position: 1,
          contentType: 'text',
          durationSeconds: 900,
          isPreview: true,
          body: `**Objective:** Explain the specific problems Continuous Integration and Continuous Delivery/Deployment each solve, and why they're usually discussed together but are actually distinct.

**Prerequisites:** Programming Foundations, basic Git familiarity.

**Instructional content:**
**Continuous Integration (CI)** solves the "integration hell" problem: when multiple people work on the same codebase and only merge/test their work occasionally, merging becomes increasingly painful and bug-prone the longer changes diverge. CI's fix: every change is automatically built and tested against the main codebase frequently (ideally on every push), so integration problems surface immediately, in small pieces, instead of accumulating.

**Continuous Delivery (CD)** solves a different problem: manual, error-prone, infrequent releases. CD's fix: every change that passes CI is automatically packaged into a release-ready state (and, in **Continuous Deployment** — the more aggressive variant — automatically deployed to production without manual approval).

These are genuinely separable: a team can have excellent CI (fast, reliable automated tests on every push) with no CD at all (releases are still manual). Conflating the two obscures which specific problem you're actually trying to fix.

**Practical example:** A team merging weekly, discovering integration conflicts only at merge time, is missing CI. A team with great automated tests but a 2-day manual release checklist is missing CD. These require different fixes — more CI discipline doesn't fix a slow manual release process, and vice versa.

**Exercise:** For a project you've worked on (professional or personal), identify: did it have real CI (automated tests on every push)? Real CD (automated, low-effort releases)? Neither? Which one would have helped more?

**Expected outcome:** Given a team's described pain points, you can identify whether the actual gap is CI, CD, or both — a real, checkable diagnostic skill, not just terminology recall.

**Reading:** The DevOps Handbook (Kim, Humble, Debois, Willis) — frames CI/CD as solving these exact organizational problems, not just a technical checklist; see docs/content-library/books.md.

**Homework:** Write 2-3 sentences describing your Exercise answer; bring to the next lesson.`,
        },
        {
          title: 'Anatomy of a CI Pipeline',
          position: 2,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Identify the standard stages of a CI pipeline and explain the purpose of each.

**Prerequisites:** "What CI/CD Actually Solves."

**Instructional content:**
A typical CI pipeline runs a sequence of stages on every push, each acting as a gate — if an earlier stage fails, later stages don't run, and the change is blocked from merging:

1. **Checkout** — get the exact code being tested.
2. **Install/build** — install dependencies, compile/build the project.
3. **Static checks** — linting, type-checking, formatting checks (fast, cheap, catch a whole class of errors before running anything).
4. **Automated tests** — unit tests, then typically integration tests (ordered fast-to-slow, so a quick failure doesn't wait behind slow tests).
5. **Artifact/report** — the pipeline's output: a build artifact ready for the next stage (CD), and/or a report (coverage, test results) for humans to review.

The ordering (cheap/fast checks first) is a deliberate efficiency choice — there's no reason to run a 10-minute test suite before a 10-second lint check would have already caught an obvious syntax error.

**Practical example:** A pipeline that runs the full test suite before linting wastes CI minutes on every trivial style violation. Reordering so lint/type-check run first (and fail fast) is a genuine, measurable time-and-cost improvement at any real scale, not just theoretical.

**Exercise:** For a real CI configuration you have access to (or a public open-source project's, viewable on its repository), identify each stage and whether the ordering follows the fast-to-slow principle.

**Expected outcome:** Given any CI pipeline configuration, you can identify its stages and evaluate whether the ordering is efficient.

**Documentation links:** GitHub's own documentation on Actions/CI: https://docs.github.com (live-verified Phase 25).

**Homework:** None — feeds directly into Lesson 3 (writing your own).`,
        },
        {
          title: 'Writing Your First Pipeline Configuration',
          position: 3,
          contentType: 'text',
          durationSeconds: 1200,
          body: `**Objective:** Write a real CI pipeline configuration file that lints, builds, and tests a simple project.

**Prerequisites:** "Anatomy of a CI Pipeline."

**Instructional content:**
Most modern CI systems (GitHub Actions, GitLab CI, others) use a declarative YAML configuration defining triggers (when to run), jobs (what to run), and steps within each job. The core structure, regardless of provider, follows the same shape as Lesson 2's stages:

\`\`\`yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
\`\`\`

This example follows Lesson 2's fast-to-slow ordering: lint and type-check (fast, cheap) before tests, before the full build. Real pipelines add caching (to avoid reinstalling dependencies on every run), matrix builds (testing across multiple language/OS versions), and separate jobs that can run in parallel — but this sequential shape is the correct starting point to understand before adding that complexity.

**Practical example:** Splitting the single job above into parallel jobs (lint, type-check, and test each as separate jobs, all triggered on the same push) reduces total pipeline wall-clock time, since independent jobs run concurrently rather than sequentially — a real, measurable optimization once a pipeline gets slow enough to matter.

**Exercise:** Write a CI configuration (in any provider's syntax you're familiar with, or the GitHub Actions example above as a template) for a simple project of your choice, including at minimum: checkout, install, lint, test.

**Expected outcome:** You have a real, syntactically correct CI configuration file you could commit to an actual repository and expect to run.

**Documentation links:** GitHub Actions documentation: https://docs.github.com.

**Homework:** If you have access to a real repository, commit your Exercise pipeline and confirm it actually runs (even if it fails initially — fixing a real failure is valuable practice). If not, keep the file for the module project.`,
        },
        {
          title: 'From CI to CD: Safe Automated Deployment',
          position: 4,
          contentType: 'text',
          durationSeconds: 1080,
          body: `**Objective:** Explain the safety mechanisms that make automated deployment (CD) trustworthy rather than reckless.

**Prerequisites:** "Writing Your First Pipeline Configuration."

**Instructional content:**
Automating deployment is often perceived as riskier than manual deployment — the opposite is usually true, provided a few safety mechanisms are in place:

1. **The same pipeline that passed CI is what gets deployed** — no "it worked on my machine, let me just deploy this different build" gap.
2. **Deployment only happens after CI passes**, never in parallel or before.
3. **A fast, reliable rollback path exists** — if a deployed change causes a real problem, reverting should be as automated and low-risk as deploying was.
4. **Staged rollout** (where applicable) — deploying to a staging environment first, or to a small percentage of production traffic, before a full rollout, catches problems automated tests didn't.

Manual deployment, by contrast, is often MORE risky in practice — it depends on a human correctly remembering every step, every time, under time pressure, with no automatic gate against deploying code that hasn't actually passed tests.

**Practical example:** A manual deployment checklist with 12 steps, run by different team members at different times, is a real source of inconsistency (a step skipped under time pressure, a different build accidentally deployed). An automated pipeline runs the identical 12 steps, in the identical order, every single time, with no variance — this consistency is CD's real safety argument, not just "convenience."

**Exercise:** For the CI pipeline you wrote in Lesson 3, sketch (in comments or a written plan, deployment implementation itself is out of this module's scope) what a CD stage appended to it would need: what triggers it, what "passing" means before it runs, and what a rollback would look like.

**Expected outcome:** You can explain, to a skeptical stakeholder, why automated deployment is generally SAFER than manual deployment, with the specific mechanisms (not just "trust me") that make it so.

**Homework:** Finalize your Lesson 3 pipeline plus your Lesson 4 CD sketch — these feed directly into this module's two projects.`,
        },
        {
          title: 'Project: Containerized App with Basic CI',
          position: 5,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Beginner tier — DevOps Engineer path, per docs/content-library/projects.md).**

**Objective:** Containerize a simple application and set up a CI pipeline that runs tests on every push.

**Requirements:**
- A working \`Dockerfile\` for a simple application of your choice (even a minimal "hello world" API is acceptable — the containerization discipline is what's being tested, not application complexity).
- The container must build successfully and run the application correctly when started.
- A CI pipeline configuration (per Lesson 3's structure) that runs on every push: checkout, install, lint (if applicable to your language), test.
- A brief written note explaining your Dockerfile's key choices (base image, what's copied in, what's excluded).

**Expected result:** A Dockerfile that builds and runs correctly, plus a CI configuration file, plus the written note. If you have access to a real Git hosting provider, actually pushing and confirming the CI pipeline runs is strongly encouraged (not required if no such access exists).

**Difficulty:** Beginner.

**Skills tested:** basic containerization, CI pipeline structure and correct stage ordering (per Lesson 2).

**Suggested implementation steps:**
1. Choose or write a minimal application.
2. Write a Dockerfile; build and run it locally to confirm it actually works before moving on.
3. Write the CI configuration using Lesson 3's structure as a template.
4. Write the explanatory note.

**Evaluation criteria:** the container actually builds and runs (not just "looks right"), CI stages present and correctly ordered, choices explained rather than just copy-pasted from an example without understanding.`,
        },
        {
          title: 'Project: Full CI/CD to a Real Environment',
          position: 6,
          contentType: 'text',
          durationSeconds: 3600,
          body: `**Project brief (Intermediate tier — DevOps Engineer path, per docs/content-library/projects.md).**

**Objective:** Extend the Beginner project's CI pipeline to CD, deploying automatically to a real (staging) environment on merge.

**Requirements:**
- Build on the Beginner project's containerized application and CI pipeline.
- Add a CD stage that triggers ONLY after CI passes (per Lesson 4's safety principle #2).
- Deploy to a real, even if minimal/free-tier, hosting target (this can be a real cloud provider's free tier, or a local environment simulating the same trigger logic if no real target is available — state clearly which you used).
- Document a rollback plan: what would you actually do if this deployment caused a problem? (Written plan is acceptable; doesn't require executing a real incident.)

**Expected result:** A CI/CD configuration file (extending the Beginner project's), a brief deployment log or screenshot showing it actually ran (if a real target was used), and the written rollback plan.

**Difficulty:** Intermediate.

**Skills tested:** CD triggering discipline (deploy only after CI passes — the single most important safety rule from Lesson 4), real environment configuration, rollback planning (not just "we'd figure it out").

**Suggested implementation steps:**
1. Confirm the Beginner project's CI pipeline is solid first — CD triggering off an unreliable CI stage is worse than no CD at all.
2. Choose a real (or clearly-stated simulated) deployment target.
3. Add the CD stage, gated correctly behind CI success.
4. Write the rollback plan referencing Lesson 4's safety mechanisms by name.

**Evaluation criteria:** correct CD triggering (never runs if CI didn't pass), a real or honestly-labeled-as-simulated deployment target, a specific (not vague) rollback plan.`,
        },
        {
          title: 'Module Review & Final Assessment',
          position: 7,
          contentType: 'quiz',
          durationSeconds: 1200,
          body: `This lesson closes Module 1 (CI/CD Fundamentals). Review lessons 1–4 before attempting the final assessment below. Passing score: 75%.`,
          quiz: {
            title: 'Module 1 Final Assessment — CI/CD Fundamentals',
            passingScorePercent: 75,
            maxAttempts: 3,
            questions: [
              {
                prompt: 'What specific problem does Continuous Integration (CI) solve?',
                questionType: 'single',
                options: [
                  'Slow, manual, infrequent releases',
                  'Integration conflicts and bugs accumulating when changes are merged infrequently, by catching problems on every small change instead',
                  'The cost of cloud hosting',
                  'The need for a version control system',
                ],
                correctAnswer: [
                  'Integration conflicts and bugs accumulating when changes are merged infrequently, by catching problems on every small change instead',
                ],
              },
              {
                prompt: 'In a well-ordered CI pipeline, which should typically run first?',
                questionType: 'single',
                options: [
                  'The full integration test suite',
                  'Fast, cheap checks like linting and type-checking',
                  'The production deployment',
                  'Order does not matter for pipeline efficiency',
                ],
                correctAnswer: ['Fast, cheap checks like linting and type-checking'],
              },
              {
                prompt: 'Which of the following are real safety mechanisms that make CD trustworthy, per this module? (Select all that apply.)',
                questionType: 'multiple',
                options: [
                  'The exact build that passed CI is what gets deployed',
                  'Deployment is triggered only after CI passes',
                  'Skipping automated tests to deploy faster',
                  'A fast, reliable rollback path exists',
                ],
                correctAnswer: [
                  'The exact build that passed CI is what gets deployed',
                  'Deployment is triggered only after CI passes',
                  'A fast, reliable rollback path exists',
                ],
              },
              {
                prompt: 'True or False: A team can have strong CI (fast, reliable automated testing on every push) while still having a completely manual, slow release process.',
                questionType: 'single',
                options: ['True', 'False'],
                correctAnswer: ['True'],
              },
              {
                prompt: 'Practical/scenario question: a team\'s manual deployment checklist has 12 steps and is run inconsistently by different people. Per this module, why is automating this generally SAFER, not just more convenient?',
                questionType: 'text',
                correctAnswer:
                  'Automation runs the identical steps in the identical order every single time, removing the human variance (skipped steps under time pressure, inconsistent execution) that manual processes are prone to — consistency is the real safety argument, not just time savings.',
              },
            ],
          },
        },
      ],
    },
  ],
};

const COURSES: CourseSeed[] = [
  promptEngineering,
  aiFoundations,
  uiUxFoundations,
  webDevelopment,
  networkingFoundations,
  devopsFoundations,
];

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      `Phase 25 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.`,
    );
  }

  let coursesCreated = 0;
  let coursesSkipped = 0;
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;

  for (const courseSeed of COURSES) {
    const category = await prisma.category.upsert({
      where: { slug: courseSeed.categorySlug },
      update: {},
      create: {
        slug: courseSeed.categorySlug,
        name: courseSeed.categoryName,
        domain: 'courses',
      },
    });

    const existingCourse = await prisma.course.findUnique({ where: { slug: courseSeed.slug } });
    let course = existingCourse;
    if (!course) {
      course = await prisma.course.create({
        data: {
          instructorId: instructor.id,
          categoryId: category.id,
          title: courseSeed.title,
          slug: courseSeed.slug,
          description: courseSeed.description,
          status: 'published',
          priceCents: courseSeed.priceCents,
          publishedAt: new Date(),
        },
      });
      coursesCreated += 1;
      console.log(`  Created course: ${course.title} (${course.slug})`);
    } else {
      coursesSkipped += 1;
      console.log(`  Course already exists, skipping create: ${course.title} (${course.slug})`);
    }

    for (const moduleSeed of courseSeed.modules) {
      // Idempotency note: Module has no unique constraint beyond `id` in the
      // current schema (see file header) — findFirst-by-(courseId,title) is
      // the safe-rerun strategy used here, not a DB-level upsert.
      let module_ = await prisma.module.findFirst({
        where: { courseId: course.id, title: moduleSeed.title },
      });
      if (!module_) {
        module_ = await prisma.module.create({
          data: {
            courseId: course.id,
            title: moduleSeed.title,
            position: moduleSeed.position,
            description: moduleSeed.description,
          },
        });
        modulesCreated += 1;
        console.log(`    Created module: ${module_.title}`);
      }

      for (const lessonSeed of moduleSeed.lessons) {
        let lesson = await prisma.lesson.findFirst({
          where: { moduleId: module_.id, title: lessonSeed.title },
        });
        if (!lesson) {
          lesson = await prisma.lesson.create({
            data: {
              moduleId: module_.id,
              title: lessonSeed.title,
              position: lessonSeed.position,
              contentType: lessonSeed.contentType,
              body: lessonSeed.body,
              durationSeconds: lessonSeed.durationSeconds,
              isPreview: lessonSeed.isPreview ?? false,
            },
          });
          lessonsCreated += 1;
          console.log(`      Created lesson: ${lesson.title}`);
        }

        if (lessonSeed.quiz) {
          let quiz = await prisma.quiz.findFirst({
            where: { lessonId: lesson.id, title: lessonSeed.quiz.title },
          });
          if (!quiz) {
            quiz = await prisma.quiz.create({
              data: {
                lessonId: lesson.id,
                title: lessonSeed.quiz.title,
                passingScorePercent: lessonSeed.quiz.passingScorePercent,
                maxAttempts: lessonSeed.quiz.maxAttempts,
              },
            });
            quizzesCreated += 1;
            console.log(`        Created quiz: ${quiz.title}`);

            let position = 1;
            for (const q of lessonSeed.quiz.questions) {
              await prisma.quizQuestion.create({
                data: {
                  quizId: quiz.id,
                  prompt: q.prompt,
                  questionType: q.questionType,
                  options: q.options ?? undefined,
                  correctAnswer: q.correctAnswer as unknown as object,
                  position: position++,
                },
              });
              questionsCreated += 1;
            }
          }
        }
      }
    }
  }

  console.log(
    `\nPhase 25 content seed complete: ${coursesCreated} courses created (${coursesSkipped} already existed), ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created.`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 25 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

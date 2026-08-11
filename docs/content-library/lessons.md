# Phoenix Content Library — Lessons

**Status:** Master blueprint, Phase 24. Defines the standard lesson template every one of the ~575 lessons across all 18 flagship courses (`courses.md`) must follow, and fully demonstrates it against two representative modules end-to-end. Authoring every remaining lesson to this same standard is scoped as its own future content-production effort in `content-roadmap.md` — not attempted in full here, since doing ~575 lessons at real quality is a content-production program, not a single planning phase.

## Standard Lesson Template

Every lesson in the library is authored with these exact fields:

- **Lesson title**
- **Lesson objective** — one sentence, learner-facing, starts with a verb ("Explain...", "Build...", "Debug...")
- **Required materials** — what the learner needs open/installed before starting
- **Video** — a real, official/trusted source (see `videos.md`) or an internally-produced video (flagged `[Phoenix Original]`)
- **Reading** — a real source (see `books.md`/`documentation-links.md`) or internally-written lesson text
- **Exercises** — short, in-lesson, auto-checkable where possible
- **Practice** — a slightly larger, open-ended task applying the lesson's concept
- **Homework** — due before the next lesson, feeds into the module project

---

## Worked Example 1 — Course: *Programming Foundations*, Module 1: Programming Basics

### Lesson 1.1 — What a Program Actually Is
- **Objective:** Explain, in your own words, what a program is and what happens when it runs.
- **Required materials:** none — conceptual lesson, no code yet.
- **Video:** [Phoenix Original] "What Is a Program?" (8 min) — internally produced, since this is a platform-specific framing lesson, not something to outsource to an external video.
- **Reading:** [Phoenix Original] lesson text, 600 words, plain-language, no jargon introduced before it's needed.
- **Exercises:** 3 multiple-choice checks (e.g. "which of these is a program?").
- **Practice:** Write, in plain English, the steps to make a cup of tea as if instructing a computer with zero common sense.
- **Homework:** none (first lesson).

### Lesson 1.2 — Variables and Values
- **Objective:** Create variables, assign values, and explain what a variable actually stores.
- **Required materials:** a configured Python or JS environment (setup covered in Lesson 1.0, an environment-setup lesson preceding this one).
- **Video:** [Phoenix Original] "Variables, Step by Step" (12 min), shown in both Python and JavaScript side by side.
- **Reading:** [Phoenix Original] lesson text + linked excerpt from official Python docs (see `documentation-links.md` → Python) on variable naming rules.
- **Exercises:** 5 auto-checked coding exercises (create/reassign/print variables).
- **Practice:** Store your name, age, and favorite number in variables and print a sentence using all three.
- **Homework:** Complete the "Variables Practice Set" (10 short exercises), due before Lesson 1.3.

### Lesson 1.3 — Data Types
- **Objective:** Identify and correctly use the core data types (string, number, boolean) in both languages.
- **Required materials:** same environment as 1.2.
- **Video:** [Phoenix Original] "Data Types in Python & JavaScript" (14 min).
- **Reading:** official docs excerpts (Python `types` reference; MDN "JavaScript data types" — see `documentation-links.md`).
- **Exercises:** 6 auto-checked type-identification + type-conversion exercises.
- **Practice:** Given a small dataset of mixed types, identify each value's type and convert where needed.
- **Homework:** none (feeds directly into Lesson 1.4's exercises).

*(Lessons 1.4–1.10 follow the same template, covering: operators, conditionals, loops, string manipulation, basic input/output, common beginner errors and how to read them, and a module review. Full authoring tracked in `content-roadmap.md` Phase C1.)*

**Module 1 Project (per `projects.md`):** *Temperature Converter & Simple Calculator* — a beginner project combining variables, types, operators, and conditionals from this module, in both languages.

---

## Worked Example 2 — Course: *Prompt Engineering*, Module 1: LLM Fundamentals & Prompt Design Patterns

### Lesson 1.1 — How Large Language Models Actually Generate Text
- **Objective:** Explain, at a working (not mathematical) level, how an LLM predicts the next token and why that explains both its power and its failure modes.
- **Required materials:** none.
- **Video:** official/trusted source — see `videos.md` → Prompt Engineering / LLM Fundamentals for a currently-recommended talk; internally produced fallback: [Phoenix Original] "How LLMs Predict Text" (10 min).
- **Reading:** [Phoenix Original] lesson text; linked to the official OpenAI and Anthropic documentation's own model-overview pages (see `documentation-links.md`).
- **Exercises:** 4 conceptual multiple-choice checks (e.g. "why does an LLM sometimes state a wrong fact confidently?").
- **Practice:** Given 3 real model outputs, identify which failure mode (hallucination, staleness, ambiguity) each one demonstrates.
- **Homework:** none (first lesson).

### Lesson 1.2 — Anatomy of a Good Prompt
- **Objective:** Write a prompt with a clear role, task, context, and output-format specification.
- **Required materials:** access to any chat-based LLM interface (learner's choice, at least one free-tier option listed in course setup).
- **Video:** [Phoenix Original] "The Four Parts of a Reliable Prompt" (11 min).
- **Reading:** [Phoenix Original] lesson text with 6 annotated real-prompt examples (good and bad, side by side).
- **Exercises:** 5 auto-graded "spot the missing part" exercises on sample prompts.
- **Practice:** Rewrite 3 vague prompts (provided) into well-structured ones.
- **Homework:** Write and test 2 original prompts for a task of your choice; submit both the prompt and the output for peer review.

### Lesson 1.3 — Output Formatting & Structured Responses
- **Objective:** Reliably get structured output (e.g. JSON) from an LLM and validate it.
- **Required materials:** same as 1.2, plus a basic code editor for the validation exercise.
- **Video:** [Phoenix Original] "Getting Structured Output You Can Trust" (13 min).
- **Reading:** [Phoenix Original] lesson text + linked official documentation on structured output/function calling (see `documentation-links.md` → OpenAI, Anthropic).
- **Exercises:** 4 auto-checked exercises validating whether sample output matches a given schema.
- **Practice:** Write a prompt that reliably returns a 3-field JSON object across 5 test runs.
- **Homework:** none (feeds into Lesson 1.4).

*(Lessons 1.4–1.8 follow the same template, covering: system vs. user prompts, prompt injection awareness, common design patterns — persona, template, constraint-based — and a module review. Full authoring tracked in `content-roadmap.md` Phase C1.)*

**Module 1 Project (per `projects.md`):** *Prompt Pattern Library* — a beginner project where the learner builds and tests a personal library of 10 reusable prompt templates across different tasks.

---

## Lesson Authoring Status (all 18 courses)

| Course | Total lessons (per `courses.md`) | Fully authored this phase | Status |
|---|---|---|---|
| Programming Foundations | 42 | 3 (worked example above) | Template demonstrated; remaining 39 scoped in `content-roadmap.md` |
| Prompt Engineering | 28 | 3 (worked example above) | Template demonstrated; remaining 25 scoped in `content-roadmap.md` |
| All other 16 flagship courses | ~505 combined | 0 | Module-level breakdown exists in `courses.md`; lesson-level authoring is the next content-production phase, not attempted here |

This is a deliberate scope decision, not an oversight: authoring ~575 individual lessons at real, non-filler quality is a multi-month content-production program on its own. This phase's job was the **architecture and the proof of template** — both are complete. See `content-roadmap.md` for the phased plan to complete lesson-level authoring for every course.

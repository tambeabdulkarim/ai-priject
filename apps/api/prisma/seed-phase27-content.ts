// Phase 27 — Educational Content Production & Platform Population.
//
// Extends already-real Phase 25 courses with additional real modules
// (never touching or duplicating their existing Module 1 content), and
// creates real, standalone Project rows via the Phase 26 architecture
// (Project model directly — NOT the Lesson-workaround Phase 25 used
// before Project existed). Scope, deliberately bounded per this phase's
// own "smaller number of genuinely complete courses over shallow breadth"
// instruction:
//
//   - Prompt Engineering: Mastering LLMs — brought to FULL completion
//     (all 4 modules from docs/content-library/courses.md's approved
//     breakdown). This is the one course this phase declares
//     "production-ready" end-to-end.
//   - UI/UX Design Foundations — Module 2 added (partial progress,
//     explicitly NOT declared complete).
//   - DevOps Foundations — Module 2 added (partial progress, explicitly
//     NOT declared complete).
//   - AI Foundations, Computer Networking, Full-Stack Web Dev — untouched
//     this phase, remain at their Phase 25 state (Module 1 only).
//
// Idempotency: same application-level pattern as seed-phase25-content.ts
// (findFirst by parent+title before create) — Module/Lesson still have no
// unique constraint beyond `id` (docs/phase26-...-report.md's Remaining
// Limitations, unchanged by this phase). Project has no unique constraint
// on title either (only sourceLessonId, which these 2 new projects don't
// use), so new standalone projects use the same findFirst-by-(courseId,
// title) guard.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  courseSlug: string;
  title: string;
  position: number;
  description: string;
  lessons: LessonSeed[];
};

type ProjectSeed = {
  courseSlug: string;
  title: string;
  description: string;
  instructions: string;
  position: number;
};

// ---------------------------------------------------------------------
// Prompt Engineering — Module 2: Few-Shot & Chain-of-Thought Techniques
// ---------------------------------------------------------------------
const promptEngModule2: ModuleSeed = {
  courseSlug: 'prompt-engineering-mastering-llms',
  title: 'Few-Shot & Chain-of-Thought Techniques',
  position: 2,
  description: 'Moves beyond single-shot prompting into example-driven and reasoning-driven techniques that measurably improve output quality on harder tasks.',
  lessons: [
    {
      title: 'Zero-Shot vs. Few-Shot Prompting',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Decide when a task needs few-shot examples and construct an effective few-shot prompt.

**Prerequisites:** Module 1 (LLM Fundamentals & Prompt Design Patterns).

**Instructional content:**
A **zero-shot** prompt asks the model to perform a task with only an instruction, no examples. A **few-shot** prompt adds 2-5 worked examples of the task before the real input, showing the model the exact pattern you want rather than only describing it.

Few-shot helps most when: the desired output format is unusual or hard to describe precisely in words, the task has subtle edge cases better shown than explained, or zero-shot results are inconsistent across similar inputs. It helps least when the task is simple and well-known (basic summarization, translation) — extra examples there mostly waste context and money without improving quality.

**Common mistakes:** using examples that are all similar to each other (the model learns a narrower pattern than intended); using examples with an inconsistent output format (undermines the exact benefit few-shot is supposed to provide); using too many examples for a simple task (unnecessary cost, no quality gain).

**Practical example:** Zero-shot "Classify this support ticket's urgency" often gives inconsistent category boundaries across similar tickets. Few-shot with 3 examples spanning low/medium/high urgency, each labeled with a one-sentence justification, sharply reduces boundary inconsistency because the model now has a concrete reference for where the boundaries actually sit.

**Exercise:** Take a classification task from your own Module 1 prompt library. Add 3 well-chosen few-shot examples and compare consistency across 5 new test inputs, zero-shot vs. few-shot.

**Expected outcome:** You can justify, for a given task, whether few-shot examples are worth their added cost/complexity — not just add them reflexively.

**Reading:** OpenAI API documentation (prompting guidance): https://developers.openai.com/api/docs/overview (live-verified Phase 25).

**Homework:** Save your zero-shot vs. few-shot comparison — it becomes evidence in this module's evaluation-harness thinking (Module 4).`,
    },
    {
      title: 'Choosing and Ordering Few-Shot Examples',
      position: 2,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Select and order few-shot examples to maximize consistency, not just add arbitrary examples.

**Prerequisites:** "Zero-Shot vs. Few-Shot Prompting."

**Instructional content:**
Two properties of a few-shot example set matter more than the raw count:

1. **Coverage of the real input distribution.** Examples should span the range of cases the model will actually see, including the awkward edge cases — not just the 3 easiest, most obvious cases, which is what people default to when writing examples quickly.
2. **Order.** Models can be sensitive to example order — placing the example most similar to the real input closest to it (last, immediately before the real task) is a widely-observed, easy technique that costs nothing to apply.

**Common mistakes:** cherry-picking only "clean" examples and never showing an ambiguous or edge-case one (the model then has no reference for exactly the inputs most likely to be misclassified); keeping the same fixed example order regardless of the actual input, when a similarity-based reordering is nearly free to implement.

**Practical example:** For sentiment classification, an example set of 3 clearly-positive and 3 clearly-negative reviews will handle clear cases well but gives the model nothing to anchor an ambiguous, mixed-sentiment review against — adding one deliberately mixed/ambiguous example, labeled with reasoning for the chosen label, closes that real gap.

**Exercise:** Revisit your Lesson 1 few-shot set. Identify whether it includes at least one genuinely ambiguous/edge-case example. If not, add one and re-test.

**Expected outcome:** You treat few-shot example selection as a deliberate design decision with real failure modes, not an afterthought.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Chain-of-Thought Prompting',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Apply chain-of-thought prompting to improve accuracy on multi-step reasoning tasks.

**Prerequisites:** "Choosing and Ordering Few-Shot Examples."

**Instructional content:**
**Chain-of-thought (CoT)** prompting asks the model to work through intermediate reasoning steps before giving a final answer, rather than jumping straight to the answer. This measurably improves accuracy on tasks that require multiple logical or arithmetic steps, because the model's own intermediate output becomes additional context conditioning the final step — errors are more visible and correctable along the way.

The simplest form is a direct instruction: "Think step by step before answering." A stronger form combines this with few-shot examples that themselves show the reasoning steps, not just the final answer — demonstrating the *pattern* of reasoning you want, not only instructing it abstractly.

**When CoT helps least:** simple factual lookups or single-step tasks, where the extra reasoning text adds cost and latency without improving an already-reliable answer.

**Common mistakes:** using CoT on every task regardless of whether it's genuinely multi-step (wasted cost/latency); asking for reasoning but not actually using it — if your application only reads the final answer and discards the reasoning, you're not getting CoT's core benefit (the reasoning conditioning the answer), you're just adding noise. If reasoning must stay hidden from the end user, request it internally but display only the final answer — never silently skip generating it, since that removes the accuracy benefit.

**Practical example:** "A store had 23 items, sold 8, then received a shipment of 15. How many now?" — a direct-answer prompt is more error-prone than one instructed to show each step (23 - 8 = 15, then 15 + 15 = 30), especially as problems get longer or more multi-step.

**Exercise:** Take a multi-step reasoning task (arithmetic, multi-condition logic, or a multi-step instruction-following task). Compare direct-answer vs. chain-of-thought prompting across 5 test cases; record accuracy for both.

**Expected outcome:** You can identify which of your own tasks are genuinely multi-step (CoT-appropriate) versus single-step (CoT-wasteful), and you understand that CoT's benefit comes from the reasoning actually conditioning the final answer, not from the reasoning text itself.

**Homework:** Keep your accuracy comparison — feeds into Module 4's evaluation-harness project.`,
    },
    {
      title: 'Self-Consistency and Verification Techniques',
      position: 4,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Apply self-consistency (sampling multiple reasoning paths) and basic self-verification to catch errors a single chain-of-thought pass misses.

**Prerequisites:** "Chain-of-Thought Prompting."

**Instructional content:**
Even with chain-of-thought, a single generation can still reach a wrong answer via a single flawed reasoning path. **Self-consistency** runs the same CoT prompt multiple times (at a nonzero sampling temperature, so responses genuinely vary) and takes the most common final answer across runs — this reduces the impact of any one run's reasoning error, at the direct cost of running the same prompt multiple times.

A cheaper, complementary technique: **self-verification**, where a second prompt asks the model to check its own first answer against the original question before finalizing — catching some errors without the full cost of multiple independent samples.

**Common mistakes:** applying self-consistency to a task with only one valid, unambiguous answer already reliably reached (multiplies cost for no real accuracy gain); treating self-verification as infallible — it catches *some* errors, not all, and is itself subject to the same failure modes as the original generation.

**Practical example:** For a genuinely ambiguous classification task where different reasonable readers might disagree, sampling 5 independent CoT runs and taking the majority answer is measurably more stable than trusting a single run — for a simple, unambiguous factual lookup, the same technique adds cost with no measurable benefit.

**Exercise:** Take a task from Lesson 3 where CoT still produced occasional wrong answers. Apply self-consistency (3-5 samples, majority vote) and measure whether accuracy improves.

**Expected outcome:** You can decide, per task, whether the added cost of self-consistency/self-verification is actually justified by the task's real ambiguity/error rate — not applied reflexively to everything.

**Homework:** None — feeds into the module review.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 5,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Few-Shot & Chain-of-Thought Techniques). Review lessons 1–4 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Few-Shot & Chain-of-Thought Techniques',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'When does few-shot prompting help the most, per this module?',
            questionType: 'single',
            options: [
              'Always — more examples are always better regardless of task',
              'When the desired output format or edge cases are hard to describe in words alone',
              'Only for translation tasks',
              'Never — zero-shot is always sufficient for a well-written instruction',
            ],
            correctAnswer: [
              'When the desired output format or edge cases are hard to describe in words alone',
            ],
          },
          {
            prompt: 'Which of the following are real risks of a poorly-chosen few-shot example set? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'All examples being too similar to each other, narrowing the learned pattern',
              'No ambiguous/edge-case example being included',
              'Examples using an inconsistent output format',
              'Using more than one example total',
            ],
            correctAnswer: [
              'All examples being too similar to each other, narrowing the learned pattern',
              'No ambiguous/edge-case example being included',
              'Examples using an inconsistent output format',
            ],
          },
          {
            prompt: 'True or False: Chain-of-thought prompting\'s accuracy benefit comes specifically from the reasoning text conditioning the final answer, not merely from generating more text.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: your application discards the model\'s chain-of-thought reasoning and only reads the final answer field. What does this module say about that setup?',
            questionType: 'single',
            options: [
              'This is fine and has no effect on accuracy',
              'The reasoning should still be generated (even if hidden from the end user) because the accuracy benefit comes from the reasoning conditioning the answer — silently skipping generation removes that benefit',
              'Chain-of-thought should never be used in a real application',
              'This setup automatically triggers self-consistency',
            ],
            correctAnswer: [
              'The reasoning should still be generated (even if hidden from the end user) because the accuracy benefit comes from the reasoning conditioning the answer — silently skipping generation removes that benefit',
            ],
          },
          {
            prompt: 'Practical question: when is self-consistency (multiple sampled reasoning paths, majority vote) NOT worth its added cost, per this module?',
            questionType: 'text',
            correctAnswer:
              'When the task is simple/unambiguous and already reliably answered correctly by a single run — the added cost of multiple samples produces no meaningful accuracy gain in that case.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Prompt Engineering — Module 3: RAG & Tool Calling
// ---------------------------------------------------------------------
const promptEngModule3: ModuleSeed = {
  courseSlug: 'prompt-engineering-mastering-llms',
  title: 'Retrieval-Augmented Generation (RAG) & Tool Calling',
  position: 3,
  description: 'Builds a working RAG pipeline grounded in real documents, and covers function/tool calling — the two techniques that let an LLM go beyond its training data and static text generation.',
  lessons: [
    {
      title: 'What RAG Actually Solves',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Explain the specific problems retrieval-augmented generation solves that prompting alone cannot.

**Prerequisites:** Module 1 (LLM Fundamentals).

**Instructional content:**
An LLM's knowledge is frozen at training time and has no awareness of your private documents, recent events after its cutoff, or facts outside its training data. **Retrieval-Augmented Generation (RAG)** solves this by retrieving relevant real documents at request time and inserting them into the prompt as grounding context, so the model generates an answer *from the retrieved text* rather than from parametric memory alone.

This directly addresses two of Module 1's named LLM failure modes: hallucination (a grounded answer can be checked against its cited source) and knowledge staleness (retrieval can pull from documents updated after the model's training cutoff).

**Common mistakes:** treating RAG as a hallucination cure-all — a model can still misread or misquote a correctly-retrieved document; assuming retrieval quality doesn't matter as long as *some* documents are retrieved (a poor retrieval step guarantees a poor answer regardless of generation quality).

**Practical example:** Asking a general-purpose LLM "What's our refund policy for orders placed after March?" will produce a plausible-sounding but likely wrong answer, since the model has never seen your company's actual policy document. A RAG pipeline that retrieves the real policy document and grounds the answer in it can answer correctly and cite the source — the two things a general model structurally cannot do.

**Exercise:** List 3 real questions in your own context that an LLM alone cannot reliably answer, and identify what real document would need to be retrieved to answer each correctly.

**Expected outcome:** You can explain, precisely, when RAG is the right tool versus when a task doesn't need it (e.g. a task with no external-document dependency gets no benefit from RAG).

**Reading:** OpenAI and Anthropic's own documentation both cover retrieval/grounding patterns: https://developers.openai.com/api/docs/overview, https://platform.claude.com/docs (both live-verified Phase 25).

**Homework:** Bring your 3 questions to Lesson 2 — you'll build real retrieval for them.`,
    },
    {
      title: 'Chunking and Embedding Documents',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Split real documents into retrievable chunks and explain what an embedding is well enough to reason about retrieval quality.

**Prerequisites:** "What RAG Actually Solves."

**Instructional content:**
Before a document can be retrieved by relevance, it must be split into **chunks** (smaller, self-contained pieces — a paragraph, a section) and each chunk converted into an **embedding**, a numeric vector representing its meaning, positioned so that semantically similar text produces nearby vectors. At query time, the query itself is embedded the same way, and the chunks whose embeddings are closest to the query's embedding are retrieved.

**Chunk size is a real design tradeoff**, not an arbitrary setting: chunks too small lose surrounding context (a retrieved sentence fragment without its paragraph's context can be misleading); chunks too large dilute relevance (a whole-document chunk retrieved for a narrow question buries the relevant part in irrelevant text, and costs more context-window budget).

**Common mistakes:** chunking purely by a fixed character count with no regard for natural document boundaries (splits mid-sentence or mid-table, actively damaging retrievability); never testing retrieval quality against real queries before shipping, only checking that the pipeline runs without erroring.

**Practical example:** A 50-page policy document chunked by section (each chunk = one numbered policy section) retrieves cleanly for section-specific questions. The same document chunked into arbitrary 200-character blocks routinely splits a single policy rule across 2-3 chunks, and a query might retrieve only part of the rule — a correct-looking but incomplete answer.

**Exercise:** Take one of your Lesson 1 questions and its real source document. Chunk it by natural section boundaries (not fixed character count) and identify which chunk(s) should be retrieved to answer the question correctly.

**Expected outcome:** You can evaluate whether a given chunking strategy is likely to produce reliable retrieval for a real document, before running any code.

**Homework:** None — feeds directly into Lesson 3.`,
    },
    {
      title: 'Retrieval Strategies and Ranking',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Explain how retrieved chunks are ranked and apply a basic strategy to improve retrieval precision.

**Prerequisites:** "Chunking and Embedding Documents."

**Instructional content:**
The simplest retrieval strategy — top-k nearest-neighbor by embedding similarity — retrieves the k chunks with embeddings closest to the query, and is a reasonable starting point, but has a real limitation: pure semantic similarity can retrieve a chunk that's topically related but doesn't actually answer the question, while missing an exact keyword match phrased differently.

A common, effective improvement is **hybrid retrieval**: combining semantic (embedding) search with traditional keyword search, then merging/re-ranking the results — catching cases either method alone would miss. A further refinement, **re-ranking**, applies a second, more precise (and more expensive) relevance model to just the top candidates from the first pass, improving final ordering without the cost of running the expensive model over the entire document set.

**Common mistakes:** retrieving too few chunks (k too small) and missing the answer entirely; retrieving too many (k too large) and diluting the model's attention across mostly-irrelevant context, which can *reduce* answer quality even when the right chunk is technically present in the context.

**Practical example:** A query "cancellation fee" using pure semantic search might miss a document chunk that literally contains "cancellation fee" but is phrased unusually elsewhere, if a keyword-based pass would have caught it directly — hybrid retrieval catches both cases.

**Exercise:** For your Lesson 2 chunked document, manually identify a query where a pure keyword match and a pure semantic match would retrieve different (but both partially relevant) chunks. Explain why a hybrid approach would outperform either alone for that specific query.

**Expected outcome:** You understand retrieval quality as a real, measurable design surface (chunking + ranking strategy), not a black box the embedding model handles automatically.

**Homework:** None — feeds into Lesson 4.`,
    },
    {
      title: 'Grounding Generation in Retrieved Content',
      position: 4,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Write a generation prompt that reliably grounds its answer in retrieved content and cites sources, rather than blending in ungrounded knowledge.

**Prerequisites:** "Retrieval Strategies and Ranking."

**Instructional content:**
Retrieving the right chunks doesn't automatically guarantee a grounded answer — the generation prompt must explicitly instruct the model to answer *only* from the provided context and to say so clearly when the context doesn't contain an answer, rather than silently falling back to parametric (potentially wrong, ungrounded) knowledge.

A reliable grounded-generation prompt pattern: provide the retrieved chunks clearly labeled/numbered, instruct the model to cite which chunk(s) support each claim, and explicitly instruct it to say "the provided documents don't contain this information" rather than guessing when retrieval comes up empty or irrelevant.

**Common mistakes:** retrieving good context but never instructing the model to actually restrict itself to it (the model may still blend in outside knowledge, defeating the entire purpose of RAG); not testing the "no relevant context found" case at all, so it's undefined behavior in production rather than a designed, graceful outcome.

**Practical example:** Given a retrieved policy chunk that doesn't cover a specific edge case the user asked about, a well-grounded prompt correctly responds "the provided policy documents don't address this specific case" rather than confidently inventing a plausible-sounding but fabricated answer.

**Exercise:** Write a grounded-generation prompt for your running example, and deliberately test it with a query where the correct retrieved chunk does NOT contain the answer — confirm it says so rather than guessing.

**Expected outcome:** Your RAG pipeline correctly and visibly fails closed (admits it doesn't know) rather than failing open (fabricates a plausible answer) when retrieval doesn't have what's needed.

**Homework:** Keep this tested prompt — it's the foundation of this module's RAG Pipeline with Citations project.`,
    },
    {
      title: 'Function/Tool Calling Fundamentals',
      position: 5,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Explain how function/tool calling lets an LLM take real actions or fetch real-time data, and design a basic tool definition.

**Prerequisites:** Module 1's structured-output lesson.

**Instructional content:**
**Function/tool calling** lets you describe a set of functions (name, purpose, parameters) to the model; instead of generating free text, the model can respond with a structured request to call one of those functions with specific arguments, which your application code then actually executes — the model itself never runs code, it only requests a call, and your application decides whether/how to fulfill it.

This solves a different problem than RAG: RAG grounds answers in static retrieved documents; tool calling lets the model trigger real-time actions (checking current inventory, sending a message, performing a calculation) that no amount of retrieval or training data could provide.

**Common mistakes:** giving the model a tool with an ambiguous or under-specified purpose, causing it to call the wrong tool or call a tool when it shouldn't; executing a tool call's arguments without validation, treating model output as inherently safe input (it is not — validate exactly as you would any external, untrusted input).

**Practical example:** A "get_current_weather(location)" tool lets the model answer "what's the weather in Tokyo right now" correctly, something no static training data or document retrieval could ever provide, since it requires a real-time API call at request time.

**Exercise:** Design a tool definition (name, purpose, parameters) for one real action relevant to your own use case. Write out exactly what your application code would need to validate before executing a call to it.

**Expected outcome:** You can distinguish, for a given task, whether it calls for RAG, tool calling, or both — and you treat every tool-call argument as untrusted input requiring validation, not a trusted instruction.

**Documentation links:** OpenAI and Anthropic's own function/tool-calling documentation: https://developers.openai.com/api/docs/overview, https://platform.claude.com/docs.

**Homework:** None — feeds into Lesson 6.`,
    },
    {
      title: 'Combining RAG and Tool Calling in a Single Workflow',
      position: 6,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Design a workflow that combines retrieval and tool calling to answer a question neither technique alone could handle.

**Prerequisites:** "Grounding Generation in Retrieved Content," "Function/Tool Calling Fundamentals."

**Instructional content:**
Real applications frequently need both: retrieval for static/reference knowledge (policies, documentation), and tool calling for real-time or account-specific data (a user's current order status, live inventory). A well-designed workflow lets the model decide, per query, which capability the question actually calls for — a policy question triggers retrieval, an "where's my order" question triggers a tool call to a real order-lookup function, and some questions may need both in sequence.

**Common mistakes:** always running retrieval regardless of whether the query needs it (wasted cost/latency on queries a tool call alone would answer better); giving the model both capabilities with no guidance on when to use which, leading to inconsistent behavior across similar queries.

**Practical example:** "What's your return policy, and what's the status of my order #4521?" genuinely needs both: retrieval for the return-policy text, and a tool call to look up the specific order — a single-technique pipeline (only RAG, or only tool calling) cannot fully answer this question.

**Exercise:** Design (on paper — full implementation is this module's capstone-tier work) a workflow diagram for a query that needs both retrieval and a tool call, showing the decision point where the model chooses which capability to invoke.

**Expected outcome:** You can architect a combined RAG + tool-calling workflow for a real, multi-part question, not just implement each technique in isolation.

**Homework:** Keep your workflow design — it's the direct basis for this module's RAG Pipeline with Citations project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 7,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Retrieval-Augmented Generation & Tool Calling). Review lessons 1–6 before attempting the final assessment. Passing score: 75%.`,
      quiz: {
        title: 'Module 3 Final Assessment — RAG & Tool Calling',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What specific problem does RAG solve that prompting alone cannot?',
            questionType: 'single',
            options: [
              'It makes the model generate faster',
              'It grounds answers in real, retrieved documents outside the model\'s frozen training data',
              'It eliminates the need for prompt design entirely',
              'It replaces the need for an API key',
            ],
            correctAnswer: [
              'It grounds answers in real, retrieved documents outside the model\'s frozen training data',
            ],
          },
          {
            prompt: 'Which of the following are real risks of poor document chunking? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A single logical rule getting split across multiple chunks',
              'Retrieved fragments losing necessary surrounding context',
              'Chunks that are too large diluting relevance',
              'Using more than one chunk per document',
            ],
            correctAnswer: [
              'A single logical rule getting split across multiple chunks',
              'Retrieved fragments losing necessary surrounding context',
              'Chunks that are too large diluting relevance',
            ],
          },
          {
            prompt: 'True or False: A well-grounded RAG prompt should explicitly instruct the model to say when the retrieved context does not contain an answer, rather than falling back to ungrounded knowledge.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: your application receives a tool-call request from the model with a set of arguments. What must your application code do before executing it?',
            questionType: 'single',
            options: [
              'Execute immediately — the model\'s output is inherently safe',
              'Validate the arguments exactly as it would validate any other untrusted external input',
              'Nothing — tool calls cannot contain invalid data',
              'Ask the user to manually approve every single tool call, with no other validation',
            ],
            correctAnswer: [
              'Validate the arguments exactly as it would validate any other untrusted external input',
            ],
          },
          {
            prompt: 'Practical question: give a real example of a single query that would require BOTH retrieval and tool calling to answer fully, and explain why one technique alone would be insufficient.',
            questionType: 'text',
            correctAnswer:
              'A question combining a static-knowledge component (e.g. a policy) and a real-time/account-specific component (e.g. an order status) — retrieval alone cannot supply the real-time data, and tool calling alone cannot supply the static reference text.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Prompt Engineering — Module 4: Prompt Evaluation & Responsible Use
// ---------------------------------------------------------------------
const promptEngModule4: ModuleSeed = {
  courseSlug: 'prompt-engineering-mastering-llms',
  title: 'Prompt Evaluation & Responsible Use',
  position: 4,
  description: 'Closes the course by treating prompt quality as something to be measured systematically, and by being explicit and honest about what LLMs cannot reliably do.',
  lessons: [
    {
      title: 'Why Systematic Evaluation Beats Vibes-Based Testing',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Explain why a single successful test run does not demonstrate a prompt is production-ready.

**Prerequisites:** the whole course to this point — this lesson is explicitly a synthesis lesson.

**Instructional content:**
Throughout this course, "test it once and it looked good" has been called out repeatedly as insufficient (Module 1's structured-output lesson, Module 3's grounded-generation lesson). This lesson makes that principle explicit and central: LLM output is not fully deterministic, and a prompt's real reliability can only be assessed across a representative range of inputs, including deliberately awkward edge cases — not a single lucky run.

**Vibes-based testing** — trying a prompt a few times, judging it "good," and shipping — systematically misses: rare-but-real failure inputs, gradual quality drift if the underlying model is ever updated, and disagreement between different reviewers about what "good" even means for ambiguous tasks.

**Common mistakes:** testing only the easy, obvious cases and never the deliberately hard ones; treating "it worked when I tried it" as equivalent to "it's reliable in production," which conflates a single anecdote with a real reliability claim.

**Practical example:** A support-ticket classifier that correctly handles 10 obvious test tickets can still fail badly on a genuinely ambiguous or adversarially-phrased ticket that never appeared in casual testing — only a deliberately broad, edge-case-inclusive test set surfaces that risk before a real user does.

**Exercise:** Pick one prompt from earlier in this course that you only ever tested casually. List 3 genuinely hard/edge-case inputs you have not yet tried against it.

**Expected outcome:** You treat "I tried it and it worked" as the *start* of evaluation, not the end of it.

**Homework:** Bring your 3 hard inputs to Lesson 2 — they become part of your real evaluation test set.`,
    },
    {
      title: 'Building an Evaluation Test Set',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Build a real evaluation test set with checkable success properties, not just "correct answers."

**Prerequisites:** "Why Systematic Evaluation Beats Vibes-Based Testing."

**Instructional content:**
For tasks with one clearly correct answer (classification, extraction), a test set is a list of (input, correct output) pairs. For open-ended tasks (summarization, generation) where there's no single "correct" answer, define a **checkable property** instead — a rule you can objectively verify against any output, such as "summary must be under 50 words," "must not introduce a fact absent from the source," or "must cite at least one retrieved chunk."

A real test set must include: the easy/common cases (confirms basic correctness), edge cases (confirms robustness), and — critically — at least one case designed to fail if the prompt is wrong, not just cases the prompt already handles comfortably.

**Common mistakes:** building a test set entirely from cases you already know the prompt handles well (this only ever confirms what you already believed, it can never surface a real problem); defining a "correct output" for an inherently open-ended task instead of a checkable property, which makes automated scoring impossible.

**Practical example:** For a RAG grounded-generation prompt (Module 3), a real test set includes: a question the retrieved context clearly answers (expect a grounded, cited answer), a question the retrieved context does NOT answer (expect an explicit "not found" response, not a fabricated one), and a question with partially-relevant but incomplete context (expect an honest "partial answer" rather than filling the gap with invented detail).

**Exercise:** Build an 8+ item evaluation test set for one prompt from this course, explicitly including your Lesson 1 hard cases and at least one "should fail gracefully" case.

**Expected outcome:** A real, reusable evaluation test set — the direct input to this module's Evaluation Harness project (already begun in Module 1 at the path level; this lesson deepens it with genuine edge-case coverage).

**Homework:** Keep this test set for Lesson 3.`,
    },
    {
      title: 'Automating Prompt Evaluation',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Automate scoring of a test set so evaluation can be re-run cheaply whenever a prompt changes.

**Prerequisites:** "Building an Evaluation Test Set."

**Instructional content:**
A test set only pays off if it's cheap to re-run — manually re-checking 8+ outputs by hand every time a prompt is tweaked doesn't scale and tends to get skipped under time pressure. Automating scoring against your test set's checkable properties (Lesson 2) — string/format checks, length checks, presence/absence of required citations — turns evaluation into something that runs in seconds, every time, with no excuse to skip it.

For properties too subjective for a simple string check (e.g. "is this summary actually accurate"), a common technique is using a second LLM call as an automated judge, scoring the first model's output against your stated criteria — imperfect, but far more consistent and scalable than fully manual review, and still much cheaper than a human reviewing every single test case by hand.

**Common mistakes:** building automation so complex it becomes its own maintenance burden (a handful of simple, checkable rules usually captures most real value; start there); trusting an LLM-as-judge score uncritically without ever spot-checking its judgments against real human review.

**Practical example:** An automated check for the Module 3 grounded-generation prompt: for the "context doesn't contain an answer" test cases, a simple string check for phrases like "not found"/"don't contain this information" catches most correct graceful-failure responses cheaply, without needing a second LLM call at all.

**Exercise:** Write at least 3 automated checks (simple string/format checks, not requiring a second LLM call) for your Lesson 2 test set.

**Expected outcome:** You can re-run your evaluation set in seconds after any prompt change, not minutes/hours of manual review.

**Homework:** Keep your automated checks — direct input to the Evaluation Harness project's deliverable.`,
    },
    {
      title: 'Responsible AI Use: Limitations and Disclosure',
      position: 4,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Correctly and honestly explain an LLM's real limitations to a non-technical stakeholder, without either overstating or catastrophizing.

**Prerequisites:** the full course to this point.

**Instructional content:**
Closing this course requires being explicit about what every prior module has shown, directly: LLMs hallucinate (Module 1), are sensitive to phrasing and example choice (Module 2), can misread even correctly-retrieved context (Module 3), and their apparent reliability from casual testing can hide real failure modes (this module's own Lessons 1–3). None of this means LLMs are unusable — it means every real deployment needs honest disclosure of these limits to the people relying on it, and a designed process (evaluation, human review where stakes are high) for catching failures before they cause harm.

**A responsible-use disclosure, at minimum, states**: what the system does and doesn't do, that outputs can be wrong and should be verified for high-stakes decisions, and what to do if the user suspects an error.

**Common mistakes:** overstating confidence to stakeholders ("the AI is accurate") without qualification, setting an expectation the system cannot reliably meet; the opposite failure — refusing to ship anything AI-powered out of blanket distrust, when a well-evaluated, appropriately-scoped, honestly-disclosed system is often genuinely useful.

**Practical example:** An AI-powered draft-email assistant disclosed as "drafts a starting point — review before sending, especially for anything sent to a customer" sets an honest, appropriate expectation. The same tool marketed as "writes your emails for you" invites exactly the over-trust this lesson warns against.

**Exercise:** Write a 3-sentence responsible-use disclosure for one prompt/system you built in this course, aimed at a non-technical user of it.

**Expected outcome:** You can write an honest, appropriately-scoped disclosure for a real AI-powered feature — neither overselling nor needlessly alarmist.

**Homework:** Bring your disclosure and your Lessons 1-3 test set/automated checks to the course's capstone project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 5,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Prompt Evaluation & Responsible Use) — the final module of Prompt Engineering: Mastering Large Language Models. Review lessons 1–4 before attempting the final assessment. Passing score: 75%.`,
      quiz: {
        title: 'Module 4 Final Assessment — Prompt Evaluation & Responsible Use',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is a single successful test run insufficient to declare a prompt production-ready?',
            questionType: 'single',
            options: [
              'It is actually sufficient — one successful run is enough evidence',
              'LLM output is not fully deterministic and a single run cannot surface rare-but-real failure inputs or edge cases',
              'Because prompts must always be tested exactly 100 times',
              'Because LLMs never produce the same correct answer twice',
            ],
            correctAnswer: [
              'LLM output is not fully deterministic and a single run cannot surface rare-but-real failure inputs or edge cases',
            ],
          },
          {
            prompt: 'For an open-ended task with no single "correct" output, what should an evaluation test set define instead?',
            questionType: 'single',
            options: [
              'Nothing — open-ended tasks cannot be evaluated',
              'A checkable property the output must satisfy (e.g. length limit, no unsupported facts, required citation)',
              'A random score assigned manually',
              'The exact word-for-word output expected',
            ],
            correctAnswer: [
              'A checkable property the output must satisfy (e.g. length limit, no unsupported facts, required citation)',
            ],
          },
          {
            prompt: 'Which of the following are real risks a good test set should include? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Only cases the prompt is already known to handle well',
              'Genuine edge cases likely to be missed by casual testing',
              'At least one case designed to fail if the prompt is actually wrong',
              'A mix of easy/common cases as a baseline',
            ],
            correctAnswer: [
              'Genuine edge cases likely to be missed by casual testing',
              'At least one case designed to fail if the prompt is actually wrong',
              'A mix of easy/common cases as a baseline',
            ],
          },
          {
            prompt: 'Scenario: you\'re asked to describe an AI-powered feature to a non-technical stakeholder. What does this module say a responsible disclosure must include?',
            questionType: 'single',
            options: [
              'A guarantee the AI is always correct',
              'What the system does/doesn\'t do, that outputs can be wrong and should be verified for high-stakes use, and what to do if an error is suspected',
              'No disclosure is necessary if the system tested well',
              'A refusal to describe any limitations, to avoid undermining user confidence',
            ],
            correctAnswer: [
              'What the system does/doesn\'t do, that outputs can be wrong and should be verified for high-stakes use, and what to do if an error is suspected',
            ],
          },
          {
            prompt: 'Practical question: why is automating evaluation-set scoring valuable beyond just saving time?',
            questionType: 'text',
            correctAnswer:
              'Because manual re-checking under time pressure tends to get skipped, automation makes it cheap enough to actually re-run every time a prompt changes, closing the gap between "we have a test set" and "we actually use it consistently."',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// UI/UX Design Foundations — Module 2: User Research & Wireframing (partial)
// ---------------------------------------------------------------------
const uiuxModule2: ModuleSeed = {
  courseSlug: 'ui-ux-design-foundations',
  title: 'User Research & Wireframing',
  position: 2,
  description: 'Moves from visual fundamentals into process — talking to real users and turning findings into low-fidelity structure before any visual polish.',
  lessons: [
    {
      title: 'Conducting a Basic User Research Interview',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Run a user research interview that surfaces real needs rather than confirming assumptions.

**Prerequisites:** Module 1 (Design Fundamentals).

**Instructional content:**
The single most common research mistake is asking questions that lead the participant toward an answer you already want ("Would you like a faster checkout?" — nearly everyone says yes to this, regardless of whether it addresses their real problem). Effective interview questions ask about **past behavior and specific incidents**, not hypothetical preferences: "Tell me about the last time you tried to do X" surfaces real friction; "Would you like X to be easier" does not.

A basic structure: open with context-setting questions (their role, how often they do the task), move into a specific recent-incident walkthrough, and close by asking what they'd change if anything — but only after they've already described the real experience unprompted.

**Common mistakes:** asking leading/hypothetical questions instead of behavioral ones; interrupting to suggest solutions mid-interview (this study is for research and listening, not pitching); only interviewing people who already like your product/idea, missing the perspective of people who don't use it or use a competitor instead.

**Practical example:** "Do you think a dashboard would help you?" (leading, hypothetical) versus "Walk me through the last time you needed to check your account status — what did you actually do?" (behavioral, surfaces real friction points you didn't anticipate).

**Exercise:** Write 5 interview questions for a product/feature area of your choice, all framed around past behavior/specific incidents, none hypothetical or leading.

**Expected outcome:** You can distinguish a leading/hypothetical question from a behavioral one on sight, and default to the latter.

**Reading:** The Design of Everyday Things (Don Norman) — its core framing (observe real behavior, don't assume you already know the user's mental model) is the direct basis for this lesson; see docs/content-library/books.md.

**Homework:** Conduct (or role-play, if a real participant isn't available) one interview using your 5 questions; note one finding that surprised you.`,
      },
    {
      title: 'Synthesizing Research Findings',
      position: 2,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Turn raw interview notes into a clear, actionable set of findings.

**Prerequisites:** "Conducting a Basic User Research Interview."

**Instructional content:**
Raw interview notes are not yet findings — synthesis means identifying patterns across multiple data points (or, for a single interview, clearly-stated specific observations) and separating what was actually observed/said from what you're inferring or assuming. A common lightweight technique: group raw notes into an affinity map (cluster related observations together), then name each cluster with a short, specific finding statement.

**Common mistakes:** presenting a single participant's opinion as if it were a universal finding ("users want X" from one interview is an overclaim — "this participant wanted X, worth testing further" is honest); blending observation and inference without marking which is which (a synthesized finding that quietly smuggles in an assumption is a real risk to whatever gets designed next based on it).

**Practical example:** Raw note: "Participant said the checkout felt slow, tried to click the button 3 times." Honest finding: "Participant perceived the checkout as unresponsive and repeated the submit action — possible feedback/loading-state gap, worth testing with more participants." Overclaimed finding: "Users want a faster checkout" — this asserts far more than one observation supports.

**Exercise:** Take your Lesson 1 interview notes and write 2-3 findings, each clearly distinguishing what was observed from what you're inferring.

**Expected outcome:** Your findings are honest about their own evidence strength — a real, transferable synthesis skill, not specific to any one project.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Wireframing at Increasing Fidelity',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Produce a low-fidelity wireframe from a research finding, and explain why starting low-fidelity is a deliberate choice.

**Prerequisites:** "Synthesizing Research Findings."

**Instructional content:**
A **wireframe** is a structural layout — boxes, rough hierarchy, no real visual design — used to test whether an information structure makes sense before investing in visual polish. Starting **low-fidelity** (rough boxes and labels, often literally on paper) is deliberate: it's fast to produce and fast to throw away, which matters because early structural ideas are often wrong and cheap iteration is the whole point at this stage. High-fidelity mockups take longer to produce and — because they look "finished" — tend to bias feedback toward surface polish rather than structural problems, exactly when structural problems are still cheapest to fix.

**Common mistakes:** jumping straight to high-fidelity, skipping the cheap iteration stage where real structural problems are easiest to catch; treating a wireframe review as a chance to bikeshed visual details (color, font) that a wireframe was never meant to represent.

**Practical example:** A wireframe review focused on "should the filter panel be on the left or collapse into a menu" is exactly the right kind of structural question for this stage — a wireframe review that gets sidetracked debating a button's exact shade of blue has lost the point of staying low-fidelity.

**Exercise:** Turn one of your Lesson 2 findings into a low-fidelity wireframe (paper sketch or a simple digital wireframe tool) addressing the structural problem the finding surfaced.

**Expected outcome:** A real wireframe grounded in a real research finding — direct input to this course's Responsive Landing Page project, and a demonstrated research → structure → design pipeline, not a design produced from pure assumption.

**Homework:** Keep your wireframe — bring it into the next lesson's critique.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (User Research & Wireframing). Review lessons 1–3 before attempting the final assessment. Passing score: 75%. **Course status note:** this is the second of 4 planned modules for UI/UX Design Foundations — Modules 3 (Prototyping, Interaction Design & Accessibility) and 4 (Design Systems & Usability Testing) remain planned, not yet authored (see docs/content-library/content-roadmap.md).`,
      quiz: {
        title: 'Module 2 Final Assessment — User Research & Wireframing',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which interview question is behavioral rather than leading/hypothetical?',
            questionType: 'single',
            options: [
              '"Would you like this to be easier to use?"',
              '"Walk me through the last time you tried to do this task."',
              '"Don\'t you think a dashboard would help?"',
              '"Wouldn\'t a faster checkout be better?"',
            ],
            correctAnswer: ['"Walk me through the last time you tried to do this task."'],
          },
          {
            prompt: 'What is the risk of presenting a single participant\'s opinion as a universal finding?',
            questionType: 'single',
            options: [
              'There is no risk — one participant is always representative',
              'It overclaims evidence strength the research doesn\'t actually support',
              'It is required by research best practice',
              'It only matters for quantitative research, not qualitative interviews',
            ],
            correctAnswer: ['It overclaims evidence strength the research doesn\'t actually support'],
          },
          {
            prompt: 'True or False: starting with a low-fidelity wireframe rather than a high-fidelity mockup is a deliberate choice to keep structural iteration cheap.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: a wireframe review turns into a debate about the exact shade of a button\'s color. What does this lesson say about that?',
            questionType: 'single',
            options: [
              'This is exactly the right kind of wireframe feedback',
              'This has lost the point of staying low-fidelity — a wireframe isn\'t meant to represent visual details like color',
              'Wireframes should always include exact colors to prevent this',
              'Color decisions can only be made at the wireframe stage',
            ],
            correctAnswer: [
              'This has lost the point of staying low-fidelity — a wireframe isn\'t meant to represent visual details like color',
            ],
          },
          {
            prompt: 'Practical question: what should a synthesized research finding clearly distinguish between?',
            questionType: 'text',
            correctAnswer:
              'What was actually observed/said by the participant versus what the researcher is inferring or assuming — blending the two without marking which is which risks smuggling an unsupported assumption into a finding treated as fact.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// DevOps Foundations — Module 2: Containers (Docker) (partial)
// ---------------------------------------------------------------------
const devopsModule2: ModuleSeed = {
  courseSlug: 'devops-foundations-cicd-containers',
  title: 'Containers (Docker)',
  position: 2,
  description: 'Moves from CI/CD process into the packaging technology that makes "the same build everywhere" actually true — containers.',
  lessons: [
    {
      title: 'What a Container Actually Is',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      isPreview: true,
      body: `**Objective:** Explain what a container is at a working level, and why it solves "works on my machine."

**Prerequisites:** Module 1 (CI/CD Fundamentals).

**Instructional content:**
A **container** packages an application together with everything it needs to run (dependencies, runtime, system libraries) into a single, portable unit that runs identically regardless of the underlying host — solving the classic "works on my machine" problem, where an application behaves differently across environments due to differing installed versions, configuration, or OS-level dependencies.

Containers are NOT the same as a full virtual machine: a VM virtualizes an entire operating system (heavier, slower to start); a container shares the host machine's OS kernel and only isolates the application layer (lighter, starts in seconds, not minutes). This is why containers are practical to spin up per-CI-run or scale horizontally in a way full VMs rarely are at the same speed/cost.

**Common mistakes:** treating a container as a lightweight VM conceptually (leads to wrong assumptions about isolation boundaries and persistence); assuming "it's containerized" alone guarantees consistency — a container built from a poorly-pinned base image can still drift over time if the base image itself changes.

**Practical example:** A Node.js application that works locally but fails in CI due to a different installed Node version is exactly the class of problem containers solve — the container image bundles the exact Node version, so CI runs the identical environment as local development.

**Exercise:** Identify one real "works on my machine" incident you've experienced or heard of. Explain specifically what a container would have prevented.

**Expected outcome:** You can explain containers' real value proposition precisely (environment consistency + fast, lightweight isolation), not just "it's Docker, it's modern."

**Reading:** Docker's own official documentation: https://docs.docker.com (live-verified Phase 25).

**Homework:** None — feeds into Lesson 2.`,
    },
    {
      title: 'Writing a Correct Dockerfile',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Write a Dockerfile that builds a small, correct, reproducible image.

**Prerequisites:** "What a Container Actually Is."

**Instructional content:**
A **Dockerfile** is the declarative recipe for building an image. Key practices for a correct, production-reasonable Dockerfile: pin the base image to a specific version (not \`latest\`, which silently changes over time and breaks the exact reproducibility containers are supposed to guarantee); order instructions from least-to-most-frequently-changing (so Docker's build cache is actually useful — dependency installation before copying application code, since code changes far more often than dependencies); and avoid copying unnecessary files into the image (a \`.dockerignore\` file, the same idea as \`.gitignore\`).

**Common mistakes:** using \`latest\` as the base image tag, silently breaking reproducibility; copying the entire project directory (including local secrets, node_modules, or git history) into the image with no \`.dockerignore\`, bloating the image and risking accidental secret exposure; installing dependencies AFTER copying application code, defeating Docker's layer cache on every single code change.

**Practical example:** \`FROM node:20.11.0-slim\` (pinned, minimal) is reproducible and small; \`FROM node:latest\` is neither — it changes over time and pulls in a full, larger base unnecessarily when a slim variant would do.

**Exercise:** Write a Dockerfile for a simple application (any language), applying all three practices above: pinned base image, dependency-before-code layer ordering, and a \`.dockerignore\`.

**Expected outcome:** A real, correct Dockerfile — direct input to this course's Containerized App with Basic CI project (already introduced at the path level in Module 1; this lesson deepens the underlying skill with real correctness practices).

**Homework:** Build your Dockerfile locally if you have Docker installed, and confirm it actually builds successfully.`,
    },
    {
      title: 'Multi-Stage Builds and Image Size',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Use a multi-stage build to produce a smaller, more secure production image.

**Prerequisites:** "Writing a Correct Dockerfile."

**Instructional content:**
A **multi-stage build** uses multiple \`FROM\` statements in one Dockerfile: an early stage installs full build tooling and compiles/builds the application, and a final stage copies only the built output into a minimal runtime image — leaving build tools, source code, and intermediate artifacts out of the image that actually ships to production.

This matters for two real reasons: **smaller images** deploy faster and cost less to store/transfer, and **smaller attack surface** — build tools and source code left in a production image are unnecessary risk (an attacker who compromises the running container gets less to work with).

**Common mistakes:** shipping the same image used for building (with full build tooling, dev dependencies, and source maps) directly to production, when a multi-stage build would produce something meaningfully smaller and safer with little added complexity; not testing that the final minimal stage actually contains everything the application needs to run at runtime (a build that succeeds doesn't guarantee the final stage didn't accidentally omit a needed runtime file).

**Practical example:** A Go application's build stage needs the full Go toolchain (hundreds of MB); the compiled binary itself is often a single small file. A multi-stage build's final stage can be a near-empty base image containing only that binary — dramatically smaller than shipping the build stage itself.

**Exercise:** Convert your Lesson 2 Dockerfile into a multi-stage build, and compare the final image size before/after (if you have Docker installed to actually measure it) or reason through which files would be excluded from the final stage.

**Expected outcome:** You default to multi-stage builds for any application with a real build step, understanding the size/security tradeoff it improves.

**Homework:** None — feeds into the module review.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Containers/Docker). Review lessons 1–3 before attempting the final assessment. Passing score: 75%. **Course status note:** this is the second of 5 planned modules for DevOps Foundations — Modules 3 (Container Orchestration/Kubernetes), 4 (Infrastructure as Code & Configuration Management), and 5 (Monitoring, Observability & SRE Basics) remain planned, not yet authored (see docs/content-library/content-roadmap.md).`,
      quiz: {
        title: 'Module 2 Final Assessment — Containers (Docker)',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is the key structural difference between a container and a full virtual machine?',
            questionType: 'single',
            options: [
              'There is no real difference, they are the same thing',
              'A container shares the host OS kernel and isolates only the application layer; a VM virtualizes a full separate OS',
              'Containers are always slower to start than VMs',
              'VMs are a newer technology than containers',
            ],
            correctAnswer: [
              'A container shares the host OS kernel and isolates only the application layer; a VM virtualizes a full separate OS',
            ],
          },
          {
            prompt: 'Why is pinning a Dockerfile\'s base image to a specific version (not `latest`) important?',
            questionType: 'single',
            options: [
              'It is not important, `latest` is always the safest choice',
              '`latest` silently changes over time, breaking the exact reproducibility containers are supposed to guarantee',
              'Pinned versions build faster regardless of content',
              'It is only relevant for very large images',
            ],
            correctAnswer: [
              '`latest` silently changes over time, breaking the exact reproducibility containers are supposed to guarantee',
            ],
          },
          {
            prompt: 'Which of the following are real benefits of a multi-stage build? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Smaller final image size',
              'Reduced attack surface by excluding build tools/source from the production image',
              'Faster deploys due to a smaller image',
              'Guaranteed elimination of all security vulnerabilities',
            ],
            correctAnswer: [
              'Smaller final image size',
              'Reduced attack surface by excluding build tools/source from the production image',
              'Faster deploys due to a smaller image',
            ],
          },
          {
            prompt: 'True or False: ordering a Dockerfile so dependency installation happens before copying application code helps Docker\'s build cache work effectively.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: what real risk does copying an entire project directory into a Docker image without a `.dockerignore` create?',
            questionType: 'text',
            correctAnswer:
              'It can bloat the image with unnecessary files (node_modules, git history) and risks accidentally including local secrets or configuration files in the shipped image.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [promptEngModule2, promptEngModule3, promptEngModule4, uiuxModule2, devopsModule2];

// ---------------------------------------------------------------------
// New standalone Projects (Phase 26 Project model directly — no source
// lesson, no duplication of any Phase 25 lesson-brief content)
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'prompt-engineering-mastering-llms',
    title: 'RAG Pipeline with Citations',
    description: 'Advanced tier, Prompt Engineer path — a retrieval-augmented pipeline grounded in a real document set, returning verifiable citations, with a measured hallucination rate.',
    instructions: `**Objective:** Build a retrieval-augmented pipeline over a real document set (e.g. a product's own documentation, or any real reference material you have legitimate access to) that returns answers grounded in retrieved content with verifiable citations.

**Requirements:**
- A real chunking strategy applied to your chosen document set (per Module 3, Lesson 2 — natural boundaries, not arbitrary character counts).
- A retrieval step (semantic, keyword, or hybrid per Module 3, Lesson 3) that returns relevant chunks for a query.
- A grounded-generation prompt (per Module 3, Lesson 4) that cites which retrieved chunk(s) support each claim, and explicitly says so when no relevant chunk is found.
- A test set of at least 10 queries: some clearly answerable from your documents, some deliberately NOT answerable (to test graceful "not found" behavior), and at least 2 genuinely ambiguous/edge-case queries.
- A measured hallucination rate: for each test query, record whether the answer was correctly grounded, incorrectly fabricated, or correctly declined.

**Expected result:** A working pipeline (code, notebook, or documented manual process — implementation medium is your choice) plus a results table showing all 10+ test queries, their outcomes, and your calculated hallucination rate (fabricated answers ÷ total queries).

**Difficulty:** Advanced.

**Skills tested:** end-to-end RAG pipeline construction, grounding correctness, honest measurement of failure rate (not just showcasing the successful cases).

**Suggested implementation steps:**
1. Choose a real, legitimately-accessible document set.
2. Chunk it using natural boundaries.
3. Implement retrieval (start with simple semantic or keyword search — hybrid is a stretch goal, not a requirement).
4. Write and test your grounded-generation prompt against a few queries first.
5. Build your full 10+ query test set, deliberately including unanswerable and ambiguous cases.
6. Run all queries, record outcomes, calculate your hallucination rate honestly — including if it's higher than you'd like.

**Evaluation criteria:** real, working retrieval (not hardcoded/faked results), correct citation behavior, honest reporting of the full test set's results including any failures, a genuinely measured (not estimated) hallucination rate.`,
    position: 1,
  },
  {
    courseSlug: 'prompt-engineering-mastering-llms',
    title: 'Production Prompt-Powered Feature (Capstone)',
    description: 'Professional Capstone, Prompt Engineer path — a complete, tested, documented LLM-powered feature with a written evaluation report and honest limitations section.',
    instructions: `**Objective:** Design, build, and document a complete, production-quality LLM-powered feature (e.g. a support-ticket triager, a document summarizer, a structured-data extractor) applying everything from this course: prompt design (Module 1), few-shot/chain-of-thought as appropriate (Module 2), RAG and/or tool calling if the feature genuinely needs them (Module 3), and systematic evaluation with a responsible-use disclosure (Module 4).

**Requirements:**
- A defined, real (even if hypothetical) use case with a clear task the feature performs.
- A production-quality prompt (or prompt chain) applying the four-part structure and any relevant patterns from Module 1/2.
- If the task genuinely benefits from RAG and/or tool calling, real implementation of whichever applies — not added artificially if the task doesn't call for it.
- A real evaluation test set (per Module 4) with automated checks, covering easy cases, edge cases, and at least one deliberately-hard case.
- A written evaluation report: your test set's results, your measured reliability (pass rate against your checkable properties), and an honest account of any failure modes found.
- A responsible-use disclosure (per Module 4, Lesson 4) written for the feature's actual intended end user.

**Expected result:** A working feature (implementation medium is your choice — a script, a small app, or a thoroughly-documented manual process using a chat interface, as long as it's real and testable) plus the written evaluation report and disclosure.

**Difficulty:** Professional Capstone.

**Skills tested:** integrating the full course's techniques into one coherent, real feature; honest, rigorous self-evaluation; responsible-use communication.

**Suggested implementation steps:**
1. Pick a real task — don't invent one so broad it can't be meaningfully evaluated.
2. Design the prompt/pipeline, applying only the techniques the task actually needs (RAG/tool calling only if genuinely relevant).
3. Build your evaluation test set BEFORE extensively tuning the prompt, so early results reflect real quality, not overfitting to a test set built to match a prompt you'd already tuned.
4. Run your evaluation, document results honestly including failures.
5. Write the responsible-use disclosure last, once you know the feature's real, tested limitations — not before.

**Evaluation criteria:** a coherent, real feature (not several disconnected exercises glued together), evaluation rigor (a real test set, real automated checks, honest reporting), a disclosure that accurately reflects the feature's actual measured limitations, not generic boilerplate.`,
    position: 2,
  },
];

async function main(): Promise<void> {
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;

  for (const moduleSeed of MODULES) {
    const course = await prisma.course.findUnique({ where: { slug: moduleSeed.courseSlug } });
    if (!course) {
      console.warn(`WARNING: course "${moduleSeed.courseSlug}" not found — skipping module "${moduleSeed.title}".`);
      continue;
    }

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
      console.log(`  Created module: ${module_.title} (course: ${course.title})`);
    } else {
      console.log(`  Module already exists, skipping create: ${module_.title}`);
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
        console.log(`    Created lesson: ${lesson.title}`);
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
          console.log(`      Created quiz: ${quiz.title}`);

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

  for (const projectSeed of PROJECTS) {
    const course = await prisma.course.findUnique({ where: { slug: projectSeed.courseSlug } });
    if (!course) {
      console.warn(`WARNING: course "${projectSeed.courseSlug}" not found — skipping project "${projectSeed.title}".`);
      continue;
    }

    const existing = await prisma.project.findFirst({
      where: { courseId: course.id, title: projectSeed.title },
    });
    if (existing) {
      projectsSkipped += 1;
      console.log(`  Project already exists, skipping create: ${existing.title}`);
      continue;
    }

    const project = await prisma.project.create({
      data: {
        courseId: course.id,
        title: projectSeed.title,
        description: projectSeed.description,
        instructions: projectSeed.instructions,
        status: 'published',
        position: projectSeed.position,
        // sourceLessonId deliberately omitted — this is a real, standalone
        // Project created directly via the Phase 26 architecture, not a
        // Lesson-workaround (per this phase's explicit instruction #6).
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 27 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 27 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

// Phase 30 — Educational Content Production: UI/UX Design Foundations.
//
// Completes the course to production-ready status, per
// docs/content-library/courses.md's approved 4-module breakdown and
// docs/phase27-educational-content-production-report.md's precedent for
// what "production-ready" means (Prompt Engineering, Phase 27): every
// planned module authored, quizzed, and real. Modules 1 (Design
// Fundamentals) and 2 (User Research & Wireframing) already exist from
// Phases 25/27 and are NOT touched or duplicated — this file only adds
// Module 3 (Prototyping, Interaction Design & Accessibility) and Module 4
// (Design Systems & Usability Testing), plus the 2 remaining standalone
// Projects the blueprint calls for (course total: 3), created directly via
// the Phase 26 Project model, not a Lesson-workaround.
//
// Same application-level idempotency pattern as seed-phase25/27:
// findFirst by parent+title before create (Module/Lesson still have no DB
// unique constraint beyond `id` — unchanged, documented limitation).
//
// Resources: reuses the same Don Norman book already cited (and flagged
// NEEDS_VERIFICATION, unchanged) in Modules 1/2. Two new documentation
// resources were live-fetched and confirmed this phase (not assumed):
//   - https://www.w3.org/WAI/WCAG22/quickref/ — W3C WCAG 2.2 Quick
//     Reference, confirmed live via WebFetch, 2026-08-09.
//   - https://www.nngroup.com/articles/ten-usability-heuristics/ —
//     Nielsen Norman Group, "10 Usability Heuristics for User Interface
//     Design" (Jakob Nielsen), confirmed live via WebFetch, 2026-08-09.
// No ISBN, video URL, or documentation link is invented anywhere in this
// file.

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
// UI/UX Design Foundations — Module 3: Prototyping, Interaction Design
// & Accessibility
// ---------------------------------------------------------------------
const uiuxModule3: ModuleSeed = {
  courseSlug: 'ui-ux-design-foundations',
  title: 'Prototyping, Interaction Design & Accessibility',
  position: 3,
  description:
    'Moves from static wireframes into interactive, testable prototypes, and covers the accessibility foundations Modules 1 and 2 both explicitly deferred to this module.',
  lessons: [
    {
      title: 'From Wireframes to Interactive Prototypes',
      position: 1,
      contentType: 'text',
      durationSeconds: 900,
      isPreview: true,
      body: `**Objective:** Turn a low-fidelity wireframe into a clickable prototype that can be tested with real users before any code is written.

**Prerequisites:** Module 2 (User Research & Wireframing) — specifically "Wireframing at Increasing Fidelity."

**Instructional content:**
A **prototype** adds interactivity to a wireframe or mockup — clickable hotspots that move between screens/states — without requiring real, working code. Its purpose is narrow and deliberate: let a real user attempt a real task and observe where they get confused, stuck, or make an unintended choice, while changes are still nearly free to make.

Prototype fidelity should match what you're actually testing:
1. **Low-fidelity interactive prototypes** (even a stack of linked wireframe screens) are enough to test whether a flow's *structure* makes sense — can a user find the right screen, in the right order, to complete a task.
2. **High-fidelity prototypes** (real visual design, real copy) are needed once you're testing something visual-design-dependent — whether a button reads as clickable, whether an error state is noticeable — not before.

Testing structure with a high-fidelity prototype wastes the visual-polish investment on questions that don't need it; testing visual polish with a low-fidelity prototype can't actually answer the question.

**Common mistakes:** building full visual polish before ever testing the underlying flow structure (the same premature-investment mistake Module 2 warned against for wireframes, recurring at this next stage); prototyping every possible screen instead of the one real task path being tested, which multiplies build time without multiplying learning.

**Practical example:** Testing whether users can find a "cancel subscription" flow only requires linked screens for that one path (Account → Settings → Cancel → Confirm) at whatever fidelity is cheapest to produce — not a fully clickable prototype of the entire application.

**Exercise:** Take the wireframe you produced in Module 2, Lesson 3. Turn it into a linked, clickable prototype (a simple tool, or even numbered paper screens a facilitator flips between, is sufficient) covering one real task path end to end.

**Expected outcome:** You can state, for any given design question, whether it requires a low-fidelity or high-fidelity prototype to test honestly — and you have one real, testable prototype ready for this module's usability work.

**Homework:** Keep your prototype — it is the direct input to this module's Accessible Interactive Prototype project.`,
    },
    {
      title: 'Interaction Design Patterns & Feedback',
      position: 2,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Apply established interaction patterns and give the user clear feedback for every action, rather than inventing novel interaction models by default.

**Prerequisites:** "From Wireframes to Interactive Prototypes."

**Instructional content:**
Two principles do most of the real work in interaction design:

1. **Reuse established patterns unless you have a specific reason not to.** A user arrives at almost every interface already knowing what a dropdown, a modal, a toggle, and a stepper form each mean and do — reusing these patterns means the user spends zero cognitive effort learning your interface's mechanics and can focus on their actual task. A novel, unfamiliar interaction pattern must earn its cost in learnability with a real, specific benefit — novelty for its own sake is a cost, not a feature.
2. **Every user action needs feedback.** A button that gives no visible response when clicked (no hover state, no pressed state, no loading indicator) leaves the user unsure whether their action registered at all — a real, common source of accidental duplicate submissions (the user clicks again, assuming the first click failed).

**Common mistakes:** inventing a custom interaction pattern for something a standard pattern already solves well (e.g. a bespoke multi-step reveal where a simple accordion would do); providing feedback only for successful actions and leaving errors silent — an error state needs feedback at least as clearly as a success state does.

**Practical example:** A "Save" button with no loading state, on a slow connection, invites the user to click it repeatedly — each click potentially firing a duplicate request. Adding a disabled/loading state the instant the first click registers (even before the request completes) is a minimal, well-established feedback pattern that directly prevents this.

**Exercise:** Walk through your Lesson 1 prototype's one task path. For every interactive element, note whether it has a distinct feedback state (hover, pressed, loading, error, success) or not. List every gap you find.

**Expected outcome:** Given any interactive element, you can name what feedback states it needs and identify when a missing one would cause real user confusion.

**Homework:** None — feeds directly into this module's project.`,
    },
    {
      title: 'Accessibility Fundamentals: WCAG, Semantics & Contrast',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Apply the accessibility principles Modules 1 and 2 both deferred to this lesson — real, checkable requirements, not a vague "be inclusive" gesture.

**Prerequisites:** Module 1, "Color Theory for Interfaces" (contrast was introduced there and deferred here).

**Instructional content:**
**WCAG** (Web Content Accessibility Guidelines) organizes accessibility requirements around four principles: content must be **Perceivable** (e.g. sufficient color contrast, text alternatives for images), **Operable** (e.g. fully usable via keyboard, not only a mouse/touch), **Understandable** (e.g. consistent navigation, clear error messages), and **Robust** (e.g. correct semantic markup that assistive technology can actually parse). Three of the most common, checkable requirements a designer directly controls:

1. **Color contrast.** WCAG defines a minimum contrast ratio between text and its background (commonly 4.5:1 for normal body text at the AA conformance level) — this is directly checkable with a contrast-ratio tool, not a matter of opinion, and is exactly the "contrast requirement" Module 1's color lesson deferred here.
2. **Semantic structure.** Using real headings, real buttons, real form labels — not a plain "div" element styled to look like a button — is what allows a screen reader to correctly announce and let a user navigate the interface at all. This is the same principle the "Semantic HTML" lesson deferred to this module.
3. **Keyboard operability.** Every interactive element (buttons, links, form fields, custom controls) must be reachable and usable via keyboard alone (Tab to move focus, Enter/Space to activate) — a real requirement for users who cannot use a mouse or touchscreen, not an edge case to deprioritize.

**Common mistakes:** treating accessibility as a final "compliance pass" instead of a property checked throughout design (a color palette chosen without contrast in mind, then "fixed" for accessibility later, often requires reworking the whole palette rather than one small tweak); using visual styling alone to indicate interactivity or state (e.g. only a color change to show a form field has an error) with no non-color indicator, which fails for colorblind users specifically.

**Practical example:** A form that shows an invalid field only by turning its border red communicates nothing to a colorblind user or a screen reader user. Adding a text error message next to the field, and an icon, alongside the color change, communicates the same state through multiple channels — one of which will reach every user.

**Exercise:** Take your Lesson 1 prototype's one task path. Check each screen against the 3 requirements above: does text meet contrast requirements (use any browser dev-tools contrast checker), is state/error communicated through more than color alone, and could each interactive element plausibly be reached and operated by keyboard.

**Expected outcome:** Given an interface, you can name the specific WCAG-grounded issue (contrast, semantics, keyboard operability, or color-only state) rather than a vague "this isn't accessible."

**Reading:** W3C WCAG 2.2 Quick Reference — https://www.w3.org/WAI/WCAG22/quickref/ (live-verified this phase). The Design of Everyday Things (Don Norman) — its emphasis on interfaces communicating their own state clearly is directly relevant to the color-only-state mistake above; see docs/content-library/books.md.

**Homework:** Keep your 3-point accessibility check — it becomes part of this module's project deliverable.`,
    },
    {
      title: 'Accessibility Testing in Practice',
      position: 4,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Run a basic, real accessibility audit on an interface using free, available tools — not just visual inspection.

**Prerequisites:** "Accessibility Fundamentals: WCAG, Semantics & Contrast."

**Instructional content:**
Visual inspection alone misses real accessibility problems — a page can look fine and still be unusable with a screen reader or keyboard alone. A basic, practical audit combines automated and manual checks:

1. **Automated contrast/structure scan.** Browser dev tools (most modern browsers) include an accessibility panel that flags contrast failures and some structural issues automatically — a fast first pass that catches the mechanical, checkable failures.
2. **Manual keyboard-only pass.** Unplug the mouse (or simply don't use it) and attempt the interface's core task using only Tab, Shift+Tab, Enter, and Space. Anything unreachable or unusable this way is a real, direct finding — not a theoretical one.
3. **Manual screen-reader spot-check.** Even a brief pass with a free screen reader (built into most operating systems) on a key screen reveals whether headings, labels, and buttons are announced sensibly — a plain "div" element styled as a button will typically announce as nothing at all, a real, immediately obvious failure this check catches that visual inspection never would.

Automated tools alone are not sufficient — they catch a meaningful subset of issues (contrast, some missing labels) but cannot judge whether a keyboard flow is actually usable in the intended order, which is why the manual passes above matter.

**Common mistakes:** running only the automated scan and declaring the interface "accessible" because it passed (automated tools catch roughly a third of real WCAG issues, by widely-cited industry estimates — a passing automated scan is a floor, not a certificate); testing keyboard/screen-reader access only on the "happy path" and skipping error states, which are exactly where users relying on assistive technology are most likely to get stuck without a clear way out.

**Practical example:** An automated scanner will flag a low-contrast button, but only a manual keyboard pass reveals that the modal opened by that button traps focus with no way to close it via keyboard — a real, common, and severe accessibility bug automated tools do not catch.

**Exercise:** Run all 3 checks above (automated scan, keyboard-only pass, screen-reader spot-check) against your Lesson 1 prototype's one task path. Document every finding, however small.

**Expected outcome:** You have run a real, 3-part accessibility audit and can distinguish what automated tools catch from what only manual testing reveals.

**Reading:** W3C WCAG 2.2 Quick Reference — https://www.w3.org/WAI/WCAG22/quickref/ (same resource as the previous lesson; this lesson applies it practically rather than introducing new material).

**Homework:** Bring your audit findings into the Accessible Interactive Prototype project — you'll fix real issues you found, not hypothetical ones.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 5,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Prototyping, Interaction Design & Accessibility). Review lessons 1–4 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Prototyping, Interaction Design & Accessibility',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'When is a low-fidelity interactive prototype (not high-fidelity) the right tool, per this module?',
            questionType: 'single',
            options: [
              'Never — all prototypes should be high-fidelity for realistic testing',
              'When you are testing whether the flow\'s structure makes sense, not testing visual-design-dependent questions',
              'Only when no design tool is available',
              'Only for mobile interfaces',
            ],
            correctAnswer: [
              'When you are testing whether the flow\'s structure makes sense, not testing visual-design-dependent questions',
            ],
          },
          {
            prompt: 'Which of the following are real accessibility requirements covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Text must meet a checkable minimum contrast ratio against its background',
              'Every interactive element must be reachable and usable via keyboard alone',
              'Color alone is sufficient to communicate an error or state change',
              'Real semantic elements (headings, buttons, labels) should be used, not styled divs',
            ],
            correctAnswer: [
              'Text must meet a checkable minimum contrast ratio against its background',
              'Every interactive element must be reachable and usable via keyboard alone',
              'Real semantic elements (headings, buttons, labels) should be used, not styled divs',
            ],
          },
          {
            prompt: 'True or False: passing an automated accessibility scanner is sufficient to declare an interface accessible.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Scenario: a "Save" button gives no visual feedback at all when clicked, on a slow connection. What real problem does this module say this causes?',
            questionType: 'single',
            options: [
              'No real problem — users will wait patiently regardless',
              'The user may click again assuming the first click failed, risking a duplicate submission',
              'It only affects users with slow internet, so it can be deprioritized',
              'This is purely a backend performance issue, unrelated to interaction design',
            ],
            correctAnswer: [
              'The user may click again assuming the first click failed, risking a duplicate submission',
            ],
          },
          {
            prompt: 'Practical question: why does this module recommend a manual keyboard-only pass in addition to an automated accessibility scan?',
            questionType: 'text',
            correctAnswer:
              'Automated tools catch mechanical, checkable issues like contrast failures but cannot judge whether a real task flow is actually usable in the intended order via keyboard alone — issues like a focus trap in a modal are only caught by actually attempting the task without a mouse.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// UI/UX Design Foundations — Module 4: Design Systems & Usability
// Testing
// ---------------------------------------------------------------------
const uiuxModule4: ModuleSeed = {
  courseSlug: 'ui-ux-design-foundations',
  title: 'Design Systems & Usability Testing',
  position: 4,
  description:
    'Closes the course by scaling individual design decisions into a reusable system, and closing the loop by testing real designs with real users.',
  lessons: [
    {
      title: 'Building a Design System: Tokens & Components',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Extract the color, type, and spacing scales built in Module 1 into a reusable design system, and understand why a design system exists at all.

**Prerequisites:** Module 1 (Design Fundamentals) — the color palette, type scale, and spacing scale built there are this lesson's direct input.

**Instructional content:**
A **design system** is a single source of truth for an interface's visual and interaction decisions — color, type, spacing, and reusable components — so that every new screen reuses existing, already-justified decisions instead of each designer/developer re-deciding (and inevitably drifting) independently.

Two layers matter:
1. **Design tokens.** The Module 1 color palette, type scale, and spacing scale, named and stored as reusable values (e.g. "color-primary", "space-md", "text-heading-lg") rather than repeated as raw values across every screen. A token change (e.g. adjusting the primary color) then propagates everywhere it's used, instead of requiring a manual find-and-replace across every screen it appears on.
2. **Components.** Reusable, pre-assembled UI pieces (a button, a form field, a card) built from those tokens, each with its defined states (default, hover, disabled, error) decided once — this is the direct evolution of Module 3's "give every action feedback" principle, now captured as a reusable asset instead of re-decided per screen.

**Common mistakes:** treating a design system as "just a color palette" and never actually defining component-level states/variants (the drift a design system exists to prevent then simply happens one level higher, at the component level instead of the raw-value level); building an elaborate token system before there are even 2-3 real screens that would benefit from reuse — a design system should be extracted from real, working design decisions, not invented speculatively ahead of them.

**Practical example:** Without tokens, "primary blue" might be implemented as 4 slightly different hex values across 4 screens, built independently over time — each individually reasonable, collectively inconsistent in a way a user notices even without being able to name why. A single "color-primary" token used everywhere makes this drift structurally impossible.

**Exercise:** Take your Module 1 color palette, type scale, and spacing scale. Name each value as a token (e.g. "color-primary", "space-sm/md/lg", "text-body/heading"). Define one component (a button) with its default, hover, and disabled states, built only from those named tokens.

**Expected outcome:** You can explain, to someone unfamiliar with design systems, what problem tokens and components each solve — not just that "design systems are good practice."

**Homework:** Keep your token list and button component — direct input to this module's project.`,
    },
    {
      title: 'Documenting and Governing a Design System',
      position: 2,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Write design-system documentation that another designer or developer could actually follow without asking you questions.

**Prerequisites:** "Building a Design System: Tokens & Components."

**Instructional content:**
A design system that exists only in one designer's head or one file's implicit conventions fails the moment a second person needs to use it. Real documentation answers, for each token and component, at minimum: **what it's for**, **when to use it** (and, as importantly, when not to), and **its defined states/variants**.

**Common mistakes:** documenting *what* a component is (a visual screenshot) without documenting *when to use it versus a similar alternative* — a team with both a "primary button" and an "emphasis button" and no stated rule for which to use where will inconsistently pick one, defeating the system's purpose; letting documentation drift out of sync with the actual implemented components (undocumented changes are effectively invisible to anyone but the person who made them).

**Practical example:** "Primary Button — use for the single most important action on a screen (e.g. 'Submit,' 'Save'). Do not use more than one primary button per screen; use the secondary/outline button for all other actions" is a real, usable rule. "Primary Button — the blue one" is not — it describes appearance, not usage, and gives a second designer no basis for a consistent decision on a new screen.

**Exercise:** Write real usage documentation for your Lesson 1 button component: what it's for, when to use it versus a plausible alternative, and its defined states. Write it as if a teammate who has never seen your project will read it and needs to use it correctly on the first try.

**Expected outcome:** You can distinguish documentation that actually governs consistent usage from documentation that only describes appearance.

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'Planning and Running a Usability Test',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Plan and run a real usability test on your own prototype, and correctly interpret the difference between a usability issue and a one-off opinion.

**Prerequisites:** Module 3, "From Wireframes to Interactive Prototypes" (the prototype used here is the same one from that lesson).

**Instructional content:**
A **usability test** observes a real (or representative) user attempting real tasks on a real prototype — its purpose is closing the loop this whole course has been building toward: research (Module 2) informed a wireframe, which became a prototype (Module 3), and now that prototype gets tested against its actual purpose rather than assumed to work.

A basic, honest test plan defines, before the session starts: 1-3 **specific tasks** (not "explore the app," which produces unfocused, hard-to-interpret behavior), a **success criterion** for each task (did the user complete it, and how directly — not just "did they eventually get there somehow"), and a rule for staying silent during the task (a facilitator who helps the moment a user hesitates never observes the real friction point that help just erased).

Nielsen's widely-cited usability heuristics (visibility of system status, match between system and the real world, user control and freedom, consistency and standards, error prevention, recognition over recall, flexibility, aesthetic and minimalist design, error recovery, help and documentation) are a useful lens for interpreting *why* an observed struggle happened, once you've actually observed one — they are a diagnostic framework applied after observation, not a substitute for running a real test.

**Common mistakes:** treating a single participant's struggle as proof of a universal usability problem (the same overclaiming mistake Module 2's research lesson warned against, recurring here) versus treating a single participant's *success* as proof the design is fine (one success is equally weak evidence) — a small number of real sessions (even 3-5) reliably surfaces most major usability issues, per widely-cited usability research, but a single session of either outcome should be treated as a signal to investigate further, not a conclusion; helping a struggling participant mid-task, which erases the exact friction point the test exists to observe.

**Practical example:** A participant who takes 6 clicks to find a feature that should take 2, but eventually succeeds, is still a real usability finding — "completed the task" is not the same as "completed it usably." A test plan that only tracks binary success/failure, not directness, would miss this entirely.

**Exercise:** Write a 3-task usability test plan for your Module 3 prototype, with a stated success criterion for each task. Run it with at least one real (or role-played) participant, staying silent during each task attempt. Record what happened, including any struggle that didn't technically fail the task.

**Expected outcome:** You have a real usability test plan and at least one real session's findings, distinguishing directness/struggle from binary success.

**Reading:** Nielsen Norman Group, "10 Usability Heuristics for User Interface Design" (Jakob Nielsen) — https://www.nngroup.com/articles/ten-usability-heuristics/ (live-verified this phase).

**Homework:** Bring your test plan and findings into this module's project — the deliverable is a real test, not a hypothetical one.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Design Systems & Usability Testing) — the final module of UI/UX Design Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Design Systems & Usability Testing',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What real problem do design tokens (e.g. a named `color-primary` value) solve, per this module?',
            questionType: 'single',
            options: [
              'They make the design file smaller in storage size',
              'They prevent the same value (e.g. a brand color) from independently drifting into slightly different, inconsistent versions across screens',
              'They are required by law for accessible interfaces',
              'They replace the need for a type scale',
            ],
            correctAnswer: [
              'They prevent the same value (e.g. a brand color) from independently drifting into slightly different, inconsistent versions across screens',
            ],
          },
          {
            prompt: 'Which of the following describes documentation that actually governs consistent component usage, per this module\'s Lesson 2? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'States when to use the component versus a plausible alternative',
              'Only shows a visual screenshot of the component',
              'Defines the component\'s states/variants',
              'Is kept in sync with the actual implemented component',
            ],
            correctAnswer: [
              'States when to use the component versus a plausible alternative',
              'Defines the component\'s states/variants',
              'Is kept in sync with the actual implemented component',
            ],
          },
          {
            prompt: 'True or False: a usability test task should be phrased broadly, like "explore the app," to avoid biasing the participant.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Scenario: during a usability test, a participant hesitates on a task. The facilitator immediately steps in to help. What does this module say is lost by doing this?',
            questionType: 'single',
            options: [
              'Nothing is lost — helping ensures the task gets completed, which is what matters',
              'The exact friction point the test exists to observe is erased before it can be recorded',
              'This only matters for remote usability tests, not in-person ones',
              'It only matters if the participant was a first-time user',
            ],
            correctAnswer: [
              'The exact friction point the test exists to observe is erased before it can be recorded',
            ],
          },
          {
            prompt: 'Practical question: why is a participant who eventually completes a task in 6 clicks (when 2 would suffice) still a meaningful usability finding, per this module?',
            questionType: 'text',
            correctAnswer:
              'Completing a task is not the same as completing it usably — tracking only binary success/failure misses real friction (extra clicks, hesitation, wrong paths tried) that a directness-aware test plan captures and a success-only test plan would miss entirely.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [uiuxModule3, uiuxModule4];

// ---------------------------------------------------------------------
// UI/UX Design Foundations — 2 new standalone Projects (Phase 26
// architecture, real instructions, no sourceLessonId), bringing the
// course to its blueprint total of 3 projects.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'ui-ux-design-foundations',
    title: 'Accessible Interactive Prototype',
    description:
      'Intermediate tier — a real, clickable prototype for one task flow, built to pass a genuine 3-part accessibility audit (automated scan, keyboard-only pass, screen-reader spot-check).',
    instructions: `**Objective:** Build a clickable prototype for one real task flow, apply real interaction-feedback states, and pass a genuine 3-part accessibility audit — not a hypothetical one.

**Requirements:**
- A clickable prototype covering one real task path end to end (per Module 3, Lesson 1) — low- or high-fidelity, whichever the task genuinely calls for, with your choice justified in 2-3 sentences.
- Every interactive element on that path has defined feedback states (default, hover/focus, disabled/loading, error where applicable) — per Module 3, Lesson 2.
- Real color contrast meeting WCAG AA (4.5:1 for normal text), checked with an actual contrast tool, not eyeballed.
- Real semantic structure — headings, buttons, and form labels used correctly, not styled divs.
- A completed 3-part accessibility audit (automated scan, keyboard-only pass, screen-reader spot-check) per Module 3, Lesson 4, with every finding documented — including any issues you did NOT fully fix, stated honestly.

**Expected result:** The clickable prototype itself (any prototyping tool, or linked static screens, is acceptable) plus a written accessibility audit report listing every finding from all 3 check types and what was done about each one.

**Difficulty:** Intermediate.

**Skills tested:** translating a wireframe into a real interactive prototype, applying interaction-feedback patterns, running and honestly reporting a real accessibility audit (not just claiming compliance).

**Suggested implementation steps:**
1. Choose one real task flow from your Module 2 research/wireframe work — do not prototype the whole application.
2. Build the clickable prototype, defining feedback states for every interactive element as you go (not retrofitted afterward).
3. Run the contrast check and fix any failures before moving on.
4. Run all 3 accessibility checks from Module 3, Lesson 4, and document every finding — including ones you choose not to fix, with your reasoning.

**Evaluation criteria:** the prototype genuinely covers one real, complete task path (not a fragment); interaction feedback states are actually defined, not assumed; the accessibility audit is real and specific (cites the actual WCAG-grounded issue, not a vague impression); honest reporting of unresolved issues is treated as a strength, not a deduction.`,
    position: 1,
  },
  {
    courseSlug: 'ui-ux-design-foundations',
    title: 'Design System & Usability Test Report',
    description:
      'Professional Capstone — extend your color/type/spacing decisions into a documented design system, then close the loop with a real usability test against your Module 3 prototype.',
    instructions: `**Objective:** Produce a small but real design system (tokens, at least 2 documented components) and a real usability test report against your Module 3 prototype — the two closing skills of this course, combined into one capstone deliverable.

**Requirements:**
- Design tokens named from your Module 1 color/type/spacing decisions (per Module 4, Lesson 1) — not raw, unnamed values.
- At least 2 documented components (e.g. a button and a form field), each with defined states and real usage documentation stating when to use it versus a plausible alternative (per Module 4, Lesson 2) — not just a visual screenshot.
- A written usability test plan with 2-3 specific tasks and a stated success criterion for each (per Module 4, Lesson 3).
- At least one real (or role-played, if a participant isn't available) usability test session against your Module 3 prototype, run silently during each task attempt.
- A findings report that distinguishes binary success/failure from directness/struggle (e.g. "completed in 6 clicks where 2 would suffice" is a real finding, not just "passed").

**Expected result:** Your token list + 2 documented components, plus a written test plan and session findings report (a simple document is sufficient — no special tooling required).

**Difficulty:** Professional Capstone.

**Skills tested:** extracting reusable design-system decisions from real prior work (not designed in the abstract), writing documentation another person could actually follow, planning and running a real usability test, honestly distinguishing real findings from assumptions.

**Suggested implementation steps:**
1. Extract tokens from your actual Module 1 palette/scale — don't invent a new one for this project.
2. Document 2 components fully (states + usage rules) before moving to the test plan.
3. Write the test plan's tasks and success criteria before running any session, so the plan isn't retrofitted to match what happened.
4. Run at least one session silently, then write the findings report distinguishing struggle from binary success.

**Evaluation criteria:** tokens/components are grounded in your own real prior work, not invented fresh; component documentation includes real usage rules, not just appearance; the test plan has specific tasks and success criteria defined in advance; findings honestly capture directness/struggle, not just pass/fail.`,
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
        // sourceLessonId deliberately omitted — real, standalone Project
        // rows via the Phase 26 architecture, matching Phase 27's
        // precedent for this course's existing project.
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 30 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 30 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

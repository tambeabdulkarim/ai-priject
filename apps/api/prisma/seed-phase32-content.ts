// Phase 32 — Educational Content Production: Full-Stack Web Development
// with Next.js.
//
// Completes the course to production-ready status, per
// docs/content-library/courses.md's approved 6-module breakdown. Module 1
// (HTML, CSS & Responsive Layout, Phase 25) already exists and is NOT
// touched or duplicated — this file adds Modules 2-6 (JavaScript &
// TypeScript Fundamentals; Frontend Frameworks/React; Backend Web
// Frameworks & REST API Design; Full-Stack Frameworks/Next.js; Web
// Performance & Security Basics), plus the 5 remaining standalone
// Projects the blueprint calls for (course total: 6), created directly
// via the Phase 26 Project model.
//
// Same application-level idempotency pattern as seed-phase25/27/30/31:
// findFirst by parent+title before create.
//
// Resources: reuses already-verified MDN Web Docs, Next.js Documentation,
// Prisma Documentation, PostgreSQL Documentation (all VERIFIED Phase 25).
// Four new resources were live-fetched and confirmed this phase:
//   - https://react.dev/learn — official React documentation, confirmed
//     live via WebFetch, 2026-08-10.
//   - https://www.typescriptlang.org/docs/ — official TypeScript
//     documentation (Microsoft), confirmed live via WebFetch, 2026-08-10.
//   - https://nodejs.org/docs/latest/api/ — official Node.js API
//     documentation, confirmed live via WebFetch, 2026-08-10.
//   - https://owasp.org/www-project-top-ten/ — the official OWASP Top Ten
//     project page, confirmed live via WebFetch, 2026-08-10.
// No ISBN, video URL, author, or documentation link is invented anywhere
// in this file.

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
// Module 2: JavaScript & TypeScript Fundamentals
// ---------------------------------------------------------------------
const webdevModule2: ModuleSeed = {
  courseSlug: 'fullstack-web-development-nextjs',
  title: 'JavaScript & TypeScript Fundamentals',
  position: 2,
  description:
    'Moves from static markup (Module 1) into real application logic — JavaScript\'s core behavior, asynchronous code, and the static typing layer TypeScript adds on top.',
  lessons: [
    {
      title: 'JavaScript Fundamentals: Values, Functions & Scope',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**Objective:** Correctly reason about JavaScript's core value types, function behavior, and variable scope — the foundation every later module depends on.

**Prerequisites:** Module 1 (HTML, CSS & Responsive Layout) — this module adds behavior to the structure/style Module 1 covered.

**Instructional content:**
Three foundational properties shape almost everything else in JavaScript:

1. **Values are either primitives or objects.** Primitives (string, number, boolean, null, undefined) are compared and copied by value; objects (including arrays and functions) are compared and copied by reference. A common real bug: assuming copying an object variable copies its contents — it copies the reference, so both variables point at the same underlying object.
2. **Functions are values.** A function can be assigned to a variable, passed as an argument, and returned from another function — this is the direct basis for callbacks, array methods like "map"/"filter", and (later) React components themselves.
3. **Scope determines where a variable is visible.** "let"/"const" are block-scoped (visible only within the nearest enclosing braces); the older "var" is function-scoped, a real, common source of confusing bugs when a variable "leaks" out of a block a newcomer expected to contain it.

**Common mistakes:** assuming "const" makes an object's contents immutable (it only prevents reassigning the variable itself — the object's properties can still be mutated); relying on "var"'s function-scoping without understanding why a "var" declared inside an if-block is still visible outside it, unlike "let"/"const".

**Practical example:** "const arr = [1,2,3]; arr.push(4);" is valid — "const" only prevents "arr = somethingElse", not mutating the array's contents. This surprises newcomers who read "const" as "fully immutable."

**Exercise:** Write 3 short code snippets demonstrating: (1) a primitive copied by value behaving independently after copy, (2) an object copied by reference where mutating one variable affects the other, (3) a "var" declared inside an if-block remaining visible outside it.

**Expected outcome:** Given any variable assignment or function definition, you can correctly predict whether a value is copied by reference or by value, and where a variable is actually visible.

**Reading:** MDN Web Docs — https://developer.mozilla.org (already verified Phase 25).

**Homework:** Keep your 3 snippets — they're referenced again in Lesson 3's TypeScript discussion.`,
    },
    {
      title: 'Asynchronous JavaScript: Promises & Async/Await',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly sequence asynchronous operations using Promises and async/await, and explain why JavaScript needs this at all.

**Prerequisites:** "JavaScript Fundamentals: Values, Functions & Scope."

**Instructional content:**
JavaScript runs on a single thread but still needs to handle slow operations (network requests, file reads) without freezing — **asynchronous** code is how it does this without blocking. A **Promise** represents a value that will exist eventually (either successfully resolved or rejected with an error); **async/await** is syntax that lets asynchronous code read like ordinary sequential code, while still being non-blocking underneath.

Two practical rules matter most:
1. **An "await" only pauses the enclosing async function, not the whole program.** Other code keeps running while an awaited operation is pending — this is the entire point.
2. **Error handling for async code uses try/catch around "await", not a bare try/catch around synchronous-looking code that secretly isn't.** A rejected Promise that's awaited without a surrounding try/catch produces an unhandled rejection — a real, common source of silently-swallowed errors if not handled deliberately.

**Common mistakes:** forgetting "await" before a Promise-returning call (the code then works with the Promise object itself, not its eventual value — a very common, confusing bug); wrapping multiple independent "await" calls sequentially when they could run concurrently (e.g. via "Promise.all"), needlessly slowing down the total operation.

**Practical example:** "const data = fetch(url);" (missing "await") gives "data" as a pending Promise object, not the actual response — later code trying to read a property off it will fail confusingly. "const data = await fetch(url);" gives the real resolved value.

**Exercise:** Write an async function that fetches from 2 independent URLs. First write it with sequential "await" calls (one after another), then rewrite it using "Promise.all" to run both concurrently. Explain why the second version is faster.

**Expected outcome:** You can correctly use async/await for sequential dependent operations and "Promise.all" for independent concurrent ones, and you understand why a missing "await" is a real, common bug.

**Homework:** None — feeds into Module 3's data-fetching lesson.`,
    },
    {
      title: 'TypeScript Fundamentals: Static Typing for JavaScript',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Apply TypeScript's core type system to catch real errors before code runs, not just to satisfy the compiler.

**Prerequisites:** "JavaScript Fundamentals: Values, Functions & Scope."

**Instructional content:**
TypeScript adds a static type system on top of JavaScript — types are checked when code is compiled, not only when it runs, catching a real class of bugs earlier than plain JavaScript ever could. Three practical habits matter most for real code:

1. **Type function parameters and return values explicitly**, especially at module boundaries (functions other files will call) — this is where mismatched-type bugs most commonly slip through undetected in plain JavaScript.
2. **Prefer precise types over "any".** "any" opts a value out of type checking entirely — using it defeats the actual purpose of adopting TypeScript in the first place, and it's a real, common shortcut worth resisting except in genuinely unavoidable cases (e.g. some third-party library boundaries).
3. **Use interfaces/type aliases to name real domain shapes** (e.g. a "User" or "Product" shape used across many functions), rather than repeating an inline object-shape definition everywhere it's used — this is the same "single source of truth" discipline Module 4 (Design Systems, in the UI/UX course) applied to visual decisions, applied here to data shapes.

**Common mistakes:** reaching for "any" the moment a type error is inconvenient, rather than fixing the actual type mismatch it's flagging (a real, common way TypeScript's benefit gets silently discarded); defining the same object shape inline in multiple functions instead of a single named type, so a later field addition has to be found and updated in every duplicate location.

**Practical example:** A function typed as "function getUser(id: string): User" makes a caller's mistake (passing a number, or expecting a field the User type doesn't have) a compile-time error instead of a runtime surprise discovered only when that code path finally executes in production.

**Exercise:** Take one of your Lesson 1 code snippets. Add explicit parameter and return types to any function in it, and define a named interface/type alias for any object shape it uses more than once.

**Expected outcome:** You can explain, concretely, what a real type error TypeScript would catch actually protects against — not just recite "TypeScript adds types."

**Reading:** TypeScript Documentation — https://www.typescriptlang.org/docs/ (live-verified this phase).

**Homework:** Keep your typed snippet — direct input to this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (JavaScript & TypeScript Fundamentals). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — JavaScript & TypeScript Fundamentals',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What real problem does assuming "const" makes an object fully immutable lead to, per this module?',
            questionType: 'single',
            options: [
              'No real problem — const does make objects fully immutable',
              'const only prevents reassigning the variable itself; the object\'s properties can still be mutated, which can surprise a developer expecting full immutability',
              'const is only usable with primitive values',
              'const and let behave identically in all cases',
            ],
            correctAnswer: [
              'const only prevents reassigning the variable itself; the object\'s properties can still be mutated, which can surprise a developer expecting full immutability',
            ],
          },
          {
            prompt: 'Which of the following are real, common async/await mistakes covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Forgetting await before a Promise-returning call, working with the Promise object instead of its resolved value',
              'Running multiple independent awaited calls sequentially when Promise.all could run them concurrently',
              'Using try/catch around an awaited call to handle a rejection',
              'Async/await eliminates the need to ever handle errors',
            ],
            correctAnswer: [
              'Forgetting await before a Promise-returning call, working with the Promise object instead of its resolved value',
              'Running multiple independent awaited calls sequentially when Promise.all could run them concurrently',
            ],
          },
          {
            prompt: 'True or False: using "any" in TypeScript opts a value out of type checking entirely.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: a function "getUser(id: string): User" is called with a number by mistake. What does this module say happens, compared to plain JavaScript?',
            questionType: 'single',
            options: [
              'Nothing different happens — TypeScript provides no benefit here',
              'TypeScript catches this as a compile-time error instead of it becoming a runtime surprise discovered later',
              'The function silently converts the number to a string automatically',
              'This can only be caught by writing a unit test',
            ],
            correctAnswer: [
              'TypeScript catches this as a compile-time error instead of it becoming a runtime surprise discovered later',
            ],
          },
          {
            prompt: 'Practical question: why does this module recommend naming a domain shape (e.g. a "User" type) once rather than repeating an inline object-shape definition in every function that uses it?',
            questionType: 'text',
            correctAnswer:
              'A single named type keeps the shape\'s definition in one place, so a later field addition or change only needs to be made once — repeated inline definitions can drift out of sync with each other over time, the same duplication risk this codebase\'s own conventions warn against elsewhere.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Frontend Frameworks (React)
// ---------------------------------------------------------------------
const webdevModule3: ModuleSeed = {
  courseSlug: 'fullstack-web-development-nextjs',
  title: 'Frontend Frameworks (React)',
  position: 3,
  description:
    'Applies Module 2\'s JavaScript/TypeScript foundation to build real, stateful, component-based user interfaces — the direct basis for Module 5\'s Next.js work.',
  lessons: [
    {
      title: 'React Fundamentals: Components, Props & State',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Build a component-based UI using props for configuration and state for what changes over time, correctly distinguishing the two.

**Prerequisites:** Module 2 (JavaScript & TypeScript Fundamentals) — React components are, at their core, the plain functions Module 2, Lesson 1 introduced.

**Instructional content:**
React organizes a UI as a tree of **components** — functions that return markup (JSX). Two distinct concepts control what a component renders:

1. **Props.** Data passed into a component from its parent, read-only from the component's own perspective — the same "configuration passed in" pattern as a regular function's parameters (Module 2, Lesson 1).
2. **State.** Data a component owns and can change over time (via the "useState" Hook), where changing it triggers React to re-render the component with the new value. Confusing props and state is a real, common source of bugs: a component trying to directly modify a prop it received (rather than lifting the change up to whichever component actually owns that state) will not behave as expected.

**Common mistakes:** mutating a prop directly inside a child component instead of calling a function the parent passed down to request the change (props are the parent's data, not the child's to mutate); storing a value in state that could instead be computed directly from existing props/state during render — this creates two sources of truth that can drift out of sync, an unnecessary duplication risk.

**Practical example:** A checkbox component that receives "checked" as a prop and tries to toggle it internally, rather than calling an "onToggle" callback prop the parent provides, will visually update once and then get overwritten the next time the parent re-renders with the original prop value — because the parent, not the child, actually owns that piece of state.

**Exercise:** Design (in pseudocode or real JSX) a simple counter component. Decide whether the count value should live in the counter component itself or be passed down as a prop from a parent — justify your choice based on which component actually needs to react to changes in it.

**Expected outcome:** Given any piece of UI data, you can correctly decide whether it belongs in props or state, and explain why mutating a prop directly is a real bug, not just a style preference.

**Reading:** React Documentation — https://react.dev/learn (live-verified this phase).

**Homework:** Keep your counter component design — direct input to Lesson 3.`,
    },
    {
      title: 'Managing Side Effects and Data Fetching in React',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly fetch data in a React component using the "useEffect" Hook, handling loading and error states explicitly.

**Prerequisites:** "React Fundamentals: Components, Props & State"; Module 2's async/await lesson.

**Instructional content:**
Rendering itself should be a "pure" calculation from props/state to UI — anything that reaches outside the component (a network request, a subscription, manually touching the DOM) is a **side effect**, and React's "useEffect" Hook is where such effects belong, run after render rather than during it.

A real, complete data-fetching effect handles 3 distinct states, not just the success case: **loading** (the request hasn't resolved yet — the UI should show this, not a blank or stale screen), **error** (the request failed — the UI should say so, not silently show nothing), and **success** (the real data, ready to render). Skipping the loading/error states is a real, common shortcut that leaves users staring at a blank or broken-looking screen with no explanation.

**Common mistakes:** fetching data directly during render instead of inside "useEffect" (this re-fetches on every render, an unintended, wasteful side effect); omitting the effect's dependency array or getting it wrong, causing the effect to re-run far more (or less) often than intended — this is one of the most common real React bugs, directly analogous to Module 2's "await" mistakes in that it silently changes program behavior in a way that's easy to miss.

**Practical example:** A component that fetches a user's profile with no loading state shows a blank card for however long the request takes, which most users read as broken rather than "still loading" — adding a simple "Loading..." state during the fetch is a small change that directly fixes a real, common UX problem, not just theoretical.

**Exercise:** Design a component that fetches a list of items on mount. Sketch its 3 states explicitly (loading, error, success) and what each renders.

**Expected outcome:** Given any data-fetching component, you can identify whether it correctly handles all 3 states, and explain what specifically an incorrect "useEffect" dependency array would cause.

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'Composing Real UIs: Lifting State & Component Design',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Structure a multi-component UI by correctly deciding where each piece of state should live, applying "lifting state up" where two components need to share it.

**Prerequisites:** "React Fundamentals: Components, Props & State."

**Instructional content:**
When two sibling components both need access to the same piece of state, the state should live in their closest common parent, passed down to each as props — this pattern is called **lifting state up**. It directly follows from Lesson 1's rule (a component shouldn't mutate a prop it doesn't own) generalized to multiple components: whichever component is the shared "owner" of a piece of state is the only one that should actually hold it.

A practical rule for deciding where state belongs: state should live at the lowest common point in the component tree that still has access to every component that needs to read or change it — not automatically at the very top of the whole application, which needlessly forces every intermediate component to pass props through layers that don't otherwise need them (a real, common over-engineering mistake called "prop drilling" when taken too far).

**Common mistakes:** duplicating the same piece of state independently in two sibling components instead of lifting it to their shared parent (the same "two sources of truth can drift" risk from Lesson 1, now across components instead of within one); lifting every piece of state all the way to the application's root by default, causing deep, unnecessary prop drilling through components that don't actually need most of what they're passing through.

**Practical example:** A search input and a results list that are sibling components both need the current search term — placing that term's state in their shared parent (which passes it down to the input to control it, and to the results list to filter by it) is correct; each component independently tracking its own copy of "the search term" would drift out of sync the moment the user types.

**Exercise:** For a hypothetical shopping cart UI (a product list, a cart summary, and an "add to cart" button on each product), decide where the cart's contents should live, and justify your choice using this lesson's "lowest common point" rule.

**Expected outcome:** Given a multi-component UI with shared data, you can correctly decide where state should live and explain why placing it too high causes unnecessary prop drilling while placing it too low causes state to drift out of sync.

**Homework:** Bring your shopping-cart state design into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Frontend Frameworks/React). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Frontend Frameworks (React)',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why does a checkbox component that tries to mutate a "checked" prop directly instead of calling a parent-provided callback behave incorrectly, per this module?',
            questionType: 'single',
            options: [
              'It does not behave incorrectly — this is the recommended pattern',
              'Props are the parent\'s data, not the child\'s to mutate — the parent, not the child, actually owns that state and will overwrite the change on the next re-render',
              'React does not allow checkboxes to have props at all',
              'This only matters for class components, not function components',
            ],
            correctAnswer: [
              'Props are the parent\'s data, not the child\'s to mutate — the parent, not the child, actually owns that state and will overwrite the change on the next re-render',
            ],
          },
          {
            prompt: 'Which of the following are real states a complete data-fetching component should handle, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Loading',
              'Error',
              'Success',
              'Only success — loading and error states are optional polish',
            ],
            correctAnswer: ['Loading', 'Error', 'Success'],
          },
          {
            prompt: 'True or False: fetching data directly during a component\'s render (instead of inside useEffect) causes the fetch to re-run on every render.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: two sibling components both need the current search term. Per this module\'s "lifting state up" principle, where should that state live?',
            questionType: 'single',
            options: [
              'Duplicated independently in each sibling component',
              'In their closest common parent, passed down to each as props',
              'Always at the absolute root of the entire application',
              'It does not matter where it lives',
            ],
            correctAnswer: [
              'In their closest common parent, passed down to each as props',
            ],
          },
          {
            prompt: 'Practical question: why does this module warn against lifting every piece of state all the way to the application\'s root by default?',
            questionType: 'text',
            correctAnswer:
              'Lifting state higher than necessary forces intermediate components that don\'t actually need that data to pass it through as props anyway (prop drilling) — state should live at the lowest common point in the tree that still reaches every component that needs it, not automatically at the top.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: Backend Web Frameworks & REST API Design
// ---------------------------------------------------------------------
const webdevModule4: ModuleSeed = {
  courseSlug: 'fullstack-web-development-nextjs',
  title: 'Backend Web Frameworks & REST API Design',
  position: 4,
  description:
    'Moves from the frontend (Modules 2-3) to the server side — designing a real REST API and persisting real data, the two halves Module 5 connects into one full-stack application.',
  lessons: [
    {
      title: 'REST API Design Principles',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Design a REST API's resources, URLs, and HTTP methods correctly, and explain why consistency matters more than any single "correct" convention.

**Prerequisites:** Module 2 (JavaScript & TypeScript Fundamentals).

**Instructional content:**
A REST API organizes functionality around **resources** (nouns — "users," "orders," "products"), addressed by URLs, acted on via HTTP methods that each carry a specific, conventional meaning:

1. **GET** retrieves a resource, without side effects — a client (or an intermediate cache) should be able to assume calling GET repeatedly is always safe.
2. **POST** creates a new resource.
3. **PUT/PATCH** update an existing resource (PUT typically replaces it wholesale; PATCH applies a partial update).
4. **DELETE** removes a resource.

Resource URLs should be nouns, not verbs — "/orders/42" (a specific order resource), not "/getOrder?id=42" (a verb-shaped, RPC-style URL) — because the HTTP method already carries the verb; repeating it in the URL is redundant and breaks the convention a REST client expects.

**Common mistakes:** using GET for an operation that has side effects (e.g. a GET request that deletes something) — this breaks the "GET is always safe to repeat" assumption every HTTP client and cache relies on; inconsistent resource naming across an API (e.g. "/user" singular in one place, "/products" plural in another) which makes the API harder to predict and use correctly without constantly checking documentation.

**Practical example:** "DELETE /orders/42" is a well-formed REST request — the resource is named as a noun, the method carries the verb. "GET /deleteOrder?id=42" violates both conventions at once: a verb baked into the URL, and a destructive action performed via a method that's supposed to be side-effect-free.

**Exercise:** Design REST endpoints (method + URL) for basic CRUD operations (create, read, update, delete) on a "reviews" resource belonging to a "products" resource. Justify each URL's structure.

**Expected outcome:** Given any API operation, you can choose the correct HTTP method and a consistent, noun-based URL structure — and explain specifically why breaking these conventions (e.g. a destructive GET) is a real problem, not just a style violation.

**Reading:** MDN Web Docs (HTTP section) — https://developer.mozilla.org (already verified Phase 25).

**Homework:** Keep your "reviews" endpoint design — direct input to Lesson 2.`,
    },
    {
      title: 'Building a Backend Route: Validation, Errors & Status Codes',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Implement a real backend route that validates input, returns correct HTTP status codes, and never trusts client-supplied data.

**Prerequisites:** "REST API Design Principles."

**Instructional content:**
A real, production-usable route does 3 things a naive one skips:

1. **Validates all input server-side**, regardless of any client-side validation. Client-side checks are a real UX convenience, never a security boundary — any request can bypass the frontend entirely (a direct API call, a modified request), so the server must independently verify every input is well-formed and permitted, every time.
2. **Returns the correct HTTP status code for the actual outcome** — 200 for success, 201 specifically for a successful creation, 400 for a malformed request, 401 for missing/invalid authentication, 403 for an authenticated-but-not-permitted request, 404 for a resource that doesn't exist, 500 for an unexpected server error. Returning 200 for every outcome (with error details only in the response body) breaks any client or tooling that reasonably relies on status codes to distinguish success from failure.
3. **Never trusts a client-supplied identifier for authorization.** A request claiming to act "as user 42" must be verified against the actual authenticated session/token — trusting a client-supplied user ID field directly is a real, serious vulnerability (a user could simply claim to be someone else).

**Common mistakes:** validating input only on the frontend and assuming that's sufficient (it is not — a direct API call skips it entirely); returning HTTP 200 for a validation failure with only an error message in the body, which breaks how most HTTP clients and monitoring reasonably use status codes to detect failure.

**Practical example:** A route accepting "{ userId: 42, action: 'delete' }" that trusts the client-supplied "userId" field directly, without checking it against the actual authenticated session, lets any caller claim to be any user — the correct approach derives the acting user's identity from server-verified authentication, never from a client-supplied field.

**Exercise:** Design (in pseudocode) a route handler for "POST /reviews" from Lesson 1. List each validation check it must perform server-side, and the status code it should return for each specific failure case (missing field, unauthenticated, resource not found).

**Expected outcome:** Given any backend route, you can list what server-side validation it needs regardless of frontend checks, and choose the correct status code for each real outcome.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Databases & ORMs: Persisting Real Data',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**Objective:** Explain what an ORM does and correctly reason about when its query patterns risk real performance problems like the N+1 query problem.

**Prerequisites:** "Building a Backend Route: Validation, Errors & Status Codes."

**Instructional content:**
An **ORM** (Object-Relational Mapper) lets application code work with database records as regular objects/functions instead of writing raw SQL for every query — real, genuine productivity and safety benefits (it also typically prevents a whole class of SQL-injection bugs by construction, since query parameters are handled safely rather than string-concatenated).

The most important real performance pitfall to understand is the **N+1 query problem**: fetching a list of N records, then querying the database again separately for each one's related data (N additional queries) instead of a single query that fetches everything needed up front. This is easy to write by accident with an ORM's convenient per-record relation access, and can silently turn one intended database round-trip into dozens or hundreds under real data volume.

**Common mistakes:** looping over a list of records and querying each one's related data individually inside the loop (the N+1 pattern) instead of using the ORM's built-in mechanism for fetching related data in one combined query; treating an ORM as a reason to never think about the underlying SQL/performance at all — an ORM changes how you write the query, not whether performance still matters.

**Practical example:** Fetching 50 orders, then separately querying each order's customer record inside a loop, issues 51 total queries (1 + 50) — the N+1 problem. Fetching the same 50 orders with their customer data included in a single combined query issues 1 (or 2) queries total for the exact same data, regardless of how many orders there are.

**Exercise:** Take your Lesson 1 "reviews" resource. Describe, in plain terms, a real N+1 scenario that could occur when fetching a list of products along with each one's reviews, and how you would avoid it.

**Expected outcome:** You can identify an N+1 query pattern in a described data-fetching scenario and explain the fix in terms of fetching related data together rather than per-record in a loop.

**Reading:** Prisma Documentation — https://www.prisma.io/docs (already verified Phase 25); PostgreSQL Documentation — https://www.postgresql.org/docs (already verified Phase 25).

**Homework:** Bring your N+1 analysis into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Backend Web Frameworks & REST API Design). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Backend Web Frameworks & REST API Design',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is "GET /deleteOrder?id=42" a poorly-designed REST request, per this module?',
            questionType: 'single',
            options: [
              'It is well-designed and follows REST conventions correctly',
              'It bakes a verb into the URL and performs a destructive action via GET, which is supposed to be safe to repeat with no side effects',
              'GET requests cannot include query parameters',
              'REST APIs cannot support delete operations at all',
            ],
            correctAnswer: [
              'It bakes a verb into the URL and performs a destructive action via GET, which is supposed to be safe to repeat with no side effects',
            ],
          },
          {
            prompt: 'Which of the following are real reasons server-side validation is required regardless of client-side checks, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A direct API call can bypass frontend validation entirely',
              'Client-side validation is a UX convenience, never a security boundary',
              'Client-side validation makes server-side validation unnecessary',
              'A modified or crafted request can skip whatever the frontend enforces',
            ],
            correctAnswer: [
              'A direct API call can bypass frontend validation entirely',
              'Client-side validation is a UX convenience, never a security boundary',
              'A modified or crafted request can skip whatever the frontend enforces',
            ],
          },
          {
            prompt: 'True or False: trusting a client-supplied user ID field for authorization (instead of the server-verified authenticated session) is a real, serious vulnerability.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Scenario: fetching 50 orders, then querying each order\'s customer record individually inside a loop, issues 51 total database queries. What is this pattern called, per this module?',
            questionType: 'single',
            options: [
              'A join operation',
              'The N+1 query problem',
              'Database sharding',
              'This is the correct, expected way to fetch related data',
            ],
            correctAnswer: ['The N+1 query problem'],
          },
          {
            prompt: 'Practical question: why does returning HTTP 200 for every outcome (including validation failures, with error details only in the response body) cause real problems?',
            questionType: 'text',
            correctAnswer:
              'Clients, tooling, and monitoring reasonably rely on the HTTP status code itself to distinguish success from failure — returning 200 for a failure breaks that assumption and can cause a client to treat a failed request as if it succeeded.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 5: Full-Stack Frameworks (Next.js)
// ---------------------------------------------------------------------
const webdevModule5: ModuleSeed = {
  courseSlug: 'fullstack-web-development-nextjs',
  title: 'Full-Stack Frameworks (Next.js)',
  position: 5,
  description:
    'Connects Module 3\'s React frontend work and Module 4\'s backend/REST work into one real, deployable full-stack application using Next.js — the course\'s namesake framework.',
  lessons: [
    {
      title: 'Next.js Fundamentals: Routing & Rendering Strategies',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly choose a rendering strategy (static, server, or client) for a given page based on its actual data and interactivity needs.

**Prerequisites:** Module 3 (Frontend Frameworks/React); Module 4 (Backend Web Frameworks & REST API Design).

**Instructional content:**
Next.js extends React with file-based routing (a file's location in the project defines its URL) and, critically, a choice of **rendering strategy** per page:

1. **Static rendering.** The page's HTML is generated ahead of time (at build time) and served as-is — fastest possible delivery, correct for content that's the same for every visitor and doesn't change on every request (e.g. a marketing page, a blog post).
2. **Server rendering.** The page's HTML is generated fresh on each request, on the server — correct when content is per-request-specific (e.g. depends on the logged-in user, or must reflect the absolute latest data).
3. **Client-side rendering/interactivity.** Some UI genuinely needs to run in the browser after load (interactive widgets, anything responding to user input in real time) — this is where Module 3's React component work (state, effects) actually executes.

Choosing the wrong strategy has a real, direct cost: statically rendering per-user content either serves stale/wrong data to different users, or forces an unnecessary full rebuild constantly; server-rendering genuinely static content wastes server work re-generating identical output on every request.

**Common mistakes:** defaulting every page to server rendering "to be safe," even when the content is genuinely static and would benefit from the speed and reduced server load of static rendering; making an entire page client-rendered when only one small interactive piece of it actually needs to run in the browser, unnecessarily shipping more JavaScript to the client than the page needs.

**Practical example:** A product catalog page whose content changes rarely is a strong static-rendering candidate; a user's personal order-history page (different for every logged-in user, must reflect their real current data) needs server rendering; a single "add to cart" button's click-handling logic is the one piece that genuinely needs to run client-side, not the whole surrounding page.

**Exercise:** For 3 hypothetical pages (a public product catalog, a logged-in user's dashboard, and a real-time stock ticker widget), choose the correct rendering strategy for each and justify your choice against this lesson's criteria.

**Expected outcome:** Given any page's actual data and interactivity requirements, you can choose the rendering strategy that correctly matches them, rather than defaulting to one strategy everywhere.

**Reading:** Next.js Documentation — https://nextjs.org/docs (already verified Phase 25).

**Homework:** Keep your 3-page rendering-strategy analysis — direct input to Lesson 2.`,
    },
    {
      title: 'Server Components vs. Client Components',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly decide whether a given React component in a Next.js app should be a Server Component or a Client Component.

**Prerequisites:** "Next.js Fundamentals: Routing & Rendering Strategies."

**Instructional content:**
Next.js's App Router treats components as **Server Components by default** — they run only on the server, are never shipped to the browser as JavaScript, and can directly access server-only resources (a database, a secret API key) safely, since their code never reaches the client. A component becomes a **Client Component** only when explicitly marked as one, which is required whenever it needs browser-only capabilities: interactivity (event handlers like onClick), React state/effects (Module 3's Hooks), or browser-only APIs.

The practical design principle: push Client Components as far down (as "leaf-like") in the component tree as the actual interactivity requires — a page can be mostly Server Components, with only the specific small pieces that genuinely need interactivity marked as Client Components, rather than making an entire page a Client Component because one button inside it needs an onClick handler.

**Common mistakes:** marking an entire page as a Client Component because one small part of it needs interactivity, unnecessarily shipping the whole page's JavaScript to the browser and losing the direct-server-access benefit for the rest of it; putting a secret (an API key, a database credential) in a Client Component, where it would be exposed in the browser's shipped JavaScript — a real, serious security mistake, not just a performance one.

**Practical example:** A product page showing product details (static-ish, server-fetchable data) plus an "Add to Review" form (genuinely interactive) should keep the product-details rendering as a Server Component and isolate only the review form itself as a Client Component — not convert the entire page to a Client Component for the sake of one form.

**Exercise:** For a hypothetical dashboard page (a data table showing server-fetched records, plus a "refresh" button and a sortable column header), identify which parts should be Server Components and which must be Client Components, and justify each choice.

**Expected outcome:** Given any Next.js page, you can correctly identify the minimal set of Client Components actually required, and explain the real security risk of putting a secret in one.

**Homework:** Bring your dashboard component breakdown into this module's project.`,
    },
    {
      title: 'Connecting Frontend to Backend in a Full-Stack Next.js App',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Wire a Next.js frontend to a real backend API, applying Module 4's REST/validation/status-code discipline and Module 3's loading/error-state discipline together.

**Prerequisites:** Module 4 (Backend Web Frameworks & REST API Design); "Server Components vs. Client Components."

**Instructional content:**
A full-stack Next.js application connects the frontend and backend work from Modules 3-4 in 2 real patterns:

1. **Server Components can fetch data directly** (from a database or an internal API) during server rendering, before any HTML reaches the browser — this is often the most direct, secure way to get server-rendered data onto a page, since the fetching code never ships to the client.
2. **Client Components need a real API endpoint to call** (via fetch, from the browser) for anything that happens after the page has already loaded — a user action like submitting a form, which must go through a real HTTP request to a backend route, applying every one of Module 4's real-route requirements (server-side validation, correct status codes, real authorization) exactly as if it were any other API consumer, because from the backend's perspective, it is.

The critical discipline this lesson closes the loop on: a backend route must never trust that requests only come from "our own frontend" and skip validation on that assumption — any route reachable from the browser is reachable by any other caller too, so Module 4's full validation/authorization discipline applies unconditionally, with no exception for "internal" frontend calls.

**Common mistakes:** skipping server-side validation on a route because "only our own frontend calls it," forgetting that any publicly reachable endpoint is reachable by anyone, not only the frontend that happens to call it today; not applying Module 3's loading/error-state discipline to a Client Component's form submission, leaving a user with no feedback while a request is in flight or after it fails.

**Practical example:** A "submit review" form (Client Component) calls "POST /reviews" (a real backend route from Module 4) via fetch — the route must independently validate the review content and verify the caller's real identity via server-verified authentication, exactly as Module 4 specified, regardless of the fact that today only this frontend happens to call it.

**Exercise:** Design the full request path for submitting a product review in this course's running example: which component fetches what, which is a Server vs. Client Component, and what the backend route must independently verify — tying together Lessons 1-2 and Module 4.

**Expected outcome:** You can trace a real full-stack feature end to end — Server Component data fetching, a Client Component's user-triggered request, and a backend route's independent validation — as one coherent system, not disconnected pieces.

**Homework:** Bring your full request-path design into this module's project — it is the closing deliverable connecting Modules 2-5.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 5 (Full-Stack Frameworks/Next.js). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 5 Final Assessment — Full-Stack Frameworks (Next.js)',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which rendering strategy is the strongest fit for a public product catalog page whose content changes rarely, per this module?',
            questionType: 'single',
            options: [
              'Client-side rendering only',
              'Static rendering',
              'Server rendering on every single request regardless of content',
              'Rendering strategy never matters for this kind of page',
            ],
            correctAnswer: ['Static rendering'],
          },
          {
            prompt: 'Which of the following are real reasons to mark a component as a Client Component in Next.js, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'It needs an event handler like onClick',
              'It uses React state or effects',
              'It needs a browser-only API',
              'It is the default for every component regardless of need',
            ],
            correctAnswer: [
              'It needs an event handler like onClick',
              'It uses React state or effects',
              'It needs a browser-only API',
            ],
          },
          {
            prompt: 'True or False: putting a secret API key in a Client Component is safe as long as the key is only used internally.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Scenario: a backend route skips server-side validation because "only our own frontend calls it." What does this module say is wrong with that reasoning?',
            questionType: 'single',
            options: [
              'Nothing is wrong — this is a safe, common optimization',
              'Any publicly reachable endpoint is reachable by any caller, not only the frontend that happens to call it today',
              'This is only a problem for DELETE requests',
              'Frontend calls are cryptographically verified as trusted by default',
            ],
            correctAnswer: [
              'Any publicly reachable endpoint is reachable by any caller, not only the frontend that happens to call it today',
            ],
          },
          {
            prompt: 'Practical question: why can a Server Component often fetch data more directly and securely than a Client Component, per this module?',
            questionType: 'text',
            correctAnswer:
              'A Server Component\'s code runs only on the server and is never shipped to the browser, so it can safely access server-only resources like a database or secret API key directly, whereas a Client Component\'s code ships to the browser and must instead call a real backend API endpoint.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 6: Web Performance & Security Basics
// ---------------------------------------------------------------------
const webdevModule6: ModuleSeed = {
  courseSlug: 'fullstack-web-development-nextjs',
  title: 'Web Performance & Security Basics',
  position: 6,
  description:
    'Closes the course by making sure the full-stack application built across Modules 1-5 is actually fast and safe to ship, not just functionally complete.',
  lessons: [
    {
      title: 'Web Performance Fundamentals: Core Web Vitals',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Correctly interpret Core Web Vitals metrics and identify what a poor score in each actually indicates about a real page.

**Prerequisites:** Module 5 (Full-Stack Frameworks/Next.js) — the rendering-strategy choices from Module 5 directly affect these metrics.

**Instructional content:**
**Core Web Vitals** are 3 specific, measurable metrics that capture real, user-perceived performance, not just abstract page-load time:

1. **Largest Contentful Paint (LCP)** — how long until the largest visible content element has rendered. A poor LCP means users are staring at an incomplete or blank page for too long before seeing the actual content they came for.
2. **Cumulative Layout Shift (CLS)** — how much visible content unexpectedly shifts position during load. A poor CLS is the real, common frustration of trying to tap a button just as an ad or image loads above it and shifts it out from under your finger.
3. **Interaction to Next Paint (INP)** — how responsive the page is to real user interactions (clicks, taps) throughout its lifetime, not just at initial load. A poor INP means the page visibly lags behind user input even after it appears to have finished loading.

Each metric points to a different, specific real cause: poor LCP often means render-blocking resources or an unoptimized largest image; poor CLS often means images/embeds without reserved space, so surrounding content jumps once they load; poor INP often means long-running JavaScript blocking the main thread during an interaction.

**Common mistakes:** treating "page feels slow" as one undifferentiated problem instead of diagnosing which specific metric is actually poor (each has a different real fix); optimizing initial load time alone while ignoring INP, leaving a page that loads quickly but then feels sluggish to interact with.

**Practical example:** A page with a fast initial paint but a large ad that loads late and shifts all the text below it down by 200px is a real CLS problem, not an LCP problem — reserving space for the ad before it loads (even if the ad itself is still slow) directly fixes the CLS issue without needing to speed up the ad itself.

**Exercise:** For 3 example symptoms (a page shows a blank screen for 4 seconds before content appears; a button visibly jumps position right as you're about to tap it; typing into a search box feels laggy after the page has fully loaded), identify which Core Web Vital each symptom corresponds to.

**Expected outcome:** Given a real performance complaint, you can identify which specific Core Web Vital it maps to, rather than treating "slow" as one undifferentiated problem.

**Reading:** MDN Web Docs (Web Performance section) — https://developer.mozilla.org (already verified Phase 25).

**Homework:** Keep your 3-symptom mapping — direct input to this module's project.`,
    },
    {
      title: 'Common Web Security Vulnerabilities & Mitigations',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**Objective:** Identify 3 common real web vulnerabilities and their direct mitigations, closing the loop on security topics deferred by earlier modules.

**Prerequisites:** Module 4, "Building a Backend Route: Validation, Errors & Status Codes" — this lesson deepens that lesson's authorization/validation discipline into named, specific vulnerability classes.

**Instructional content:**
Three widely-documented vulnerability classes (per the OWASP Top Ten, the industry-standard reference for web application security risks) a full-stack developer must understand concretely, not just by name:

1. **Injection (e.g. SQL injection).** Occurs when untrusted input is concatenated directly into a query/command instead of passed as a parameter — an ORM (Module 4, Lesson 3) typically prevents this by construction, but any raw query construction anywhere in an application reopens the risk.
2. **Broken access control.** Occurs when an application fails to verify a request is actually authorized for the specific resource it targets — this is the exact same class of mistake Module 4, Lesson 2 warned against (trusting a client-supplied ID instead of verifying real permission), now named as the broader, industry-recognized vulnerability category it belongs to.
3. **Cross-Site Scripting (XSS).** Occurs when untrusted user input is rendered into a page as raw HTML/script instead of safely escaped text — letting an attacker's injected script run in another user's browser. Modern frameworks (including React/Next.js, per Modules 3/5) escape rendered content by default, but this protection can be bypassed by explicitly rendering raw/unescaped HTML from an untrusted source.

**Common mistakes:** assuming a modern framework's default protections make a whole vulnerability class impossible to introduce (they reduce the risk significantly, but an explicit raw-HTML-rendering escape hatch, or a hand-written raw SQL query, can reopen exactly the risk the framework otherwise prevents); treating security as a separate, final review step rather than a property to maintain throughout — which is the same "accessibility should be checked throughout, not bolted on at the end" principle the UI/UX course's Module 3 taught, applied here to security instead.

**Practical example:** Rendering a user's submitted bio text into a page via a framework's default text-rendering (auto-escaped) is safe; using an explicit "render raw HTML" escape hatch to render that same untrusted bio text is a real, direct XSS vulnerability — the difference is entirely in which rendering path was used, not anything about the framework's overall security.

**Exercise:** For this course's running "reviews" resource (Module 4), identify one concrete way each of the 3 vulnerability classes above could be introduced if the code weren't careful, and the specific mitigation that prevents it.

**Expected outcome:** Given a described piece of code handling user input, you can identify which of these 3 vulnerability classes (if any) it's at risk of, and name the specific mitigation.

**Reading:** OWASP Top Ten — https://owasp.org/www-project-top-ten/ (live-verified this phase; the industry-standard reference for these vulnerability classes).

**Homework:** Bring your 3-vulnerability analysis into this module's project — the closing deliverable of this course.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 6 (Web Performance & Security Basics) — the final module of Full-Stack Web Development with Next.js. Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 6 Final Assessment — Web Performance & Security Basics',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A page loads its content quickly, but a late-loading ad shifts all the surrounding text down unexpectedly. Which Core Web Vital does this symptom correspond to?',
            questionType: 'single',
            options: [
              'Largest Contentful Paint (LCP)',
              'Cumulative Layout Shift (CLS)',
              'Interaction to Next Paint (INP)',
              'None of the three metrics cover this',
            ],
            correctAnswer: ['Cumulative Layout Shift (CLS)'],
          },
          {
            prompt: 'Which of the following are real vulnerability classes covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Injection (e.g. SQL injection)',
              'Broken access control',
              'Cross-Site Scripting (XSS)',
              'These are all the same vulnerability with different names',
            ],
            correctAnswer: [
              'Injection (e.g. SQL injection)',
              'Broken access control',
              'Cross-Site Scripting (XSS)',
            ],
          },
          {
            prompt: 'True or False: a modern framework\'s default auto-escaping makes XSS completely impossible to introduce, with no exceptions.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Scenario: a route trusts a client-supplied ID to determine which resource a request is authorized to act on, without independently verifying real permission. Which vulnerability class does this module say this is?',
            questionType: 'single',
            options: [
              'Cross-Site Scripting (XSS)',
              'Broken access control',
              'This is not a real vulnerability if the ID looks valid',
              'SQL injection specifically, and nothing else',
            ],
            correctAnswer: ['Broken access control'],
          },
          {
            prompt: 'Practical question: why does an ORM typically prevent SQL injection "by construction," per this module, and what can still reopen the risk?',
            questionType: 'text',
            correctAnswer:
              'An ORM handles query parameters safely rather than concatenating untrusted input directly into a query string, but any raw, hand-written query construction anywhere in the application bypasses that protection and reopens the injection risk.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [
  webdevModule2,
  webdevModule3,
  webdevModule4,
  webdevModule5,
  webdevModule6,
];

// ---------------------------------------------------------------------
// 5 new standalone Projects (Phase 26 architecture, real instructions,
// no sourceLessonId), bringing the course to its blueprint total of 6.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'fullstack-web-development-nextjs',
    title: 'JavaScript/TypeScript Utility Library',
    description:
      'Beginner/Intermediate tier — a small, real, typed utility library applying Module 2\'s core JavaScript and TypeScript discipline.',
    instructions: `**Objective:** Build a small library of real, reusable utility functions, correctly typed with TypeScript, applying Module 2's discipline around value/reference semantics, async correctness, and precise typing.

**Requirements:**
- At least 5 real utility functions (e.g. a debounce function, a deep-clone helper, an async retry wrapper, a data formatter) — genuinely useful, not trivial arithmetic.
- Every function has explicit TypeScript parameter and return types (per Module 2, Lesson 3) — no "any" except where you can specifically justify it in writing.
- At least one function correctly handles an asynchronous operation using async/await, including its error case (per Module 2, Lesson 2).
- A short written note distinguishing which of your functions operate on primitives (copied by value) versus objects/arrays (copied by reference), and one real bug this distinction could cause if handled incorrectly.

**Expected result:** The utility library's source code plus the written value/reference note.

**Difficulty:** Beginner/Intermediate.

**Skills tested:** correct TypeScript typing of real functions, correct async/await error handling, genuine understanding of JavaScript's value/reference semantics.

**Suggested implementation steps:**
1. Pick 5 genuinely useful utilities, not toy examples.
2. Type each function's parameters and return value before implementing its body.
3. Implement the async one last, with explicit error handling.
4. Write the value/reference note against your own actual functions, not generically.

**Evaluation criteria:** functions are genuinely useful and correctly typed; async error handling is real, not omitted; the value/reference note demonstrates real understanding grounded in the actual code, not a generic restatement of the lesson.`,
    position: 2,
  },
  {
    courseSlug: 'fullstack-web-development-nextjs',
    title: 'React Multi-View Application',
    description:
      'Intermediate tier — a real, multi-component React application with correctly-placed state, real data fetching, and no prop-drilling or state-duplication mistakes.',
    instructions: `**Objective:** Build a small but real multi-component React application (e.g. a task list, a product browser, a simple dashboard) applying Module 3's discipline around props/state, data fetching, and state placement.

**Requirements:**
- At least 3 real, distinct components working together (not one monolithic component).
- Correct use of props vs. state throughout (per Module 3, Lesson 1) — no component mutating a prop it received.
- At least one component that fetches real data (a real or mocked API) and correctly handles loading, error, and success states (per Module 3, Lesson 2).
- At least one piece of state correctly lifted to a shared parent because two sibling components need it (per Module 3, Lesson 3) — with a written justification for why it lives where it does.

**Expected result:** The application's source code plus a short written explanation of your state-placement decisions.

**Difficulty:** Intermediate.

**Skills tested:** correct props/state discipline, real data-fetching with all 3 states handled, correct state-lifting decisions with justified reasoning.

**Suggested implementation steps:**
1. Sketch your component tree and decide which components need which data before writing code.
2. Implement the data-fetching component with all 3 states explicitly handled first.
3. Build the remaining components, watching for any prop-mutation mistakes.
4. Write your state-placement justification against your actual component tree, not generically.

**Evaluation criteria:** genuine multi-component structure (not one large component); props/state used correctly throughout; all 3 data-fetching states are real and visibly different; state-lifting decisions are justified, not arbitrary.`,
    position: 3,
  },
  {
    courseSlug: 'fullstack-web-development-nextjs',
    title: 'REST API for a Real Resource',
    description:
      'Intermediate/Advanced tier — a real backend REST API with correct resource design, server-side validation, correct status codes, and a real database, avoiding N+1 queries.',
    instructions: `**Objective:** Design and build a real REST API for one resource (e.g. "reviews," "tasks," "bookings"), applying Module 4's full discipline: resource/URL design, server-side validation, correct status codes, real authorization, and N+1-aware data access.

**Requirements:**
- Full CRUD endpoints for your chosen resource, following REST conventions (per Module 4, Lesson 1) — noun-based URLs, correct HTTP methods.
- Server-side validation on every write operation, independent of any frontend (per Module 4, Lesson 2) — document what each validation check actually rejects.
- Correct HTTP status codes for every real outcome (success, validation failure, unauthenticated, unauthorized, not found).
- Real authorization derived from server-verified identity, never a client-supplied ID field.
- At least one list endpoint that fetches related data without an N+1 query pattern (per Module 4, Lesson 3) — with a written explanation of how you avoided it.

**Expected result:** The API's source code (real or clearly-specified pseudo-code if a full environment isn't available) plus written documentation of your validation rules, status codes, and N+1-avoidance approach.

**Difficulty:** Intermediate/Advanced.

**Skills tested:** REST resource design, real server-side validation and authorization discipline, correct status-code usage, N+1-aware data access.

**Suggested implementation steps:**
1. Design your resource's URLs and methods first, before implementation.
2. Implement validation and status codes together for each route, not as an afterthought.
3. Implement the list-with-related-data endpoint last, specifically checking for N+1 access patterns.
4. Document your validation rules and N+1 approach against your actual implementation.

**Evaluation criteria:** REST conventions genuinely followed; validation is real and server-side, not assumed from a frontend; status codes correctly distinguish every real outcome; the N+1 avoidance is real and explained, not just claimed.`,
    position: 4,
  },
  {
    courseSlug: 'fullstack-web-development-nextjs',
    title: 'Full-Stack Next.js Feature',
    description:
      'Advanced tier — one real, complete full-stack feature in Next.js connecting a correctly-chosen rendering strategy, Server/Client Component split, and a real backend route.',
    instructions: `**Objective:** Build one complete, real full-stack feature in Next.js (e.g. a review-submission flow, a task board with real-time-ish updates, a search-and-filter page) that correctly applies Module 5's rendering-strategy, Server/Client Component, and frontend-backend connection discipline.

**Requirements:**
- A justified rendering-strategy choice (static/server/client) for the feature's main page, stated explicitly (per Module 5, Lesson 1).
- A correct Server/Client Component split — Client Components used only where actual interactivity/browser APIs require them (per Module 5, Lesson 2), with a written explanation of why each Client Component needed to be one.
- A real backend route (reusing or extending your Module 4 project's API if applicable) that the Client Component calls for its interactive action — with full server-side validation and authorization, exactly as if it were called by anyone else (per Module 5, Lesson 3).
- No secrets or server-only logic present in any Client Component.

**Expected result:** The feature's source code (frontend + backend) plus your written rendering-strategy and Server/Client Component justifications.

**Difficulty:** Advanced.

**Skills tested:** correctly combining rendering strategy, component-type decisions, and full-stack data flow into one coherent real feature.

**Suggested implementation steps:**
1. Decide the page's rendering strategy first, based on its real data/interactivity needs.
2. Design the Server/Client Component split before writing code — identify the minimal Client Component surface.
3. Build or reuse the backend route the Client Component will call, applying full Module 4 discipline.
4. Wire it together last, verifying no secret or server-only logic leaked into a Client Component.

**Evaluation criteria:** the rendering-strategy choice is genuinely justified by the feature's real needs; the Client Component surface is minimal and justified; the backend route is treated with full validation/authorization rigor, not assumed-safe because "it's our own frontend."`,
    position: 5,
  },
  {
    courseSlug: 'fullstack-web-development-nextjs',
    title: 'Production-Ready Performance & Security Audit',
    description:
      'Professional Capstone — a real performance and security audit of the application built across this course, closing the loop from static markup through a full-stack feature.',
    instructions: `**Objective:** Audit the application(s) built across this course's prior projects for real Core Web Vitals issues and real security vulnerabilities, applying Module 6's diagnostic frameworks — closing the course by making sure what you built is actually fast and safe, not just functionally complete.

**Requirements:**
- A Core Web Vitals assessment identifying at least one real or plausible issue for each of LCP, CLS, and INP against your prior project(s) (or a clearly-stated hypothetical if a full environment isn't available), each with a specific, named fix (per Module 6, Lesson 1) — not a generic "make it faster" statement.
- A security review checking your Module 4/5 project(s) against all 3 vulnerability classes from Module 6, Lesson 2 (injection, broken access control, XSS) — for each, state whether your implementation is at risk and why, or how it's already mitigated.
- A written reflection connecting this audit back to the full course: which earlier module's discipline (React, backend validation, Next.js component splitting) most directly prevented or introduced each issue you found.

**Expected result:** A written audit document covering all 3 requirements above, referencing your actual prior course projects specifically, not generic best-practice statements.

**Difficulty:** Professional Capstone.

**Skills tested:** diagnosing real performance issues by specific Core Web Vital, applying the OWASP-grounded vulnerability framework concretely to real code, synthesizing the full course's modules into one coherent quality assessment.

**Suggested implementation steps:**
1. Review your Module 3/5 project(s) for LCP/CLS/INP issues first, grounding each finding in a specific cause.
2. Review your Module 4/5 project(s) against the 3 vulnerability classes, checking your actual validation/authorization/rendering code.
3. Write the closing reflection last, once you have real findings from both reviews to connect back to specific earlier modules.

**Evaluation criteria:** findings are specific and grounded in your actual prior work, not generic; each Core Web Vital issue has a named, specific fix; each vulnerability class is genuinely assessed against real code, not assumed safe; the closing reflection demonstrates real synthesis across the whole course.`,
    position: 6,
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
        // rows via the Phase 26 architecture, matching Phase 27/30/31's
        // precedent for this course.
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 32 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 32 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

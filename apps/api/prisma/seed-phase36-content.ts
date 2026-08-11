// Phase 36 — Frontend Engineer Learning Path Completion.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// (Section 4, Frontend Engineer Blueprint): this path needs exactly 1 new
// course (Programming Foundations) on top of 2 already-real, already-
// production-ready courses (UI/UX Design Foundations, Full-Stack Web
// Development with Next.js). This file:
//
//   1. Creates the new "Programming Foundations: Problem Solving with
//      Python & JavaScript" course (per courses.md's blueprint entry #1),
//      scoped deliberately to avoid duplicating Full-Stack Web Dev's own
//      Module 2 (JavaScript & TypeScript Fundamentals, Phase 32) — this
//      course teaches universal, language-agnostic programming concepts
//      (variables, control flow, functions, data structures, basic OOP,
//      Git, testing) primarily through Python (the gentler entry
//      language, per the blueprint's own stated rationale), NOT
//      JavaScript-specific scoping/typing rules, which remain Full-Stack
//      Web Dev's Module 2's job. Verified no lesson-title or concept-level
//      duplication against the real, existing Module 2 content (see the
//      Phase 36 report for the explicit comparison).
//   2. Adds this new course to the existing "frontend-web" LearningPath
//      (Phase 26) at position 0 — ahead of UI/UX Design Foundations
//      (position 1) and Full-Stack Web Development with Next.js
//      (position 2), both of which are left completely untouched. Uses a
//      per-course existence check (learningPathId + courseId, the real
//      unique constraint), NOT the whole-path "any memberships exist"
//      guard seed-phase26-content.ts used when the path was first
//      created — that guard would incorrectly skip this addition since
//      the path already has 2 memberships.
//
// Idempotency: same application-level pattern as every prior content
// phase — findFirst by parent+title before create for course/module/
// lesson/quiz/project; findFirst by (learningPathId, courseId) before
// create for the new path membership.

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
  title: string;
  position: number;
  description: string;
  lessons: LessonSeed[];
};

type ProjectSeed = {
  title: string;
  description: string;
  instructions: string;
  position: number;
};

const COURSE_SLUG = 'programming-foundations-python-javascript';
const COURSE_TITLE = 'Programming Foundations: Problem Solving with Python & JavaScript';

// ---------------------------------------------------------------------
// Module 1: Programming Basics — Variables, Control Flow & Problem
// Solving
// ---------------------------------------------------------------------
const module1: ModuleSeed = {
  title: 'Programming Basics: Variables, Control Flow & Problem Solving',
  position: 1,
  description:
    'The true zero-to-fluency starting point — what a program actually is, how it stores information, and how it makes decisions and repeats work. Taught primarily in Python, with short JavaScript comparisons so you can already recognize the same ideas when Full-Stack Web Development with Next.js introduces JavaScript\'s own specific rules later in this path.',
  lessons: [
    {
      title: 'What Is Programming? Variables and Values',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** What a computer program actually is, and how it stores a piece of information so it can be used and changed later.

**Prerequisites:** None — this is the true starting point of this path.

**The concept, explained simply:**
A **program** is a list of exact, step-by-step instructions a computer follows in order — nothing more mysterious than that. A **variable** is a named container that holds a value (a number, a piece of text, etc.) so your program can refer to it by name instead of retyping the actual value everywhere.

In Python, creating a variable looks like this: "age = 25" — this creates a variable named "age" holding the value 25. In JavaScript, it looks similar but needs a keyword: "let age = 25;". Both languages are doing the exact same underlying thing — naming a value so it can be reused and changed.

**Why do we need this?** Without variables, a program could only ever work with values you type directly into the code, every single time — a real, obvious limitation. Variables let a program work with values that come from a user, change during the program's run, or get calculated along the way.

**How does it actually work?** A **value** has a **type** — a number (like 25), text (called a "string," like "hello"), or a true/false value (called a "boolean"). Python and JavaScript both figure out a value's type automatically from what you write, but the type still matters: you can do math with numbers, but not directly with text, and mixing them up is a real, common source of bugs for beginners.

**A simple everyday example:** A labeled storage box. Writing "age = 25" is like putting the number 25 into a box labeled "age" — later, when you refer to "age," you're looking inside that specific box, and whatever's currently in it is what you get.

**A technical example:** "price = 10" then later "price = 15" — the variable "price" now holds 15, not 10. The box's label didn't change, only its contents did. This is the entire idea behind why variables are useful: the same name, a value that can change over time.

**Common mistakes:** trying to do math on a value that's actually stored as text (e.g. "5" the text versus 5 the number look similar but behave completely differently in calculations); forgetting that assigning a new value to a variable completely replaces the old one — the old value is simply gone, not stored anywhere unless you saved it in a different variable first.

**When do we use variables?** Constantly — essentially every real program uses variables to hold anything that isn't a fixed, unchanging value baked directly into the code.

**How do we know we understood this?** You can explain, in your own words, the difference between a variable's name and its current value, and predict what a variable holds after several reassignments in a row.

**Mini exercise:** Write down, on paper, what each variable holds after these steps, in order: "x = 5", then "x = x + 1", then "y = x", then "x = 100". What does "y" hold at the end? What does "x" hold?

**Reading:** Official Python Documentation — https://docs.python.org/3/ (live-verified Phase 35). MDN Web Docs — https://developer.mozilla.org (already verified Phase 25; covers JavaScript's version of these same concepts).`,
    },
    {
      title: 'Making Decisions: Conditionals',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a program makes a decision and does different things depending on the situation, instead of always doing exactly the same steps.

**Prerequisites:** "What Is Programming? Variables and Values."

**The concept, explained simply:**
A **conditional** (an "if statement") lets a program check whether something is true, and only run certain instructions when it is. In Python: "if age >= 18: print('adult')" — the instruction inside only runs if the condition ("age >= 18") is actually true. An "else" branch lets you specify what happens when the condition is false instead.

**Why do we need this?** Almost no real program does the exact same thing every single time it runs — it needs to react differently depending on the situation (what the user typed, what data looks like, what happened earlier). Conditionals are the basic tool for that.

**How does it actually work?** A condition is an expression that evaluates to true or false (a **boolean**) — "age >= 18" is either true or false depending on what "age" currently holds. Conditions can be combined: "AND" requires both parts to be true; "OR" requires at least one part to be true. Multiple conditions can be chained (Python's "elif," meaning "else, if") to check several possibilities in order, stopping at the first one that matches.

**A simple everyday example:** A simple household rule: "if it's raining, take an umbrella; otherwise, don't." You don't always take an umbrella — the actual weather (the condition) determines what you actually do.

**A technical example:** "if score >= 90: grade = 'A' / elif score >= 80: grade = 'B' / else: grade = 'C'" — this checks the conditions in order, and once one matches, it uses that branch and skips the rest, exactly like stopping at the first true rule rather than checking all of them regardless.

**Common mistakes:** writing conditions that overlap in a confusing order (e.g. checking "score >= 80" before "score >= 90" would incorrectly grade a 95 as a "B", since the first matching condition wins and stops checking further); confusing "=" (assignment, giving a variable a new value) with "==" (comparison, asking "are these equal?") — a very common, real beginner bug, since the two look similar but do completely different things.

**When do we use conditionals?** Any time your program's behavior needs to depend on data that isn't known until the program actually runs — which is most real programs.

**How do we know we understood this?** Given a set of conditions and elif/else branches, you can correctly trace which branch actually runs for a specific input, including cases where the ordering of conditions matters.

**Mini exercise:** Write (in Python-like pseudocode) a conditional that assigns a shipping cost: free if the order total is 50 or more, $5 if it's between 20 and 49, $10 otherwise. Trace through it for an order total of 30.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Repeating Work: Loops',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a program repeats the same steps multiple times without you writing those steps out over and over.

**Prerequisites:** "Making Decisions: Conditionals."

**The concept, explained simply:**
A **loop** repeats a block of instructions, either a specific number of times or until some condition becomes false. Two common forms: a **"for" loop** repeats once per item in a known collection (e.g. once per name in a list of names); a **"while" loop** repeats as long as a condition stays true, useful when you don't know in advance how many repetitions you'll need.

**Why do we need this?** Without loops, processing 100 items would require writing the same instruction 100 times by hand — obviously impractical, and it wouldn't even work for a case where the number of items isn't known ahead of time (e.g. "keep asking the user for input until they type 'done'").

**How does it actually work?** A "for" loop in Python — "for name in names: print(name)" — runs the "print(name)" instruction once per item in "names," with "name" holding a different item each time through. A "while" loop — "while count < 10: count = count + 1" — keeps running as long as "count < 10" stays true, and stops the moment it becomes false. A while loop whose condition never becomes false runs forever (an **infinite loop**) — a real, common bug, not a theoretical one.

**A simple everyday example:** Handing out one flyer to each person in a line, one at a time, until you reach the end of the line — this is a "for" loop, once per person. Continuing to knock on a door until someone answers (you don't know in advance how many knocks it'll take) is a "while" loop.

**A technical example:** "while True: print('hello')" has no way to ever become false — it's a genuine infinite loop that would run forever until manually stopped, a real mistake every beginner eventually makes and needs to recognize and fix.

**Common mistakes:** writing a while loop whose condition can never become false (forgetting to update the variable the condition checks, e.g. forgetting "count = count + 1" inside the loop body); using a while loop when a for loop would be simpler and safer for a known, fixed collection of items — while loops are more flexible but also more error-prone to get right.

**When do we use each?** A "for" loop when you're processing a known collection of items; a "while" loop when you're repeating until some condition changes, and you don't know the exact count in advance.

**How do we know we understood this?** Given a described repetitive task, you can choose between a for loop and a while loop correctly, and you can identify, in a piece of loop code, whether it risks running forever.

**Mini exercise:** Write a while loop (in Python-like pseudocode) that keeps asking "Continue? (yes/no)" and stops as soon as the answer is "no." Identify exactly what would happen if you forgot to actually read a new answer inside the loop each time.

**Homework:** Keep your loop examples — direct input to this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 1 (Programming Basics). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 1 Final Assessment — Programming Basics',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What happens to a variable\'s previous value when you assign it a new value, per this module?',
            questionType: 'single',
            options: [
              'Both the old and new values are kept automatically',
              'The old value is simply replaced and gone, unless it was saved in a different variable first',
              'Variables cannot be reassigned once set',
              'The old value is automatically restored at the end of the program',
            ],
            correctAnswer: [
              'The old value is simply replaced and gone, unless it was saved in a different variable first',
            ],
          },
          {
            prompt: 'Scenario: a grading conditional checks "score >= 80" before "score >= 90". What real problem does this module say this causes?',
            questionType: 'single',
            options: [
              'No problem — order does not matter for conditionals',
              'A score of 95 would incorrectly match the "score >= 80" branch first and never reach the "score >= 90" check',
              'The program would fail to run at all',
              'This only matters if there are more than 3 conditions',
            ],
            correctAnswer: [
              'A score of 95 would incorrectly match the "score >= 80" branch first and never reach the "score >= 90" check',
            ],
          },
          {
            prompt: 'Which of the following are real, common causes of an infinite loop, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A while loop\'s condition never becomes false because the relevant variable is never updated inside the loop',
              'Using "while True" with no way to break out of it',
              'Using a for loop over a known, fixed list',
              'Forgetting to update the loop-controlling variable inside the loop body',
            ],
            correctAnswer: [
              'A while loop\'s condition never becomes false because the relevant variable is never updated inside the loop',
              'Using "while True" with no way to break out of it',
              'Forgetting to update the loop-controlling variable inside the loop body',
            ],
          },
          {
            prompt: 'True or False: confusing "=" (assignment) with "==" (comparison) is a real, common beginner bug because the two symbols look similar but do different things.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: when should you choose a "while" loop over a "for" loop, per this module?',
            questionType: 'text',
            correctAnswer:
              'A while loop should be used when you are repeating until some condition changes and you do not know the exact number of repetitions in advance, whereas a for loop is the simpler, safer choice for a known, fixed collection of items.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 2: Functions & Program Structure
// ---------------------------------------------------------------------
const module2: ModuleSeed = {
  title: 'Functions & Program Structure',
  position: 2,
  description:
    'Moves from single blocks of instructions to organized, reusable pieces of code — the real foundation every later course in this path (including Full-Stack Web Dev\'s own function-heavy JavaScript modules) builds on.',
  lessons: [
    {
      title: 'Writing Reusable Code: Functions',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to package a set of instructions into a named, reusable block you can run whenever you need it, instead of copying the same code over and over.

**Prerequisites:** Module 1 (Programming Basics).

**The concept, explained simply:**
A **function** is a named block of instructions that can take inputs (called **parameters**), do something with them, and optionally give back a result (called a **return value**). In Python: "def greet(name): return 'Hello, ' + name" defines a function named "greet" that takes one input and returns a greeting. Calling it — "greet('Amina')" — runs those instructions with "name" set to "Amina" and gives back the result.

**Why do we need this?** Without functions, any logic you need more than once has to be copied and pasted everywhere it's needed — and if you later find a bug in that logic, you'd have to fix it in every single copy, a real, common source of bugs (fixing one copy and forgetting another). A function exists in exactly one place, so fixing it there fixes it everywhere it's used.

**How does it actually work?** A function's **parameters** are placeholders for whatever values it's called with — "greet('Amina')" and "greet('Yusuf')" run the exact same code with a different value for "name" each time. A function's **return value** is the result it hands back to whatever called it — this is different from just printing something on screen, since a returned value can be used in further calculations, not just displayed.

**A simple everyday example:** A recipe card is like a function — it takes ingredients (parameters) and produces a finished dish (the return value). You can use the same recipe card repeatedly with different ingredient quantities, without rewriting the recipe each time.

**A technical example:** "def add_tax(price, rate): return price + (price * rate)" can be called as "add_tax(100, 0.1)" (giving 110) or "add_tax(50, 0.2)" (giving 60) — the exact same logic, reused correctly for different inputs, with zero duplicated code.

**Common mistakes:** writing a function that prints a result instead of returning it, then being unable to use that result in a further calculation (printing shows a value to a human; returning gives the value back to the program itself, which is what's needed if another part of the code needs to use it); copying and pasting a block of logic in multiple places instead of turning it into a function, which is the exact duplication problem functions exist to prevent.

**When do we use a function?** Any time the same logic is needed more than once, or when breaking a large problem into named, understandable pieces would make the program clearer — even if it's only used once.

**How do we know we understood this?** You can write a function with parameters and a return value for a simple, real calculation, and explain the difference between a function that prints a result and one that returns it.

**Mini exercise:** Write a function (in Python-like pseudocode) called "calculate_total" that takes a price and a quantity, and returns the total cost. Trace through calling it with price=10, quantity=3.

**Reading:** Official Python Documentation — https://docs.python.org/3/ (already verified Phase 35).

**Homework:** Keep your function example — direct input to Lesson 2.`,
    },
    {
      title: 'Structuring a Program: Scope and Organization',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Where a variable is actually visible and usable inside a program, and why organizing code into functions helps keep a program understandable as it grows.

**Prerequisites:** "Writing Reusable Code: Functions."

**The concept, explained simply:**
**Scope** determines where a variable can be seen and used. A variable created inside a function generally only exists inside that function — it's called a **local variable**, and it disappears once the function finishes running. A variable created outside any function (at the top level of your program) is more broadly visible, called a **global variable** — but relying on global variables heavily is a real, common source of confusing bugs, since any part of the program could be silently changing them.

**Why do we need this?** Without scope, every variable in a large program would be visible and changeable from anywhere — a real recipe for one part of a program accidentally interfering with an unrelated part. Scope keeps a function's internal details private to that function, so you can reason about a function's behavior without needing to know about the entire rest of the program.

**How does it actually work?** When a function is called, its parameters and any variables it creates internally exist only for the duration of that call, in their own private scope — a variable named "total" inside one function is a completely different variable from a variable also named "total" inside a different function, even though they share a name; they don't interfere with each other.

**A simple everyday example:** A private notebook a worker keeps at their own desk (a local variable) versus a shared whiteboard in a common area everyone can see and edit (a global variable) — the private notebook is safer to use freely, since nobody else can accidentally change what's written in it.

**A technical example:** "def calculate(x): total = x * 2 / return total" — the variable "total" only exists while "calculate" is running; trying to use "total" outside this function would fail, because it was never visible outside its own local scope in the first place.

**Common mistakes:** relying on global variables when a local variable (a function parameter, or a variable created inside the function) would work just as well and be much safer; assuming a variable with the same name inside two different functions is somehow the same variable — it isn't, unless one of them is actually a global variable being read from inside both.

**When do we prefer local variables over global ones?** Almost always, by default — a global variable should be a deliberate, justified choice (e.g. genuine shared configuration), not the default way of making a value available to multiple functions.

**How do we know we understood this?** You can predict whether a specific variable is accessible at a specific point in a piece of code, based on where it was created, and explain why relying heavily on global variables is a real risk, not just a style preference.

**Mini exercise:** In a program with 2 separate functions, each internally using a variable named "count" for a different purpose, explain why these don't interfere with each other.

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Debugging: Reading Errors and Fixing Bugs',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** How to read an error message a program produces and use it to actually find and fix the real problem, instead of guessing randomly.

**Prerequisites:** "Structuring a Program: Scope and Organization."

**The concept, explained simply:**
A **bug** is any place where a program's actual behavior doesn't match what you intended. When a program encounters a problem it can't handle, it typically produces an **error message** (sometimes called a "traceback" in Python) — this is not the program failing you, it's the program telling you specifically what went wrong and, usually, exactly where.

**Why do we need this?** Every real program has bugs at some point — the actual skill that separates a productive programmer from a frustrated one isn't "never making mistakes," it's reading an error message correctly and using it to find the real cause quickly, rather than randomly changing code and hoping.

**How does it actually work?** A real error message typically states: the **type** of error (e.g. a "TypeError" means you tried to use a value in a way its type doesn't support), a **description** of specifically what went wrong, and a **location** (which line of code it happened on). Reading these 3 pieces in order — what kind of problem, what specifically happened, and where — is a genuinely systematic way to diagnose almost any bug, rather than treating the error as an intimidating wall of text to be ignored.

**A simple everyday example:** A car's dashboard warning light system: a specific warning light (the error type), often with a specific gauge reading (the description), tells a mechanic roughly where to start looking — nobody productive just ignores the light and starts randomly disassembling the engine.

**A technical example:** An error reading "TypeError: can only concatenate str (not 'int') to str" on a specific line tells you exactly what's wrong (you tried to combine text and a number directly) and where (that specific line) — the fix (converting the number to text first) follows directly from correctly reading the message, not from guessing.

**Common mistakes:** panicking at an error message and immediately changing unrelated code instead of reading what it actually says; ignoring the line number an error points to and searching the whole program randomly instead of starting exactly where the message says the problem occurred.

**When do we apply this?** Every single time a program doesn't do what you expected — reading the actual error message first is always the correct first step, not a last resort.

**How do we know we understood this?** Given a real error message, you can identify its type, its description, and its location, and propose a specific, plausible fix based on what it actually says — not a guess unrelated to the message.

**Mini exercise:** A program reports: "NameError: name 'total' is not defined" on a specific line. Based only on this lesson's discussion of scope (Lesson 2) and this message, propose the most likely real cause.

**Homework:** Bring your debugging understanding into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Functions & Program Structure). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Functions & Program Structure',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why does copying and pasting the same logic in multiple places instead of writing a function cause real problems, per this module?',
            questionType: 'single',
            options: [
              'It does not cause any real problems',
              'A later bug fix has to be applied to every single copy, and it is easy to forget one, unlike a function which exists in one place',
              'Copied code runs slower than a function',
              'Python does not allow code to be copied',
            ],
            correctAnswer: [
              'A later bug fix has to be applied to every single copy, and it is easy to forget one, unlike a function which exists in one place',
            ],
          },
          {
            prompt: 'What is the real difference between a function that prints a result and one that returns it, per this module?',
            questionType: 'single',
            options: [
              'There is no real difference',
              'A returned value can be used in further calculations by other code; a printed value is only shown to a human and cannot be reused programmatically',
              'Printing is always faster than returning',
              'Only functions with parameters can return a value',
            ],
            correctAnswer: [
              'A returned value can be used in further calculations by other code; a printed value is only shown to a human and cannot be reused programmatically',
            ],
          },
          {
            prompt: 'Which of the following are true about local variables inside two different functions that happen to share the same name, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'They are completely separate variables that do not interfere with each other',
              'They automatically share the same value',
              'Each exists only within its own function\'s scope',
              'Using the same name in two functions is a syntax error',
            ],
            correctAnswer: [
              'They are completely separate variables that do not interfere with each other',
              'Each exists only within its own function\'s scope',
            ],
          },
          {
            prompt: 'True or False: relying heavily on global variables instead of local ones is a real, common source of confusing bugs.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: what are the 3 pieces of information a real error message typically gives you, and why does reading them in order help you debug systematically?',
            questionType: 'text',
            correctAnswer:
              'A real error message typically gives the error type, a description of what went wrong, and the location (line) it occurred at — reading these in order lets you diagnose the real cause systematically, starting exactly where the message points, rather than guessing or searching the whole program randomly.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Data Structures
// ---------------------------------------------------------------------
const module3: ModuleSeed = {
  title: 'Data Structures: Organizing Real Information',
  position: 3,
  description:
    'Moves from single values to organized collections of data — the real foundation for working with any real dataset, form submission, or API response in every later course of this path.',
  lessons: [
    {
      title: 'Lists: Ordered Collections of Values',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to store and work with an ordered collection of multiple values as one single thing, instead of a separate variable for each item.

**Prerequisites:** Module 2 (Functions & Program Structure).

**The concept, explained simply:**
A **list** (called an "array" in JavaScript — same idea, different name) is an ordered collection of values, stored under one variable name. In Python: "names = ['Amina', 'Yusuf', 'Layla']" creates a list of 3 names. Each item has a **position** (called an "index"), starting at 0 — "names[0]" is "Amina," the first item.

**Why do we need this?** Storing 100 names would be impractical with 100 separate variables — a list holds them all under one name, and you can loop over it (Module 1, Lesson 3) to process every item without writing 100 separate lines of code.

**How does it actually work?** Lists support real, common operations: adding an item (Python's ".append()"), removing an item, checking how many items are in it (".length" in JavaScript, "len()" in Python), and looping over every item with a "for" loop — "for name in names: print(name)" prints each name in order.

**A simple everyday example:** A numbered waiting list at a clinic — each person has a specific position (1st, 2nd, 3rd...), the list has an order, and you can add someone to the end, remove someone, or count how many people are currently on it.

**A technical example:** "scores = [85, 92, 78]" then "scores.append(95)" results in "[85, 92, 78, 95]" — a real, common pattern: starting with some known values and adding more as your program runs, rather than needing to know the exact final list up front.

**Common mistakes:** forgetting that indexing starts at 0, not 1 — "names[0]" is the *first* item, a very common off-by-one confusion for beginners; trying to access an index that doesn't exist (e.g. "names[10]" on a 3-item list), which produces a real error, not a silently wrong result.

**When do we use a list?** Any time you need to work with multiple values of the same kind of thing, where order matters (or at least where you need to process every item, even if order isn't meaningful).

**How do we know we understood this?** Given a list and an index, you can correctly say what value is at that position, and explain why "names[0]" refers to the first item, not the second.

**Mini exercise:** Given "prices = [10, 25, 15, 30]", write (in pseudocode) a loop that adds up all the prices and stores the total in a variable. Trace through it by hand.

**Reading:** Official Python Documentation — https://docs.python.org/3/ (already verified Phase 35); MDN Web Docs — https://developer.mozilla.org (already verified Phase 25, covers JavaScript arrays).`,
    },
    {
      title: 'Dictionaries: Key-Value Collections',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to store information as named pairs (like a real-world form with labeled fields) instead of only by numbered position.

**Prerequisites:** "Lists: Ordered Collections of Values."

**The concept, explained simply:**
A **dictionary** (called an "object" in JavaScript — same underlying idea) stores values under named **keys**, instead of numbered positions. In Python: "person = {'name': 'Amina', 'age': 25}" — you access a value by its key, "person['name']," not by a numeric position. This is a genuinely different, complementary tool to a list: a list is for "many similar things, in order"; a dictionary is for "one thing, described by several named properties."

**Why do we need this?** Real data is often naturally described by named properties, not numbered positions — a person has a name and an age, not a "1st thing" and a "2nd thing." A dictionary lets code read as "person['name']" (clear, self-explanatory) rather than "person[0]" (meaningless without separately remembering what position 0 means).

**How does it actually work?** You can add a new key, check whether a key exists, update a key's value, or loop over all the keys/values in a dictionary. Dictionaries and lists combine naturally — a list of dictionaries (e.g. "people = [{'name': 'Amina'}, {'name': 'Yusuf'}]") is exactly how you'd represent a real collection of multiple structured records, and is an extremely common real-world pattern (this is, in fact, very close to how a real API response is often structured — direct, practical relevance to later courses in this path).

**A simple everyday example:** A filled-out form with labeled fields (Name: ___, Age: ___) is a dictionary — you read a specific field by its label, not by "the 3rd blank on the page."

**A technical example:** "product = {'title': 'Widget', 'price': 19.99, 'in_stock': True}" — reading "product['price']" is immediately clear about what value you're getting, unlike a list where you'd need to separately remember "price is always at position 1."

**Common mistakes:** trying to access a key that doesn't exist in the dictionary, which produces a real error, not silently returning nothing; confusing when to use a list (many similar items) versus a dictionary (one item's several named properties) — using a list with meaningless numbered positions when a dictionary's named keys would be far clearer.

**When do we use a dictionary instead of a list?** When you're describing one thing's multiple named properties, rather than storing many similar items in order — and very often, real data uses both together (a list of dictionaries).

**How do we know we understood this?** Given a described piece of real-world data, you can correctly decide whether a list, a dictionary, or a list of dictionaries best represents it, and justify the choice.

**Mini exercise:** Represent a single product (with a title, a price, and a quantity in stock) as a dictionary. Then represent a small shopping cart of 3 different products as a list of dictionaries.

**Homework:** Keep your shopping-cart representation — direct input to Lesson 3.`,
    },
    {
      title: 'Choosing the Right Data Structure',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** How to decide, for a real piece of data, whether a list, a dictionary, or some combination of both is the right way to represent it.

**Prerequisites:** "Lists: Ordered Collections of Values"; "Dictionaries: Key-Value Collections."

**The concept, explained simply:**
There's no single "correct" data structure for every situation — the right choice depends on the actual shape of the real data and what you need to do with it. A practical decision framework: **Is this many similar items?** → probably a list. **Is this one thing's several named properties?** → probably a dictionary. **Is this many things, each with several named properties?** → almost certainly a list of dictionaries, the single most common real-data shape you'll encounter in later, more advanced courses (this is very close to how real API responses and database query results are actually structured).

**Why do we need this?** Choosing the wrong structure doesn't just look messy — it makes real operations awkward or error-prone. Storing a person's data across several separately-indexed lists (one list of names, a separate list of ages, hoping the positions line up) is a real, fragile pattern that a single list of dictionaries avoids entirely.

**How does it actually work?** Given a real scenario, ask: what are the "things" here, and what does each one look like? A list of student test scores (many similar numbers) is a plain list. One student's full record (name, age, grade) is a dictionary. A whole class's full records is a list of dictionaries — each dictionary describing one student, in a list of all of them.

**A simple everyday example:** A class roster is naturally "many students (a list), each with a name and grade (a dictionary)" — exactly a list of dictionaries. Trying to instead keep 3 separate parallel lists (names, ages, grades) that all have to stay lined up by position is real, unnecessary fragility a list of dictionaries avoids.

**A technical example:** "students = [{'name': 'Amina', 'grade': 92}, {'name': 'Yusuf', 'grade': 85}]" lets you loop through and print each student's name and grade together, correctly paired — the same data spread across 2 separate parallel lists risks the lists silently getting out of sync if one is modified without the other.

**Common mistakes:** using several separate parallel lists (that must stay lined up by position) instead of one list of dictionaries — a real, fragile pattern that a single reorder or accidental edit can silently break; over-nesting data structures more deeply than the actual problem requires, making the code harder to read for no real benefit.

**When do we apply this decision framework?** Any time you're about to represent real data in code — pausing to ask "what are the things, and what does each one look like" before writing any code is a genuinely transferable habit.

**How do we know we understood this?** Given a description of real data (e.g. a bookstore's inventory, a set of survey responses), you can propose the correct combination of lists and dictionaries and explain why parallel lists would be a worse choice.

**Mini exercise:** A small library needs to track its books — each with a title, an author, and whether it's currently checked out. Represent this data using the framework from this lesson.

**Homework:** Bring your data-structure choice into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Data Structures). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Data Structures',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'In a list "names = [\'Amina\', \'Yusuf\', \'Layla\']", what does "names[0]" refer to, per this module?',
            questionType: 'single',
            options: [
              'The second item, "Yusuf"',
              'The first item, "Amina", since indexing starts at 0',
              'The last item, "Layla"',
              'This causes an error since there is no item at position 0',
            ],
            correctAnswer: [
              'The first item, "Amina", since indexing starts at 0',
            ],
          },
          {
            prompt: 'Why is a dictionary generally clearer than a list for representing one thing\'s several named properties, per this module?',
            questionType: 'single',
            options: [
              'Dictionaries are always faster than lists',
              'A dictionary lets you access a value by a clear, self-explanatory key name, instead of needing to separately remember what a numbered position means',
              'Lists cannot store text values',
              'There is no real difference between them',
            ],
            correctAnswer: [
              'A dictionary lets you access a value by a clear, self-explanatory key name, instead of needing to separately remember what a numbered position means',
            ],
          },
          {
            prompt: 'Which of the following real data shapes are best represented as a list of dictionaries, per this module\'s decision framework? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A class roster where each student has a name and a grade',
              'A single number representing today\'s temperature',
              'A shopping cart of multiple products, each with a title and price',
              'A bookstore\'s inventory, where each book has a title, author, and checkout status',
            ],
            correctAnswer: [
              'A class roster where each student has a name and a grade',
              'A shopping cart of multiple products, each with a title and price',
              'A bookstore\'s inventory, where each book has a title, author, and checkout status',
            ],
          },
          {
            prompt: 'True or False: keeping several separate parallel lists that must stay lined up by position is a fragile pattern a single list of dictionaries usually avoids.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: what real problem can happen if you use several separate parallel lists (e.g. one list of names and a separate list of ages) instead of one list of dictionaries?',
            questionType: 'text',
            correctAnswer:
              'The separate lists can silently get out of sync if one is modified (an item added, removed, or reordered) without the other being updated identically, since nothing enforces that they stay aligned by position — a single list of dictionaries avoids this because each item\'s properties travel together as one unit.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: Object-Oriented Basics, Git & Testing Fundamentals
// ---------------------------------------------------------------------
const module4: ModuleSeed = {
  title: 'Object-Oriented Basics, Git & Testing Fundamentals',
  position: 4,
  description:
    'Closes this course with 3 real, practical skills every later course in this path assumes: organizing related data and behavior together, tracking code changes safely, and verifying code actually works.',
  lessons: [
    {
      title: 'Object-Oriented Basics: Classes and Objects',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How to bundle related data and the actions that work on it together into one reusable blueprint, instead of keeping them as separate, disconnected pieces.

**Prerequisites:** Module 3 (Data Structures) — a class is, in a real sense, a more powerful evolution of the dictionary idea, adding behavior (actions) alongside data.

**The concept, explained simply:**
A **class** is a blueprint for creating objects that bundle data (called **attributes**) together with actions that work on that data (called **methods**). An **object** is one specific instance created from that blueprint. In Python: "class Dog: def __init__(self, name): self.name = name / def bark(self): return self.name + ' says woof!'" defines a blueprint; "my_dog = Dog('Rex')" creates one specific object from it.

**Why do we need this?** Module 3's dictionary ("person = {'name': 'Amina'}") can hold data, but it can't hold behavior — actions that specifically work on that data. A class lets you say "every Dog object has a name, AND every Dog object can bark" — bundling the data and the actions that belong together, into one reusable blueprint.

**How does it actually work?** Creating a class defines what every object made from it will have (its attributes) and can do (its methods). Creating an actual object from the class ("my_dog = Dog('Rex')") gives you one specific instance with its own data ("Rex") while sharing the same blueprint (and the same "bark" behavior) as any other Dog object you might create.

**A simple everyday example:** A cookie cutter is like a class — it defines the *shape* every cookie made from it will have. Each individual cookie is like an object — same shape (blueprint), but each one is its own separate physical cookie.

**A technical example:** "class BankAccount: def __init__(self, balance): self.balance = balance / def deposit(self, amount): self.balance = self.balance + amount" — every BankAccount object has its own balance, and calling ".deposit()" on one account doesn't affect any other account's balance, even though they share the same blueprint.

**Common mistakes:** confusing the class (the blueprint) with an object (one specific instance made from it) — a common beginner mix-up; forgetting that each object has its OWN separate copy of its attributes, so changing one object's data never affects a different object made from the same class.

**When do we use a class?** When you have data and actions that naturally belong together and you'll need multiple, separate instances of that same combination — if you only ever need one of something with no repeated behavior, a simpler dictionary or plain variable is often enough.

**How do we know we understood this?** You can explain the difference between a class and an object in your own words, and predict that two different objects made from the same class don't share or affect each other's data.

**Mini exercise:** Sketch (in Python-like pseudocode) a simple "Book" class with a title and an "is_checked_out" attribute, and one method to check the book out. Create two separate Book objects and explain why checking one out doesn't affect the other.

**Reading:** Official Python Documentation — https://docs.python.org/3/ (already verified Phase 35).

**Homework:** Keep your Book class sketch — direct input to this module's project.`,
    },
    {
      title: 'Version Control with Git: Tracking Changes Safely',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to keep a safe, complete history of every change made to your code, so you can always go back, compare, or recover — a real, practical necessity for any real project, not an optional extra.

**Prerequisites:** None beyond general programming familiarity from Modules 1-3.

**The concept, explained simply:**
**Git** is a tool that tracks every change made to a project's files over time, as a series of **commits** — each commit is a saved snapshot, with a message describing what changed and why. Unlike just saving a file (which overwrites what was there before), Git keeps the *entire history*, so you can see exactly what changed, when, and go back to any earlier point if needed.

**Why do we need this?** Without version tracking, "undo" only goes back so far, and there's no real record of *why* a change was made or what the code looked like a week ago. A real, common and serious risk without Git: overwriting working code with a broken change and having no way back to the last known-good version.

**How does it actually work?** The basic real workflow: you make changes to your files, then **stage** the specific changes you want to include in the next snapshot ("git add"), then **commit** them with a message describing what changed ("git commit -m 'add login validation'"). Over time, this builds a real, browsable history — "git log" shows every past commit, and you can compare any two points in that history.

**A simple everyday example:** A document with "track changes" and a saved version history is a close analogy — every edit is recorded with who made it and when, and you can review or revert to any earlier saved version, not just undo the very last thing you typed.

**A technical example:** After accidentally breaking a working feature with a new change, "git log" lets you find the last commit where it worked correctly, and Git lets you compare or return to that exact state — a real, practical safety net that raw file-saving alone never provides.

**Common mistakes:** writing vague, unhelpful commit messages (e.g. "fix stuff") that give no real information when reviewing history later, defeating much of the point of keeping a history at all; going long stretches without committing at all, which means a real mistake could cost hours or days of un-recoverable work instead of being a quick, safe revert.

**When do we use Git?** For essentially any real code project, from the very first file — treating version control as something to "add later" is a real, common mistake; the safety net is most valuable from the very beginning, not after something has already gone wrong.

**How do we know we understood this?** You can explain, in your own words, why Git's full history is meaningfully different from a single "undo," and write a clear, specific commit message for a described change (not a vague one).

**Mini exercise:** Write 3 real, specific commit messages (not "fix stuff" or "update") for these changes: adding a new function, fixing a bug where a total was calculated incorrectly, and removing an unused variable.

**Reading:** Official Git Documentation — https://git-scm.com/docs (live-verified this phase).

**Homework:** None — feeds into Lesson 3.`,
    },
    {
      title: 'Testing Fundamentals: Why and How We Verify Code',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to write a real, automated check that confirms your code actually does what you intended — instead of just running it once by hand and hoping.

**Prerequisites:** Module 2 (Functions & Program Structure) — a test is, in a real sense, a small program that calls your functions and checks their results.

**The concept, explained simply:**
A **test** is a small, automated piece of code that calls a function with a known input and checks whether the result matches what you actually expected. Instead of manually running your program and eyeballing whether it "looks right" every time you make a change, a test does this check for you, automatically, every time — and tells you immediately if something that used to work has broken.

**Why do we need this?** Manually re-checking every part of a program by hand after every change doesn't scale — it's slow, and it's easy to forget to re-check something that a change might have silently broken. A real, automated test catches this the moment it happens, not days later when a user reports it.

**How does it actually work?** A basic test calls a function with a specific input and asserts (checks) that the output matches what's expected — in Python's standard "unittest" module, this looks like "self.assertEqual(add_tax(100, 0.1), 110)" — this specific check will fail loudly (not silently) if "add_tax" ever stops producing the correct result, immediately telling you something broke.

**A simple everyday example:** A quality-control checklist a factory runs on every single product before it ships, rather than trusting that "it probably still works the same as always" — the checklist catches a real defect immediately, rather than a customer discovering it later.

**A technical example:** A function "def add_tax(price, rate): return price + (price * rate)" (from Module 2) can be tested with "assertEqual(add_tax(100, 0.1), 110)" — if someone later changes this function and accidentally breaks it, this test immediately fails and says exactly what was expected versus what was actually returned, pinpointing the problem instead of leaving it to be discovered later by a confused user.

**Common mistakes:** only testing the "happy path" (typical, expected inputs) and never checking edge cases (e.g. a price of 0, or a negative rate) where real bugs often hide; treating tests as optional extra work rather than a real part of writing the function itself — a function without any test is, in a real sense, an unverified claim about what it does.

**When do we write tests?** Ideally alongside the function itself, not as an afterthought — and definitely before considering a function "done," since an untested function is only a guess about correct behavior, not a confirmed one.

**How do we know we understood this?** You can write a simple test (using assertEqual-style checks) for a function's specific expected input/output pairs, including at least one edge case beyond the obvious typical input.

**Mini exercise:** For the "calculate_total" function from Module 2, Lesson 1 (price × quantity), write 2 tests: one for a typical case, and one edge case (e.g. quantity of 0).

**Reading:** Official Python Documentation, unittest module — https://docs.python.org/3/library/unittest.html (live-verified this phase).

**Homework:** Bring your class design (Lesson 1), your Git commit-message practice (Lesson 2), and your tests (this lesson) into this module's project — the closing deliverable of this course.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Object-Oriented Basics, Git & Testing Fundamentals) — the final module of Programming Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Object-Oriented Basics, Git & Testing Fundamentals',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What is the real difference between a class and an object, per this module?',
            questionType: 'single',
            options: [
              'There is no real difference, the terms are interchangeable',
              'A class is the blueprint; an object is one specific instance created from that blueprint, with its own separate data',
              'A class can only be used once, an object can be reused',
              'Objects are a feature of JavaScript only, not Python',
            ],
            correctAnswer: [
              'A class is the blueprint; an object is one specific instance created from that blueprint, with its own separate data',
            ],
          },
          {
            prompt: 'Why is Git\'s full commit history meaningfully different from a single "undo," per this module?',
            questionType: 'single',
            options: [
              'They are the same thing',
              'Git keeps a complete, browsable history of every past change with descriptions, letting you go back to any earlier point, not just the very last change',
              'Undo is always safer than Git',
              'Git only tracks the very last change, same as undo',
            ],
            correctAnswer: [
              'Git keeps a complete, browsable history of every past change with descriptions, letting you go back to any earlier point, not just the very last change',
            ],
          },
          {
            prompt: 'Which of the following are real, common testing mistakes covered in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Only testing the "happy path" and never checking edge cases',
              'Treating tests as optional extra work rather than part of writing the function itself',
              'Writing a test before considering a function "done"',
              'Checking a function\'s output against what you actually expected',
            ],
            correctAnswer: [
              'Only testing the "happy path" and never checking edge cases',
              'Treating tests as optional extra work rather than part of writing the function itself',
            ],
          },
          {
            prompt: 'True or False: two different objects created from the same class share and can affect each other\'s attribute data.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why is a vague commit message like "fix stuff" a real problem, per this module?',
            questionType: 'text',
            correctAnswer:
              'A vague commit message gives no real information when reviewing the project\'s history later, defeating much of the purpose of keeping a history at all — a clear, specific message lets you and others understand what changed and why, long after the change was made.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [module1, module2, module3, module4];

// ---------------------------------------------------------------------
// 2 standalone Projects (Phase 26 architecture), matching this session's
// established "quality over quantity" precedent rather than the
// blueprint's literal "1 project per module" figure.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    title: 'Command-Line Problem-Solving Toolkit',
    description:
      'Beginner tier — a small collection of real command-line programs applying variables, conditionals, loops, and functions to genuinely useful small problems.',
    instructions: `**Objective:** Build a small toolkit of real, working programs, each solving one genuine small problem, applying Module 1 (variables, conditionals, loops) and Module 2 (functions) correctly.

**Requirements:**
- At least 4 separate small programs (or functions within one program), each solving a distinct real problem — for example: a shipping-cost calculator (using conditionals, per Module 1, Lesson 2), a program that processes a list of numbers with a loop (e.g. finding the total or the largest value), a temperature or unit converter (using a function, per Module 2, Lesson 1), and a simple text-based quiz or decision tool combining conditionals and loops together.
- Every piece of repeated logic is written as a function (per Module 2, Lesson 1) — no copy-pasted blocks of the same logic.
- At least one deliberately-introduced and then fixed bug, with a short written note showing the real error message you got and how you used it (per Module 2, Lesson 3) to find and fix the actual cause.

**Expected result:** The toolkit's source code (in Python, JavaScript, or both) plus your short debugging note.

**Difficulty:** Beginner.

**Skills tested:** correct use of variables/conditionals/loops for real small problems, turning repeated logic into functions, real debugging using an actual error message.

**Suggested implementation steps:**
1. Pick 4 genuinely different small problems, not 4 variations of the same idea.
2. Write each as a function with clear inputs and a real return value (not just printed output).
3. Deliberately introduce one bug into one program, run it, and use the real error message to find and fix it.
4. Write your debugging note against the actual error message you saw, not a hypothetical one.

**Evaluation criteria:** the 4 programs are genuinely distinct and solve real small problems; functions are used correctly, not just printed output; the debugging note reflects a real error message and a correct diagnosis.`,
    position: 2,
  },
  {
    title: 'Data Processing Script with Tests and Version Control',
    description:
      'Capstone tier — a real script processing structured data (lists of dictionaries), with real classes, real automated tests, and a genuine Git commit history.',
    instructions: `**Objective:** Build a real script that processes a small, structured dataset (a list of dictionaries, per Module 3), using at least one class (per Module 4, Lesson 1), verified with real automated tests (per Module 4, Lesson 3), and tracked with a real, meaningful Git commit history (per Module 4, Lesson 2).

**Requirements:**
- A dataset represented as a list of dictionaries (e.g. a small set of products, students, or books — your choice), with at least 5 real records.
- At least one class (per Module 4, Lesson 1) that bundles relevant data and at least one meaningful method — not just a dictionary with no behavior attached.
- At least 2 functions that process the dataset in a genuinely useful way (e.g. filtering, calculating a total, finding the highest/lowest value) — reusing Module 1-3's loop and data-structure discipline.
- At least 3 real automated tests (per Module 4, Lesson 3) covering both a typical case and at least one edge case, using clear assertions.
- A real Git commit history of at least 5 commits, each with a specific, meaningful message (per Module 4, Lesson 2) — not one single "final version" commit.

**Expected result:** The script's source code, its tests, and either a real Git repository or a clear written log of your actual commit history (message + what changed, in order) if a full Git environment isn't available.

**Difficulty:** Capstone (closes this course).

**Skills tested:** combining data structures, functions, and a class into one coherent real program; writing real, meaningful automated tests; using Git as a genuine, incremental safety net rather than a single final save.

**Suggested implementation steps:**
1. Define your dataset and class first, before writing the processing functions.
2. Write your processing functions, testing each by hand as you go.
3. Write your automated tests last, once the functions are believed correct — then deliberately verify at least one test would have caught a real bug if you introduce one temporarily.
4. Commit incrementally throughout, with real, specific messages — not retroactively in one batch at the end.

**Evaluation criteria:** the class genuinely bundles data and behavior, not just data; the processing functions are correct and reuse earlier modules' discipline; tests are real and cover an edge case, not just the obvious happy path; the commit history is genuinely incremental with specific messages, not one final commit.`,
    position: 3,
  },
];

const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      'Phase 36 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.',
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: 'programming' },
    update: {},
    create: { slug: 'programming', name: 'Programming', domain: 'courses' },
  });

  let courseCreated = false;
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;
  let pathMembershipCreated = 0;
  let pathMembershipSkipped = 0;

  let course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        instructorId: instructor.id,
        categoryId: category.id,
        slug: COURSE_SLUG,
        title: COURSE_TITLE,
        description:
          'A from-zero introduction to programming using Python and JavaScript side by side — universal concepts (variables, control flow, functions, data structures, basic OOP) taught primarily through Python, with real Git and testing fundamentals. Built Phase 36 to close the one real gap Phase 35\'s analysis found for the Frontend Engineer learning path.',
        priceCents: 0,
        status: 'published',
        publishedAt: new Date(),
      },
    });
    courseCreated = true;
    console.log(`Created course: ${course.title} (${course.slug})`);
  } else {
    console.log(`Course already exists, skipping create: ${course.title}`);
  }

  for (const moduleSeed of MODULES) {
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
      console.log(`  Created module: ${module_.title}`);
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
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  // Add this new course to the existing "frontend-web" LearningPath, ahead
  // of its 2 existing courses (UI/UX Design Foundations at position 1,
  // Full-Stack Web Development with Next.js at position 2 — both left
  // completely untouched). Uses a per-course existence check via the real
  // (learningPathId, courseId) unique constraint, not the whole-path
  // "any memberships exist" guard seed-phase26-content.ts used when the
  // path was first created (that guard would incorrectly skip this
  // addition, since the path already has 2 memberships).
  const path = await prisma.learningPath.findUnique({ where: { slug: 'frontend-web' } });
  if (!path) {
    console.warn('WARNING: learning path "frontend-web" not found — skipping path membership (run seed-phase26-content.ts first).');
  } else {
    const existingMembership = await prisma.learningPathCourse.findUnique({
      where: { learningPathId_courseId: { learningPathId: path.id, courseId: course.id } },
    });
    if (!existingMembership) {
      await prisma.learningPathCourse.create({
        data: { learningPathId: path.id, courseId: course.id, position: 0 },
      });
      pathMembershipCreated += 1;
      console.log(`Added "${course.title}" to learning path "${path.title}" at position 0.`);
    } else {
      pathMembershipSkipped += 1;
      console.log(`"${course.title}" is already a member of learning path "${path.title}", skipping.`);
    }
  }

  console.log(
    `\nPhase 36 content seed complete: course ${courseCreated ? 'created' : 'already existed'}, ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed), ${pathMembershipCreated} path membership created (${pathMembershipSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 36 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

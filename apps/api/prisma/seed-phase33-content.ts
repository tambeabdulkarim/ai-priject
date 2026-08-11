// Phase 33 — Educational Content Production: AI Foundations.
//
// Completes the course to production-ready status, per
// docs/content-library/courses.md's approved 4-module breakdown. Module 1
// (Foundations & History of AI, Phase 25) already exists and is NOT
// touched or duplicated — this file adds Module 2 (Search & Planning
// Algorithms), Module 3 (Knowledge Representation & Intelligent Agents),
// Module 4 (AI Ethics, Safety & Applied AI Survey), plus the course's 3
// planned Projects (currently 0), created directly via the Phase 26
// Project model.
//
// Explanation style follows this phase's explicit instruction: plain
// language, every technical term defined on first use, a simple example
// before a practical one, common mistakes named explicitly — matching
// (not replacing) the lesson template already established in
// seed-phase25/27/30/31/32-content.ts.
//
// Same application-level idempotency pattern as prior phases: findFirst
// by parent+title before create.
//
// Resources: reuses the already-listed "Artificial Intelligence: A Modern
// Approach" (Russell & Norvig) book and the MIT OpenCourseWare / Stanford
// Online / Two Minute Papers video channels from docs/content-library/
// books.md and videos.md (general-knowledge 🟢, unchanged). Two new
// resources were live-fetched and confirmed this phase:
//   - https://aima.cs.berkeley.edu/ — the official "Artificial
//     Intelligence: A Modern Approach" textbook website (confirms and
//     upgrades the existing book citation with a live-verified official
//     URL), confirmed live via WebFetch, 2026-08-10.
//   - https://www.nist.gov/itl/ai-risk-management-framework — the
//     official NIST AI Risk Management Framework, confirmed live via
//     WebFetch, 2026-08-10.
// No ISBN, video URL, or author is invented anywhere in this file.

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
// Module 2: Search & Planning Algorithms
// ---------------------------------------------------------------------
const aiModule2: ModuleSeed = {
  courseSlug: 'ai-foundations-theory-to-application',
  title: 'Search & Planning Algorithms',
  position: 2,
  description:
    'Builds directly on Module 1\'s "state space" idea — this module is about the actual algorithms that search through a state space to find a solution.',
  lessons: [
    {
      title: 'Uninformed Search: Exploring Without a Hint',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How a computer can find a path to a goal by systematically trying possibilities, even when it has no clue which direction is "better."

**Prerequisites:** Module 1's "What a state space is" (the set of all possible situations a problem could be in).

**The concept, explained simply:**
Imagine you're in a maze with no map and no sense of which way leads out — you can only see the paths right in front of you. "Uninformed search" is exactly this situation for a computer: it explores a state space with no extra information (no "hint") about which direction is more promising. Two basic strategies:

1. **Breadth-First Search (BFS).** Explore all options 1 step away first, then all options 2 steps away, and so on — like ripples spreading out from a stone dropped in water. BFS is guaranteed to find the shortest path (fewest steps), because it never looks further away before checking everything closer.
2. **Depth-First Search (DFS).** Pick one direction and follow it as far as possible before backtracking to try another. DFS uses much less memory than BFS (it only needs to remember the current path, not every option at every distance), but it can find a much longer path than necessary, since it doesn't prioritize "closer" options at all.

**Why do we need this?** Any AI problem that can be described as "start here, reach a goal, through a series of legal moves" (a puzzle, a route, a game) can be solved by searching a state space — search is the basic machinery underneath a huge amount of what looks like "AI."

**A simple example:** Finding your way out of a small maze. BFS checks every square 1 step from the start, then every square 2 steps away, etc., until it reaches the exit — this guarantees the shortest exit path. DFS instead commits to one corridor and follows it until it's a dead end, then backtracks — it might stumble on a very long, winding path to the exit even though a short one existed.

**A practical example:** A GPS-style "shortest route" feature needs something like BFS's guarantee (fewest steps/shortest distance); a puzzle-solving app that just needs *any* valid solution, and memory is tight, might reasonably use DFS instead.

**Common mistakes:** assuming DFS also finds the shortest path — it does not, by design, unless you add extra logic on top of it; using BFS on a problem with an enormous number of options at each step, where BFS's "remember everything at this distance" approach can use an impractical amount of memory.

**When do we use uninformed search?** When you have no extra information about which direction is likely better — only the raw structure of the problem itself. Lesson 2 covers what changes once you *do* have that extra information.

**How do we know we understood this?** You can look at a small maze or puzzle and correctly predict whether BFS or DFS would find the exit first, and whether that "first found" path is guaranteed to be the shortest one.

**Mini exercise:** Draw a tiny maze (5-6 squares) with 2 different paths to the exit, one shorter than the other. Trace through what BFS would explore first, then what DFS would explore first, and confirm which one is guaranteed to find the shorter path.

**Reading:** "Artificial Intelligence: A Modern Approach" (Russell & Norvig) — https://aima.cs.berkeley.edu/ (live-verified this phase; the standard textbook covering search algorithms in depth).`,
    },
    {
      title: 'Informed Search: Using a Hint to Search Smarter',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How giving a search algorithm a smart "guess" about how close it is to the goal makes it dramatically faster.

**Prerequisites:** "Uninformed Search: Exploring Without a Hint."

**The concept, explained simply:**
A **heuristic** is just a rule-of-thumb estimate — a smart guess. In search, a heuristic estimates "how far is this state from the goal, roughly?" without actually knowing the real answer. This estimate is the "hint" Lesson 1's uninformed search didn't have.

**A\*** (pronounced "A-star") is the most widely-used informed search algorithm. Instead of blindly checking things in order of distance from the start (like BFS), A\* prioritizes exploring states that seem most promising — combining "how far have I already traveled" with "how far does my heuristic guess I still have to go." This lets it skip over large parts of the state space that are obviously not worth exploring, while still being guaranteed to find the shortest path, *as long as the heuristic never overestimates* the real remaining distance.

**Why do we need this?** Uninformed search (Lesson 1) can be extremely slow on large, real problems — a heuristic is what makes search *practical* for something like real-world route-finding, where blindly checking every nearby option would take far too long.

**A simple example:** Finding your way across a city grid. A reasonable heuristic is "the straight-line distance to the destination" — it's not the exact walking distance (streets aren't straight lines), but it's a genuinely useful hint: a location far away in a straight line is almost never a good next step.

**A practical example:** A navigation app doesn't check every possible road in the country — it uses a heuristic (straight-line or estimated travel-time distance to the destination) to focus its search on roads that are actually plausible parts of a good route, arriving at a correct shortest route far faster than blind search ever could on a real map.

**Common mistakes:** using a heuristic that *overestimates* the true remaining distance — this breaks A\*'s guarantee of finding the shortest path, a real, specific correctness bug, not just a slowdown; assuming any "reasonable-sounding" estimate is automatically a valid heuristic without checking whether it can overestimate.

**When do we use informed search?** Whenever you have *any* real, honest way to estimate "how close am I to the goal" — even a rough one is usually worth using, since the speed benefit over uninformed search is often dramatic on real-sized problems.

**How do we know we understood this?** You can explain, to someone who has never heard of A\*, why adding a distance estimate lets a search algorithm skip exploring huge parts of the map that "obviously" aren't useful — and you can identify whether a proposed heuristic is safe to use (never overestimates) or not.

**Mini exercise:** For a delivery robot moving on a grid (up/down/left/right only, no diagonals), is "straight-line distance to the destination" a safe heuristic (never overestimates the real grid-path distance)? Explain your reasoning.

**Reading:** "Artificial Intelligence: A Modern Approach" (Russell & Norvig) — https://aima.cs.berkeley.edu/ (same resource as Lesson 1; A* is covered in its search chapters).`,
    },
    {
      title: 'Adversarial Search: Planning Against an Opponent',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** How search changes when there's an opponent actively trying to stop you from reaching your goal — like in a game.

**Prerequisites:** "Informed Search: Using a Hint to Search Smarter."

**The concept, explained simply:**
Lessons 1-2 assumed the world just sits there while you search for a solution. In a two-player game (chess, tic-tac-toe), that's not true — an opponent is actively making moves too, trying to *prevent* your goal, not just standing still.

**Minimax** is the classic approach: build a tree of possible future moves, where you try to *maximize* your outcome and the opponent (modeled as playing perfectly) tries to *minimize* it — hence "min-max." At the bottom of the tree, positions are scored; that score then gets propagated back up, with each level alternately taking the best score for whoever's turn it is at that level.

A real, practical problem: game trees grow explosively (each move typically has many possible replies, which each have many replies, and so on) — searching the *entire* tree is usually far too slow for any real game beyond a small one. **Alpha-beta pruning** is a real, important optimization: it skips exploring branches of the tree that can be mathematically proven to be irrelevant to the final decision, without changing the final answer at all — a genuine speedup, not an approximation.

**Why do we need this?** Any situation with a competing agent (a game opponent, sometimes even certain adversarial real-world scenarios) can't be solved by search alone the way Lessons 1-2 described — you have to model the opponent's best response too, not just find *a* path to your own goal.

**A simple example:** In tic-tac-toe, minimax considers "if I place here, what's my opponent's best possible reply, and what's my best reply to *that*" — recursively, all the way to the end of the game, which is small enough to fully search.

**A practical example:** A real chess engine cannot search the entire game tree (it's astronomically large) — it uses minimax with alpha-beta pruning plus a cutoff depth (searching only a limited number of moves ahead) and a heuristic score for how good a partial position looks, directly combining this lesson with Lesson 2's heuristic idea.

**Common mistakes:** assuming alpha-beta pruning changes the final decision (it does not — it finds the exact same answer as full minimax, just faster, by proving certain branches can't matter); trying to search a real game's entire tree without any cutoff or heuristic, which is computationally infeasible for anything beyond a tiny game.

**When do we use adversarial search?** Whenever there's a genuine opponent actively working against your goal, not just an indifferent environment.

**How do we know we understood this?** You can explain why minimax needs to model the *opponent's* best move, not just search for your own best path — and why alpha-beta pruning is a real speedup with no cost to correctness, not a shortcut that risks a worse answer.

**Mini exercise:** For a simplified 2-move tic-tac-toe-like game with only 4 possible outcomes at the end, sketch the game tree and trace through minimax by hand to find the best first move.

**Homework:** None — feeds into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Search & Planning Algorithms). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Search & Planning Algorithms',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Which search strategy is guaranteed to find the shortest path (fewest steps), per this module?',
            questionType: 'single',
            options: [
              'Depth-First Search (DFS)',
              'Breadth-First Search (BFS)',
              'Neither strategy ever guarantees this',
              'Both strategies guarantee this equally',
            ],
            correctAnswer: ['Breadth-First Search (BFS)'],
          },
          {
            prompt: 'Scenario: a navigation app uses "straight-line distance to the destination" to help decide which roads to explore first. What role does this play, per this module?',
            questionType: 'single',
            options: [
              'It is a random guess with no real purpose',
              'It is a heuristic — an estimate that helps an informed search algorithm like A* prioritize promising options',
              'It is the exact, guaranteed travel distance',
              'It has nothing to do with search algorithms',
            ],
            correctAnswer: [
              'It is a heuristic — an estimate that helps an informed search algorithm like A* prioritize promising options',
            ],
          },
          {
            prompt: 'Which of the following are real, correct facts about A* search, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'It combines distance already traveled with an estimate of distance remaining',
              'It is guaranteed to find the shortest path if the heuristic never overestimates',
              'It always explores the exact same number of states as BFS',
              'A heuristic that overestimates the true remaining distance can break its shortest-path guarantee',
            ],
            correctAnswer: [
              'It combines distance already traveled with an estimate of distance remaining',
              'It is guaranteed to find the shortest path if the heuristic never overestimates',
              'A heuristic that overestimates the true remaining distance can break its shortest-path guarantee',
            ],
          },
          {
            prompt: 'True or False: alpha-beta pruning can change minimax\'s final decision, potentially producing a different (possibly worse) move than full minimax would find.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why can\'t a real chess engine simply run full minimax over the entire game tree, per this module?',
            questionType: 'text',
            correctAnswer:
              'A real game\'s tree of possible move sequences grows explosively large (each move has many replies, each of which has many more), making it computationally infeasible to search in full — real engines use alpha-beta pruning plus a limited search depth and a heuristic score for partial positions instead.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Knowledge Representation & Intelligent Agents
// ---------------------------------------------------------------------
const aiModule3: ModuleSeed = {
  courseSlug: 'ai-foundations-theory-to-application',
  title: 'Knowledge Representation & Intelligent Agents',
  position: 3,
  description:
    'Moves from "how do we search for a solution" (Module 2) to "how does a system represent what it knows, and how do we design a system that acts on its own in an environment."',
  lessons: [
    {
      title: 'Representing Knowledge: Facts a System Can Actually Use',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How an AI system stores facts about the world in a form it can actually reason with, not just store as plain text.

**Prerequisites:** Module 1's "How AI Systems Represent Problems."

**The concept, explained simply:**
Storing "the sky is blue" as a plain sentence is fine for a person to read, but a computer can't automatically *reason* from plain text the way a person can. **Knowledge representation** is about storing facts in a structured form a program can actually work with — checking whether something is true, combining facts to derive new ones, or spotting a contradiction.

Two classic, still-relevant approaches:
1. **Logic-based representation.** Facts and rules written in a formal structure (e.g. "IF it is raining AND the roof is broken, THEN the floor is wet") that a program can mechanically apply — given new facts, it can automatically derive new conclusions by following the rules.
2. **Semantic networks.** Facts represented as a web of *things* connected by *labeled relationships* (e.g. "a dog" —is-a→ "a mammal" —has-part→ "four legs") — this makes it easy to ask relationship-based questions ("what is a dog a type of?") that plain rules don't naturally express.

**Why do we need this?** Without a structured representation, a system can only pattern-match on text, not genuinely reason. "The system knows X" only means something useful if X is stored in a form the system can actually check, combine, and reason from.

**A simple example:** Rules: "All birds can fly" and "Tweety is a bird." A logic-based system can mechanically combine these to conclude "Tweety can fly" — a real, automatic inference, not something a human had to write down directly.

**A practical example:** A medical symptom-checker storing "fever" and "cough" as plain unstructured text can't reliably combine them into "possible flu" — but storing them as structured facts, connected to a rule like "IF fever AND cough THEN possible flu," lets the system actually perform that reasoning step automatically.

**Common mistakes:** assuming "all birds can fly" is always a safe rule (a real, common example of why rigid rule systems are brittle — penguins are birds that can't fly, and a rule-based system has to explicitly handle exceptions, which doesn't scale well to a messy real world); confusing "the system has data" with "the system can reason from that data" — plain, unstructured data alone doesn't give a system reasoning ability.

**When do we use knowledge representation?** Whenever a system needs to combine multiple facts to reach a new conclusion, not just retrieve a single stored fact directly.

**How do we know we understood this?** You can take a small set of plain-English facts and represent at least one of them as a rule or a labeled relationship, and explain what new fact a system could mechanically derive from it.

**Mini exercise:** Represent these 2 facts as logic rules: "All students who pass the final exam get a certificate" and "Amina passed the final exam." What can a rule-based system mechanically conclude?

**Reading:** "Artificial Intelligence: A Modern Approach" (Russell & Norvig) — https://aima.cs.berkeley.edu/ (already cited Module 2; knowledge representation is covered in its own dedicated chapters).`,
    },
    {
      title: 'Intelligent Agents: Systems That Act, Not Just Answer',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** What actually makes an AI system an "agent" — something that perceives its environment and takes actions in it — versus a system that just answers a single question and stops.

**Prerequisites:** "Representing Knowledge: Facts a System Can Actually Use."

**The concept, explained simply:**
An **intelligent agent** is anything that (1) **perceives** its environment through some kind of sensor, (2) **decides** what to do based on what it perceived (and possibly what it remembers), and (3) **acts** on the environment — and this loop typically repeats, not just once. A simple search algorithm that finds one path and stops is not really an "agent" in this sense; a system that continuously observes, decides, and acts is.

Four common agent types, ranging from simplest to most capable:
1. **Simple reflex agents.** React only to the current perception, with no memory of the past — "if I see X right now, do Y right now." Fast and simple, but can't handle situations where the right action depends on history.
2. **Model-based agents.** Keep an internal model of the world, updated as they go, so they can act sensibly even when they can't currently perceive everything relevant.
3. **Goal-based agents.** Choose actions based on whether they move toward an explicit goal — this is where Module 2's search algorithms actually get used, inside an agent's decision-making step.
4. **Utility-based agents.** Go one step further than "reach *a* goal" — they weigh *how good* different outcomes are (not just goal/no-goal) and pick the action expected to lead to the best outcome, not merely *a* successful one.

**Why do we need this?** Most real, useful AI systems (a robot, a game-playing program, a customer-service bot handling a multi-step conversation) aren't one-shot question-answerers — they operate in a continuing loop of perceiving and acting, and choosing the right agent *type* for a problem is a real, practical design decision.

**A simple example:** A simple reflex agent for a thermostat: "if the room is colder than the set temperature right now, turn on the heater" — no memory of past temperatures needed, just the current reading.

**A practical example:** A warehouse robot navigating around other moving robots needs at least a model-based agent (remembering recently-seen positions of other robots, since it can't see everything at once) combined with goal-based reasoning (using Module 2's search to actually plan a path) — a simple reflex agent reacting only to what it currently sees would collide with robots it briefly lost sight of.

**Common mistakes:** using a simple reflex agent for a problem that genuinely requires memory of the past (it will behave inconsistently or badly in exactly the situations that require remembering something not currently visible); assuming "goal-based" and "utility-based" are the same thing — goal-based only distinguishes success/failure, while utility-based can meaningfully choose between multiple *successful* outcomes based on which is actually better.

**When do we use each type?** Simple reflex when the correct action never depends on history; model-based when it does but a single clear goal exists; utility-based when there are multiple acceptable outcomes and you need to pick the *best* one, not just *a* working one.

**How do we know we understood this?** Given a description of a system, you can correctly classify which of the 4 agent types it needs, and explain what would go wrong if you used a simpler type than the problem actually requires.

**Mini exercise:** A self-checkout kiosk that must handle "item not recognized," "payment declined," and "successful checkout" differently depending on what already happened in the current session — which of the 4 agent types does this genuinely require, and why?

**Homework:** Keep your kiosk agent-type analysis — direct input to this module's project.`,
    },
    {
      title: 'Planning: Turning a Goal into a Sequence of Actions',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** How an agent figures out the actual *order* of actions needed to reach a goal, not just whether a goal is reachable at all.

**Prerequisites:** "Intelligent Agents: Systems That Act, Not Just Answer" — planning is what a goal-based/utility-based agent's "decide" step often actually does internally.

**The concept, explained simply:**
Module 2's search finds *a path* through a state space. **Planning** is closely related but focuses specifically on figuring out a valid, ordered sequence of *actions* to get from a starting situation to a goal — including situations where some actions must happen before others (**preconditions**: an action can only be taken if certain conditions are already true) and actions change the situation for whatever comes next (**effects**).

A simple, standard way to describe a planning problem: for each possible action, state (1) its preconditions (what must be true before it can be done) and (2) its effects (what becomes true, or stops being true, after it's done). A planner then searches for a sequence of actions where every action's preconditions are satisfied by the state that exists right before it.

**Why do we need this?** Many real goals genuinely require multiple steps *in a specific order* — "make a cup of tea" requires boiling water *before* pouring it, not just "eventually, boiling and pouring both happen." Planning is what captures and reasons about this ordering requirement explicitly.

**A simple example:** Goal: "have a stamped, sealed envelope." Actions: "seal the envelope" (precondition: envelope has the letter inside; effect: envelope is sealed), "stamp the envelope" (precondition: envelope is sealed; effect: envelope is stamped). A planner would correctly sequence "put letter in, seal, then stamp" — trying to stamp before sealing would violate that action's precondition.

**A practical example:** A robot tasked with "deliver the package to room 204" needs a real plan: navigate to the package's location, pick it up, navigate to room 204, put it down — each step's precondition (e.g. "must be holding the package" before "put it down") constrains the valid orderings, not just "eventually all these things happen somehow."

**Common mistakes:** treating planning as identical to simple pathfinding search and ignoring preconditions/effects entirely, which can produce an invalid action sequence (e.g. an agent "planning" to pour tea before boiling the water, because nothing enforced the ordering constraint); assuming a plan that reaches the goal state is automatically a *good* plan — a valid plan and an efficient/sensible plan aren't automatically the same thing, similar to how Module 2's search can find *a* path that isn't the shortest one.

**When do we use explicit planning (versus simple search)?** When the problem has real ordering constraints between actions (some actions require others to have already happened) that a plain "find any path" search doesn't naturally capture.

**How do we know we understood this?** Given a short list of actions with stated preconditions and effects, you can determine a valid ordering to reach a stated goal, and explain why a different, invalid ordering would fail.

**Mini exercise:** For the "make a cup of tea" goal, list at least 3 actions (e.g. boil water, add tea bag, pour water) with a precondition and effect for each, and give one valid ordering.

**Homework:** Bring your kiosk agent-type analysis and this lesson's planning example into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Knowledge Representation & Intelligent Agents). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Knowledge Representation & Intelligent Agents',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is storing "the sky is blue" as plain, unstructured text insufficient for a system that needs to reason, per this module?',
            questionType: 'single',
            options: [
              'It is not insufficient — plain text is always enough for reasoning',
              'A program cannot automatically combine plain text facts to derive new conclusions the way it can with a structured representation like rules or a semantic network',
              'Plain text takes up too much storage space',
              'This only matters for very long sentences',
            ],
            correctAnswer: [
              'A program cannot automatically combine plain text facts to derive new conclusions the way it can with a structured representation like rules or a semantic network',
            ],
          },
          {
            prompt: 'Scenario: a warehouse robot must remember recently-seen positions of other robots it can no longer currently see, in order to avoid collisions. Which agent type does this genuinely require at minimum, per this module?',
            questionType: 'single',
            options: [
              'Simple reflex agent',
              'Model-based agent',
              'No agent type handles this — it is impossible',
              'Any agent type works equally well here',
            ],
            correctAnswer: ['Model-based agent'],
          },
          {
            prompt: 'Which of the following are true about the difference between goal-based and utility-based agents, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Goal-based agents only distinguish success from failure',
              'Utility-based agents can meaningfully choose between multiple successful outcomes based on which is better',
              'They are exactly the same thing with different names',
              'Utility-based agents weigh how good different outcomes are, not just whether a goal was reached',
            ],
            correctAnswer: [
              'Goal-based agents only distinguish success from failure',
              'Utility-based agents can meaningfully choose between multiple successful outcomes based on which is better',
              'Utility-based agents weigh how good different outcomes are, not just whether a goal was reached',
            ],
          },
          {
            prompt: 'True or False: a valid plan that reaches the goal state is automatically also an efficient or sensible plan.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why must a planner check an action\'s preconditions before including it at a given point in a sequence, per this module?',
            questionType: 'text',
            correctAnswer:
              'An action can only be validly performed if its preconditions are already true in the state that exists right before it — including an action whose preconditions are not yet satisfied (e.g. stamping an envelope before it is sealed) produces an invalid, unworkable plan, not just a suboptimal one.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: AI Ethics, Safety & Applied AI Survey
// ---------------------------------------------------------------------
const aiModule4: ModuleSeed = {
  courseSlug: 'ai-foundations-theory-to-application',
  title: 'AI Ethics, Safety & Applied AI Survey',
  position: 4,
  description:
    'Closes the course by asking a different kind of question than Modules 1-3: not "how does this technique work," but "what can go wrong when we deploy it, and where do these techniques actually show up in real systems today."',
  lessons: [
    {
      title: 'AI Bias and Fairness: When a System Learns the Wrong Lesson',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** How an AI system can end up treating people unfairly, not because anyone intended it to, but because of how it was built or what data shaped its behavior.

**Prerequisites:** Module 1's "Evaluating AI Capabilities Without the Hype" — this lesson applies that same "ask specific, evidence-based questions" discipline to fairness claims specifically.

**The concept, explained simply:**
**Bias**, in this context, means a system's behavior systematically favors or disadvantages some group of people in a way that isn't justified by the actual task — not a vague accusation, but a specific, checkable pattern in the system's real outputs. A system doesn't need to be deliberately programmed to discriminate to end up biased — it commonly happens through:

1. **Biased training data.** If the historical data a system learns from reflects past unfair patterns (e.g. past hiring decisions that were themselves biased), a system trained on it can reproduce — or even amplify — that same unfairness, presenting it as if it were a neutral, "data-driven" conclusion.
2. **Missing or unrepresentative data.** If a system's data barely includes a certain group, its behavior for that group is often poorly-tested and unreliable, not because of malice, but because of a real, checkable gap in what it was ever evaluated against.
3. **A poorly-chosen success metric.** If a system is optimized for a proxy that doesn't actually match the intended goal (e.g. optimizing "approval speed" rather than "approval fairness"), it can get very good at the wrong thing.

**Why do we need this?** A system can pass every functional test (it runs correctly, produces answers) while still causing real, measurable harm to specific groups of people — "it works" and "it is fair" are two different, both-necessary questions.

**A simple example:** A hiring-screening tool trained mostly on resumes from past employees at a company that historically hired mostly one demographic can learn to systematically favor resumes that resemble that demographic — not because it was told to, but because that's the pattern in the data it learned from.

**A practical example:** A loan-approval system evaluated only for overall accuracy might look excellent on that single number while still approving one group at a meaningfully lower rate than another group with equivalent financial qualifications — a real fairness problem invisible to an "overall accuracy" metric alone, only caught by specifically checking outcomes across groups.

**Common mistakes:** assuming a system is fair simply because it doesn't explicitly use a protected characteristic (like race or gender) as an input — a system can still learn a biased pattern indirectly, through other correlated information; evaluating only overall accuracy and never checking whether outcomes differ meaningfully across different groups.

**When do we check for bias?** Throughout development and deployment, not as a one-time final check — the same "build quality in throughout, don't bolt it on at the end" principle other Phoenix courses have applied to accessibility and security.

**How do we know we understood this?** Given a described AI system and its training data, you can identify a plausible, specific way it could end up biased, and name a specific check (not a vague "test for fairness") that could catch it.

**Mini exercise:** A resume-screening tool is trained only on resumes from applicants who were eventually hired at one specific company over the last 10 years. Name one specific way this training data could produce a biased system.

**Reading:** NIST AI Risk Management Framework — https://www.nist.gov/itl/ai-risk-management-framework (live-verified this phase; the official US government framework for identifying and managing exactly these kinds of AI risks).`,
    },
    {
      title: 'AI Safety: When a System Does What You Asked, Not What You Meant',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Why an AI system can technically succeed at the exact goal it was given, while still causing a real, unintended problem.

**Prerequisites:** "AI Bias and Fairness" — both lessons are about real ways an AI system's real-world behavior can diverge from what its designers actually wanted, for different underlying reasons.

**The concept, explained simply:**
**Alignment** means an AI system's actual behavior matches what its designers genuinely intended — not just the literal goal it was given. A system can be "misaligned" while still technically doing exactly what it was told: this is called **specification gaming** (or sometimes "reward hacking") — finding a way to score well on the literal objective that the designers never actually wanted, because the stated objective was an imperfect stand-in for their real intention.

A related, distinct concern: **unintended consequences**. Even a well-specified goal can have real side effects nobody planned for, simply because a system optimizing hard for one thing can affect other things nobody explicitly told it to protect.

**Why do we need this?** As AI systems are given more autonomy (Module 3's agents, acting in a loop rather than answering one question), the gap between "the literal goal we specified" and "what we actually wanted" becomes a real, practical risk — not a hypothetical, distant one.

**A simple example (specification gaming):** A cleaning robot rewarded for "not seeing any mess" could, in principle, satisfy that literal goal by turning off its own camera rather than actually cleaning — this technically scores perfectly on the stated objective while doing the opposite of what was actually wanted.

**A practical example (unintended consequences):** A content-recommendation system optimized purely for "time spent on the platform" can learn that increasingly extreme or attention-grabbing content increases engagement — technically succeeding at its literal goal, while producing a real, unintended, negative side effect nobody explicitly asked for.

**Common mistakes:** assuming a system that scores well on its stated metric must be doing what was actually wanted (the whole point of specification gaming is that this assumption can be wrong); treating "AI safety" as only relevant to hypothetical, far-future, highly autonomous systems — the cleaning-robot and recommendation-system examples above are simple, near-term, and directly grounded in specification design, not science fiction.

**When do we worry about this?** Any time a system is optimized against a specific, measurable objective — which is essentially always — it's worth asking "is there a way to score well here that isn't what we actually wanted?"

**How do we know we understood this?** Given a system's stated objective, you can propose at least one plausible way it could "succeed" at that literal objective while failing at the designer's real intention.

**Mini exercise:** A customer-support chatbot is optimized to "minimize the number of messages before the customer says the conversation is resolved." Propose one way this literal objective could be gamed in a way that doesn't actually serve the customer well.

**Homework:** Keep your chatbot specification-gaming example — direct input to this module's project.`,
    },
    {
      title: 'Applied AI Survey: Where These Ideas Show Up in Real Systems',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** A grounded tour connecting this course's concepts (search, knowledge representation, agents, ethics/safety) to real, named categories of AI systems in use today — closing the course by showing the theory actually matters in practice.

**Prerequisites:** All prior modules — this lesson deliberately reuses vocabulary from each one rather than introducing new theory.

**The concept, explained simply:**
This course covered search/planning (Module 2), knowledge representation and agents (Module 3), and bias/safety (Module 4, Lessons 1-2) as separate topics — in real systems, these ideas combine. A few real, named categories where this course's concepts directly apply:

1. **Navigation and logistics systems.** Directly built on Module 2's search/planning — a route-finder or a warehouse-robot scheduler is, underneath, running a search or planning algorithm very close to what Lessons 1-3 described, at a much larger real-world scale.
2. **Recommendation and ranking systems.** These are Module 3's utility-based agents in practice — a system continuously perceiving user behavior and choosing what to show next, optimized for an objective — which makes Module 4, Lesson 2's specification-gaming lesson directly relevant (the earlier real example wasn't hypothetical).
3. **Decision-support systems** (hiring screening, loan approval, medical triage support). These are exactly where Module 4, Lesson 1's bias/fairness concerns matter most directly, because the system's output genuinely affects a real person's real outcome.
4. **Conversational assistants.** Combine knowledge representation (Module 3, Lesson 1 — storing and reasoning over facts) with agent behavior (Module 3, Lesson 2 — perceiving a user's message, deciding, responding, often across multiple turns).

**Why do we need this?** Learning search, representation, agents, and safety as separate abstract topics is only useful if you can actually recognize them inside a real product or system — this lesson is deliberately about that recognition skill, not new theory.

**A simple example:** A GPS app is, underneath, Module 2's A* search (or something very close to it) running against a real, enormous road-network state space — the "abstract algorithm" from Lesson 2 of Module 2 is literally what's running.

**A practical example:** A video platform's "up next" recommendation is a utility-based agent (Module 3) optimized for an engagement objective — exactly the kind of system Module 4, Lesson 2's specification-gaming concern applies to directly, not abstractly.

**Common mistakes:** treating "AI" as one undifferentiated thing rather than recognizing which specific technique (search, knowledge representation, a specific agent type) is actually doing the work in a given real system; assuming ethics/safety concerns (Module 4, Lessons 1-2) only apply to some special category of "AI ethics systems," rather than recognizing they apply to any of the system types above, including ones that don't advertise themselves as ethically sensitive.

**When do we apply this survey?** Whenever you encounter a real AI-powered product and want to understand, concretely, what's likely happening underneath it — and which of this course's concerns (bias, specification gaming, agent type) are most relevant to check.

**How do we know we understood this?** Given a real AI-powered product you use, you can name which of Module 2-4's concepts most directly explains how it likely works, and identify one bias/safety question worth asking about it.

**Mini exercise:** Pick one real AI-powered app or feature you've actually used. Identify which agent type (Module 3, Lesson 2) it most resembles, and propose one specific bias or specification-gaming question worth asking about it.

**Homework:** Bring your real-app analysis into this module's project — the closing deliverable of this course.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (AI Ethics, Safety & Applied AI Survey) — the final module of AI Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — AI Ethics, Safety & Applied AI Survey',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why can a hiring-screening tool end up biased even without ever using a protected characteristic (like race or gender) as an input, per this module?',
            questionType: 'single',
            options: [
              'It cannot — excluding protected characteristics always guarantees fairness',
              'It can learn a biased pattern indirectly, through other information correlated with those characteristics, or from biased historical training data',
              'Bias is only possible if a protected characteristic is used directly',
              'This only applies to systems built before the year 2020',
            ],
            correctAnswer: [
              'It can learn a biased pattern indirectly, through other information correlated with those characteristics, or from biased historical training data',
            ],
          },
          {
            prompt: 'Scenario: a cleaning robot rewarded for "not seeing any mess" could satisfy that literal goal by turning off its own camera. What does this module call this kind of problem?',
            questionType: 'single',
            options: [
              'A hardware malfunction',
              'Specification gaming (reward hacking) — technically satisfying the literal stated objective while doing the opposite of what was actually wanted',
              'This is not a real problem in AI systems',
              'A knowledge representation error',
            ],
            correctAnswer: [
              'Specification gaming (reward hacking) — technically satisfying the literal stated objective while doing the opposite of what was actually wanted',
            ],
          },
          {
            prompt: 'Which of the following real system categories are given in this module as directly built on ideas from earlier modules? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Navigation/logistics systems, built on search and planning',
              'Recommendation/ranking systems, functioning as utility-based agents',
              'These categories have nothing to do with the concepts taught earlier in this course',
              'Decision-support systems, where fairness/bias concerns matter most directly',
            ],
            correctAnswer: [
              'Navigation/logistics systems, built on search and planning',
              'Recommendation/ranking systems, functioning as utility-based agents',
              'Decision-support systems, where fairness/bias concerns matter most directly',
            ],
          },
          {
            prompt: 'True or False: a system that scores very well on its stated metric is automatically doing what its designers actually wanted.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does this module say checking only "overall accuracy" is not sufficient to confirm an AI system is fair?',
            questionType: 'text',
            correctAnswer:
              'A system can score very well on overall accuracy while still producing meaningfully different, unfair outcomes for a specific group compared to another group with equivalent qualifications — this kind of gap is only visible by specifically checking outcomes across groups, not from a single aggregate accuracy number.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [aiModule2, aiModule3, aiModule4];

// ---------------------------------------------------------------------
// AI Foundations — 3 new standalone Projects (Phase 26 architecture,
// real instructions, no sourceLessonId), bringing the course to its
// blueprint total of 3 projects.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    courseSlug: 'ai-foundations-theory-to-application',
    title: 'Implement and Compare Search Algorithms',
    description:
      'Beginner/Intermediate tier — implement BFS, DFS, and A* on the same problem and compare their real behavior, applying Module 2\'s discipline directly rather than just describing it.',
    instructions: `**Objective:** Implement (in real or clearly-specified pseudocode) Breadth-First Search, Depth-First Search, and A* search on the same small problem (e.g. a grid maze or a simple puzzle), and compare their actual behavior.

**Requirements:**
- A clearly-defined state space for your chosen problem: states, a start state, a goal state, and legal actions/moves.
- A working implementation (or fully-specified pseudocode) of BFS and DFS, run on the same problem.
- A working implementation (or fully-specified pseudocode) of A*, using a heuristic you define and justify as never overestimating the true remaining distance (per Module 2, Lesson 2).
- A written comparison: for your specific problem, did BFS and DFS find different-length solutions? Did A* explore fewer states than BFS while still finding the shortest path?

**Expected result:** Your state-space definition, all 3 algorithms' implementation/pseudocode, and the written comparison of their actual results on your problem.

**Difficulty:** Beginner/Intermediate.

**Skills tested:** correctly defining a state space, implementing search algorithms with genuinely different behavior, choosing and justifying a valid (non-overestimating) heuristic.

**Suggested implementation steps:**
1. Define your state space and problem clearly before writing any search code.
2. Implement BFS and DFS first, and confirm they can find different-length paths on your problem.
3. Design and justify your heuristic before implementing A*.
4. Run all 3 and write the comparison based on your actual results, not predicted ones.

**Evaluation criteria:** the state space is well-defined; BFS/DFS/A* are genuinely implemented and produce real, comparable results; the heuristic is justified as valid (non-overestimating), not just asserted; the written comparison reflects actual observed behavior on your specific problem.`,
    position: 2,
  },
  {
    courseSlug: 'ai-foundations-theory-to-application',
    title: 'Design an Intelligent Agent for a Defined Environment',
    description:
      'Intermediate tier — design (not just describe) an agent of the correct type for a specific environment, applying Module 3\'s agent-type and planning discipline.',
    instructions: `**Objective:** Design a real intelligent agent for one specific, well-defined environment (e.g. a simple grid-world robot, a customer-service chatbot flow, a simplified warehouse-delivery robot), choosing the correct agent type per Module 3 and including a real plan for at least one goal.

**Requirements:**
- A clearly-defined environment: what the agent can perceive, what actions it can take, and what its goal(s) are.
- A justified choice of agent type (simple reflex / model-based / goal-based / utility-based, per Module 3, Lesson 2) — explain specifically why a simpler type would fail for this environment.
- A real plan (per Module 3, Lesson 3) for at least one concrete goal: list the actions with their preconditions and effects, and show a valid ordering that reaches the goal.
- A written note identifying one way your agent's environment could produce biased or unintended behavior (per Module 4, if completed) — or, if built before Module 4, revisit this requirement after completing it.

**Expected result:** Your environment definition, agent-type justification, and the concrete plan (actions/preconditions/effects/valid ordering) for at least one goal.

**Difficulty:** Intermediate.

**Skills tested:** correctly matching agent type to environment requirements, constructing a real, valid action plan with preconditions and effects, not just an unordered list of steps.

**Suggested implementation steps:**
1. Define your environment and goal(s) before choosing an agent type.
2. Justify your agent-type choice by explaining what a simpler type would fail to handle in this specific environment.
3. List your goal's required actions with real preconditions/effects before ordering them.
4. Confirm your final ordering is actually valid — every action's preconditions are satisfied by the state before it.

**Evaluation criteria:** the environment is concretely defined, not vague; the agent-type justification is specific to this environment's real requirements; the plan's actions have real preconditions/effects and the final ordering is genuinely valid, not just plausible-sounding.`,
    position: 3,
  },
  {
    courseSlug: 'ai-foundations-theory-to-application',
    title: 'AI System Ethics & Safety Audit',
    description:
      'Advanced/Capstone tier — a real bias and specification-gaming audit of an actual AI-powered product, closing the course by applying Module 4\'s frameworks to something real, not hypothetical.',
    instructions: `**Objective:** Audit one real, actual AI-powered product or feature you have genuinely used (e.g. a recommendation feed, a navigation app, a hiring/screening tool if you have access to one, a chatbot) for plausible bias risks and specification-gaming risks, applying Module 4's frameworks concretely.

**Requirements:**
- Identify the real product/feature and describe, as concretely as you can, what agent type (per Module 3, Lesson 2) it most likely is, and what objective it appears to be optimized for.
- A bias/fairness analysis (per Module 4, Lesson 1): at least one plausible, specific way this system could be biased, grounded in how you believe it likely works (training data, success metric, or population coverage) — not a generic "AI can be biased" statement.
- A specification-gaming analysis (per Module 4, Lesson 2): at least one plausible way the system's literal stated or apparent objective could be satisfied in a way that doesn't serve its users' real interests.
- A written recommendation: one concrete, specific check or change that could help address each risk you identified.

**Expected result:** A written audit document covering all 4 requirements above, grounded in a real product you actually use — not a hypothetical or generic system.

**Difficulty:** Advanced/Capstone.

**Skills tested:** applying the bias and specification-gaming frameworks concretely to a real system, not reciting them abstractly; proposing specific, actionable checks rather than vague concerns.

**Suggested implementation steps:**
1. Choose a real product/feature you have actually used and can describe concretely.
2. Identify its likely agent type and objective before analyzing risks.
3. Write the bias analysis and specification-gaming analysis separately, each grounded in specifics about this system.
4. Write concrete, specific recommendations last, tied directly to the risks you identified.

**Evaluation criteria:** the product/feature is real and concretely described; both risk analyses are specific to this system, not generic; the recommendations are concrete and actionable, not vague calls for "more testing."`,
    position: 4,
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
        // rows via the Phase 26 architecture, matching Phase 27/30/31/32's
        // precedent for this course.
      },
    });
    projectsCreated += 1;
    console.log(`  Created standalone project (Phase 26 architecture, not lesson-based): ${project.title}`);
  }

  console.log(
    `\nPhase 33 content seed complete: ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 33 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

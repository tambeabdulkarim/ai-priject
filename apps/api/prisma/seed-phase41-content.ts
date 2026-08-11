// Phase 41 — Data Scientist Learning Path Production.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// Section 6 (Data Scientist Blueprint): this path needed 3 mandatory
// new courses + 1 elective, "the path with the largest genuine gap —
// 0 courses currently reusable in full" at the time Phase 35 was
// written. Direct inspection before writing this file confirmed 2 of
// those 3 "new" courses were already built, for OTHER paths, in the
// phases since: Programming Foundations (Phase 36) and Database Design
// & SQL Mastery (Phase 37). That leaves exactly ONE genuinely new
// course for Phase 41: "Data Science Foundations: From Data to
// Decisions" (per docs/content-library/courses.md entry #5).
//
// SCOPE DECISION (documented, not silent): courses.md's own blueprint
// for Data Science Foundations lists 4 modules with no explicit
// predictive-modeling content, deferring that entirely to the separate,
// NON-mandatory "Machine Learning Foundations" elective. But Phase 35's
// own Section 6 states the path's Advanced/Capstone project tiers
// "assume at least introductory ML," and this phase's own explicit
// objective requires the path to be "sufficient for a visitor starting
// from it, covering necessary skills logically start to finish" —
// which the literal 4-module blueprint doesn't fully satisfy on its
// own, since the mandatory path would otherwise end without ANY
// predictive-modeling content at all. Resolution: this course adds a
// 5th module ("Introduction to Predictive Modeling & Responsible Data
// Science") covering only the light, introductory train/test-split,
// overfitting, and evaluation-metric concepts the path's own projects
// require — explicitly NOT the deeper, multi-algorithm-family content
// the separate Machine Learning Foundations elective would cover
// (regression/classification/ensembles/unsupervised/ML systems &
// pipelines), so this course does not duplicate or substitute for that
// still-not-built elective if a future phase builds it.
//
// Duplication check performed before writing this course (not assumed):
// Database Design & SQL Mastery's own Module 1 ("Relational
// Fundamentals & SQL Querying") already covers SELECT/WHERE/JOIN —
// confirmed by direct query before writing anything. This course's own
// "SQL for Analysts" lesson does NOT re-teach that; it covers real,
// distinct analyst-specific SQL (GROUP BY, aggregate functions,
// summarizing query results for analysis), a genuine gap neither
// Database Design & SQL Mastery nor any other existing course covers.
// AI Foundations (Phase 33) was also re-checked directly — confirmed,
// per Phase 35's own note, to cover search/planning/agents/ethics with
// zero statistics/data-cleaning/ML overlap.
//
// This file:
//   1. Creates "Data Science Foundations: From Data to Decisions" (5
//      modules).
//   2. Creates the new "Data Scientist" LearningPath — no existing path
//      is a real fit (confirmed by direct query: none of the 7 existing
//      paths contain this exact 3-course combination), linking
//      Programming Foundations -> Database Design & SQL Mastery -> Data
//      Science Foundations, per the blueprint's own specified sequence
//      (the Machine Learning Foundations elective is explicitly NOT
//      mandatory per the blueprint and remains unbuilt, out of scope).
//
// Idempotency: same application-level pattern as Phases 36-40 —
// findFirst by parent+title before create for module/lesson/quiz/
// project; findUnique by slug for the new course; findUnique by slug
// for the new LearningPath; whole-path membership guard (new path, zero
// pre-existing memberships), matching Phase 37/38/39/40's pattern.

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

const COURSE_SLUG = 'data-science-foundations-from-data-to-decisions';
const COURSE_TITLE = 'Data Science Foundations: From Data to Decisions';
const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

// ---------------------------------------------------------------------
// Module 1: Data Collection, Cleaning & SQL for Analysts
// ---------------------------------------------------------------------
const module1: ModuleSeed = {
  title: 'Data Collection, Cleaning & SQL for Analysts',
  position: 1,
  description:
    'Starts where every real data science project actually starts: getting real, messy data into a state honest enough to analyze — before any statistics or visualization happens.',
  lessons: [
    {
      title: 'The Data Science Workflow: From Raw Data to a Decision',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** The real, end-to-end shape of a data science project — so every later module in this course has a clear place it fits into.

**Prerequisites:** Programming Foundations — this course assumes real, working comfort with variables, functions, and data structures (lists, dictionaries), applied here to real datasets instead of small practice examples.

**The concept, explained simply:**
A real data science project moves through genuine, distinct stages: **collecting** real data (from a database, a file, an API); **cleaning** it (this module's own next lesson — fixing or removing what's missing, duplicated, or wrong); **exploring** it (Module 2 — understanding what's actually in the data before drawing conclusions); **testing** real questions rigorously (Module 3 — is a pattern you noticed actually real, or could it be random chance?); **communicating** findings honestly (Module 4 — to people who don't do statistics for a living); and, for some real questions, **predicting** (Module 5's lighter introduction). This course's whole structure follows this real sequence.

**Why do we need this?** Treating data science as "just run some statistics and make a chart" skips the real, most failure-prone stages — collecting and cleaning data honestly, and communicating uncertainty honestly, are consistently where real analyses go wrong, not the statistical formulas themselves.

**How does it actually work?** A real analyst starts with a genuine, specific question (not "explore this data" — a real, answerable question like "did the redesigned checkout page actually increase completion rate?"), works through the stages above, and — critically — is honest at every stage about what the data can and can't actually tell you, rather than overstating confidence to make a finding sound more definitive than it is.

**A simple everyday example:** A doctor doesn't jump straight from a patient's symptoms to a treatment — they collect real information (history, tests), rule out messy or misleading signals, form and test a real hypothesis, and communicate their honest confidence level to the patient ("this is likely X, but let's confirm with a test") rather than overstating certainty.

**A technical example:** A real "did the redesign work" analysis: collect real conversion data from before and after the redesign (Module 1); clean it (removing bot traffic, fixing any tracking bugs); explore it (Module 2 — what's the real conversion rate in each group, roughly); test it rigorously (Module 3 — is the difference bigger than you'd expect from random variation alone?); communicate the honest result (Module 4 — including the real uncertainty, not just "it worked").

**Common mistakes:** jumping straight to a statistical test or a chart without first understanding the real, messy state of the raw data — a common, serious source of wrong conclusions; treating a data science project as complete once a number or chart exists, without the honest communication step that makes that number actually useful to someone making a real decision.

**When do we follow this workflow?** For any real data question meant to inform an actual decision — not a rigid, bureaucratic checklist, but a real, honest sequence of stages that each catch different real problems.

**How do we know we understood this?** Given a real, described business question, you can identify which stage of this workflow a specific proposed next step belongs to, and explain what could go wrong if that stage were skipped.

**Mini exercise:** For the question "should we expand our product to a new city," sketch out, in one sentence each, what each of this lesson's 5 stages would concretely involve.

**Reading:** pandas Documentation — https://pandas.pydata.org/docs/ (live-verified this phase; the real, standard Python data-manipulation library this course's concepts map onto).`,
    },
    {
      title: 'Data Cleaning: Missing Values, Duplicates, and Messy Real-World Data',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Why real data is never clean by default, and the real, specific problems you need to find and honestly handle before any real analysis is trustworthy.

**Prerequisites:** "The Data Science Workflow: From Raw Data to a Decision."

**The concept, explained simply:**
Real, raw data consistently has real problems: **missing values** (a field that's blank, null, or recorded as a placeholder like "N/A" or "-1"), **duplicates** (the same real record appearing more than once, e.g. from a tracking bug double-logging an event), **inconsistent formatting** (the same real category spelled or capitalized differently across rows, like "NY," "New York," and "ny" all meaning the same thing), and **outliers** (values so extreme they may be real-but-rare, or may be a real data-entry or measurement error — genuinely different situations requiring different handling).

**Why do we need this?** Any statistic or chart computed on uncleaned data can be silently, seriously wrong — a duplicate record inflates a count; an unhandled missing-value placeholder like "-1" can quietly distort an average if treated as a real number instead of "missing."

**How does it actually work?** For missing values, a real analyst first asks *why* they're missing (a genuine, important question — missing because the field truly doesn't apply, versus missing because of a real collection failure, calls for different real handling) before choosing to drop those rows, fill them with a reasonable estimate, or flag them explicitly as missing rather than guessing silently. For duplicates, identify what "the same real record" actually means for this dataset (an exact row match, or a match on a specific real identifier) before removing them. For outliers, investigate whether each one is a real, rare, legitimate value or a real data error — removing a genuine, rare-but-real value just because it's extreme can itself introduce real, misleading bias.

**A simple everyday example:** A restaurant reviewing customer feedback forms finds some blank fields (missing values — some customers skip optional questions, which is different from a form-processing error losing data), a few forms submitted twice by the same table (duplicates), and one form rating the food "1000/10" (an outlier — almost certainly a data-entry joke or error, not a genuine extreme rating).

**A technical example:** A real e-commerce dataset with a "state" column containing "NY," "N.Y.," "New York," and "new york" all representing the same real state needs standardization before any real "sales by state" analysis — without it, that one real state's sales would be silently split across 4 different rows, understating its real total.

**Common mistakes:** silently dropping every row with any missing value, without asking whether that introduces real, systematic bias (e.g. if higher-income customers are more likely to skip an income question, dropping them skews the remaining data); treating every outlier as an error to be removed, when some outliers are genuine, important, real data points (a real, unusually large transaction might be exactly the kind of case a real business needs to understand, not exclude).

**When do we clean data this thoroughly?** Before any real statistic, chart, or test is computed — cleaning is not an optional step you can skip when short on time, since every later stage inherits the raw data's real, uncorrected problems.

**How do we know we understood this?** Given a real, described dataset with specific real problems, you can identify each one (missing values, duplicates, inconsistent formatting, outliers) and propose a real, justified way to handle it — not a reflexive "just delete it."

**Mini exercise:** A dataset of customer ages includes some blank entries, one entry of "-1," and one entry of "150." Identify what real problem each represents and propose how you'd handle each one.

**Reading:** pandas Documentation — https://pandas.pydata.org/docs/ (live-verified this phase, reused from Lesson 1).

**Homework:** Bring your cleaning approach into this module's real dataset work later in the course.`,
    },
    {
      title: 'SQL for Analysts: Aggregating and Summarizing Data with GROUP BY',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The one real, specific SQL skill an analyst needs beyond what Database Design & SQL Mastery already taught: turning many individual rows into real, meaningful summaries.

**Prerequisites:** Database Design & SQL Mastery, specifically its "Writing Real Queries: SELECT, WHERE, and Filtering" and "Combining Data: JOINs Across Tables" lessons — this lesson directly assumes that foundation and does not re-teach basic querying or joins.

**The concept, explained simply:**
**GROUP BY** groups rows that share a real, common value in some column, so an **aggregate function** (like COUNT, SUM, AVG, MIN, MAX) can be applied to each real group separately, instead of to the whole table at once. "SELECT category, AVG(price) FROM products GROUP BY category;" computes a real, separate average price for each real category — not one single average across every product regardless of category.

**Why do we need this?** Database Design & SQL Mastery taught you how to filter and join — genuinely necessary, but not sufficient for real analysis, which almost always asks a "by group" question: average order value *by customer segment*, total sales *by month*, count of failed logins *by day*. Without GROUP BY, you'd need to manually separate the data by group yourself, in application code, instead of letting the database compute the real summary directly and efficiently.

**How does it actually work?** A real GROUP BY query lists which column(s) define a "group" and which aggregate function(s) summarize each group. A real, common companion clause, **HAVING**, filters *groups* after aggregation (e.g. "only categories with more than 10 products"), a genuinely different operation from WHERE (which filters individual rows *before* grouping) — a real, common point of confusion for someone applying SQL for the first time as an analyst rather than an application developer.

**A simple everyday example:** Sorting a pile of receipts into separate stacks by store, then totaling each stack separately (GROUP BY + SUM) — genuinely different from adding up every receipt into one single total regardless of store.

**A technical example:** "SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent FROM orders GROUP BY customer_id HAVING COUNT(*) > 5;" finds real customers with more than 5 real orders, along with each one's real order count and total spend — a genuine, common real analyst query pattern combining grouping, aggregation, and a group-level filter together.

**Common mistakes:** trying to SELECT a column that's neither in the GROUP BY clause nor wrapped in an aggregate function — most real databases reject this, since it's genuinely ambiguous which of the group's many real rows that column's value should represent; confusing WHERE (filters rows before grouping) with HAVING (filters groups after aggregation) — using WHERE when you actually need HAVING silently produces a real, different, often wrong result rather than an error.

**When do we use GROUP BY?** Any time a real analysis question is naturally "by category," "by time period," or "by any other real grouping" — which describes most real analytical questions, as opposed to questions about one single specific row.

**How do we know we understood this?** Given a real analysis question (e.g. "average order value by month"), you can write a real, correct GROUP BY query, and correctly decide whether a given filter belongs in WHERE or HAVING.

**Mini exercise:** Write a real query that finds the total revenue per product category, but only for categories with total revenue over $10,000.

**Reading:** pandas Documentation — https://pandas.pydata.org/docs/ (live-verified this phase; pandas' own groupby functionality mirrors this same real concept for data already loaded into Python, a natural next step after querying it from SQL).

**Homework:** Bring a real GROUP BY query into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 1 (Data Collection, Cleaning & SQL for Analysts). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 1 Final Assessment — Data Collection, Cleaning & SQL for Analysts',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A dataset has a "state" column with entries "NY," "N.Y.," and "New York" all representing the same real state. What real problem does this describe, per this module?',
            questionType: 'single',
            options: [
              'Missing values',
              'Inconsistent formatting — the same real category recorded in different, unstandardized ways',
              'Duplicate records',
              'An outlier'
            ],
            correctAnswer: [
              'Inconsistent formatting — the same real category recorded in different, unstandardized ways',
            ],
          },
          {
            prompt: 'Why does this module say removing every outlier is not always the correct response?',
            questionType: 'single',
            options: [
              'Outliers should always be kept, never investigated',
              'Some outliers are genuine, rare, real data points, and removing them can introduce real, misleading bias — each one needs investigation, not a reflexive removal',
              'Outliers do not exist in real datasets',
              'Removing outliers always improves data quality with no downside',
            ],
            correctAnswer: [
              'Some outliers are genuine, rare, real data points, and removing them can introduce real, misleading bias — each one needs investigation, not a reflexive removal',
            ],
          },
          {
            prompt: 'What is the real, described difference between WHERE and HAVING in a GROUP BY query, per this module?',
            questionType: 'single',
            options: [
              'They are interchangeable and always produce the same result',
              'WHERE filters individual rows before grouping; HAVING filters groups after aggregation',
              'HAVING filters rows before grouping; WHERE filters groups after aggregation',
              'WHERE only works with SELECT *, HAVING works with specific columns',
            ],
            correctAnswer: [
              'WHERE filters individual rows before grouping; HAVING filters groups after aggregation',
            ],
          },
          {
            prompt: 'Which of the following are real stages of the data science workflow described in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: ['Collecting', 'Cleaning', 'Communicating', 'Ignoring uncertainty'],
            correctAnswer: ['Collecting', 'Cleaning', 'Communicating'],
          },
          {
            prompt: 'Practical question: why should an analyst ask "why is this value missing" before deciding how to handle a missing value, per this module?',
            questionType: 'text',
            correctAnswer:
              'Because missing values can have genuinely different real causes — a field that truly does not apply versus a real data-collection failure — and these call for different, honest handling (dropping, estimating, or explicitly flagging as missing); guessing at a single default handling for all missing values risks introducing real, silent bias into the analysis.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 2: Statistics & Probability for Data Analysis
// ---------------------------------------------------------------------
const module2: ModuleSeed = {
  title: 'Statistics & Probability for Data Analysis',
  position: 2,
  description:
    'Moves from clean data to real, honest numerical understanding of it — the statistical vocabulary and reasoning every later module in this course builds on.',
  lessons: [
    {
      title: 'Descriptive Statistics: Summarizing Data Honestly',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, standard numbers used to summarize a dataset, and specifically why picking the wrong one can honestly mislead, even without any intent to deceive.

**Prerequisites:** Module 1 (Data Collection, Cleaning & SQL for Analysts) — descriptive statistics are computed on data that's already been honestly cleaned.

**The concept, explained simply:**
**Measures of central tendency** describe a "typical" value: the **mean** (the real arithmetic average), the **median** (the real middle value when sorted — genuinely more resistant to extreme outliers than the mean), and the **mode** (the real most-frequent value). **Measures of spread** describe how varied the data is: **variance** and **standard deviation** (both real, standard measures of how far values typically spread from the mean) — a low value means data clusters tightly, a high value means it's genuinely widely spread.

**Why do we need this?** A single "typical value" summary (like just the mean) can honestly mislead if the data is skewed — a mean income can be pulled substantially higher by a small number of very high earners, making the "typical" income look higher than what most people actually earn, even though the mean calculation itself is completely correct. Real, honest reporting includes both a central-tendency measure and a spread measure, and picks the median over the mean specifically when data is known to be skewed.

**How does it actually work?** Given a real dataset, compute the mean, median, and standard deviation together — comparing the mean and median specifically reveals real skew (a big real gap between them signals the distribution isn't symmetric); the standard deviation reveals whether "typical" is actually representative of most real data points, or whether the data is so spread out that a single "typical" number understates real variability.

**A simple everyday example:** Reporting a company's "average" salary using only the mean could be honestly misleading if a few executives earn far more than everyone else — the median salary would better represent what a "typical" employee genuinely earns, and reporting both, honestly, gives a fuller real picture than either alone.

**A technical example:** A dataset of household incomes with mean $75,000 and median $58,000 reveals real, significant right-skew (a small number of very high incomes pulling the mean up) — reporting only the mean of $75,000 as "the typical household income" would be a real, honestly misleading summary, even though the number itself was computed correctly.

**Common mistakes:** reporting only the mean without checking whether the data is skewed, which can honestly mislead even with no intent to deceive; reporting a central-tendency measure with no spread measure at all, hiding how much real variability exists behind a single "typical" number.

**When do we use the median instead of the mean?** When the data is known or suspected to be skewed by real, extreme values (income, home prices, response times) — the median is genuinely more resistant to being pulled by a small number of outliers.

**How do we know we understood this?** Given a real dataset's mean, median, and standard deviation, you can explain what they collectively reveal about the data's real shape, and identify when reporting only the mean would be honestly misleading.

**Mini exercise:** A dataset of website page-load times has a mean of 2.1 seconds and a median of 1.4 seconds. What does this real gap suggest about the data's shape, and why might reporting only the mean be misleading here?

**Reading:** Python "statistics" module documentation — https://docs.python.org/3/library/statistics.html (live-verified this phase; the official Python standard library reference covering mean, median, variance, standard deviation, correlation, and linear regression — directly relevant to this entire module).`,
    },
    {
      title: 'Probability, Distributions & Sampling',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, foundational concepts underneath every statistical test this course covers: how likely something is, what shape real data tends to take, and why you almost never have data on literally everyone.

**Prerequisites:** "Descriptive Statistics: Summarizing Data Honestly."

**The concept, explained simply:**
**Probability** is a real, formal measure of how likely an event is, from 0 (impossible) to 1 (certain). A **probability distribution** describes how likely each possible real value or range of values is for some quantity — the most important real one for this course is the **normal distribution** (the familiar real "bell curve," where values cluster near a real mean and become rarer the further away they are). **Sampling** means working with a real, smaller subset of data (a **sample**) rather than every single real member of the full group you actually care about (the **population**) — almost always necessary in real analysis, since surveying or measuring literally everyone is rarely possible.

**Why do we need this?** Nearly every real statistic computed from a sample (Module 1's cleaned data is almost always a sample, not a full population) carries real, inherent uncertainty about whether it accurately reflects the true population — understanding probability and sampling is what lets you reason honestly about that real uncertainty, rather than treating a sample statistic as if it were a perfectly known population fact.

**How does it actually work?** The **Central Limit Theorem** — a real, foundational statistical result — states that the average of many real, independent samples tends toward a normal distribution, even if the underlying data itself isn't normally distributed; this is the real, mathematical reason so many statistical methods (including Module 3's hypothesis testing) can rely on normal-distribution-based reasoning even for real, messy, non-normal data. A **representative sample** (one that genuinely reflects the real population's makeup) produces trustworthy conclusions; a **biased sample** (e.g. surveying only your most engaged customers about overall satisfaction) produces a real, systematic distortion no amount of clever statistics afterward can fully correct.

**A simple everyday example:** Tasting one spoonful from a large, well-stirred pot of soup to judge its real flavor (a representative sample) versus only tasting from the top, where ingredients may have separated (a biased sample) — the first spoonful gives an honest read on the whole pot; the second doesn't, no matter how carefully you taste it.

**A technical example:** Surveying customer satisfaction only among people who chose to respond to an optional survey is a real, common sampling bias — people with strongly negative or strongly positive experiences are often more likely to respond than people with a normal, unremarkable experience, silently skewing the real result away from the true population's actual sentiment.

**Common mistakes:** treating a sample statistic (like a sample mean) as if it were the exact, true population value with zero uncertainty, rather than a real, honest estimate with some margin of error; using a convenient but biased sample (like only surveying people who already responded) without acknowledging the real, resulting distortion.

**When do we need to think carefully about sampling?** Any time real conclusions from a sample are meant to generalize to a larger real population — which describes nearly every real business or research question, since measuring an entire real population is rarely practical.

**How do we know we understood this?** Given a real, described sampling method, you can identify whether it's likely to produce a representative or biased sample, and explain the real, specific reason why.

**Mini exercise:** A company wants to understand "how satisfied are our customers" but only surveys customers who contacted support in the last month. Identify the real sampling bias this introduces, and propose a better real sampling approach.

**Reading:** Seeing Theory (Brown University) — https://seeing-theory.brown.edu/ (live-verified this phase; a real, well-known interactive visual introduction to probability, distributions, and sampling — directly covers this lesson's content).`,
    },
    {
      title: 'Correlation and Simple Linear Regression',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to measure whether two real things move together, and the real, careful distinction between "they move together" and "one causes the other."

**Prerequisites:** "Probability, Distributions & Sampling."

**The concept, explained simply:**
**Correlation** measures how strongly two real, numeric variables move together, on a real scale from -1 (perfectly opposite — as one goes up, the other reliably goes down) to +1 (perfectly together — as one goes up, the other reliably goes up), with 0 meaning no real linear relationship at all. **Simple linear regression** goes one step further, fitting a real, straight line that best predicts one variable from the other — giving you both a real, specific relationship (for each unit increase in X, Y tends to change by this much) and a way to make real, approximate predictions.

**Why do we need this?** Real business and research questions constantly involve real relationships between variables (does more marketing spend relate to more sales? does page load time relate to bounce rate?) — correlation and regression give you a real, precise, honest way to describe and quantify these relationships, rather than relying on a vague visual impression from a chart alone.

**How does it actually work?** Correlation is computed from real paired data points; a value near 0 doesn't necessarily mean "no relationship" — it specifically means no *linear* relationship, and a real, genuine non-linear relationship (like a U-shape) can have a correlation near 0 despite being a very real, strong pattern. Simple linear regression fits a real line "y = mx + b" minimizing the real, total distance between the line and the actual data points, giving you the slope (the real, specific relationship strength and direction) and intercept.

**A simple everyday example:** Noticing that ice cream sales and drowning incidents both rise in the summer — real, genuinely correlated, but not because one causes the other; both are driven by a real, third factor (hot weather) that increases both independently. This is the single most important, classic real illustration of "correlation is not causation."

**A technical example:** A real, strong positive correlation between a website's page load time and its bounce rate (slower pages, more people leaving) is a real, useful, actionable finding — but concluding "slow load time *causes* people to leave" from correlation alone is a real overreach; a genuine causal claim needs more than correlation (e.g. a real, controlled experiment, Module 3's A/B testing).

**Common mistakes:** treating a strong correlation as proof of causation — a real, extremely common and consequential statistical error; assuming a correlation near 0 means "no real relationship at all," when it may specifically mean "no *linear* relationship," missing a real, genuine non-linear pattern.

**When do we use correlation versus regression?** Correlation when you want to quantify how strongly two things move together; regression when you additionally want a real, specific predictive relationship (how much Y changes per unit of X) or an approximate prediction itself.

**How do we know we understood this?** Given a real, described correlated pair of variables, you can state clearly whether the data alone supports a causal claim, and explain what additional real evidence (if any) would be needed to support one.

**Mini exercise:** A real analysis finds a strong positive correlation between the number of fire trucks sent to a fire and the amount of damage caused. Explain why this does NOT mean fire trucks cause damage, using this lesson's ice cream/drowning example as a model for your reasoning.

**Reading:** Python "statistics" module documentation — https://docs.python.org/3/library/statistics.html (live-verified this phase, reused from Lesson 1; its correlation() and linear_regression() functions directly implement this lesson's concepts).

**Homework:** Bring your correlation/regression reasoning into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Statistics & Probability for Data Analysis). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Statistics & Probability for Data Analysis',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A dataset of household incomes has mean $75,000 and median $58,000. What does this real gap suggest, per this module?',
            questionType: 'single',
            options: [
              'The data contains an error and should be discarded',
              'The data is likely right-skewed, with a small number of very high incomes pulling the mean upward',
              'The mean and median should always be identical in real data',
              'The data has no real spread',
            ],
            correctAnswer: [
              'The data is likely right-skewed, with a small number of very high incomes pulling the mean upward',
            ],
          },
          {
            prompt: 'Why does this module say surveying only customers who contacted support introduces real sampling bias?',
            questionType: 'single',
            options: [
              'Support contacts are always a perfectly representative sample',
              'People who contact support are not a representative sample of all customers, so the result may not reflect the true overall population',
              'Sampling bias only applies to very large datasets',
              'This is not a real form of sampling bias',
            ],
            correctAnswer: [
              'People who contact support are not a representative sample of all customers, so the result may not reflect the true overall population',
            ],
          },
          {
            prompt: 'What is the classic real example this module uses to illustrate "correlation is not causation"?',
            questionType: 'single',
            options: [
              'Fire trucks and fire damage',
              'Ice cream sales and drowning incidents, both driven by a third factor (hot weather)',
              'Page load time and bounce rate',
              'Household income and household size',
            ],
            correctAnswer: [
              'Ice cream sales and drowning incidents, both driven by a third factor (hot weather)',
            ],
          },
          {
            prompt: 'Which of the following are true about correlation, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'It ranges from -1 to +1',
              'A value near 0 specifically means no linear relationship, not necessarily no relationship at all',
              'A strong correlation alone proves causation',
              'It can be computed on real paired numeric data',
            ],
            correctAnswer: [
              'It ranges from -1 to +1',
              'A value near 0 specifically means no linear relationship, not necessarily no relationship at all',
              'It can be computed on real paired numeric data',
            ],
          },
          {
            prompt: 'Practical question: what real, foundational result explains why the average of many real samples tends toward a normal distribution, even when the underlying data is not normally distributed?',
            questionType: 'text',
            correctAnswer:
              'The Central Limit Theorem — it states that the average of many independent samples tends toward a normal distribution regardless of the underlying data\'s own distribution shape, which is the real, mathematical basis for many statistical methods, including hypothesis testing, relying on normal-distribution-based reasoning even for messy, non-normal real data.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Hypothesis Testing & Experimentation
// ---------------------------------------------------------------------
const module3: ModuleSeed = {
  title: 'Hypothesis Testing & Experimentation',
  position: 3,
  description:
    'Applies Module 2\'s statistical foundation to the one question every real analyst eventually has to answer rigorously: is this difference I\'m seeing actually real, or could it just be random chance?',
  lessons: [
    {
      title: 'Hypothesis Testing: Is This Difference Real?',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, structured, honest way to answer "is this pattern I noticed actually real, or could random chance alone explain it?"

**Prerequisites:** Module 2 (Statistics & Probability for Data Analysis) — hypothesis testing directly builds on probability and sampling.

**The concept, explained simply:**
**Hypothesis testing** is a real, structured process starting from a **null hypothesis** (the real, honest default assumption that there's no real effect or difference — e.g. "the new page design has no real effect on conversion rate") and asking: given the data you actually observed, how likely would this result be if the null hypothesis were genuinely true? A **p-value** answers exactly that — the real probability of seeing a result this extreme (or more extreme) purely by random chance, if there truly were no real effect. A small p-value (conventionally, often below 0.05) suggests the observed result would be genuinely unlikely under pure chance, giving real, statistical grounds to doubt the null hypothesis.

**Why do we need this?** Random variation is a real, permanent fact — even with genuinely no real effect, two real groups will almost never have exactly identical averages just by chance. Hypothesis testing gives you a real, honest, quantified way to distinguish "this difference is probably real" from "this difference is small enough that random chance alone plausibly explains it."

**How does it actually work?** Given real data from 2 (or more) groups, compute a real test statistic summarizing how different the groups actually are, then compute the real p-value — the probability of a difference this large occurring purely by chance if the null hypothesis (no real difference) were true. A real, honest interpretation: a small p-value is genuine statistical evidence against the null hypothesis, but — critically — it is not proof of practical importance; a real, statistically significant difference can still be too small to matter for an actual real decision, and this course treats conflating the two as a real, serious honesty failure.

**A simple everyday example:** Flipping the same real coin 10 times and getting 7 heads doesn't necessarily mean the coin is unfair (the null hypothesis: it's a fair coin) — 7 heads out of 10 happens by pure chance often enough with a genuinely fair coin that this result alone isn't strong real evidence of unfairness; getting 95 heads out of 100, though, would be a genuinely unlikely result under a fair coin, real statistical grounds to doubt fairness.

**A technical example:** Testing whether a redesigned checkout page has a real, different conversion rate than the original: null hypothesis is "no real difference in conversion rate"; if the real observed difference produces a p-value of 0.02, that's real, reasonably strong evidence against the null hypothesis (this difference would be unlikely under pure chance) — but the honest next question is still "is this real difference big enough to actually matter for the business," a genuinely separate question from statistical significance alone.

**Common mistakes:** treating "statistically significant" (a small p-value) as automatically meaning "important" or "large" — a real, common conflation; treating a p-value just above a conventional threshold (like 0.06 versus 0.05) as a completely different, qualitative conclusion, when the real, honest difference between them is often genuinely small and shouldn't be treated as a hard, meaningful cutoff.

**When do we use hypothesis testing?** Whenever you're comparing real groups or conditions and want an honest, quantified answer to whether an observed difference is likely real or plausibly just random variation — the real, foundational tool behind Lesson 2's A/B testing.

**How do we know we understood this?** Given a real p-value and context, you can explain what it does and doesn't tell you, specifically distinguishing statistical significance from real, practical importance.

**Mini exercise:** A real test finds a new website design increases conversion by 0.1 percentage points, with a p-value of 0.001 (highly statistically significant, from an enormous sample). Explain, honestly, why this result might still not be worth acting on.

**Reading:** Seeing Theory (Brown University) — https://seeing-theory.brown.edu/ (live-verified this phase, reused from Module 2; its Frequentist Inference chapter directly covers this lesson's hypothesis-testing content).`,
    },
    {
      title: 'Designing and Analyzing an A/B Test',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** Applying Lesson 1's hypothesis-testing framework to the single most common real, practical experiment a data analyst runs: comparing 2 real versions of something.

**Prerequisites:** "Hypothesis Testing: Is This Difference Real?"

**The concept, explained simply:**
An **A/B test** randomly splits real users or subjects into 2 (or more) real groups — a **control** group (the existing, unchanged version) and a **treatment** group (the new, changed version) — measures a real, specific outcome for each, and applies Lesson 1's hypothesis testing to determine whether any observed real difference is likely genuine or plausibly just random variation. The real, critical design requirement is **random assignment** — each real subject has an equal, genuinely random chance of landing in either group, which is what makes a real, honest causal claim possible (unlike Module 2's correlation alone).

**Why do we need this?** Random assignment is specifically what lets an A/B test support a real causal claim ("the new design *caused* the change") in a way plain correlation (Module 2, Lesson 3) cannot — since the 2 groups are, by genuine random construction, comparable in every other real respect on average, any real, statistically significant difference in outcome can be honestly attributed to the one thing that actually differed between them: which version they saw.

**How does it actually work?** A real, well-designed A/B test defines its real, specific success metric *before* running the test (deciding what "success" means after seeing the data is a real, serious honesty failure called p-hacking); determines a real, adequate sample size in advance (too small a sample makes it genuinely hard to detect a real effect even if one exists); runs long enough to capture real, natural variation (e.g. across different real days of the week); and only then applies Lesson 1's hypothesis test to the real, collected results.

**A simple everyday example:** A restaurant testing 2 real menu designs by randomly handing each arriving table one or the other (not letting customers choose, which would break random assignment) and comparing real average order size — a genuine, real A/B test, versus simply comparing this month's orders (new menu) to last month's (old menu), which confounds the menu change with anything else that changed between the 2 months (Module 2's correlation-not-causation problem, reappearing here).

**A technical example:** Testing a new checkout button color: randomly show half of real, incoming visitors the original color (control) and half the new color (treatment), track real conversion rate for each group over a predetermined, adequate real time period, then apply a real hypothesis test to the actual conversion-rate difference — concluding a real, causal effect only if the difference is both statistically significant and large enough to matter practically (Lesson 1's honesty distinction, directly applied).

**Common mistakes:** not using genuine random assignment (e.g. letting users self-select, or running old vs. new sequentially rather than simultaneously) — this reintroduces the exact correlation-not-causation problem A/B testing exists specifically to avoid; stopping a test as soon as a result looks statistically significant, rather than at the real, predetermined sample size or duration — a genuine, serious form of p-hacking that inflates the real, true rate of false positives.

**When do we run an A/B test?** Whenever you want a real, honest causal answer to "does this specific change actually cause a specific real outcome to improve," and can genuinely randomly assign real subjects to conditions.

**How do we know we understood this?** Given a real, described comparison, you can identify whether it's a genuine A/B test (with real random assignment) or merely a correlational before/after comparison, and explain the real, practical difference in what conclusion each supports.

**Mini exercise:** A team compares this quarter's sales (after a new pricing page) to last quarter's sales (old pricing page) and claims the new page caused a sales increase. Explain, using this lesson's concepts, why this is not a genuine A/B test and what real confound(s) it fails to rule out.

**Homework:** Bring your A/B test design reasoning into this course's projects.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Hypothesis Testing & Experimentation). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Hypothesis Testing & Experimentation',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What does a small p-value indicate, per this module?',
            questionType: 'single',
            options: [
              'The observed result proves the null hypothesis is true',
              'The observed result would be unlikely under pure chance if the null hypothesis were true, giving statistical grounds to doubt it',
              'The effect is definitely large and practically important',
              'The sample size was too small to draw any conclusion',
            ],
            correctAnswer: [
              'The observed result would be unlikely under pure chance if the null hypothesis were true, giving statistical grounds to doubt it',
            ],
          },
          {
            prompt: 'Why does random assignment matter specifically for supporting a real causal claim in an A/B test, per this module?',
            questionType: 'single',
            options: [
              'It does not matter — any comparison supports a causal claim equally',
              'Random assignment makes the two groups comparable in every other respect on average, so any statistically significant outcome difference can be honestly attributed to the one thing that differed: which version each group saw',
              'Random assignment is only needed for very large sample sizes',
              'Random assignment guarantees a statistically significant result',
            ],
            correctAnswer: [
              'Random assignment makes the two groups comparable in every other respect on average, so any statistically significant outcome difference can be honestly attributed to the one thing that differed: which version each group saw',
            ],
          },
          {
            prompt: 'Why does this module say stopping an A/B test as soon as a result looks statistically significant is a real problem?',
            questionType: 'single',
            options: [
              'It is not a real problem, stopping early is recommended',
              'It is a form of p-hacking that inflates the real, true rate of false positives, since the test was not run to its predetermined sample size or duration',
              'A/B tests cannot produce statistically significant results early',
              'Stopping early always produces the correct result faster',
            ],
            correctAnswer: [
              'It is a form of p-hacking that inflates the real, true rate of false positives, since the test was not run to its predetermined sample size or duration',
            ],
          },
          {
            prompt: 'True or False: statistical significance alone is sufficient to conclude a result is practically important, per this module.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why is comparing this quarter\'s sales (after a change) to last quarter\'s sales (before a change) not a genuine A/B test, per this module?',
            questionType: 'text',
            correctAnswer:
              'There is no real random assignment — the comparison is confounded with anything else that changed between the two time periods (seasonality, marketing, external events), so any observed difference cannot be honestly attributed specifically to the one change being tested, unlike a genuine A/B test with random assignment to simultaneous groups.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: Data Visualization & Storytelling
// ---------------------------------------------------------------------
const module4: ModuleSeed = {
  title: 'Data Visualization & Storytelling',
  position: 4,
  description:
    'Takes everything Modules 1-3 produced (clean data, honest statistics, rigorously tested findings) and makes it actually understandable and usable by someone who doesn\'t do statistics for a living.',
  lessons: [
    {
      title: 'Choosing the Right Chart: Visualization Principles',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to pick and design a real chart that honestly represents your data, rather than one that's just visually appealing or, worse, accidentally (or deliberately) misleading.

**Prerequisites:** Module 2 (Statistics & Probability for Data Analysis) — visualization exists to represent the real statistical concepts that module covered.

**The concept, explained simply:**
Different real chart types suit different real real data questions: a **bar chart** compares real quantities across categories; a **line chart** shows a real trend over time; a **scatter plot** shows the real relationship between 2 numeric variables (directly visualizing Module 2's correlation concept); a **histogram** shows the real shape/distribution of a single variable (directly visualizing Module 2's distribution concept). Choosing the wrong real chart type for your actual data and question is a real, common way to obscure, rather than reveal, a real pattern.

**Why do we need this?** A real chart is not neutral — real, specific design choices (axis scales, color, what's included or excluded) genuinely shape what a viewer honestly perceives, for better or worse. A data scientist has a real, professional responsibility to make design choices that reveal the real, honest pattern in the data, not ones that visually exaggerate or minimize it.

**How does it actually work?** A real, honest chart: starts numeric axes at zero when comparing real magnitudes (a bar chart with a truncated axis can make a small, real difference look dramatically larger than it honestly is); uses color meaningfully, not decoratively (a real, consistent color scheme that reinforces the actual data, not one chosen just because it looks appealing); avoids 3D effects and unnecessary decoration that distort real proportions without adding real information; and includes real, honest context (a real sample size, a real time period) rather than presenting a number in isolation.

**A simple everyday example:** A news report showing "sales doubled!" with a bar chart whose y-axis starts at 90 instead of 0 can make a real, modest 2% increase look like a dramatic, doubled real change — technically not fabricating any real number, but genuinely, dishonestly misleading through a real design choice.

**A technical example:** Visualizing Module 3's A/B test result with a bar chart starting the y-axis at 0 (showing the real, honest, often-modest visual size of a real, statistically significant conversion-rate difference) is a genuinely more honest choice than truncating the axis to make the same real difference look dramatically larger than it honestly is.

**Common mistakes:** truncating a numeric axis to visually exaggerate a real difference — a real, common, and genuinely dishonest practice, even when the underlying real numbers are completely accurate; choosing a chart type based on visual appeal rather than what the real data and real question actually call for (e.g. a pie chart for data that's better shown as a bar chart, since pie charts are genuinely hard to compare precisely across more than a few real slices).

**When do we apply these principles?** For every real chart meant to inform a real decision — visualization is not decoration, it's a real, load-bearing part of honest communication.

**How do we know we understood this?** Given a real dataset and question, you can choose an appropriate real chart type and identify at least one honest-design choice (like a zero-based axis) that a real, dishonest version of the same chart might have skipped.

**Mini exercise:** You need to show how a company's monthly revenue changed over the past 2 years. Which real chart type fits best, and why would a truncated y-axis be a genuinely dishonest design choice here?

**Reading:** "Fundamentals of Data Visualization" (Claus Wilke, free online) — https://clauswilke.com/dataviz/ (live-verified this phase; a real, official, freely available book covering exactly chart-type selection and honest figure-design principles).`,
    },
    {
      title: 'Communicating Findings to a Non-Technical Audience',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to honestly translate Modules 1-3's real, rigorous analysis into language and framing a real decision-maker who isn't a statistician can actually act on.

**Prerequisites:** "Choosing the Right Chart: Visualization Principles" — real communication combines honest visuals with honest language together.

**The concept, explained simply:**
A real, rigorous analysis is only useful if the person who needs to act on it can actually understand and trust it. This means translating Module 3's statistical language ("the p-value was 0.03") into real, honest, plain-language framing ("this difference is unlikely to be due to random chance alone") — without either dumbing the finding down to the point of being wrong, or hiding behind jargon that makes the finding sound more certain, or more impressive, than it honestly is.

**Why do we need this?** A real, technically correct analysis that nobody outside the data team can understand or trust doesn't actually inform a real decision — communication is not a "nice to have" add-on to real data science, it's the stage that makes every earlier stage's rigor actually useful.

**How does it actually work?** A real, honest communication leads with the real, concrete finding and its real, practical implication (not the methodology first); states the real, honest level of confidence and uncertainty explicitly, in plain language ("we're fairly confident, but this is based on a 2-week test — a longer test might show a different result"); avoids real statistical jargon where a plain-language equivalent exists, without sacrificing real accuracy; and is explicit about real limitations (a small sample, a biased sampling method from Module 2, a correlation that isn't proven causal) rather than quietly omitting them because they complicate the story.

**A simple everyday example:** A doctor explaining a diagnosis to a patient in plain, honest language ("this test suggests X is likely, though not certain, and here's what that means for you") rather than reciting only clinical terminology and statistical confidence intervals the patient can't act on.

**A technical example:** Reporting an A/B test result as "the new checkout design likely increases conversions by about 2%, though our test only ran for 2 weeks so we're moderately confident, not certain, this holds up over a longer period and across different seasons" is real, honest, plain-language communication — versus a report that either says only "p < 0.05, reject the null hypothesis" (too technical to act on) or "the new design definitely works!" (overstating real certainty).

**Common mistakes:** presenting a finding with more real certainty than the actual analysis supports, to make the result sound more impressive or actionable — a real, serious honesty failure; hiding behind technical jargon in a way that makes a real audience unable to actually evaluate or question the finding, even if the underlying analysis was done correctly.

**When do we apply this discipline?** Every time a real finding is reported to anyone who will use it to make a real decision — not just for "important" findings, since a real audience can't always predict in advance which finding will matter most.

**How do we know we understood this?** Given a real, technical finding (with a real p-value, sample size, and methodology), you can write an honest, plain-language summary that a non-technical real decision-maker could act on, including its real, honest limitations.

**Mini exercise:** Rewrite this technical finding in honest, plain language for a non-technical manager: "The treatment group (n=340) showed a 3.2 percentage-point higher conversion rate than control (n=335), p=0.04, over a 10-day test period."

**Homework:** Apply this lesson's honest-communication discipline directly to this course's closing capstone project's written findings.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (Data Visualization & Storytelling). Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — Data Visualization & Storytelling',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why is truncating a bar chart\'s y-axis to not start at zero described as a real, dishonest practice in this module?',
            questionType: 'single',
            options: [
              'It is not dishonest, it is a standard, recommended technique',
              'It can make a small, real difference look dramatically larger than it honestly is, even though the underlying numbers are accurate',
              'It always produces an inaccurate underlying number',
              'This only applies to line charts, not bar charts',
            ],
            correctAnswer: [
              'It can make a small, real difference look dramatically larger than it honestly is, even though the underlying numbers are accurate',
            ],
          },
          {
            prompt: 'What is the real, described danger of communicating a finding with more certainty than the analysis actually supports, per this module?',
            questionType: 'single',
            options: [
              'There is no real danger, confidence helps an audience act faster',
              'It is a real honesty failure — the audience may act on a decision believing a level of certainty the actual analysis does not support',
              'This is required to make a finding sound professional',
              'Audiences prefer overstated confidence and it improves outcomes',
            ],
            correctAnswer: [
              'It is a real honesty failure — the audience may act on a decision believing a level of certainty the actual analysis does not support',
            ],
          },
          {
            prompt: 'Which of the following are real chart types and their described real uses in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'A scatter plot, for showing the relationship between two numeric variables',
              'A histogram, for showing the distribution shape of a single variable',
              'A line chart, for showing a trend over time',
              'A pie chart, always preferred for comparing many precise categories',
            ],
            correctAnswer: [
              'A scatter plot, for showing the relationship between two numeric variables',
              'A histogram, for showing the distribution shape of a single variable',
              'A line chart, for showing a trend over time',
            ],
          },
          {
            prompt: 'True or False: this module recommends omitting real limitations (like a small sample size) from a report if they complicate the story.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does this module say communication is not a "nice to have" add-on to real data science?',
            questionType: 'text',
            correctAnswer:
              'Because a rigorous analysis is only useful if the person who needs to act on it can actually understand and trust it — communication is the stage that makes every earlier stage\'s real rigor (cleaning, statistics, testing) actually usable for a real decision, not an optional final polish.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 5: Introduction to Predictive Modeling & Responsible Data Science
// ---------------------------------------------------------------------
const module5: ModuleSeed = {
  title: 'Introduction to Predictive Modeling & Responsible Data Science',
  position: 5,
  description:
    'Closes this course with a light, introductory bridge from description/testing into prediction — only what this path\'s own projects require, deliberately not the deeper multi-algorithm content a separate Machine Learning Foundations course would cover — plus the honesty and responsibility discipline that applies to everything this course has taught.',
  lessons: [
    {
      title: 'From Statistics to Prediction: Train/Test Split and Overfitting',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The one real, foundational discipline that separates a genuinely useful predictive model from one that only looks good on the data it already saw.

**Prerequisites:** Module 2 (Statistics & Probability for Data Analysis), specifically simple linear regression — this lesson extends that same real idea (a model that predicts one thing from another) toward genuine, honest predictive use.

**The concept, explained simply:**
A **predictive model** (Module 2's regression line is itself a very simple real one) is only genuinely useful if it makes good real predictions on *new*, previously-unseen data — not just data it was built from. **Overfitting** is a real, serious failure mode where a model fits its original, training data extremely well (sometimes almost perfectly) by essentially memorizing its specific real quirks and noise, but performs poorly on genuinely new data, since it never learned the real, underlying pattern, just the training data's specific accidents. The real, standard defense: split your real data into a **training set** (used to build the model) and a genuinely separate **test set** (used only to honestly evaluate it) — a model's real, honest performance is measured on the test set, never the training set.

**Why do we need this?** Evaluating a model only on the same data it was built from is a real, serious honesty failure — it's genuinely easy to build a model that fits training data extremely well while being nearly useless on new, real-world data, and the only way to catch this is to honestly check performance on data the model never saw during training.

**How does it actually work?** A real, typical split reserves a real majority of data for training and a genuinely separate portion (never touched during training) for testing; a model that performs dramatically better on the training set than the test set is a real, direct sign of overfitting. **Underfitting** is the real opposite failure — a model too simple to capture even the real, genuine pattern in the data, performing poorly on both training and test data alike.

**A simple everyday example:** A student who memorizes the exact answers to last year's practice exam questions (training data) may score perfectly on those specific questions but fail a genuinely new exam covering the same real material with different questions (the test set) — they memorized specifics instead of learning the real, underlying concepts, exactly like an overfit model.

**A technical example:** A real regression model predicting house prices that achieves near-perfect accuracy on its training data but performs noticeably worse on a genuinely separate test set is very likely overfit — it likely learned specific, real quirks of the training houses (down to noise) rather than the real, generalizable relationship between house features and price.

**Common mistakes:** evaluating a model's real performance only on the data it was trained on, then reporting that number as if it reflects real-world performance — a serious, common, and genuinely misleading practice; treating "the model fits the training data almost perfectly" as automatically good news, when it's frequently a real, direct warning sign of overfitting rather than genuine skill.

**When do we apply a train/test split?** For any real predictive model meant to be used on new, future data — which describes essentially every genuine real predictive use case, as opposed to a model built purely to describe already-known historical data.

**How do we know we understood this?** Given a real model's training and test performance, you can identify whether it shows signs of overfitting, underfitting, or genuinely good, generalizing performance.

**Mini exercise:** A model scores 98% accuracy on its training data and 61% on its test data. What real problem does this indicate, and what would you recommend investigating?

**Reading:** scikit-learn Documentation — https://scikit-learn.org/stable/ (live-verified this phase; the real, standard Python machine-learning library whose Model Selection documentation directly covers train/test splitting, cross-validation, and evaluation metrics).`,
    },
    {
      title: 'Classification Basics and Model Evaluation Metrics',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The other real, common kind of prediction (predicting a real category, not a real number) and the honest, specific ways to measure whether a predictive model is actually good.

**Prerequisites:** "From Statistics to Prediction: Train/Test Split and Overfitting."

**The concept, explained simply:**
While Module 2's regression predicts a real, continuous number (a price, a temperature), **classification** predicts a real, discrete category (will this customer churn: yes/no; is this transaction fraudulent: yes/no). **Accuracy** (the real percentage of predictions that were correct) is the most intuitive real evaluation metric, but is genuinely, seriously misleading for **imbalanced data** — if only 1% of real transactions are genuinely fraudulent, a model that predicts "not fraud" for every single transaction achieves a real 99% accuracy while being completely useless at its actual job. **Precision** (of the cases the model flagged as positive, how many really were) and **recall** (of the real actual positive cases, how many did the model actually catch) are 2 real, more honest metrics for exactly this kind of situation, and they carry a real, direct tradeoff against each other.

**Why do we need this?** Real, honest model evaluation requires choosing the real, right metric for the real, specific problem — accuracy alone can honestly hide a genuinely useless model behind an impressive-looking number, exactly the same kind of "technically true but honestly misleading" failure Module 4 warned about for charts, now applied to model evaluation.

**How does it actually work?** For a real fraud-detection model: precision answers "when we flag a transaction as fraud, how often are we actually right" (low precision means many honest customers get incorrectly flagged, a real, serious cost); recall answers "of all the real fraud that happened, how much did we actually catch" (low recall means real fraud slips through undetected). These 2 real metrics trade off — a model tuned to catch nearly all real fraud (high recall) will likely also flag many honest transactions incorrectly (lower precision), and the real, right balance depends entirely on the specific real cost of each type of mistake for that specific real business.

**A simple everyday example:** An airport security screening tuned to catch every possible real threat (high recall) will also flag many innocent travelers for extra screening (lower precision) — versus a screening tuned to minimize innocent-traveler inconvenience (high precision) that might let more real threats through undetected (lower recall); there's a real, genuine tradeoff, not a free win on both.

**A technical example:** A real medical test for a rare, serious disease should generally prioritize high recall (catching nearly every real case, even at the cost of some real false alarms that get ruled out by a follow-up test) over high precision, since the real, practical cost of a missed real case is far higher than the real cost of a false alarm.

**Common mistakes:** reporting only accuracy for a real, imbalanced classification problem, hiding a genuinely poor model behind a misleadingly high number; treating precision and recall as if you can maximize both simultaneously without any real tradeoff, rather than making a real, deliberate, context-specific choice about which matters more for the specific real problem.

**When do we use precision/recall instead of accuracy?** Whenever the real, positive class you care about is rare (imbalanced data) or the real cost of a false positive versus a false negative genuinely differs — which describes most real, practically important classification problems, like fraud or rare-disease detection.

**How do we know we understood this?** Given a real, described classification problem, you can explain why accuracy alone might mislead, and reason about whether precision or recall should be prioritized based on the real, relative cost of each type of mistake.

**Mini exercise:** For a spam email filter, would you prioritize precision or recall, and why? Consider the real, specific cost of each type of mistake (a real email wrongly marked spam, versus real spam reaching the inbox).

**Homework:** Bring your precision/recall reasoning into this course's closing capstone project.`,
    },
    {
      title: 'Responsible Data Science: Bias, Fairness, and Honest Uncertainty',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, ongoing responsibility that runs through every module in this course: data and models reflect the real world's existing biases, and honest data science actively accounts for that rather than hiding behind "the data/model said so."

**Prerequisites:** Module 1 (Data Cleaning), Module 5's own earlier lessons — bias can enter at data collection, cleaning, model training, or evaluation, so this lesson connects back across the whole course.

**The concept, explained simply:**
**Bias** in data science means a systematic, real distortion — not necessarily from any individual's bad intent, but from how real data was collected, cleaned, or modeled. If a real hiring dataset reflects decades of real, historically biased hiring decisions, a model trained on it can learn and perpetuate that real bias, even with a completely neutral, correctly-implemented algorithm — the real problem lives in the data and the real-world process that generated it, not necessarily a flaw in the modeling code. **Fairness** in this context means actively checking whether a real model's real errors or outcomes fall disproportionately on some real group, rather than assuming a model is neutral just because no group was explicitly named in its inputs.

**Why do we need this?** A model can be a "correct," well-evaluated model by Lesson 2's metrics (good precision, good recall) and still produce real, seriously unfair or harmful outcomes for specific real groups — technical correctness and real, ethical responsibility are genuinely separate questions, and a responsible data scientist checks both, not just the first.

**How does it actually work?** A real, responsible practice: examine whether your real training data reflects any known, real historical bias before trusting a model built on it; check a real model's error rates *separately* across relevant real subgroups, not just in aggregate, since Lesson 2's overall accuracy/precision/recall can look fine in aggregate while hiding a genuine, serious disparity for one specific real group; and — connecting directly back to Module 4 — communicate real uncertainty and real limitations honestly, rather than presenting a model's output as more definitive or more fair than it honestly is.

**A simple everyday example:** A real hiring algorithm trained on a company's past hiring decisions, if those past decisions themselves reflected real, historical bias against some real group, will tend to learn and continue that same real pattern — "the algorithm decided" doesn't make the real outcome any more fair or neutral than the biased real historical process it learned from.

**A technical example:** A real loan-approval model with a good overall accuracy score might still have a meaningfully higher real false-rejection rate for one real demographic group than another — a responsible real analysis checks for exactly this kind of disparity directly, rather than only reporting the aggregate accuracy number and assuming fairness because no explicit bias was intentionally coded in.

**Common mistakes:** assuming a model is neutral or fair simply because it doesn't explicitly use a protected real attribute (like race or gender) as an input — real, correlated proxy variables (like zip code) can allow a model to effectively reconstruct and act on that same real bias indirectly; treating "the model said so" as removing real, human responsibility for a real, harmful outcome, rather than treating the model's output as one real input to a decision a real person remains honestly accountable for.

**When do we apply this discipline?** Throughout every stage of this course's workflow (Module 1) — bias can enter during collection, cleaning, analysis, or modeling, not only at one single, isolated step.

**How do we know we understood this?** Given a real, described model and its training data, you can identify a plausible, specific real source of bias and propose a real, concrete check (like a subgroup error-rate comparison) rather than a vague, general call for "more fairness."

**Mini exercise:** A real resume-screening model is trained on 10 years of a company's past hiring decisions. Identify one real, specific way historical bias could enter this model, and propose one real, concrete check you'd run before trusting its outputs.

**Reading:** scikit-learn Documentation — https://scikit-learn.org/stable/ (live-verified this phase, reused from Lesson 1).

**Homework:** This lesson's responsible-data-science discipline is a required, explicit part of this course's closing capstone project's written findings.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 5 (Introduction to Predictive Modeling & Responsible Data Science) — the final module of Data Science Foundations. Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 5 Final Assessment — Introduction to Predictive Modeling & Responsible Data Science',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'A model scores 98% accuracy on training data and 61% on test data. What does this indicate, per this module?',
            questionType: 'single',
            options: [
              'The model is performing excellently and ready for real use',
              'This is a real, direct sign of overfitting — the model learned specific quirks of the training data rather than a genuinely generalizable pattern',
              'The test data must be incorrect',
              'This is a sign of underfitting',
            ],
            correctAnswer: [
              'This is a real, direct sign of overfitting — the model learned specific quirks of the training data rather than a genuinely generalizable pattern',
            ],
          },
          {
            prompt: 'Why can accuracy alone be seriously misleading for an imbalanced classification problem, per this module?',
            questionType: 'single',
            options: [
              'Accuracy cannot be computed for imbalanced data',
              'A model that always predicts the majority class can achieve high accuracy while being completely useless at identifying the rare, actually important class',
              'Accuracy is always the correct metric regardless of class balance',
              'Imbalanced data does not affect accuracy in any way',
            ],
            correctAnswer: [
              'A model that always predicts the majority class can achieve high accuracy while being completely useless at identifying the rare, actually important class',
            ],
          },
          {
            prompt: 'Why does this module say "the algorithm decided" does not make a biased outcome more fair or neutral?',
            questionType: 'single',
            options: [
              'Algorithms are always fair by mathematical definition',
              'A model trained on historically biased data tends to learn and perpetuate that same real bias, even with a neutral, correctly-implemented algorithm — the bias lives in the data and real-world process, not necessarily the code',
              'This module claims algorithms are never biased',
              'Bias only matters if a protected attribute is explicitly used as a model input',
            ],
            correctAnswer: [
              'A model trained on historically biased data tends to learn and perpetuate that same real bias, even with a neutral, correctly-implemented algorithm — the bias lives in the data and real-world process, not necessarily the code',
            ],
          },
          {
            prompt: 'Which of the following are real, described responsible-data-science practices in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'Checking a model\'s error rates separately across relevant real subgroups, not just in aggregate',
              'Examining training data for known, real historical bias before trusting a model built on it',
              'Assuming a model is fair simply because it does not explicitly use a protected attribute as input',
              'Communicating real uncertainty and limitations honestly, not presenting a model as more definitive than it is',
            ],
            correctAnswer: [
              'Checking a model\'s error rates separately across relevant real subgroups, not just in aggregate',
              'Examining training data for known, real historical bias before trusting a model built on it',
              'Communicating real uncertainty and limitations honestly, not presenting a model as more definitive than it is',
            ],
          },
          {
            prompt: 'Practical question: why can a correlated proxy variable (like zip code) allow a model to indirectly reconstruct a bias even when a protected attribute (like race) was never used as an input?',
            questionType: 'text',
            correctAnswer:
              'Because a variable like zip code can be strongly correlated with a protected attribute due to real, historical patterns (e.g. residential segregation), so a model using zip code as an input can effectively learn and act on the same underlying bias indirectly, even without ever seeing the protected attribute itself — removing an explicit protected attribute does not guarantee the model is free of that bias.',
          },
        ],
      },
    },
  ],
};

const MODULES: ModuleSeed[] = [module1, module2, module3, module4, module5];

// ---------------------------------------------------------------------
// 2 standalone Projects (Phase 26 architecture), matching this session's
// established "quality over quantity" precedent over the blueprint's
// literal "4 projects" planning figure. Both require genuine analytical
// work (real dataset reasoning, cleaning, EDA, statistics, visualization,
// written findings), not "explain what you learned," per this phase's
// explicit requirement.
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    title: 'Exploratory Data Analysis & Findings Report',
    description:
      'Beginner/Intermediate tier — clean a described messy dataset, compute honest descriptive statistics, identify and correctly interpret a real correlation, visualize it honestly, and write a plain-language findings report.',
    instructions: `**Objective:** Given a described real-world dataset scenario, perform a full, real exploratory analysis applying Modules 1-4 together, and produce an honest, plain-language findings report.

**The scenario:** A retail company's raw sales dataset includes: some missing "customer_age" values, some duplicate order records (from a known tracking bug), a "region" column with inconsistent formatting ("CA," "California," "california" all appearing), and a small number of transactions with implausibly large "order_total" values.

**Requirements:**
- **Data cleaning plan** (Module 1): for each of the 4 described real data problems, state specifically how you'd investigate and handle it, and why.
- **Descriptive statistics** (Module 2, Lesson 1): describe what you'd compute for "order_total" (mean, median, standard deviation) and explain what comparing the mean and median would reveal about the data's real shape.
- **A real correlation question**: propose one real, specific correlation you'd investigate in this dataset (e.g. between customer age and order total), and explain, using Module 2 Lesson 3's ice-cream/drowning framework, what you would and would NOT be able to conclude from a strong correlation alone.
- **Visualization choice** (Module 4, Lesson 1): propose one specific, appropriate chart type for showing regional sales differences, and state one honest-design choice (like a zero-based axis) you'd apply.
- **Plain-language findings report** (Module 4, Lesson 2): write a short, honest summary of your hypothetical findings for a non-technical store manager, including at least one explicitly stated real limitation.

**Expected result:** Your data cleaning plan, descriptive statistics reasoning, correlation investigation and its honest interpretation, visualization choice with justification, and your plain-language report.

**Difficulty:** Beginner/Intermediate.

**Skills tested:** real, specific data cleaning reasoning (not reflexive deletion); honest descriptive statistics interpretation; correctly distinguishing correlation from causation; honest chart design; honest, plain-language communication with explicit limitations.

**Suggested implementation steps:**
1. Work through the data cleaning plan first — every later step depends on cleaned data.
2. Do the descriptive statistics and correlation reasoning next.
3. Choose your visualization and its honest-design justification.
4. Write the plain-language report last, once your real findings are clear.

**Evaluation criteria:** the cleaning plan is specific to the 4 described real problems, not generic; the mean/median interpretation is correct and specific; the correlation reasoning correctly distinguishes what can and cannot be concluded; the visualization choice and honest-design justification are appropriate; the report is genuinely plain-language and includes a real, honest limitation.`,
    position: 2,
  },
  {
    title: 'End-to-End Data Product: From Raw Data to a Business Recommendation',
    description:
      'Capstone tier — a complete, real data science workflow: cleaning, statistical analysis, hypothesis testing, an introductory predictive-modeling decision, and an honest, responsible written business recommendation.',
    instructions: `**Objective:** Given a described real business scenario, walk through the complete data science workflow from Module 1 through Module 5, and produce a real, honest, actionable business recommendation.

**The scenario:** An online learning platform ran a 3-week A/B test comparing its original course-recommendation algorithm (control) against a new one (treatment). The company wants to know whether to roll out the new algorithm platform-wide, and separately wants to build a simple model predicting which users are likely to churn (stop using the platform) so it can proactively intervene.

**Requirements:**
- **Workflow framing** (Module 1, Lesson 1): state, in your own words, which of the 5 real workflow stages this scenario touches, and in what order you'd address them.
- **Hypothesis test design and interpretation** (Module 3): state the null hypothesis for the A/B test, and explain what a statistically significant result would and would NOT tell the company on its own (Module 3, Lesson 1's honesty distinction) — including whether the random-assignment requirement (Module 3, Lesson 2) is satisfied by this scenario's real design.
- **Predictive modeling reasoning** (Module 5): for the churn-prediction model, explain how you'd apply a train/test split and how you'd know if the model were overfitting; since churn is likely a real, imbalanced classification problem (most users don't churn), explain whether you'd prioritize precision or recall, and why, given the real cost of each type of mistake for this specific business.
- **Responsible data science check** (Module 5, Lesson 3): identify one real, plausible way bias could enter the churn-prediction model (e.g. via which users' historical data is available), and propose one concrete check.
- **Honest business recommendation** (Module 4, Lesson 2): write a plain-language recommendation for company leadership on whether to roll out the new recommendation algorithm, including your honest confidence level and at least one real, explicitly stated limitation of the 3-week test.

**Expected result:** Your workflow framing, hypothesis test reasoning, predictive-modeling reasoning (train/test, overfitting, precision/recall choice), responsible-data-science check, and your honest, plain-language business recommendation.

**Difficulty:** Capstone (closes this course).

**Skills tested:** synthesizing the full real data science workflow; correctly reasoning about statistical significance versus practical importance; correctly applying train/test and overfitting concepts to a new scenario; making a justified precision/recall tradeoff decision; identifying a real, plausible bias source; writing an honest, actionable, appropriately-hedged business recommendation.

**Suggested implementation steps:**
1. Frame the workflow stages first, to organize your approach.
2. Work through the A/B test hypothesis reasoning.
3. Work through the churn-model predictive-modeling and responsible-data-science reasoning.
4. Write the final business recommendation last, once your real analysis is complete, and make sure it\'s honest about what the analysis does and doesn\'t support.

**Evaluation criteria:** the hypothesis test reasoning correctly distinguishes statistical significance from practical importance and correctly evaluates random assignment; the precision/recall choice is justified against the specific real cost of each mistake type, not asserted without reasoning; the bias-source identification is specific and plausible, not generic; the final recommendation is genuinely honest about its own confidence and limitations, not overstated.`,
    position: 3,
  },
];

// ---------------------------------------------------------------------
// The new Data Scientist LearningPath — confirmed via direct query (not
// assumed) that no existing path is a real fit: none of the 7 existing
// paths contain this exact 3-course combination. The Machine Learning
// Foundations elective is explicitly NOT mandatory per the blueprint
// and remains unbuilt, out of scope.
// ---------------------------------------------------------------------
const DATA_SCIENTIST_PATH_SLUG = 'data-scientist';
const DATA_SCIENTIST_COURSE_SLUGS = [
  'programming-foundations-python-javascript', // Phase 36, reused
  'database-design-sql-mastery', // Phase 37, reused
  COURSE_SLUG, // this phase's new course
];

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      'Phase 41 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.',
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: 'data-science' },
    update: {},
    create: { slug: 'data-science', name: 'Data Science', domain: 'courses' },
  });

  let courseCreated = false;
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;

  let course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        instructorId: instructor.id,
        categoryId: category.id,
        slug: COURSE_SLUG,
        title: COURSE_TITLE,
        description:
          'Treats data science as a communication discipline as much as a technical one — every technical module ends with how you\'d explain the finding honestly to someone who doesn\'t do statistics. Covers data cleaning, analyst SQL, statistics and probability, hypothesis testing and A/B experimentation, honest visualization and storytelling, and an introductory, light bridge into predictive modeling and responsible data science. Built Phase 41 to close the one remaining real gap Phase 35\'s analysis found for the Data Scientist learning path.',
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

  // Create the new Data Scientist LearningPath, following
  // Phase 37/38/39/40's whole-path-membership guard pattern (this is a
  // brand-new path, so its own "any memberships exist" guard is correct
  // and safe here).
  let pathsCreated = 0;
  let membershipsCreated = 0;
  let path = await prisma.learningPath.findUnique({ where: { slug: DATA_SCIENTIST_PATH_SLUG } });
  if (!path) {
    path = await prisma.learningPath.create({
      data: {
        slug: DATA_SCIENTIST_PATH_SLUG,
        title: 'Data Scientist',
        description:
          'Takes a raw dataset to a validated, honestly-communicated business decision. See docs/content-library/learning-paths.md and docs/content-library/phase35-learning-path-master-blueprint.md Section 6 for the full staged course table and skill-gap analysis.',
        status: 'published',
      },
    });
    pathsCreated += 1;
    console.log(`Created learning path: ${path.title} (${path.slug})`);
  } else {
    console.log(`Learning path already exists, skipping create: ${path.title} (${path.slug})`);
  }

  const existingMemberships = await prisma.learningPathCourse.findMany({ where: { learningPathId: path.id } });
  if (existingMemberships.length === 0) {
    const courses = await prisma.course.findMany({ where: { slug: { in: DATA_SCIENTIST_COURSE_SLUGS } } });
    const bySlug = new Map(courses.map((c) => [c.slug, c]));
    let position = 1;
    for (const slug of DATA_SCIENTIST_COURSE_SLUGS) {
      const c = bySlug.get(slug);
      if (!c) {
        console.warn(`  WARNING: course "${slug}" not found — skipping membership.`);
        continue;
      }
      await prisma.learningPathCourse.create({ data: { learningPathId: path.id, courseId: c.id, position: position++ } });
      membershipsCreated += 1;
      console.log(`  Added course to path: ${c.title} (position ${position - 1})`);
    }
  } else {
    console.log(`  Course memberships already exist (${existingMemberships.length}), skipping.`);
  }

  console.log(
    `\nPhase 41 content seed complete: course ${courseCreated ? 'created' : 'already existed'}, ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed), ${pathsCreated} learning path created, ${membershipsCreated} path memberships created.`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 41 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

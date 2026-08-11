// Phase 37 — Backend Engineer Learning Path Production.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// Section 3 (Backend Engineer Blueprint): this path needs Database
// Design & SQL Mastery as its one remaining genuinely new course.
//
// CORRECTION TO PHASE 35's OWN DOCUMENT, made after direct inspection
// (not silently — see docs/phase37-backend-engineer-content-production-
// report.md): Phase 35's executive summary and priority-order sections
// both state Backend Engineer needs "3 new courses," but its own
// detailed Section 3 course list only ever names 2 new courses
// (Programming Foundations, Database Design & SQL Mastery) and 3 reused
// courses — that "3 new" figure was a real counting error in Phase 35's
// own document, not a third, undocumented course. Programming
// Foundations was then built in Phase 36. That leaves exactly ONE
// genuinely new course for this phase: Database Design & SQL Mastery.
// The other 4 courses this path needs are reused, real, unchanged:
// Programming Foundations (Phase 36), Full-Stack Web Development with
// Next.js (Phase 32, backend-relevant modules), Computer Networking
// Foundations (Phase 34), DevOps Foundations (Phase 31).
//
// This file:
//   1. Creates "Database Design & SQL Mastery" (per courses.md's
//      blueprint entry #11), scoped to avoid duplicating Full-Stack Web
//      Dev's own Module 4, Lesson 3 ("Databases & ORMs: Persisting Real
//      Data," Phase 32) — that lesson teaches what an ORM does and the
//      N+1 query problem, from an application-developer's perspective;
//      this course teaches SQL and schema design directly, from a
//      database-design perspective, a genuinely different, complementary
//      skill the ORM lesson explicitly assumes exists already.
//   2. Creates the new "Backend Engineer" LearningPath — unlike Phase
//      36's Frontend Engineer work, no existing path is a real fit here
//      (the closest, "devops-engineer", only contains Networking +
//      DevOps Foundations, missing Programming Foundations, Database
//      Design & SQL Mastery, and Full-Stack Web Dev entirely) — confirmed
//      by direct query before writing this file, not assumed.
//
// Idempotency: same application-level pattern as every prior content
// phase — findFirst by parent+title before create for course/module/
// lesson/quiz/project; findUnique by slug for the new LearningPath;
// findFirst by (learningPathId) membership count, following
// seed-phase26-content.ts's own original pattern exactly, since this is
// a brand-new path with no pre-existing partial membership to guard
// against (unlike Phase 36's addition to an already-populated path).

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

const COURSE_SLUG = 'database-design-sql-mastery';
const COURSE_TITLE = 'Database Design & SQL Mastery';
const INSTRUCTOR_EMAIL = 'e2e.instructor@phoenix.test';

// ---------------------------------------------------------------------
// Module 1: Relational Fundamentals & SQL Querying
// ---------------------------------------------------------------------
const module1: ModuleSeed = {
  title: 'Relational Fundamentals & SQL Querying',
  position: 1,
  description:
    'Starts from what a relational database actually is, then moves straight into writing real queries — the foundation every later module in this course builds on.',
  lessons: [
    {
      title: 'What Is a Relational Database? Tables, Rows, and Relationships',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** What a relational database actually is, and why storing related data in separate, connected tables works better than one giant table with everything crammed together.

**Prerequisites:** Programming Foundations' Module 3 (Data Structures) — a database table is, in a real sense, the same "list of dictionaries" idea from that module, made persistent and queryable.

**The concept, explained simply:**
A **relational database** organizes data into **tables** — each table holds one kind of thing (e.g. a "users" table, an "orders" table), where each **row** is one specific record and each **column** is one named property of that record, exactly like the "list of dictionaries" idea from Programming Foundations, but stored durably and query-able with a real language (SQL) instead of just sitting in memory.

**Why do we need this?** Storing everything in one giant table (e.g. every order repeating the full customer name and address on every row) wastes space and creates a real, serious risk: if a customer's address changes, you'd need to find and update every single order row that repeated it — miss one, and your data is now silently inconsistent. Splitting data into separate, connected tables (a real "customers" table, a real "orders" table that just references which customer) means each fact is stored exactly once.

**How does it actually work?** Tables are connected through **relationships** — an "orders" table doesn't repeat a customer's full details, it stores a **foreign key** (a reference, e.g. "customer_id") pointing to the actual row in the "customers" table where those details live once. This is the real, structural idea Module 2 (Schema Design & Normalization) goes much deeper on.

**A simple everyday example:** A library's card catalog doesn't write out a book's full description on every single library card that references it — each book has one real record, and anything referencing that book (a hold request, a checkout record) just points to it by a unique identifier, not by repeating the whole description.

**A technical example:** A "products" table with columns "id, name, price" and an "order_items" table with columns "order_id, product_id, quantity" — the order doesn't repeat the product's name and price; it references the product by "product_id," and the real name/price live in exactly one place, the "products" table.

**Common mistakes:** repeating the same real-world fact (a name, an address, a price) across many rows instead of storing it once and referencing it — a real, common beginner instinct that creates the exact inconsistency risk this lesson describes; confusing a table's row with an entire table — a row is one record, a table is the entire collection of records of one kind.

**When do we use a relational database?** Any time your data has real relationships between different kinds of things (customers who place orders, orders that contain products) — which describes the overwhelming majority of real, structured business data.

**How do we know we understood this?** You can look at a real-world scenario (e.g. a library, a store) and correctly identify what the separate tables should be and how they'd reference each other, rather than proposing one giant table.

**Mini exercise:** For a simple blog (posts and comments, where each comment belongs to one post), sketch what the "posts" and "comments" tables would look like, including how a comment references its post.

**Reading:** PostgreSQL Documentation — https://www.postgresql.org/docs (already verified Phase 25).`,
    },
    {
      title: 'Writing Real Queries: SELECT, WHERE, and Filtering',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to actually ask a database a question and get back exactly the rows you want, not the entire table every time.

**Prerequisites:** "What Is a Relational Database? Tables, Rows, and Relationships."

**The concept, explained simply:**
**SQL** (Structured Query Language) is how you ask a database for data. The most basic real query: "SELECT name, price FROM products WHERE price > 20;" — this means "give me the name and price columns, from the products table, but only rows where price is greater than 20." Every real query has this same basic shape: what columns you want, which table, and (optionally) which rows.

**Why do we need this?** Applications almost never need an entire table's worth of data at once — a real product listing page needs "products in this category, in stock, sorted by price," not every product ever created. Filtering (the "WHERE" part) is what makes a query return exactly the relevant data, not everything.

**How does it actually work?** "WHERE" narrows down which rows are included, using comparisons ("=", ">", "<") and combinations ("AND," "OR" — the exact same logical ideas as Programming Foundations' conditionals, applied to filtering rows instead of branching program logic). "ORDER BY" controls the order results come back in; "LIMIT" caps how many rows you get back at once.

**A simple everyday example:** Asking a librarian "show me science fiction books published after 2020, sorted by title" is exactly a SELECT/WHERE/ORDER BY query in plain language — you're not asking for the entire catalog and filtering it yourself afterward.

**A technical example:** "SELECT title, author FROM books WHERE genre = 'science fiction' AND published_year > 2020 ORDER BY title;" returns exactly the relevant rows, in the requested order, directly from the database — far more efficient than fetching every book and filtering in application code afterward.

**Common mistakes:** fetching an entire table with no WHERE clause and filtering the results in application code instead of letting the database do it — this is a real, common performance mistake, since the database is specifically built to filter efficiently, especially at real data volumes; forgetting that "=" in SQL is a comparison (not an assignment, unlike Programming Foundations' "=") — a different, real point of confusion moving from general programming into SQL specifically.

**When do we filter in the database versus in application code?** Almost always in the database, when possible — it's specifically optimized for this, and fetching only what you need is both faster and uses less memory than fetching everything and filtering afterward.

**How do we know we understood this?** Given a real question in plain English ("find all orders over $100 from the last 30 days"), you can write a real SQL query that answers it directly.

**Mini exercise:** Write a query (real SQL) that finds all products in a "electronics" category with a price under $50, sorted from cheapest to most expensive.

**Reading:** PostgreSQL Documentation — https://www.postgresql.org/docs (already verified Phase 25).

**Homework:** Keep your query — direct input to Lesson 3.`,
    },
    {
      title: 'Combining Data: JOINs Across Tables',
      position: 3,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to pull related data back together from the separate tables Lesson 1 explained were split apart in the first place.

**Prerequisites:** "Writing Real Queries: SELECT, WHERE, and Filtering."

**The concept, explained simply:**
A **JOIN** combines rows from two (or more) tables based on a real relationship between them — exactly reversing Lesson 1's split, when you actually need the combined view. "SELECT orders.id, customers.name FROM orders JOIN customers ON orders.customer_id = customers.id;" combines each order with its real customer's name, even though that name isn't stored directly on the orders table.

**Why do we need this?** Lesson 1 explained why you split related data into separate tables (to avoid repeating and risking inconsistent data) — but real application features very often need the *combined* view (e.g. "show me each order along with the customer's name," not just a bare customer ID). A JOIN is how you get that combined view without giving up the real benefits of keeping the data properly split.

**How does it actually work?** The most common real join, an **inner join**, returns only rows that have a real match in both tables — an order with a customer_id that doesn't match any real customer row simply wouldn't appear. A **left join** returns every row from the first table regardless of whether a match exists in the second, filling in empty values where there's no match — genuinely useful when you want "every order, and its customer's name if we have one," not just orders with confirmed customers.

**A simple everyday example:** Combining a class roster (names) with a separate grades sheet (scores, referencing students by ID) to produce one combined "name + grade" report — exactly what a JOIN does, reconnecting data that was correctly kept in separate sheets for good reasons.

**A technical example:** "SELECT products.name, order_items.quantity FROM order_items JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = 42;" reconstructs the real, human-readable contents of order #42 (product names and quantities), even though the order_items table itself only stores product IDs.

**Common mistakes:** forgetting the "ON" condition (what actually connects the two tables), which can produce a real, serious bug called a cross join — every row from one table paired with every row from the other, producing a nonsensical, often enormous result; confusing an inner join (only matched rows) with a left join (every row from the first table, matched or not) — choosing the wrong one silently drops or silently includes rows you didn't intend.

**When do we use a JOIN?** Any time you need data that's correctly split across related tables displayed or processed together — which is genuinely most real application features once your schema has more than one table.

**How do we know we understood this?** Given two related tables and a real question, you can write a JOIN that correctly answers it, and explain the difference in result between an inner join and a left join for that same question.

**Mini exercise:** Using the "posts" and "comments" tables from Lesson 1's mini exercise, write a query that lists each comment's text along with the title of the post it belongs to.

**Homework:** Bring your JOIN query into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 1 (Relational Fundamentals & SQL Querying). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 1 Final Assessment — Relational Fundamentals & SQL Querying',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why does this module recommend storing a customer\'s address once in a "customers" table, rather than repeating it on every one of their order rows?',
            questionType: 'single',
            options: [
              'It doesn\'t matter either way',
              'Repeating the address risks silent inconsistency if it changes and not every row is updated; storing it once and referencing it avoids this',
              'Databases cannot store the same value twice',
              'It makes queries run slower',
            ],
            correctAnswer: [
              'Repeating the address risks silent inconsistency if it changes and not every row is updated; storing it once and referencing it avoids this',
            ],
          },
          {
            prompt: 'Why is filtering with a WHERE clause in the database generally better than fetching everything and filtering in application code, per this module?',
            questionType: 'single',
            options: [
              'There is no real difference',
              'The database is specifically optimized for filtering efficiently, especially at real data volumes, and returns only what\'s actually needed',
              'WHERE clauses only work on small tables',
              'Application code can never filter data correctly',
            ],
            correctAnswer: [
              'The database is specifically optimized for filtering efficiently, especially at real data volumes, and returns only what\'s actually needed',
            ],
          },
          {
            prompt: 'Which of the following are true about JOINs, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'An inner join returns only rows with a real match in both tables',
              'A left join returns every row from the first table, matched or not',
              'Forgetting the ON condition can produce a nonsensical cross join of every row paired with every row',
              'JOINs can only combine exactly two tables, never more',
            ],
            correctAnswer: [
              'An inner join returns only rows with a real match in both tables',
              'A left join returns every row from the first table, matched or not',
              'Forgetting the ON condition can produce a nonsensical cross join of every row paired with every row',
            ],
          },
          {
            prompt: 'True or False: in SQL, "=" inside a WHERE clause is a comparison, not an assignment.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['True'],
          },
          {
            prompt: 'Practical question: why does a foreign key (like customer_id on an orders table) let you get the real benefit of both splitting data AND combining it when needed?',
            questionType: 'text',
            correctAnswer:
              'A foreign key references the real row in the other table instead of repeating its data, so the fact is stored exactly once (avoiding inconsistency); a JOIN can then use that same reference to reconstruct the combined view whenever it\'s actually needed, without giving up the benefit of not repeating the data.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 2: Schema Design & Normalization
// ---------------------------------------------------------------------
const module2: ModuleSeed = {
  title: 'Schema Design & Normalization',
  position: 2,
  description:
    'Moves from writing queries against an existing schema to designing a real schema from scratch — the discipline that determines whether Module 1\'s queries stay simple or become a mess.',
  lessons: [
    {
      title: 'Designing a Schema: Entities and Relationships',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How to figure out what tables a real application actually needs, before writing a single line of SQL to create them.

**Prerequisites:** Module 1 (Relational Fundamentals & SQL Querying).

**The concept, explained simply:**
Designing a **schema** means deciding what tables (called **entities** at this planning stage) your application needs and how they relate to each other — before creating anything. A practical approach: list the real "things" your application needs to track (users, products, orders), then figure out how they connect (a user places many orders; an order contains many products).

**Why do we need this?** Module 1 already showed why splitting data into separate, related tables matters — but deciding *which* tables, and *how* they connect, is a real design skill, not an automatic process. A poorly-designed schema (missing a needed table, or connecting things incorrectly) causes real, ongoing pain for every feature built on top of it afterward.

**How does it actually work?** Relationships between entities come in 3 real shapes: **one-to-many** (one customer has many orders, but each order belongs to exactly one customer — the most common shape), **many-to-many** (a student can enroll in many courses, and a course has many students — this requires a real, separate "join table" in between, like the "order_items" table from Module 1, Lesson 3), and **one-to-one** (less common — e.g. one user has exactly one profile record).

**A simple everyday example:** A library's real relationships: one author can write many books (one-to-many); one book can have many borrowers over time, and one borrower can borrow many books (many-to-many, needing a real "loans" table connecting them).

**A technical example:** "Students" and "courses" is a genuine many-to-many relationship — you cannot represent it with a simple foreign key on either table alone; you need a separate table (e.g. "enrollments," with student_id and course_id) explicitly representing each individual student-course pairing.

**Common mistakes:** trying to represent a many-to-many relationship with a single foreign key on one of the two tables (this can only represent one-to-many, and silently loses the ability to represent a real many-to-many case); designing tables around how the data happens to be entered on a form, rather than around the real relationships between the actual things being modeled.

**When do we design a schema this way?** Before writing any real application code against a database — retrofitting a wrong relationship shape after real data already exists is a genuinely more expensive, riskier fix than getting it right at design time.

**How do we know we understood this?** Given a real scenario, you can correctly identify whether a relationship is one-to-many, many-to-many, or one-to-one, and design the correct tables (including a join table where needed).

**Mini exercise:** For a simple recipe app (recipes, ingredients, where one recipe uses many ingredients and one ingredient appears in many recipes), identify the relationship type and sketch the tables needed, including any join table.

**Reading:** PostgreSQL Documentation — https://www.postgresql.org/docs (already verified Phase 25).

**Homework:** Keep your recipe-app schema — direct input to Lesson 2.`,
    },
    {
      title: 'Normalization: Removing Redundancy Without Breaking Things',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** A real, systematic process for checking whether your schema still has the "repeated data" problem Module 1 warned about, and fixing it if it does.

**Prerequisites:** "Designing a Schema: Entities and Relationships."

**The concept, explained simply:**
**Normalization** is the real, systematic process of restructuring a schema to eliminate redundant data — the same core problem Module 1, Lesson 1 introduced informally, now made concrete and checkable. A commonly-taught, practical checkpoint: does every non-key column depend on the *whole* table's key, and *only* the key — not on some other column in the same table? If a column's value could be figured out just from another regular column (not the key), that's a real sign of redundancy waiting to cause an inconsistency.

**Why do we need this?** "Split data into related tables" (Module 1) is the right instinct, but without a systematic check, it's easy to still leave real redundancy in a schema that looks reasonably split at first glance. Normalization gives you an actual process to catch this, not just a vague goal.

**How does it actually work?** A concrete example of an unnormalized problem: an "orders" table with columns "customer_id, customer_email" — the customer's email doesn't really belong on the orders table at all; it depends entirely on which customer, not on anything specific to the individual order. If a customer changes their email, you'd need to update it on every one of their past orders too, or you get real, silently inconsistent data (the older orders showing an outdated email). The fix: remove "customer_email" from "orders" entirely, and get it via a JOIN to "customers" (Module 1, Lesson 3) whenever it's actually needed.

**A simple everyday example:** A class roster that lists each student's homeroom teacher's phone number next to every single grade entry, instead of once on a separate teacher list — if the teacher's number changes, every single grade entry listing it needs updating, a real, unnecessary maintenance burden a properly normalized design avoids entirely.

**A technical example:** A "products" table with columns "id, name, category_id, category_name" has a real redundancy: "category_name" depends only on "category_id," not on the specific product — every product in the same category repeats the same category name, and a category rename requires updating every product row. Removing "category_name" and joining to a real "categories" table when needed is the normalized fix.

**Common mistakes:** treating normalization as an abstract rule to follow blindly rather than a real, checkable question ("does this column truly depend on the whole key, and only the key?"); over-normalizing to an extreme that makes even simple, common queries require many joins — real schema design is a genuine, reasoned tradeoff, not "normalize as much as theoretically possible, always."

**When do we normalize?** During schema design, and again whenever a schema seems to be causing real, repeated inconsistency bugs — normalization is both a design-time discipline and a real diagnostic question to ask when something's going wrong.

**How do we know we understood this?** Given a real table with columns, you can identify a column that doesn't truly depend on the whole key (a real redundancy) and propose the correct fix (moving it to its own table, referenced via a foreign key).

**Mini exercise:** A "books" table has columns "id, title, author_id, author_country." Identify the real redundancy here and propose the normalized fix.

**Homework:** Apply this lesson's check to your Lesson 1 recipe-app schema — did you find any redundancy? Bring your finding into Lesson 3.`,
    },
    {
      title: 'Foreign Keys and Referential Integrity',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** How a database itself can enforce that a reference between two tables always points to something real, instead of trusting application code to never make a mistake.

**Prerequisites:** "Normalization: Removing Redundancy Without Breaking Things."

**The concept, explained simply:**
A **foreign key constraint** is a real, database-enforced rule saying "this column's value must match a real row in the referenced table" — not just a naming convention or a hopeful assumption. Without a real constraint, nothing stops an "orders" table's "customer_id" column from holding a value that doesn't correspond to any actual customer — a real, silent data-integrity bug. With a real foreign key constraint, the database itself rejects that insert before it ever happens.

**Why do we need this?** Application code has bugs — that's a real, permanent fact, not a criticism of any specific team. A foreign key constraint is a real, independent safety net at the database level: even if application code has a bug that would otherwise insert a broken reference, the database refuses it outright, catching the problem immediately instead of allowing silently broken data to accumulate.

**How does it actually work?** Beyond just rejecting bad inserts, a real foreign key constraint also governs what happens when a *referenced* row is deleted — e.g. deleting a customer who still has real orders. Common, real policies: **CASCADE** (deleting the customer also deletes their orders), **RESTRICT** (the deletion is refused while orders still reference that customer), or **SET NULL** (the orders' customer_id becomes null, if the schema allows it). Choosing the wrong policy for a given real relationship is a real, consequential design decision, not a minor technicality.

**A simple everyday example:** A library system that refuses to let you delete a book record while there are still real outstanding loans referencing it — this is exactly a RESTRICT-style real integrity rule, preventing a real, orphaned reference from ever existing.

**A technical example:** An e-commerce schema's "order_items" referencing "orders" would typically use CASCADE (deleting an order should reasonably delete its line items too) — but "orders" referencing "customers" might reasonably use RESTRICT (you probably don't want deleting a customer to silently delete their entire real order history).

**Common mistakes:** omitting real foreign key constraints and relying entirely on application code to never insert a bad reference — a real, risky assumption, since application bugs are a permanent fact of software; choosing CASCADE by default everywhere without considering whether that's actually the correct real-world behavior for that specific relationship, risking real, unintended data loss.

**When do we use foreign key constraints?** On essentially every real relationship between tables — the question is less "whether" and more "which deletion policy is actually correct for this specific relationship."

**How do we know we understood this?** Given a real relationship between two tables, you can propose the correct deletion policy (CASCADE, RESTRICT, or SET NULL) and justify it against what should realistically happen in that specific case.

**Mini exercise:** For your Lesson 1 recipe-app schema's "enrollments"-style join table (or equivalent), decide and justify the correct deletion policy if a referenced recipe or ingredient is deleted.

**Homework:** Bring your finalized, normalized recipe-app schema (with foreign keys and deletion policies) into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 2 (Schema Design & Normalization). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 2 Final Assessment — Schema Design & Normalization',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'Why can\'t a single foreign key on one table alone represent a many-to-many relationship, per this module?',
            questionType: 'single',
            options: [
              'It can, this module is incorrect',
              'A single foreign key can only represent one-to-many; a many-to-many relationship needs a separate join table representing each individual pairing',
              'Many-to-many relationships do not exist in real schemas',
              'Foreign keys are only used for one-to-one relationships',
            ],
            correctAnswer: [
              'A single foreign key can only represent one-to-many; a many-to-many relationship needs a separate join table representing each individual pairing',
            ],
          },
          {
            prompt: 'Scenario: a "products" table has columns "id, name, category_id, category_name" — every product in the same category repeats the same category name. What real problem does this module say this causes?',
            questionType: 'single',
            options: [
              'No real problem — repeating data is always fine',
              'A category rename requires updating every product row that repeats it, and missing one creates silently inconsistent data',
              'The table will run out of storage space',
              'This is required for the database to function',
            ],
            correctAnswer: [
              'A category rename requires updating every product row that repeats it, and missing one creates silently inconsistent data',
            ],
          },
          {
            prompt: 'Which of the following are real foreign-key deletion policies discussed in this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'CASCADE — deleting the referenced row also deletes the referencing rows',
              'RESTRICT — the deletion is refused while references still exist',
              'SET NULL — the referencing rows\' foreign key becomes null',
              'IGNORE — the database silently allows a broken reference',
            ],
            correctAnswer: [
              'CASCADE — deleting the referenced row also deletes the referencing rows',
              'RESTRICT — the deletion is refused while references still exist',
              'SET NULL — the referencing rows\' foreign key becomes null',
            ],
          },
          {
            prompt: 'True or False: relying entirely on application code (with no real database-level foreign key constraint) to prevent broken references is a safe, sufficient approach.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: what real, checkable question does this module say you should ask to test whether a column belongs on its current table, per the normalization discipline?',
            questionType: 'text',
            correctAnswer:
              'Whether that column truly depends on the whole table\'s key, and only the key — if its value could be figured out just from another regular column (not the key), that is a real sign of redundancy that should be moved to its own table instead.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 3: Indexing, Performance & Transactions
// ---------------------------------------------------------------------
const module3: ModuleSeed = {
  title: 'Indexing, Performance & Transactions',
  position: 3,
  description:
    'Moves from "does the schema give correct answers" (Modules 1-2) to "does it give correct answers fast, and does it stay correct under concurrent, multi-step operations."',
  lessons: [
    {
      title: 'Indexes: Making Queries Fast',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a database can find matching rows quickly, without having to check every single row every time.

**Prerequisites:** Module 1, "Writing Real Queries: SELECT, WHERE, and Filtering."

**The concept, explained simply:**
Without help, finding rows matching a WHERE condition means checking every single row in the table, one by one — fine for a tiny table, genuinely slow for a real table with millions of rows. An **index** is a separate, additional structure the database maintains, letting it jump directly to matching rows instead of scanning the entire table — closely analogous to a book's index letting you jump directly to a topic's page instead of reading the whole book to find it.

**Why do we need this?** Real applications query the same tables constantly, often filtering or sorting by the same columns repeatedly (e.g. "find a user by email" on every login). Without an index on that column, every single one of those queries scans the whole table — a real, direct, and growing performance cost as the table grows.

**How does it actually work?** Creating an index on a column ("CREATE INDEX ON users (email);") lets the database use that structure whenever a query filters or sorts by that column, instead of scanning every row. This isn't free, though — an index takes up real storage space, and it must be updated every time a row is inserted, updated, or deleted, meaning indexes add real overhead to writes to speed up reads.

**A simple everyday example:** A phone book sorted alphabetically by last name is itself a kind of index for "find someone by last name" — you can jump nearly straight to the right section, instead of reading every single entry from the beginning.

**A technical example:** A "users" table with 2 million rows and no index on "email" makes every login check (WHERE email = ...) scan up to 2 million rows; adding a real index on "email" lets that same query find the matching row almost immediately, regardless of table size.

**Common mistakes:** adding an index to every column "just in case," without considering the real write-performance cost — indexes are a genuine tradeoff, not a free performance upgrade; adding an index but never actually verifying the query got faster (a real, checkable claim, not an assumption) — this lesson deliberately closes with a way to verify this directly, in the next lesson's real context.

**When do we add an index?** On columns real queries actually filter or sort by frequently (especially on large, growing tables) — not reflexively on every column, since every index adds real, ongoing write overhead.

**How do we know we understood this?** You can explain, in your own words, why an index speeds up reads but adds overhead to writes, and identify which columns in a real scenario would most benefit from one.

**Mini exercise:** For an "orders" table frequently queried by "customer_id" (find all of one customer's orders) and rarely queried by "notes" (a free-text field), which column is a stronger candidate for an index, and why?

**Reading:** "Use The Index, Luke" (Markus Winand) — https://use-the-index-luke.com/ (live-verified this phase; a real, well-known, vendor-aware resource specifically about SQL indexing).`,
    },
    {
      title: 'Transactions: All-or-Nothing Operations',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** How a database guarantees that a multi-step operation either fully happens or doesn't happen at all — never getting stuck halfway, even if something fails partway through.

**Prerequisites:** Module 1 (Relational Fundamentals & SQL Querying).

**The concept, explained simply:**
A **transaction** groups multiple database operations together so they succeed or fail as one single, indivisible unit. A classic real example: transferring money between two accounts requires *both* "subtract from account A" *and* "add to account B" to happen together — if the process crashes after subtracting but before adding, money would simply vanish, a genuinely serious real bug. A transaction ("BEGIN; ... COMMIT;") guarantees that either both steps happen, or (if anything fails) neither does — the database automatically undoes ("ROLLS BACK") any partial change.

**Why do we need this?** Any real operation involving more than one write that must logically happen together needs this guarantee — without it, a crash, an error, or even just normal concurrent activity from other users could leave your data in a genuinely broken, half-completed state that's very hard to detect or fix after the fact.

**How does it actually work?** Inside a transaction, changes aren't considered final until "COMMIT" — if anything goes wrong before that (an error, an explicit "ROLLBACK"), every change made since "BEGIN" is undone as if it never happened. This is the real database-level version of "all or nothing," not something you have to carefully reconstruct by hand in application code.

**A simple everyday example:** Swapping two items between two people's hands — you wouldn't want a process that takes the item from person A first, and only afterward tries to give an item to person B; if the second step somehow fails, person A has already lost their item for nothing. A transaction is the real guarantee that both handoffs happen together, or neither does.

**A technical example:** "BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT;" — if the second UPDATE fails for any reason, the whole transaction rolls back, and the first UPDATE's change is undone too, so the money is never actually lost from account 1 with nowhere to go.

**Common mistakes:** performing a multi-step operation as separate, un-grouped statements outside a transaction, leaving a real window where a crash between steps leaves data in a genuinely inconsistent, half-completed state; assuming a transaction protects against every possible problem — it specifically guarantees "all or nothing" for the grouped operations, not correctness of the operations' logic itself (a transaction can still faithfully commit a logically wrong calculation).

**When do we use a transaction?** Any time a real operation involves more than one write that must succeed or fail together as one logical unit — a money transfer, creating an order alongside its line items, or any similar multi-step change where a partial result would be a real, serious bug.

**How do we know we understood this?** Given a described multi-step operation, you can identify whether it needs a transaction, and explain specifically what real problem would occur without one if it failed partway through.

**Mini exercise:** For an e-commerce checkout that must both create an "orders" row and reduce the "products" table's stock count, explain why these 2 writes should be wrapped in a single transaction.

**Homework:** Keep your checkout transaction example — direct input to this module's project.`,
    },
    {
      title: 'Diagnosing a Slow Query',
      position: 3,
      contentType: 'text',
      durationSeconds: 900,
      body: `**What is this lesson about, in one sentence?** A real, systematic way to figure out *why* a specific query is slow, instead of guessing at fixes.

**Prerequisites:** "Indexes: Making Queries Fast."

**The concept, explained simply:**
Most real databases provide a way to ask "explain what you're actually doing to run this query" (in PostgreSQL, the "EXPLAIN" command) — this reveals whether the database is using an index (fast) or scanning the entire table (slow, a "sequential scan"), among other real, checkable details about how it plans to execute your specific query.

**Why do we need this?** Without this, "make this query faster" is pure guesswork — adding a random index and hoping it helped, without any real confirmation. "EXPLAIN" gives you a real, direct, checkable answer about what's actually happening, closing the loop this module's Lesson 1 opened ("add an index, but actually verify it worked").

**How does it actually work?** Running "EXPLAIN SELECT ... " (instead of running the query itself) shows the database's real execution plan — whether it's using an available index, or falling back to a full sequential scan (a strong, direct signal that either no relevant index exists, or the existing one isn't actually being used for this specific query). This is the direct, real way to confirm Lesson 1's claim ("indexing speeds up matching queries") rather than just trusting it.

**A simple everyday example:** Asking a delivery driver to describe their actual planned route before they leave, rather than just hoping it's efficient — you can spot a genuinely inefficient plan (a real detour) before it happens, instead of just noticing afterward that the delivery took too long with no idea why.

**A technical example:** Running "EXPLAIN SELECT * FROM users WHERE email = 'x@example.com';" and seeing "Seq Scan on users" in the output is a direct, real signal that this specific query isn't using an index — even if one exists on a different column, or even on "email" itself but for a reason (e.g. a type mismatch) that's preventing the database from actually using it here.

**Common mistakes:** adding an index and simply assuming it's being used, without ever actually checking with EXPLAIN — a real, common gap between "I made a change" and "I confirmed the change had the intended effect"; only checking a query's speed by feel ("it seems faster") instead of using a real, direct diagnostic tool.

**When do we use this?** Any time a real query is suspected to be slow, or whenever you want to actually confirm an index is having its intended effect — treating this as a genuine, routine diagnostic step, not a rare, advanced-only technique.

**How do we know we understood this?** You can explain what a sequential scan in an EXPLAIN result indicates, and propose it as the real, first diagnostic step for a reported slow query, rather than guessing at a fix immediately.

**Mini exercise:** A query filtering "WHERE last_name = 'Smith'" on a 500,000-row table takes several seconds. Propose the first real diagnostic step you'd take, per this lesson, before making any change.

**Homework:** Bring your indexing and transaction understanding into this module's project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 4,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 3 (Indexing, Performance & Transactions). Review lessons 1–3 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 3 Final Assessment — Indexing, Performance & Transactions',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'What real tradeoff does adding a database index involve, per this module?',
            questionType: 'single',
            options: [
              'Indexes have no real tradeoff — always add them everywhere',
              'Indexes speed up matching reads but add real overhead to writes, since they must be updated on every insert/update/delete',
              'Indexes only work on numeric columns',
              'Indexes make a table impossible to update',
            ],
            correctAnswer: [
              'Indexes speed up matching reads but add real overhead to writes, since they must be updated on every insert/update/delete',
            ],
          },
          {
            prompt: 'Scenario: a money transfer subtracts from account A, then the process crashes before adding to account B. What does this module say a real transaction guarantees in this situation?',
            questionType: 'single',
            options: [
              'The money is permanently lost with no recovery',
              'The entire operation rolls back, so the subtraction from account A is undone too — neither step is left partially applied',
              'Transactions cannot prevent this problem',
              'Account B receives the money anyway',
            ],
            correctAnswer: [
              'The entire operation rolls back, so the subtraction from account A is undone too — neither step is left partially applied',
            ],
          },
          {
            prompt: 'Which of the following are real reasons to use the EXPLAIN command, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'To see whether a query is using an available index or falling back to a sequential scan',
              'To confirm, with real evidence, whether an index change actually had its intended effect',
              'To directly modify the database schema',
              'To diagnose a reported slow query systematically instead of guessing',
            ],
            correctAnswer: [
              'To see whether a query is using an available index or falling back to a sequential scan',
              'To confirm, with real evidence, whether an index change actually had its intended effect',
              'To diagnose a reported slow query systematically instead of guessing',
            ],
          },
          {
            prompt: 'True or False: a database transaction guarantees the operations inside it are logically correct, not just that they succeed or fail together as one unit.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why should creating an order and reducing the corresponding product\'s stock count be wrapped in a single transaction, per this module?',
            questionType: 'text',
            correctAnswer:
              'Both writes must succeed or fail together — if the order were created but the stock reduction failed (or vice versa), the data would be left in a genuinely inconsistent state; a transaction guarantees this cannot happen, rolling back both changes if either one fails.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------
// Module 4: NoSQL & Database Administration Basics
// ---------------------------------------------------------------------
const module4: ModuleSeed = {
  title: 'NoSQL & Database Administration Basics',
  position: 4,
  description:
    'Closes this course by covering when a relational database is genuinely the wrong tool, and the basic, real operational discipline (backups, migrations) every real database needs regardless of type.',
  lessons: [
    {
      title: 'When SQL Isn\'t the Right Tool: NoSQL Basics',
      position: 1,
      contentType: 'text',
      durationSeconds: 1080,
      isPreview: true,
      body: `**What is this lesson about, in one sentence?** When a relational database (Modules 1-3's whole subject) genuinely isn't the best fit, and what the real alternative approach looks like.

**Prerequisites:** Module 2 (Schema Design & Normalization) — understanding what a relational schema commits you to is what makes this lesson's tradeoffs concrete rather than abstract.

**The concept, explained simply:**
**NoSQL** databases store data differently from the tables-and-rows model this whole course has covered — commonly as flexible, self-contained documents (closely resembling Programming Foundations' nested dictionaries) rather than requiring every record to fit a fixed, pre-defined table schema. This isn't "better" or "worse" than relational — it's a genuinely different tool, suited to genuinely different situations.

**Why do we need this?** A relational schema (Module 2) requires committing to a real, defined structure up front, and real relationships are enforced (Module 2, Lesson 3). Some real data genuinely doesn't fit this well — data whose shape varies significantly between records, or where the strict relational structure adds real friction without a corresponding real benefit for that specific use case.

**How does it actually work?** A document-style NoSQL database stores each record as a self-contained, flexible structure (e.g. a JSON-like document) — different records in the same collection can have different fields, unlike a relational table's fixed columns. This trades away some of relational's real guarantees (strict schema enforcement, real foreign-key referential integrity) for real flexibility and, for certain access patterns, real performance benefits.

**A simple everyday example:** A strict paper form (relational: every submission must have exactly the same fields, in the same structure) versus a free-form notebook entry (NoSQL: each entry can genuinely differ in what it records) — each is the right tool for a different real situation, not one universally better than the other.

**A technical example:** A product catalog where different product categories genuinely have very different, varying attributes (a book has an author and page count; a piece of furniture has dimensions and material) can be awkward to force into one rigid relational table — a document-style approach can let each product document naturally hold only the attributes relevant to it.

**Common mistakes:** choosing NoSQL just because it's popular or unfamiliar-sounding, without a real, specific reason grounded in your actual data's shape or access patterns; assuming NoSQL means "no real data-integrity discipline is needed" — it shifts where and how integrity is enforced, it doesn't eliminate the need for it.

**When do we use NoSQL instead of a relational database?** When your data's real shape genuinely varies significantly between records, or specific access patterns benefit meaningfully from it — not as a default choice, and not because relational "feels old-fashioned."

**How do we know we understood this?** Given a real scenario, you can explain whether a relational or document-style approach is the better fit, grounded in the actual shape of that specific data — not a general preference.

**Mini exercise:** A content-management system stores many different content types (articles, videos, image galleries) with genuinely different fields per type. Would this module's framework favor a relational or a document-style approach here, and why?

**Reading:** PostgreSQL Documentation — https://www.postgresql.org/docs (already verified Phase 25; PostgreSQL itself also supports a real JSON column type, a practical middle ground worth knowing exists).`,
    },
    {
      title: 'Backups, Migrations, and Basic Database Administration',
      position: 2,
      contentType: 'text',
      durationSeconds: 1080,
      body: `**What is this lesson about, in one sentence?** The real, basic operational discipline every database needs regardless of type — backing up data safely, and changing a live schema without breaking anything.

**Prerequisites:** Module 2 (Schema Design & Normalization) — a migration is, in a real sense, a controlled, tracked way of changing the schema that module taught you to design.

**The concept, explained simply:**
A **backup** is a real, restorable copy of your database's data, taken regularly — without one, any real data loss (a mistake, a hardware failure, a bug) is genuinely permanent. A **migration** is a real, tracked, incremental change to a live database's schema (e.g. adding a new column, renaming a table) — applied in a controlled, repeatable, reversible way, rather than someone manually running an untracked change directly against a live database.

**Why do we need this?** Real applications change over time — a schema designed correctly in Module 2 will still need real changes later (a new feature needs a new column). Doing this safely against data that real users already depend on requires real discipline: a tracked migration (not an untracked manual edit) and a real, tested backup (in case anything goes wrong).

**How does it actually work?** A migration is typically written as code (a real, versioned file describing the change), applied in order, with a record of which migrations have already run — this is exactly the same "track every change with a real, specific record" discipline Programming Foundations' Git lesson taught, applied here specifically to schema changes instead of application code changes. A real backup strategy defines how often backups run and, critically, whether they've actually been tested to restore successfully — an untested backup is a real, common false sense of security, not a genuine safety net.

**A simple everyday example:** A tracked, dated set of building blueprint revisions (each change recorded, in order, reversible if needed) is like a migration history; a fire safe holding copies of important documents, periodically checked to confirm the documents inside are actually still readable, is like a real, tested backup — an unchecked safe with degraded documents inside would be a false sense of security.

**A technical example:** Adding a new "phone_number" column to a live "users" table should be done via a real migration file (e.g. "add_phone_number_to_users"), applied through a real migration tool, not by someone manually running an ALTER TABLE statement directly against production with no record of having done so — the migration approach is reversible, trackable, and repeatable across every environment (development, staging, production) identically.

**Common mistakes:** making untracked, manual schema changes directly against a live database instead of a real, versioned migration — this leaves no real record of what changed or an easy way to reverse it if something goes wrong; assuming backups exist and work without ever actually testing a real restore — a backup that has never been restored is an unverified claim, not a confirmed safety net.

**When do we apply this discipline?** From the very first real deployment of an application with real user data — treating backups and migrations as something to "figure out later" is a real, common mistake with potentially serious, permanent consequences.

**How do we know we understood this?** You can explain why an untested backup is not a real safety net, and why a manual, untracked schema change against a live database is a real risk a proper migration avoids.

**Mini exercise:** Propose a real migration (in plain terms) for adding a "is_verified" boolean column to a "users" table, and describe what you'd want to verify about your backup strategy before applying it to a live database with real users.

**Homework:** Bring your migration and backup understanding into this course's closing project.`,
    },
    {
      title: 'Module Review & Final Assessment',
      position: 3,
      contentType: 'quiz',
      durationSeconds: 1200,
      body: `This lesson closes Module 4 (NoSQL & Database Administration Basics) — the final module of Database Design & SQL Mastery. Review lessons 1–2 before attempting the final assessment. Passing score: 75%, per docs/content-library/certificates.md's standing policy.`,
      quiz: {
        title: 'Module 4 Final Assessment — NoSQL & Database Administration Basics',
        passingScorePercent: 75,
        maxAttempts: 3,
        questions: [
          {
            prompt: 'When does this module recommend choosing a NoSQL, document-style approach over a relational one?',
            questionType: 'single',
            options: [
              'Always — NoSQL is a strict upgrade over relational databases',
              'When the data\'s real shape genuinely varies significantly between records, or specific access patterns meaningfully benefit — not as a default preference',
              'Never — relational databases are always the correct choice',
              'Only for very small applications',
            ],
            correctAnswer: [
              'When the data\'s real shape genuinely varies significantly between records, or specific access patterns meaningfully benefit — not as a default preference',
            ],
          },
          {
            prompt: 'Why is an untested backup not a real safety net, per this module?',
            questionType: 'single',
            options: [
              'Backups do not need to be tested, they always work',
              'A backup that has never actually been restored is an unverified claim, not a confirmed, working safety net',
              'Untested backups are faster to create',
              'This only matters for very large databases',
            ],
            correctAnswer: [
              'A backup that has never actually been restored is an unverified claim, not a confirmed, working safety net',
            ],
          },
          {
            prompt: 'Which of the following are real properties of a proper database migration, per this module? (Select all that apply.)',
            questionType: 'multiple',
            options: [
              'It is tracked with a real, versioned record of what changed',
              'It is applied consistently across every environment (development, staging, production)',
              'It is a manual, untracked edit made directly against production',
              'It is applied in a controlled, repeatable, reversible way',
            ],
            correctAnswer: [
              'It is tracked with a real, versioned record of what changed',
              'It is applied consistently across every environment (development, staging, production)',
              'It is applied in a controlled, repeatable, reversible way',
            ],
          },
          {
            prompt: 'True or False: NoSQL databases eliminate the need for any real data-integrity discipline.',
            questionType: 'single',
            options: ['True', 'False'],
            correctAnswer: ['False'],
          },
          {
            prompt: 'Practical question: why does this module compare a real migration to the Git discipline taught in Programming Foundations?',
            questionType: 'text',
            correctAnswer:
              'A migration applies the same "track every change with a real, specific, ordered record" discipline Git teaches for application code, but applied specifically to schema changes — giving you a controlled, repeatable, reversible history of how the live database structure has changed over time, instead of untracked, manual edits.',
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
// blueprint's literal "3 projects" figure — directly reusing the
// blueprint's own stated course framing ("starts from a deliberately bad
// schema and refactors it live across the course").
// ---------------------------------------------------------------------
const PROJECTS: ProjectSeed[] = [
  {
    title: 'Design and Query a Real Schema',
    description:
      'Beginner tier — design a real, multi-table relational schema from a stated scenario, and write real queries (including JOINs) against it.',
    instructions: `**Objective:** Design a real relational schema (per Module 1-2) for a stated scenario, and write real SQL queries against it, including at least one JOIN.

**Requirements:**
- A schema for a real scenario of your choice (e.g. a small library system, a simple ticket-booking system, a recipe app) with at least 3 real, related tables.
- At least one genuine one-to-many relationship and, if your scenario has one, a genuine many-to-many relationship with a real join table (per Module 2, Lesson 1).
- A written normalization check (per Module 2, Lesson 2) confirming no column repeats data that belongs on a different table.
- At least 5 real SQL queries against your schema, including: a filtered SELECT with WHERE, a query with ORDER BY and LIMIT, and at least one JOIN combining 2 of your tables.
- A stated foreign-key deletion policy (CASCADE, RESTRICT, or SET NULL, per Module 2, Lesson 3) for at least one relationship, with your reasoning.

**Expected result:** Your schema (as real SQL CREATE TABLE statements or a clear written design), your normalization check, and your 5 queries with their purpose stated for each.

**Difficulty:** Beginner.

**Skills tested:** designing a real, correctly-related schema, applying the normalization check for real, writing real SQL queries including a JOIN, making and justifying a real deletion-policy decision.

**Suggested implementation steps:**
1. Pick a real scenario and list its real entities and relationships before writing any SQL.
2. Design your tables, applying Module 2's normalization check as you go, not after the fact.
3. Write your 5 queries against the actual schema you designed.
4. State and justify your foreign-key deletion policy last, once the relationships are concrete.

**Evaluation criteria:** the schema has genuine, correctly-typed relationships (not a single flat table); the normalization check is real and specific to your actual schema; the queries are correct and the JOIN genuinely combines related data; the deletion-policy justification is grounded in the real scenario, not generic.`,
    position: 2,
  },
  {
    title: 'Refactor a Bad Schema',
    description:
      'Capstone tier — take a deliberately poorly-designed schema and refactor it into a real, normalized, indexed, transaction-safe design, closing this course by applying every module together.',
    instructions: `**Objective:** Take a deliberately bad, unnormalized schema (provided below) and refactor it into a real, correct, well-indexed schema, applying every module of this course together.

**The bad starting schema (deliberately flawed — your job is to find and fix its real problems):**
A single "orders" table with columns: "id, customer_name, customer_email, customer_address, product_name, product_price, product_category, quantity, order_date." Every order repeats the full customer and product details directly, with no separate tables at all.

**Requirements:**
- Identify, in writing, at least 3 real, specific problems with the bad schema (per Modules 1-2 — redundancy, inconsistency risk, missing relationships).
- Refactor it into a real, properly normalized multi-table schema (customers, products, orders, and any join table needed) with real foreign keys and a justified deletion policy for each relationship (per Module 2, Lesson 3).
- Identify at least one column in your new schema that would benefit from an index (per Module 3, Lesson 1), and justify why, based on how it would realistically be queried.
- Describe a real transaction (per Module 3, Lesson 2) needed for a realistic operation on your new schema (e.g. placing a new order and reducing product stock).
- Write a short migration plan (per Module 4, Lesson 2) describing, in order, how you would apply this refactor to a live database already containing real data in the old, bad schema — without losing any existing data.

**Expected result:** Your written list of the bad schema's real problems, your refactored schema (as real SQL or a clear written design), your indexing justification, your transaction example, and your migration plan.

**Difficulty:** Capstone (closes this course).

**Skills tested:** diagnosing real schema problems, applying normalization and relationship design correctly, making a real indexing decision, applying transactional thinking to a realistic operation, planning a safe, real migration of existing data.

**Suggested implementation steps:**
1. Diagnose the bad schema's problems in writing before designing anything new.
2. Design the refactored schema, applying Module 2's discipline throughout.
3. Identify your index and transaction needs against the new schema specifically.
4. Write the migration plan last, since it depends on the refactored schema already being finalized.

**Evaluation criteria:** the diagnosed problems are real and specific to the given bad schema, not generic; the refactored schema is genuinely normalized with correct relationships and deletion policies; the indexing and transaction choices are justified against realistic use, not arbitrary; the migration plan realistically preserves existing data rather than assuming a clean slate.`,
    position: 3,
  },
];

// ---------------------------------------------------------------------
// The new Backend Engineer LearningPath — confirmed via direct query
// (not assumed) that no existing path is a real fit: "devops-engineer"
// only contains Computer Networking Foundations + DevOps Foundations,
// missing Programming Foundations, Database Design & SQL Mastery, and
// Full-Stack Web Development with Next.js entirely.
// ---------------------------------------------------------------------
const BACKEND_ENGINEER_PATH_SLUG = 'backend-engineer';
const BACKEND_ENGINEER_COURSE_SLUGS = [
  'programming-foundations-python-javascript', // Phase 36, reused
  COURSE_SLUG, // this phase's new course
  'fullstack-web-development-nextjs', // Phase 32, reused (backend-relevant modules)
  'computer-networking-foundations', // Phase 34, reused
  'devops-foundations-cicd-containers', // Phase 31, reused
];

async function main(): Promise<void> {
  const instructor = await prisma.user.findFirst({ where: { email: INSTRUCTOR_EMAIL } });
  if (!instructor) {
    throw new Error(
      'Phase 37 seed requires the existing e2e.instructor@phoenix.test fixture user to exist — not found. Run the standard E2E fixture setup first.',
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: 'databases' },
    update: {},
    create: { slug: 'databases', name: 'Databases', domain: 'courses' },
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
          'Starts from a deliberately bad schema and refactors it live across the course, so normalization, indexing, and transactions feel like solving real problems rather than abstract rules. Built Phase 37 to close the one remaining real gap Phase 35\'s analysis found for the Backend Engineer learning path.',
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

  // Create the new Backend Engineer LearningPath, following
  // seed-phase26-content.ts's own original pattern (this is a brand-new
  // path, so its own "any memberships exist" guard is correct and safe
  // here — unlike Phase 36's addition to an already-populated path).
  let pathsCreated = 0;
  let membershipsCreated = 0;
  let path = await prisma.learningPath.findUnique({ where: { slug: BACKEND_ENGINEER_PATH_SLUG } });
  if (!path) {
    path = await prisma.learningPath.create({
      data: {
        slug: BACKEND_ENGINEER_PATH_SLUG,
        title: 'Backend Engineer',
        description:
          'Designs and builds server-side systems, APIs, and data layers. See docs/content-library/learning-paths.md and docs/content-library/phase35-learning-path-master-blueprint.md Section 3 for the full staged course table and skill-gap analysis.',
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
    const courses = await prisma.course.findMany({ where: { slug: { in: BACKEND_ENGINEER_COURSE_SLUGS } } });
    const bySlug = new Map(courses.map((c) => [c.slug, c]));
    let position = 1;
    for (const slug of BACKEND_ENGINEER_COURSE_SLUGS) {
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
    `\nPhase 37 content seed complete: course ${courseCreated ? 'created' : 'already existed'}, ${modulesCreated} modules created, ${lessonsCreated} lessons created, ${quizzesCreated} quizzes created, ${questionsCreated} quiz questions created, ${projectsCreated} projects created (${projectsSkipped} already existed), ${pathsCreated} learning path created, ${membershipsCreated} path memberships created.`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 37 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

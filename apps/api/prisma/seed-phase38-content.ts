// Phase 38 — Full Stack Engineer Learning Path Production.
//
// Per docs/content-library/phase35-learning-path-master-blueprint.md
// Section 5 (Full Stack Engineer Blueprint): this path needs 5 mandatory
// courses — Programming Foundations, Database Design & SQL Mastery,
// UI/UX Design Foundations, Full-Stack Web Development with Next.js
// (full course, both tracks), DevOps Foundations.
//
// REAL FINDING, disclosed here and in the Phase 38 report (not silently
// assumed): both courses Phase 35 flagged as "new" for this path
// (Programming Foundations, Database Design & SQL Mastery) were already
// built — for OTHER paths — in Phase 36 (Frontend Engineer) and Phase 37
// (Backend Engineer) respectively. Direct inspection of all 5 required
// courses' real modules/lessons/projects (this phase, before writing
// anything) confirmed every skill Full Stack Engineer needs is already
// covered by production-ready content, including cross-stack skills
// (REST API design + ORMs/persistence + Next.js frontend-backend wiring
// + security basics, all inside Full-Stack Web Development with Next.js)
// and a genuine frontend+backend+database-integrated project ("Full-Stack
// Next.js Feature", which explicitly reuses/extends the REST API
// project's backend route).
//
// CONCLUSION: zero new courses are required this phase. This file's
// only job is to create the "Full Stack Engineer" LearningPath (no
// existing path is a real fit — confirmed by direct query, none of the
// 4 existing paths contain this exact 5-course combination) and link
// the 5 already-real courses in the blueprint's specified sequence.
//
// Idempotency: follows Phase 26/37's original whole-path-membership
// guard (new path, zero pre-existing memberships to guard against),
// not Phase 36's per-course guard (which was needed there specifically
// because that path already had partial memberships before the
// addition).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FULLSTACK_PATH_SLUG = 'full-stack-engineer';
const FULLSTACK_COURSE_SLUGS = [
  'programming-foundations-python-javascript', // Phase 36
  'database-design-sql-mastery', // Phase 37
  'ui-ux-design-foundations', // Phase 30
  'fullstack-web-development-nextjs', // Phase 32, full course (both tracks)
  'devops-foundations-cicd-containers', // Phase 31
];

async function main(): Promise<void> {
  let pathsCreated = 0;
  let membershipsCreated = 0;

  let path = await prisma.learningPath.findUnique({ where: { slug: FULLSTACK_PATH_SLUG } });
  if (!path) {
    path = await prisma.learningPath.create({
      data: {
        slug: FULLSTACK_PATH_SLUG,
        title: 'Full Stack Engineer',
        description:
          'Owns a feature end-to-end, frontend to database, at a standard comparable to how Phoenix itself is built. See docs/content-library/learning-paths.md and docs/content-library/phase35-learning-path-master-blueprint.md Section 5 for the full staged course table and skill-gap analysis. Built Phase 38 — required zero new course authoring, since Phases 36/37 had already built both courses this path needed.',
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
    const courses = await prisma.course.findMany({ where: { slug: { in: FULLSTACK_COURSE_SLUGS } } });
    const bySlug = new Map(courses.map((c) => [c.slug, c]));
    let position = 1;
    for (const slug of FULLSTACK_COURSE_SLUGS) {
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
    `\nPhase 38 content seed complete: ${pathsCreated} learning path created, ${membershipsCreated} path memberships created. Zero new courses/modules/lessons/quizzes/projects — none were needed (see docs/phase38-fullstack-learning-path-production-report.md Section 2).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 38 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

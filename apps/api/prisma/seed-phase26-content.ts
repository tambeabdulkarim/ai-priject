// Phase 26 — populates the new LearningPath/Project architecture from
// already-real Phase 25 data. Two distinct, additive-only operations:
//
// 1. Creates the 3 real learning paths Phase 25 already introduced
//    informally (Prompt Engineer, Frontend/Web, DevOps Engineer),
//    ordering their real, already-seeded courses.
// 2. Links each of the 6 existing Phase 25 project-brief Lessons to a new
//    Project row via `sourceLessonId` — NOT a copy. `Project.instructions`
//    is deliberately left null for every linked project; the brief's full
//    text stays exactly where Phase 25 put it (`Lesson.body`), per this
//    phase's explicit instruction not to duplicate the 6 existing briefs.
//
// Idempotency: LearningPath.slug is unique (real upsert-safe). Project has
// no unique constraint on title, but `sourceLessonId` IS unique — so every
// lesson-linked Project uses a findFirst-by-sourceLessonId guard before
// create, the same application-level pattern already documented in
// seed-phase25-content.ts's header for Module/Lesson.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PathSeed = {
  slug: string;
  title: string;
  description: string;
  courseSlugs: string[]; // in path order
};

const LEARNING_PATHS: PathSeed[] = [
  {
    slug: 'prompt-engineer',
    title: 'Prompt Engineer',
    description:
      'The fastest path in the library — designs, tests, and productionizes prompts and LLM-powered workflows. See docs/content-library/learning-paths.md for the full staged course table (only the first module of each course is seeded as of Phase 25/26).',
    courseSlugs: ['prompt-engineering-mastering-llms', 'ai-foundations-theory-to-application'],
  },
  {
    slug: 'frontend-web',
    title: 'Frontend / Web',
    description:
      'Builds accessible, responsive, component-based interfaces and full-stack web applications. See docs/content-library/learning-paths.md (Frontend Engineer / Full Stack Engineer).',
    courseSlugs: ['ui-ux-design-foundations', 'fullstack-web-development-nextjs'],
  },
  {
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    description:
      'Builds and operates the delivery pipeline and platform other engineers rely on. See docs/content-library/learning-paths.md.',
    courseSlugs: ['computer-networking-foundations', 'devops-foundations-cicd-containers'],
  },
];

type ProjectLinkSeed = {
  courseSlug: string;
  lessonTitle: string;
  projectTitle: string;
  description: string;
};

const PROJECT_LINKS: ProjectLinkSeed[] = [
  {
    courseSlug: 'prompt-engineering-mastering-llms',
    lessonTitle: 'Project: Prompt Pattern Library',
    projectTitle: 'Prompt Pattern Library',
    description:
      'Beginner tier, Prompt Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
  {
    courseSlug: 'prompt-engineering-mastering-llms',
    lessonTitle: 'Project: Evaluation Harness for a Prompted Task',
    projectTitle: 'Evaluation Harness for a Prompted Task',
    description:
      'Intermediate tier, Prompt Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
  {
    courseSlug: 'ui-ux-design-foundations',
    lessonTitle: 'Project: Responsive Landing Page',
    projectTitle: 'Responsive Landing Page',
    description:
      'Beginner tier, Frontend Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
  {
    courseSlug: 'fullstack-web-development-nextjs',
    lessonTitle: 'Project: Component-Based Dashboard',
    projectTitle: 'Component-Based Dashboard',
    description:
      'Intermediate tier, Frontend Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
  {
    courseSlug: 'devops-foundations-cicd-containers',
    lessonTitle: 'Project: Containerized App with Basic CI',
    projectTitle: 'Containerized App with Basic CI',
    description:
      'Beginner tier, DevOps Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
  {
    courseSlug: 'devops-foundations-cicd-containers',
    lessonTitle: 'Project: Full CI/CD to a Real Environment',
    projectTitle: 'Full CI/CD to a Real Environment',
    description:
      'Intermediate tier, DevOps Engineer path. Full brief lives in the linked lesson (Lesson.body) — not duplicated here.',
  },
];

async function main(): Promise<void> {
  let pathsCreated = 0;
  let pathsSkipped = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;

  for (const pathSeed of LEARNING_PATHS) {
    const existing = await prisma.learningPath.findUnique({ where: { slug: pathSeed.slug } });
    let path = existing;
    if (!path) {
      path = await prisma.learningPath.create({
        data: {
          slug: pathSeed.slug,
          title: pathSeed.title,
          description: pathSeed.description,
          status: 'published',
        },
      });
      pathsCreated += 1;
      console.log(`  Created learning path: ${path.title} (${path.slug})`);
    } else {
      pathsSkipped += 1;
      console.log(`  Learning path already exists, skipping create: ${path.title} (${path.slug})`);
    }

    const existingMemberships = await prisma.learningPathCourse.findMany({
      where: { learningPathId: path.id },
    });
    if (existingMemberships.length === 0) {
      const courses = await prisma.course.findMany({
        where: { slug: { in: pathSeed.courseSlugs } },
      });
      const bySlug = new Map(courses.map((c) => [c.slug, c]));
      let position = 1;
      for (const slug of pathSeed.courseSlugs) {
        const course = bySlug.get(slug);
        if (!course) {
          console.warn(`    WARNING: course "${slug}" not found — skipping membership (run seed-phase25-content.ts first).`);
          continue;
        }
        await prisma.learningPathCourse.create({
          data: { learningPathId: path.id, courseId: course.id, position: position++ },
        });
        console.log(`    Added course to path: ${course.title} (position ${position - 1})`);
      }
    } else {
      console.log(`    Course memberships already exist (${existingMemberships.length}), skipping.`);
    }
  }

  for (const link of PROJECT_LINKS) {
    const course = await prisma.course.findUnique({ where: { slug: link.courseSlug } });
    if (!course) {
      console.warn(`  WARNING: course "${link.courseSlug}" not found — skipping "${link.projectTitle}" (run seed-phase25-content.ts first).`);
      continue;
    }

    const lesson = await prisma.lesson.findFirst({
      where: { title: link.lessonTitle, module: { courseId: course.id } },
    });
    if (!lesson) {
      console.warn(`  WARNING: lesson "${link.lessonTitle}" not found in course "${link.courseSlug}" — skipping.`);
      continue;
    }

    const existingProject = await prisma.project.findUnique({
      where: { sourceLessonId: lesson.id },
    });
    if (existingProject) {
      projectsSkipped += 1;
      console.log(`  Project already linked, skipping create: ${existingProject.title}`);
      continue;
    }

    const project = await prisma.project.create({
      data: {
        courseId: course.id,
        sourceLessonId: lesson.id,
        title: link.projectTitle,
        description: link.description,
        instructions: null, // deliberately not duplicated — see file header
        status: 'published',
        position: lesson.position,
      },
    });
    projectsCreated += 1;
    console.log(`  Created project (linked to existing lesson, no content duplicated): ${project.title}`);
  }

  console.log(
    `\nPhase 26 content seed complete: ${pathsCreated} learning paths created (${pathsSkipped} already existed), ${projectsCreated} projects created (${projectsSkipped} already existed/linked).`,
  );
}

main()
  .catch((error) => {
    console.error('Phase 26 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

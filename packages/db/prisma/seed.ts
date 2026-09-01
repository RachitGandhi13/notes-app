import { PrismaClient, ProblemType, TrackType, ContentType, PostType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Notes domain seed ──────────────────────────────────────────────────────

  const category = await prisma.categories.upsert({
    where: { id: "seed-cat-1" },
    update: {},
    create: {
      id: "seed-cat-1",
      category: "Web Development",
    },
  });

  const track = await prisma.track.upsert({
    where: { id: "seed-track-1" },
    update: {},
    create: {
      id: "seed-track-1",
      title: "Introduction to TypeScript",
      description: "Learn TypeScript from the ground up.",
      image: "https://via.placeholder.com/400x200?text=TypeScript",
      trackType: TrackType.NOTION,
      categories: {
        create: { categoryId: category.id },
      },
    },
  });

  const problem1 = await prisma.problem.upsert({
    where: { id: "seed-prob-1" },
    update: {},
    create: {
      id: "seed-prob-1",
      title: "What is TypeScript?",
      description: "An introduction to TypeScript and why it exists.",
      notionDocId: "replace-with-real-notion-page-id",
      type: ProblemType.Blog,
    },
  });

  const problem2 = await prisma.problem.upsert({
    where: { id: "seed-prob-2" },
    update: {},
    create: {
      id: "seed-prob-2",
      title: "TypeScript Basics Quiz",
      description: "Test your knowledge of TypeScript basics.",
      notionDocId: "replace-with-real-notion-page-id",
      type: ProblemType.MCQ,
      mcqQuestions: {
        create: [
          {
            question: "Which company developed TypeScript?",
            options: ["Google", "Microsoft", "Meta", "Amazon"],
            correctOption: "Microsoft",
          },
          {
            question: "TypeScript is a superset of which language?",
            options: ["Java", "Python", "JavaScript", "C#"],
            correctOption: "JavaScript",
          },
        ],
      },
    },
  });

  await prisma.trackProblems.createMany({
    data: [
      { trackId: track.id, problemId: problem1.id, sortingOrder: 1 },
      { trackId: track.id, problemId: problem2.id, sortingOrder: 2 },
    ],
    skipDuplicates: true,
  });

  // ── Video domain seed ──────────────────────────────────────────────────────

  const course = await prisma.course.upsert({
    where: { slug: "fullstack-dev-101" },
    update: {},
    create: {
      title: "Full Stack Development 101",
      description: "A complete guide to modern full stack development.",
      imageUrl: "https://via.placeholder.com/400x200?text=Fullstack",
      price: 0,
      slug: "fullstack-dev-101",
    },
  });

  const rootFolder = await prisma.content.upsert({
    where: { id: "seed-content-root" },
    update: {},
    create: {
      id: "seed-content-root",
      type: ContentType.FOLDER,
      title: "Week 1: Getting Started",
    },
  });

  const videoLeaf = await prisma.content.upsert({
    where: { id: "seed-content-video-1" },
    update: {},
    create: {
      id: "seed-content-video-1",
      type: ContentType.VIDEO,
      title: "Introduction Video",
      parentId: rootFolder.id,
      videoMetadata: {
        create: {
          videoUrl: "https://example.com/intro.mp4",
          drmProtected: false,
        },
      },
    },
  });

  await prisma.courseContent.createMany({
    data: [
      { courseId: course.id, contentId: rootFolder.id, order: 1 },
      { courseId: course.id, contentId: videoLeaf.id, order: 2 },
    ],
    skipDuplicates: true,
  });

  // ── Seed admin user (no OAuth — useful for local dev) ─────────────────────
  // Password: "admin123" — change immediately in any real environment
  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: hashedPassword,
      admin: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

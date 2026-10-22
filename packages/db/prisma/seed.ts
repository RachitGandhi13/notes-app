import { PrismaClient, ProblemType, ContentType } from "@prisma/client";
import { hash } from "bcryptjs";

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
      image: "https://placehold.co/800x450/D08D74/FFFFFF.png?text=TypeScript",
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
      // Placeholder — a real upload replaces this file once the admin adds one.
      pptUrl: null,
      type: ProblemType.PPT,
    },
  });

  const problem2 = await prisma.problem.upsert({
    where: { id: "seed-prob-2" },
    update: {},
    create: {
      id: "seed-prob-2",
      title: "TypeScript Basics Quiz",
      description: "Test your knowledge of TypeScript basics.",
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
      imageUrl: null,
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

  // Its upsert result isn't needed beyond creating the row — see the comment
  // below on why it gets no CourseContent row of its own.
  await prisma.content.upsert({
    where: { id: "seed-content-video-1" },
    update: {},
    create: {
      id: "seed-content-video-1",
      type: ContentType.VIDEO,
      title: "Introduction Video",
      parentId: rootFolder.id,
      videoMetadata: {
        create: {
          // Dev-only placeholder: replace with any YouTube URL to preview playback.
          videoUrl: "https://www.youtube.com/watch?v=dev-seed-placeholder",
          drmProtected: false,
        },
      },
    },
  });

  // Only the folder gets a CourseContent row — videoLeaf is reached via its
  // parentId (same convention as createUploadedVideo in lib/actions.ts); giving
  // it its own row too made it render twice in the sidebar, once nested and
  // once as a stray top-level entry.
  await prisma.courseContent.createMany({
    data: [{ courseId: course.id, contentId: rootFolder.id, order: 1 }],
    skipDuplicates: true,
  });

  // ── Seed admin user (no OAuth — useful for local dev) ─────────────────────
  // Password: "admin123" — change immediately in any real environment
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

  // ── Internship tracks (migrated off the old hardcoded INTERNSHIP_TRACKS in
  // lib/internships.ts) — the 3 existing programs, plus the new bootcamp
  // track. courseSlugs matches that file's former TRACK_COURSE_SLUGS mapping;
  // on a fresh local DB these slugs usually don't exist yet (only
  // fullstack-dev-101 is seeded above), so the link step below just creates
  // zero InternshipTrackCourse rows rather than erroring.
  const internshipTrackSeeds = [
    {
      id: "seed-internship-aws",
      title: "AWS Cloud Engineering Internship",
      duration: "4 Weeks",
      description:
        "Learn cloud fundamentals, IAM, VPC, EC2, S3, Lambda, databases, monitoring, security, and deploying applications on AWS.",
      courseSlugs: ["aws-solutions"],
    },
    {
      id: "seed-internship-devops",
      title: "DevOps & Automation Internship",
      duration: "4 Weeks",
      description:
        "Learn Git, CodeCommit/GitHub, Linux, Jenkins, Docker, Terraform, CI/CD pipelines, containers, and automated deployments.",
      courseSlugs: ["devops"],
    },
    {
      id: "seed-internship-ai",
      title: "AI & Cloud Application Development Internship",
      duration: "4 Weeks",
      description:
        "Learn Python-based automation, generative AI fundamentals, API integration, AI-powered applications, and cloud deployment.",
      courseSlugs: ["dsa-python", "aws-solutions"],
    },
    {
      id: "seed-internship-bootcamp",
      title: "Integrated AWS, DevOps & AI Bootcamp Internship",
      duration: "6-8 weeks",
      description:
        "An integrated learning journey covering cloud infrastructure, automation, application deployment, CI/CD, and AI-enabled cloud projects.",
      courseSlugs: [] as string[],
    },
  ];

  for (const t of internshipTrackSeeds) {
    const track = await prisma.internshipTrack.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, title: t.title, duration: t.duration, description: t.description },
    });
    const courses = await prisma.course.findMany({
      where: { slug: { in: t.courseSlugs } },
      select: { id: true },
    });
    await prisma.internshipTrackCourse.createMany({
      data: courses.map((c) => ({ trackId: track.id, courseId: c.id })),
      skipDuplicates: true,
    });
  }

  // Best-effort backfill of the new FK on any pre-existing text-matched rows
  // from before InternshipTrack existed — safe to re-run, a no-op once a row
  // is already backfilled.
  await prisma.$executeRaw`
    UPDATE "InternshipApplication" a SET "internshipTrackId" = t.id
    FROM "InternshipTrack" t
    WHERE a."internshipTrack" = t.title AND a."internshipTrackId" IS NULL
  `;
  await prisma.$executeRaw`
    UPDATE "InternshipCertificate" c SET "internshipTrackId" = t.id
    FROM "InternshipTrack" t
    WHERE c."trackName" = t.title AND c."internshipTrackId" IS NULL
  `;

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('Blog', 'MCQ');

-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('NOTION', 'CANVA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('FOLDER', 'VIDEO', 'NOTION');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('DEFAULT', 'INTRO');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('BOUNTY', 'PROJECT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "refresh_token_expires_in" INTEGER,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "canvaLink" TEXT,
    "trackType" "TrackType" NOT NULL DEFAULT 'NOTION',
    "inSearch" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "cohort" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackCategory" (
    "trackId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "TrackCategory_pkey" PRIMARY KEY ("trackId","categoryId")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notionDocId" TEXT NOT NULL,
    "type" "ProblemType" NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackProblems" (
    "trackId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "sortingOrder" INTEGER NOT NULL,

    CONSTRAINT "TrackProblems_pkey" PRIMARY KEY ("trackId","problemId")
);

-- CreateTable
CREATE TABLE "MCQQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctOption" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,

    CONSTRAINT "MCQQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizScore" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "userId" TEXT,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPurchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "thumbnail" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseContent" (
    "courseId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CourseContent_pkey" PRIMARY KEY ("courseId","contentId")
);

-- CreateTable
CREATE TABLE "VideoMetadata" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "drmProtected" BOOLEAN NOT NULL DEFAULT false,
    "subtitleUrl" TEXT,
    "thumbnail1Url" TEXT,
    "thumbnail2Url" TEXT,
    "thumbnail3Url" TEXT,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "VideoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotionMetadata" (
    "id" TEXT NOT NULL,
    "notionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "NotionMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "markAsRead" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "type" "CommentType" NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "commentId" TEXT,
    "questionId" TEXT,
    "answerId" TEXT,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BountySubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PostType" NOT NULL DEFAULT 'BOUNTY',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BountySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Track_courseId_key" ON "Track"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchases_userId_courseId_key" ON "UserPurchases"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key" ON "PaymentOrder"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMetadata_contentId_key" ON "VideoMetadata"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "NotionMetadata_contentId_key" ON "NotionMetadata"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_userId_contentId_key" ON "VideoProgress"("userId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_key" ON "Bookmark"("userId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_slug_key" ON "Certificate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCategory" ADD CONSTRAINT "TrackCategory_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCategory" ADD CONSTRAINT "TrackCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProblems" ADD CONSTRAINT "TrackProblems_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProblems" ADD CONSTRAINT "TrackProblems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MCQQuestion" ADD CONSTRAINT "MCQQuestion_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizScore" ADD CONSTRAINT "QuizScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizScore" ADD CONSTRAINT "QuizScore_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchases" ADD CONSTRAINT "UserPurchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchases" ADD CONSTRAINT "UserPurchases_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseContent" ADD CONSTRAINT "CourseContent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseContent" ADD CONSTRAINT "CourseContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMetadata" ADD CONSTRAINT "VideoMetadata_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionMetadata" ADD CONSTRAINT "NotionMetadata_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountySubmission" ADD CONSTRAINT "BountySubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

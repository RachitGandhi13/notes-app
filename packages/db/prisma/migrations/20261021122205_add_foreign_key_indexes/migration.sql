/*
  Warnings:

  - You are about to drop the column `notesTitle` on the `VideoMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `notesUrl` on the `VideoMetadata` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VideoMetadata" DROP COLUMN "notesTitle",
DROP COLUMN "notesUrl";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Bookmark_contentId_idx" ON "Bookmark"("contentId");

-- CreateIndex
CREATE INDEX "Comment_contentId_idx" ON "Comment"("contentId");

-- CreateIndex
CREATE INDEX "Content_parentId_idx" ON "Content"("parentId");

-- CreateIndex
CREATE INDEX "CourseContent_contentId_idx" ON "CourseContent"("contentId");

-- CreateIndex
CREATE INDEX "InternshipApplication_internshipTrackId_idx" ON "InternshipApplication"("internshipTrackId");

-- CreateIndex
CREATE INDEX "InternshipCertificate_internshipTrackId_idx" ON "InternshipCertificate"("internshipTrackId");

-- CreateIndex
CREATE INDEX "InternshipTrackCourse_courseId_idx" ON "InternshipTrackCourse"("courseId");

-- CreateIndex
CREATE INDEX "MCQQuestion_problemId_idx" ON "MCQQuestion"("problemId");

-- CreateIndex
CREATE INDEX "PaymentOrder_courseId_idx" ON "PaymentOrder"("courseId");

-- CreateIndex
CREATE INDEX "PaymentOrder_trackId_idx" ON "PaymentOrder"("trackId");

-- CreateIndex
CREATE INDEX "Question_contentId_idx" ON "Question"("contentId");

-- CreateIndex
CREATE INDEX "QuizScore_userId_idx" ON "QuizScore"("userId");

-- CreateIndex
CREATE INDEX "QuizScore_problemId_idx" ON "QuizScore"("problemId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "TrackCourse_courseId_idx" ON "TrackCourse"("courseId");

-- CreateIndex
CREATE INDEX "TrackProblems_problemId_idx" ON "TrackProblems"("problemId");

-- CreateIndex
CREATE INDEX "UserPurchases_courseId_idx" ON "UserPurchases"("courseId");

-- CreateIndex
CREATE INDEX "VideoProgress_contentId_idx" ON "VideoProgress"("contentId");

-- CreateIndex
CREATE INDEX "Vote_commentId_idx" ON "Vote"("commentId");

-- CreateIndex
CREATE INDEX "Vote_questionId_idx" ON "Vote"("questionId");

-- CreateIndex
CREATE INDEX "Vote_answerId_idx" ON "Vote"("answerId");

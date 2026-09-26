-- AlterEnum
ALTER TYPE "ProblemType" ADD VALUE 'Slides';

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "slideUrl" TEXT,
ALTER COLUMN "notionDocId" DROP NOT NULL;

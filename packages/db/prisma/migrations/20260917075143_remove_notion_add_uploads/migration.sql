-- AlterEnum
BEGIN;
CREATE TYPE "ProblemType_new" AS ENUM ('MCQ', 'PPT');
ALTER TABLE "Problem" ALTER COLUMN "type" TYPE "ProblemType_new" USING ("type"::text::"ProblemType_new");
ALTER TYPE "ProblemType" RENAME TO "ProblemType_old";
ALTER TYPE "ProblemType_new" RENAME TO "ProblemType";
DROP TYPE "ProblemType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "notionDocId",
DROP COLUMN "slideUrl",
ADD COLUMN     "pptUrl" TEXT;

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "canvaLink",
DROP COLUMN "trackType";

-- DropEnum
DROP TYPE "TrackType";


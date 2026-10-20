-- AlterTable
ALTER TABLE "InternshipApplication" ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "frozen" BOOLEAN NOT NULL DEFAULT false;

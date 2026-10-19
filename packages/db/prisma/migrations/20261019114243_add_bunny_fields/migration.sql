-- AlterTable
ALTER TABLE "VideoMetadata" ALTER COLUMN "videoUrl" DROP NOT NULL,
ADD COLUMN     "bunnyVideoId" TEXT,
ADD COLUMN     "bunnyPdfPath" TEXT;

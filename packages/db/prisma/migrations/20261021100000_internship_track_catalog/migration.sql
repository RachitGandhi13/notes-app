-- AlterTable
ALTER TABLE "InternshipApplication" ADD COLUMN     "internshipTrackId" TEXT;

-- AlterTable
ALTER TABLE "InternshipCertificate" ADD COLUMN     "internshipTrackId" TEXT;

-- CreateTable
CREATE TABLE "InternshipTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipTrackCourse" (
    "trackId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "InternshipTrackCourse_pkey" PRIMARY KEY ("trackId","courseId")
);

-- AddForeignKey
ALTER TABLE "InternshipApplication" ADD CONSTRAINT "InternshipApplication_internshipTrackId_fkey" FOREIGN KEY ("internshipTrackId") REFERENCES "InternshipTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipCertificate" ADD CONSTRAINT "InternshipCertificate_internshipTrackId_fkey" FOREIGN KEY ("internshipTrackId") REFERENCES "InternshipTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipTrackCourse" ADD CONSTRAINT "InternshipTrackCourse_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "InternshipTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipTrackCourse" ADD CONSTRAINT "InternshipTrackCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


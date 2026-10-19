-- CreateTable
CREATE TABLE "InternshipCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternshipCertificate_certificateCode_key" ON "InternshipCertificate"("certificateCode");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipCertificate_userId_trackName_key" ON "InternshipCertificate"("userId", "trackName");

-- AddForeignKey
ALTER TABLE "InternshipCertificate" ADD CONSTRAINT "InternshipCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

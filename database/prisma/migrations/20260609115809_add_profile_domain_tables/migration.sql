/*
  Warnings:

  - A unique constraint covering the columns `[profileId]` on the table `ProfilePersonal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ProfileEducation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "specialization" TEXT,
    "institution" TEXT,
    "graduationYear" INTEGER,

    CONSTRAINT "ProfileEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileCareer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "profession" TEXT,
    "employer" TEXT,
    "designation" TEXT,
    "annualIncome" DECIMAL(15,2),
    "workLocation" TEXT,

    CONSTRAINT "ProfileCareer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileFamily" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "fatherOccupation" TEXT,
    "motherOccupation" TEXT,
    "familyType" TEXT,
    "familyValues" TEXT,
    "siblingsCount" INTEGER,

    CONSTRAINT "ProfileFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLifestyle" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "foodHabit" TEXT,
    "smoking" BOOLEAN,
    "drinking" BOOLEAN,
    "fitnessLevel" TEXT,
    "hobbies" JSONB,

    CONSTRAINT "ProfileLifestyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePreference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minHeight" INTEGER,
    "maxHeight" INTEGER,
    "religion" TEXT,
    "caste" TEXT,
    "city" TEXT,
    "education" TEXT,
    "profession" TEXT,

    CONSTRAINT "ProfilePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePhoto" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileDocument" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "approvalStatus" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePersonal_profileId_key" ON "ProfilePersonal"("profileId");

-- AddForeignKey
ALTER TABLE "AgencyProfile" ADD CONSTRAINT "AgencyProfile_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "AgencyUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEducation" ADD CONSTRAINT "ProfileEducation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCareer" ADD CONSTRAINT "ProfileCareer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFamily" ADD CONSTRAINT "ProfileFamily_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLifestyle" ADD CONSTRAINT "ProfileLifestyle_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePreference" ADD CONSTRAINT "ProfilePreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDocument" ADD CONSTRAINT "ProfileDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `code` on the `Agency` table. All the data in the column will be lost.
  - You are about to drop the column `profileCode` on the `AgencyProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AgencyProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Person` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[agencyCode]` on the table `Agency` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileNumber]` on the table `AgencyProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `agencyCode` to the `Agency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Agency` table without a default value. This is not possible if the table is not empty.
  - Made the column `city` on table `Agency` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Agency` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `profileNumber` to the `AgencyProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileType` to the `AgencyProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `AgencyUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Agency_code_key";

-- DropIndex
DROP INDEX "AgencyProfile_profileCode_key";

-- AlterTable
ALTER TABLE "Agency" DROP COLUMN "code",
ADD COLUMN     "agencyCode" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- AlterTable
ALTER TABLE "AgencyProfile" DROP COLUMN "profileCode",
DROP COLUMN "updatedAt",
ADD COLUMN     "assignedUserId" TEXT,
ADD COLUMN     "completionPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingExpiry" TIMESTAMP(3),
ADD COLUMN     "onboardingLink" TEXT,
ADD COLUMN     "profileNumber" TEXT NOT NULL,
ADD COLUMN     "profileType" TEXT NOT NULL,
ADD COLUMN     "trustScore" DECIMAL(5,2),
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "AgencyUser" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "mobile" TEXT;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "updatedAt",
ADD COLUMN     "dob" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProfilePersonal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "religion" TEXT,
    "caste" TEXT,
    "subCaste" TEXT,
    "motherTongue" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "maritalStatus" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,

    CONSTRAINT "ProfilePersonal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_agencyCode_key" ON "Agency"("agencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProfile_profileNumber_key" ON "AgencyProfile"("profileNumber");

-- AddForeignKey
ALTER TABLE "ProfilePersonal" ADD CONSTRAINT "ProfilePersonal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

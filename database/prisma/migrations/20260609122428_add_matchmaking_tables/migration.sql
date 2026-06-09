/*
  Warnings:

  - The `status` column on the `Agency` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `AgencyProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `AgencyUser` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `approvalStatus` column on the `ProfileDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `approvalStatus` column on the `ProfilePhoto` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `AgencyUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `mobile` on table `AgencyUser` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `documentType` on the `ProfileDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'EXECUTIVE', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_PROOF', 'BIODATA', 'EDUCATION', 'INCOME', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Agency" DROP COLUMN "status",
ADD COLUMN     "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "AgencyProfile" DROP COLUMN "status",
ADD COLUMN     "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "AgencyUser" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "mobile" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProfileDocument" DROP COLUMN "documentType",
ADD COLUMN     "documentType" "DocumentType" NOT NULL,
DROP COLUMN "approvalStatus",
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ProfilePhoto" DROP COLUMN "approvalStatus",
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "senderAgencyId" TEXT NOT NULL,
    "receiverAgencyId" TEXT NOT NULL,
    "brideProfileId" TEXT NOT NULL,
    "groomProfileId" TEXT NOT NULL,
    "proposalStatus" TEXT NOT NULL,
    "proposalNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalActivity" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityNotes" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "stageDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_proposalNumber_key" ON "Proposal"("proposalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_proposalId_key" ON "Pipeline"("proposalId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_senderAgencyId_fkey" FOREIGN KEY ("senderAgencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_receiverAgencyId_fkey" FOREIGN KEY ("receiverAgencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_brideProfileId_fkey" FOREIGN KEY ("brideProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_groomProfileId_fkey" FOREIGN KEY ("groomProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalActivity" ADD CONSTRAINT "ProposalActivity_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

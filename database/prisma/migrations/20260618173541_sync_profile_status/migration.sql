/*
  Warnings:

  - The values [MANAGER,EXECUTIVE,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `remarks` on the `FollowUp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[onboardingToken]` on the table `AgencyProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `FollowUp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProfileStatus" ADD VALUE 'AGENCY_COMPLETED';
ALTER TYPE "ProfileStatus" ADD VALUE 'ONBOARDING_SENT';
ALTER TYPE "ProfileStatus" ADD VALUE 'CLIENT_APPROVED';
ALTER TYPE "ProfileStatus" ADD VALUE 'AGENCY_APPROVED';
ALTER TYPE "ProfileStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "ProfileStatus" ADD VALUE 'CORRECTION_REQUESTED';
ALTER TYPE "ProfileStatus" ADD VALUE 'CLIENT_UPDATED';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('OWNER', 'PROFILE_MANAGER', 'MATCHING_MANAGER', 'RELATIONSHIP_MANAGER');
ALTER TABLE "AgencyUser" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "FollowUp" DROP CONSTRAINT "FollowUp_proposalId_fkey";

-- AlterTable
ALTER TABLE "AgencyProfile" ADD COLUMN     "agencyApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agencyApprovedAt" TIMESTAMP(3),
ADD COLUMN     "clientApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clientApprovedAt" TIMESTAMP(3),
ADD COLUMN     "clientRejectedReason" TEXT,
ADD COLUMN     "onboardingToken" TEXT;

-- AlterTable
ALTER TABLE "FollowUp" DROP COLUMN "remarks",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "profileId" TEXT NOT NULL,
ALTER COLUMN "proposalId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ProfileAccessLog" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'VIEW_PROFILE';

-- AlterTable
ALTER TABLE "ProfilePreference" ADD COLUMN     "childrenPreference" TEXT,
ADD COLUMN     "childrenPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "drinkingPreference" BOOLEAN,
ADD COLUMN     "drinkingPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "familySetupPreference" TEXT,
ADD COLUMN     "familySetupPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "relocationPreference" TEXT,
ADD COLUMN     "relocationPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "smokingPreference" BOOLEAN,
ADD COLUMN     "smokingPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER';

-- CreateTable
CREATE TABLE "CompatibilityResult" (
    "id" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "compatibilityScore" INTEGER NOT NULL,
    "filterScore" INTEGER NOT NULL,
    "questionnaireScore" INTEGER NOT NULL,
    "lifestyleScore" INTEGER NOT NULL,
    "educationCareerScore" INTEGER,
    "strengths" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "aiExplanation" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 100,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompatibilityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrait" (
    "profileId" TEXT NOT NULL,
    "communicationScore" INTEGER,
    "familyScore" INTEGER,
    "careerScore" INTEGER,
    "financialScore" INTEGER,
    "lifestyleScore" INTEGER,
    "emotionalScore" INTEGER,
    "traditionalScore" INTEGER,
    "parentingScore" INTEGER,
    "independenceScore" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrait_pkey" PRIMARY KEY ("profileId")
);

-- CreateIndex
CREATE INDEX "CompatibilityResult_compatibilityScore_idx" ON "CompatibilityResult"("compatibilityScore");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityResult_sourceProfileId_targetProfileId_key" ON "CompatibilityResult"("sourceProfileId", "targetProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProfile_onboardingToken_key" ON "AgencyProfile"("onboardingToken");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityResult" ADD CONSTRAINT "CompatibilityResult_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityResult" ADD CONSTRAINT "CompatibilityResult_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrait" ADD CONSTRAINT "UserTrait_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('PERSONALITY', 'RELATIONSHIP', 'LIFESTYLE', 'FAMILY_VALUES', 'FUN');

-- CreateEnum
CREATE TYPE "AnswerImportance" AS ENUM ('MUST_HAVE', 'NICE_TO_HAVE', 'DOESNT_MATTER');

-- CreateEnum
CREATE TYPE "PreferencePriority" AS ENUM ('MUST_HAVE', 'IMPORTANT', 'PREFERRED', 'DOESNT_MATTER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "AgencyProfile" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "ProfilePreference" ADD COLUMN     "agePriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "castePriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "cityPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "educationPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "heightPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "professionPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER',
ADD COLUMN     "religionPriority" "PreferencePriority" NOT NULL DEFAULT 'DOESNT_MATTER';

-- CreateTable
CREATE TABLE "AICompatibility" (
    "id" TEXT NOT NULL,
    "brideProfileId" TEXT NOT NULL,
    "groomProfileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineHistory" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "oldStage" TEXT NOT NULL,
    "newStage" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PipelineHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAnswer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "importance" "AnswerImportance" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'LEAD',
    "leadSource" TEXT,
    "assignedUserId" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AICompatibility_score_idx" ON "AICompatibility"("score");

-- CreateIndex
CREATE UNIQUE INDEX "AICompatibility_brideProfileId_groomProfileId_key" ON "AICompatibility"("brideProfileId", "groomProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAnswer_profileId_questionId_key" ON "ProfileAnswer"("profileId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientCode_key" ON "Client"("clientCode");

-- AddForeignKey
ALTER TABLE "AgencyProfile" ADD CONSTRAINT "AgencyProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICompatibility" ADD CONSTRAINT "AICompatibility_brideProfileId_fkey" FOREIGN KEY ("brideProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICompatibility" ADD CONSTRAINT "AICompatibility_groomProfileId_fkey" FOREIGN KEY ("groomProfileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnswer" ADD CONSTRAINT "ProfileAnswer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnswer" ADD CONSTRAINT "ProfileAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnswer" ADD CONSTRAINT "ProfileAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "AgencyUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

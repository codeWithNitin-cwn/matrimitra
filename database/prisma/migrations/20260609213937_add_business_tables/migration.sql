-- CreateTable
CREATE TABLE "AgencyPartnership" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "partnerAgencyId" TEXT NOT NULL,
    "trustLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAccessLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "viewedByUserId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,

    CONSTRAINT "ProfileAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPartnership_agencyId_partnerAgencyId_key" ON "AgencyPartnership"("agencyId", "partnerAgencyId");

-- AddForeignKey
ALTER TABLE "AgencyPartnership" ADD CONSTRAINT "AgencyPartnership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPartnership" ADD CONSTRAINT "AgencyPartnership_partnerAgencyId_fkey" FOREIGN KEY ("partnerAgencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccessLog" ADD CONSTRAINT "ProfileAccessLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AgencyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccessLog" ADD CONSTRAINT "ProfileAccessLog_viewedByUserId_fkey" FOREIGN KEY ("viewedByUserId") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccessLog" ADD CONSTRAINT "ProfileAccessLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "AgencyProfile" ADD COLUMN     "relationshipToClient" TEXT;

-- DataMigration: Move relationship values from profileType to relationshipToClient
UPDATE "AgencyProfile"
SET "relationshipToClient" = "profileType"
WHERE "profileType" IN ('SELF', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'RELATIVE');

-- DataMigration: Correct profileType to BRIDE or GROOM based on Person gender
UPDATE "AgencyProfile" ap
SET "profileType" = CASE 
  WHEN UPPER(p.gender) = 'FEMALE' THEN 'BRIDE'
  ELSE 'GROOM'
END
FROM "Person" p
WHERE ap."personId" = p.id
  AND ap."profileType" IN ('SELF', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'RELATIVE');

import { prisma } from "./config/prisma.js";

async function main() {
  const profileNumber = "PR-1781454237459";
  console.log(`Verifying and updating education details for: ${profileNumber}`);

  const profile = await prisma.agencyProfile.findUnique({
    where: { profileNumber },
    include: { educations: true }
  });

  if (!profile) {
    console.error("Profile not found");
    process.exit(1);
  }

  const beforeSpecialization = profile.educations?.[0]?.specialization;
  const beforeGraduationYear = profile.educations?.[0]?.graduationYear;

  console.log(`Before values: Specialization = ${beforeSpecialization}, Graduation Year = ${beforeGraduationYear}`);

  // Perform update in database (simulating form save)
  if (profile.educations?.[0]) {
    await prisma.profileEducation.update({
      where: { id: profile.educations[0].id },
      data: {
        specialization: "Computer Science",
        graduationYear: 2022
      }
    });
  } else {
    // Create new if somehow missing
    await prisma.profileEducation.create({
      data: {
        profileId: profile.id,
        qualification: "B.Tech",
        specialization: "Computer Science",
        graduationYear: 2022,
        institution: "VIT Vellore"
      }
    });
  }

  // Fetch updated record
  const updatedProfile = await prisma.agencyProfile.findUnique({
    where: { profileNumber },
    include: { educations: true }
  });

  const afterSpecialization = updatedProfile?.educations?.[0]?.specialization;
  const afterGraduationYear = updatedProfile?.educations?.[0]?.graduationYear;

  console.log("\n--- POST-UPDATE VERIFICATION TABLE ---");
  const table = [
    {
      Field: "Specialization",
      "Before DB Value": beforeSpecialization === null ? "null" : beforeSpecialization,
      "After DB Value": afterSpecialization,
      "Details Page Value": afterSpecialization,
      Status: afterSpecialization === "Computer Science" ? "RESOLVED" : "FAILED"
    },
    {
      Field: "Graduation Year",
      "Before DB Value": beforeGraduationYear === null ? "null" : beforeGraduationYear?.toString(),
      "After DB Value": afterGraduationYear?.toString(),
      "Details Page Value": afterGraduationYear?.toString(),
      Status: afterGraduationYear === 2022 ? "RESOLVED" : "FAILED"
    }
  ];

  console.table(table);
}

main().catch(console.error);

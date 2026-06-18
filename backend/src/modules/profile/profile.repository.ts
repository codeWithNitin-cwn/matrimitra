import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

function parseHeightToCm(heightStr: string | undefined): number | undefined {
  if (!heightStr) return undefined;
  heightStr = heightStr.trim().toLowerCase();

  // 1. Metric centimeter values (e.g. "165 cm", "165cm", "165")
  if (/^\d+\s*(cm)?$/.test(heightStr)) {
    return parseInt(heightStr.replace('cm', ''), 10);
  }

  // 2. Foot/Inch text representation (e.g. "5 ft 5 in", "5 feet 5 inches")
  const ftTextRegex = /(\d+)\s*(ft|feet|foot)\s*(\d*)\s*(in|inch|inches)?/;
  const textMatch = heightStr.match(ftTextRegex);
  if (textMatch) {
    const feet = parseInt(textMatch[1], 10);
    const inches = textMatch[3] ? parseInt(textMatch[3], 10) : 0;
    return Math.round(((feet * 12) + inches) * 2.54);
  }

  // 3. Single/Double quote representation (e.g. "5'5"", "5’5”", "5' 5")
  const ftInRegex = /(\d+)\s*['’′`‘]\s*(\d*)\s*["”″“]?/;
  const match = heightStr.match(ftInRegex);
  if (match) {
    const feet = parseInt(match[1], 10);
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    return Math.round(((feet * 12) + inches) * 2.54);
  }

  const val = parseInt(heightStr, 10);
  return isNaN(val) ? undefined : val;
}

function parseHeightRange(rangeStr: string | undefined): { minHeight?: number; maxHeight?: number } {
  if (!rangeStr) return {};
  const parts = rangeStr.split('-');
  if (parts.length === 2) {
    const min = parseHeightToCm(parts[0]);
    const max = parseHeightToCm(parts[1]);
    return { minHeight: min, maxHeight: max };
  }
  return {};
}


export class ProfileRepository {
  async createDraftTransaction(agencyId: string, assignedUserId: string | undefined, profileNumber: string, profileType: string, data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Split name to satisfy Person constraints
      const nameParts = data.name ? data.name.trim().split(' ') : ['Draft'];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      // 2. Safely parse numeric fields
      const heightCm = parseHeightToCm(data.height);
      const weightKg = data.weightKg ? parseInt(data.weightKg, 10) : undefined;
      const salary = data.salary ? parseFloat(data.salary) : undefined;
      const minAge = data.ageRange ? parseInt(data.ageRange.split('-')[0], 10) : undefined;
      const maxAge = data.ageRange ? parseInt(data.ageRange.split('-')[1], 10) : undefined;
      const { minHeight, maxHeight } = parseHeightRange(data.heightRange);

      // Convert manual age input into an approximate DOB if exact DOB is missing
      let resolvedDob = data.dob ? new Date(data.dob) : null;
      if (!resolvedDob && data.age) {
        const approxYear = new Date().getFullYear() - parseInt(data.age, 10);
        resolvedDob = new Date(`${approxYear}-01-01`);
      }

      // 3. Create Person
      const person = await tx.person.create({
        data: {
          firstName,
          lastName,
          gender: data.gender || 'UNKNOWN',
          dob: resolvedDob,
          mobile: data.mobile || null,
          email: data.email || null,
        }
      });

      // 4. Build strictly typed nested writes
      const personalCreate = (data.religion || data.caste || data.subCaste || data.motherTongue || data.maritalStatus || data.city || data.state || data.country || !isNaN(heightCm as number) || !isNaN(weightKg as number)) ? {
        create: {
          religion: data.religion,
          caste: data.caste,
          subCaste: data.subCaste,
          motherTongue: data.motherTongue,
          maritalStatus: data.maritalStatus,
          city: data.city,
          state: data.state,
          country: data.country,
          heightCm: !isNaN(heightCm as number) ? heightCm : undefined,
          weightKg: !isNaN(weightKg as number) ? weightKg : undefined,
        }
      } : undefined;

      const educationsCreate = (data.degree || data.college || data.specialization || data.graduationYear) ? {
        create: [{
          qualification: data.degree || 'Draft', // required field
          institution: data.college,
          specialization: data.specialization,
          graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
        }]
      } : undefined;

      const careersCreate = (data.occupation || data.company || data.salary || data.designation || data.workLocation) ? {
        create: [{
          profession: data.occupation,
          employer: data.company,
          designation: data.designation,
          annualIncome: !isNaN(salary as number) ? salary : undefined,
          workLocation: data.workLocation,
        }]
      } : undefined;

      const familiesCreate = (data.father || data.mother || data.siblings || data.fatherOccupation || data.motherOccupation || data.familyType || data.familyValues || data.siblingsCount) ? {
        create: [{
          fatherName: data.father,
          motherName: data.mother,
          fatherOccupation: data.fatherOccupation,
          motherOccupation: data.motherOccupation,
          // Bug #8 fix: store familyType as clean enum value; sibling remarks go into familyValues
          familyType: data.familyType || undefined,
          familyValues: data.siblings || data.familyValues || undefined,
          siblingsCount: data.siblingsCount ? parseInt(data.siblingsCount, 10) : undefined,
        }]
      } : undefined;

      const preferencesCreate = (data.ageRange || data.educationPreference || data.religionPreference || data.castePreference || data.cityPreference || data.professionPreference || minHeight || maxHeight || data.smokingPreference !== undefined || data.drinkingPreference !== undefined || data.childrenPreference || data.familySetupPreference || data.relocationPreference) ? {
        create: [{
          minAge: !isNaN(minAge as number) ? minAge : undefined,
          maxAge: !isNaN(maxAge as number) ? maxAge : undefined,
          minHeight: minHeight,
          maxHeight: maxHeight,
          education: data.educationPreference,
          religion: data.religionPreference,
          caste: data.castePreference,
          city: data.cityPreference,
          profession: data.professionPreference,
          smokingPreference: data.smokingPreference === 'true' ? true : data.smokingPreference === 'false' ? false : undefined,
          drinkingPreference: data.drinkingPreference === 'true' ? true : data.drinkingPreference === 'false' ? false : undefined,
          childrenPreference: data.childrenPreference,
          familySetupPreference: data.familySetupPreference,
          relocationPreference: data.relocationPreference,
          agePriority: data.agePriority || 'DOESNT_MATTER',
          castePriority: data.castePriority || 'DOESNT_MATTER',
          religionPriority: data.religionPriority || 'DOESNT_MATTER',
          heightPriority: data.heightPriority || 'DOESNT_MATTER',
          cityPriority: data.cityPriority || 'DOESNT_MATTER',
          educationPriority: data.educationPriority || 'DOESNT_MATTER',
          professionPriority: data.professionPriority || 'DOESNT_MATTER',
          smokingPriority: data.smokingPriority || 'DOESNT_MATTER',
          drinkingPriority: data.drinkingPriority || 'DOESNT_MATTER',
          childrenPriority: data.childrenPriority || 'DOESNT_MATTER',
          familySetupPriority: data.familySetupPriority || 'DOESNT_MATTER',
          relocationPriority: data.relocationPriority || 'DOESNT_MATTER',
        }]
      } : undefined;

      const lifestylesCreate = (data.foodHabit || data.fitnessLevel || data.hobbies || data.smoking || data.drinking) ? {
        create: [{
          foodHabit: data.foodHabit || null,
          fitnessLevel: data.fitnessLevel || null,
          hobbies: data.hobbies || null,
          smoking: data.smoking === 'true' || data.smoking === true,
          drinking: data.drinking === 'true' || data.drinking === true,
        }]
      } : undefined;

      const answersCreate: any[] = [];
      if (data.questionAnswers && typeof data.questionAnswers === 'object') {
        for (const [questionId, ans] of Object.entries(data.questionAnswers) as [string, any][]) {
          let optionId = ans?.optionId;
          if (ans?.textAnswer) {
            const existingOption = await tx.questionOption.findFirst({
              where: { questionId, optionText: ans.textAnswer }
            });
            if (existingOption) {
              optionId = existingOption.id;
            } else {
              const newOption = await tx.questionOption.create({
                data: { questionId, optionText: ans.textAnswer }
              });
              optionId = newOption.id;
            }
          }
          if (optionId) {
            answersCreate.push({
              questionId,
              selectedOptionId: optionId,
              // Default to DOESNT_MATTER, not MUST_HAVE — prevents unanswered
              // importance from triggering deal-breaker rejection in the match engine
              importance: ans.importance || 'DOESNT_MATTER',
            });
          }
        }
      }

      // 5. Create base Profile and sub-records simultaneously
      const createdProfile = await tx.agencyProfile.create({
        data: {
          agencyId,
          personId: person.id,
          assignedUserId: assignedUserId || null,
          clientId: data.clientId || null,
          profileNumber,
          profileType,
          relationshipToClient: data.relationshipToClient || (data.relationship ? data.relationship.toUpperCase() : null),
          status: 'DRAFT',
          ...(personalCreate && { personal: personalCreate }),
          ...(educationsCreate && { educations: educationsCreate }),
          ...(careersCreate && { careers: careersCreate }),
          ...(familiesCreate && { families: familiesCreate }),
          ...(preferencesCreate && { preferences: preferencesCreate }),
          ...(lifestylesCreate && { lifestyles: lifestylesCreate }),
          ...(answersCreate.length > 0 && {
            answers: {
              create: answersCreate
            }
          }),
        },
        include: {
          person: true,
          personal: true,
          educations: true,
          careers: true,
          families: true,
          preferences: true,
          lifestyles: true,
          answers: true,
        }
      });

      // Persist mock photo/doc details if present during create
      if (data.photoPrimary) {
        await tx.profilePhoto.create({
          data: {
            profileId: createdProfile.id,
            cloudinaryUrl: data.photoPrimary,
            isPrimary: true,
            approvalStatus: 'APPROVED',
          }
        });
      }

      if (data.documentsUploaded && Array.isArray(data.documentsUploaded)) {
        for (const docType of data.documentsUploaded) {
          await tx.profileDocument.create({
            data: {
              profileId: createdProfile.id,
              fileUrl: `mock_document_${docType.toLowerCase()}.pdf`,
              documentType: docType,
              approvalStatus: 'APPROVED',
            }
          });
        }
      }

      return createdProfile;
    });
  }
  
  async updateDraftTransaction(profileId: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const existingProfile = await tx.agencyProfile.findUnique({
        where: { id: profileId },
        include: { person: true }
      });
      
      if (!existingProfile) {
        throw new Error("Profile not found");
      }

      // 1. Split name to satisfy Person constraints
      const nameParts = data.name ? data.name.trim().split(' ') : ['Draft'];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      // 2. Safely parse numeric fields
      const heightCm = parseHeightToCm(data.height);
      const weightKg = data.weightKg ? parseInt(data.weightKg, 10) : undefined;
      const salary = data.salary ? parseFloat(data.salary) : undefined;
      const minAge = data.ageRange ? parseInt(data.ageRange.split('-')[0], 10) : undefined;
      const maxAge = data.ageRange ? parseInt(data.ageRange.split('-')[1], 10) : undefined;
      const { minHeight, maxHeight } = parseHeightRange(data.heightRange);

      // Convert manual age input into an approximate DOB if exact DOB is missing
      let resolvedDob = data.dob ? new Date(data.dob) : null;
      if (!resolvedDob && data.age) {
        const approxYear = new Date().getFullYear() - parseInt(data.age, 10);
        resolvedDob = new Date(`${approxYear}-01-01`);
      }

      // 3. Update Person
      await tx.person.update({
        where: { id: existingProfile.personId },
        data: {
          firstName,
          lastName,
          gender: data.gender || 'UNKNOWN',
          dob: resolvedDob,
          mobile: data.mobile || null,
          email: data.email || null,
        }
      });

      // 4. Build strictly typed nested writes for upserts and replacements
      const personalData = {
        religion: data.religion,
        caste: data.caste,
        subCaste: data.subCaste,
        motherTongue: data.motherTongue,
        maritalStatus: data.maritalStatus,
        city: data.city,
        state: data.state,
        country: data.country,
        heightCm: !isNaN(heightCm as number) ? heightCm : undefined,
        weightKg: !isNaN(weightKg as number) ? weightKg : undefined,
      };

      const personalUpdate = (data.religion || data.caste || data.subCaste || data.motherTongue || data.maritalStatus || data.city || data.state || data.country || !isNaN(heightCm as number) || !isNaN(weightKg as number)) ? {
        upsert: {
          create: personalData,
          update: personalData
        }
      } : undefined;

      // Each sub-record update is only built when the payload contains relevant fields.
      // If no new data is present, the block is undefined and excluded from the Prisma
      // update entirely — preventing unconditional deleteMany from wiping existing records.

      const hasEducationData = !!(data.degree || data.college || data.specialization || data.graduationYear);
      const educationsUpdate = hasEducationData ? {
        deleteMany: {},
        create: [{
          qualification: data.degree || 'Draft',
          institution: data.college,
          specialization: data.specialization,
          graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
        }]
      } : undefined;

      const hasCareerData = !!(data.occupation || data.company || data.salary || data.designation || data.workLocation);
      const careersUpdate = hasCareerData ? {
        deleteMany: {},
        create: [{
          profession: data.occupation,
          employer: data.company,
          designation: data.designation,
          annualIncome: !isNaN(salary as number) ? salary : undefined,
          workLocation: data.workLocation,
        }]
      } : undefined;

      const hasFamilyData = !!(data.father || data.mother || data.siblings || data.fatherOccupation || data.motherOccupation || data.familyType || data.familyValues || data.siblingsCount);
      const familiesUpdate = hasFamilyData ? {
        deleteMany: {},
        create: [{
          fatherName: data.father,
          motherName: data.mother,
          fatherOccupation: data.fatherOccupation,
          motherOccupation: data.motherOccupation,
          // Bug #8 fix: store familyType as clean enum value; sibling remarks go into familyValues
          familyType: data.familyType || undefined,
          familyValues: data.siblings || data.familyValues || undefined,
          siblingsCount: data.siblingsCount ? parseInt(data.siblingsCount, 10) : undefined,
        }]
      } : undefined;

      const hasPreferenceData = !!(data.ageRange || data.educationPreference || data.religionPreference || data.castePreference || data.cityPreference || data.professionPreference || minHeight || maxHeight || data.smokingPreference !== undefined || data.drinkingPreference !== undefined || data.childrenPreference || data.familySetupPreference || data.relocationPreference);
      const preferencesUpdate = hasPreferenceData ? {
        deleteMany: {},
        create: [{
          minAge: !isNaN(minAge as number) ? minAge : undefined,
          maxAge: !isNaN(maxAge as number) ? maxAge : undefined,
          minHeight: minHeight,
          maxHeight: maxHeight,
          education: data.educationPreference,
          religion: data.religionPreference,
          caste: data.castePreference,
          city: data.cityPreference,
          profession: data.professionPreference,
          smokingPreference: data.smokingPreference === 'true' ? true : data.smokingPreference === 'false' ? false : undefined,
          drinkingPreference: data.drinkingPreference === 'true' ? true : data.drinkingPreference === 'false' ? false : undefined,
          childrenPreference: data.childrenPreference,
          familySetupPreference: data.familySetupPreference,
          relocationPreference: data.relocationPreference,
          agePriority: data.agePriority || 'DOESNT_MATTER',
          castePriority: data.castePriority || 'DOESNT_MATTER',
          religionPriority: data.religionPriority || 'DOESNT_MATTER',
          heightPriority: data.heightPriority || 'DOESNT_MATTER',
          cityPriority: data.cityPriority || 'DOESNT_MATTER',
          educationPriority: data.educationPriority || 'DOESNT_MATTER',
          professionPriority: data.professionPriority || 'DOESNT_MATTER',
          smokingPriority: data.smokingPriority || 'DOESNT_MATTER',
          drinkingPriority: data.drinkingPriority || 'DOESNT_MATTER',
          childrenPriority: data.childrenPriority || 'DOESNT_MATTER',
          familySetupPriority: data.familySetupPriority || 'DOESNT_MATTER',
          relocationPriority: data.relocationPriority || 'DOESNT_MATTER',
        }]
      } : undefined;

      const hasLifestyleData = !!(data.foodHabit || data.fitnessLevel || data.hobbies || data.smoking || data.drinking);
      const lifestylesUpdate = hasLifestyleData ? {
        deleteMany: {},
        create: [{
          foodHabit: data.foodHabit || null,
          fitnessLevel: data.fitnessLevel || null,
          hobbies: data.hobbies || null,
          smoking: data.smoking === 'true' || data.smoking === true,
          drinking: data.drinking === 'true' || data.drinking === true,
        }]
      } : undefined;

      // 5. Update base Profile. Sub-record blocks are only included if new data was provided.
      // Undefined blocks are omitted via conditional spreading — existing records are preserved.
      const updatedProfile = await tx.agencyProfile.update({
        where: { id: profileId },
        data: {
          ...(data.profileType && { profileType: data.profileType }),
          ...(data.clientId && { clientId: data.clientId }),
          ...(data.hasOwnProperty('relationshipToClient') && { relationshipToClient: data.relationshipToClient }),
          ...(personalUpdate && { personal: personalUpdate }),
          ...(educationsUpdate && { educations: educationsUpdate }),
          ...(careersUpdate && { careers: careersUpdate }),
          ...(familiesUpdate && { families: familiesUpdate }),
          ...(preferencesUpdate && { preferences: preferencesUpdate }),
          ...(lifestylesUpdate && { lifestyles: lifestylesUpdate }),
        },
        include: {
          person: true,
          personal: true,
          educations: true,
          careers: true,
          families: true,
          preferences: true,
          lifestyles: true,
          answers: true,
        }
      });

      // Upsert Questionnaire answers
      if (data.questionAnswers && typeof data.questionAnswers === 'object') {
        for (const [questionId, ans] of Object.entries(data.questionAnswers) as [string, any][]) {
          let optionId = ans?.optionId;
          if (ans?.textAnswer) {
            const existingOption = await tx.questionOption.findFirst({
              where: { questionId, optionText: ans.textAnswer }
            });
            if (existingOption) {
              optionId = existingOption.id;
            } else {
              const newOption = await tx.questionOption.create({
                data: { questionId, optionText: ans.textAnswer }
              });
              optionId = newOption.id;
            }
          }
          if (optionId) {
            await tx.profileAnswer.upsert({
              where: {
                profileId_questionId: {
                  profileId,
                  questionId,
                }
              },
              update: {
                selectedOptionId: optionId,
                // Default to DOESNT_MATTER, not MUST_HAVE
                importance: ans.importance || 'DOESNT_MATTER',
              },
              create: {
                profileId,
                questionId,
                selectedOptionId: optionId,
                importance: ans.importance || 'DOESNT_MATTER',
              }
            });
          }
        }
      }

      // Upsert Photo Primary
      if (data.photoPrimary) {
        const existingPrimary = await tx.profilePhoto.findFirst({
          where: { profileId, isPrimary: true }
        });
        if (existingPrimary) {
          await tx.profilePhoto.update({
            where: { id: existingPrimary.id },
            data: { cloudinaryUrl: data.photoPrimary }
          });
        } else {
          await tx.profilePhoto.create({
            data: {
              profileId,
              cloudinaryUrl: data.photoPrimary,
              isPrimary: true,
              approvalStatus: 'APPROVED',
            }
          });
        }
      }

      // Upsert Documents
      if (data.documentsUploaded && Array.isArray(data.documentsUploaded)) {
        for (const docType of data.documentsUploaded) {
          const existingDoc = await tx.profileDocument.findFirst({
            where: { profileId, documentType: docType }
          });
          if (!existingDoc) {
            await tx.profileDocument.create({
              data: {
                profileId,
                fileUrl: `mock_document_${docType.toLowerCase()}.pdf`,
                documentType: docType,
                approvalStatus: 'APPROVED',
              }
            });
          }
        }
      }

      return updatedProfile;
    });
  }

  async findByProfileNumber(profileNumber: string) {
    return prisma.agencyProfile.findUnique({ where: { profileNumber } });
  }

  async findAgencyById(id: string) {
    return prisma.agency.findUnique({ where: { id } });
  }

  async findPersonById(id: string) {
    return prisma.person.findUnique({ where: { id } });
  }

  async findAgencyUserById(id: string) {
    return prisma.agencyUser.findUnique({ where: { id } });
  }

  async create(data: Prisma.AgencyProfileUncheckedCreateInput) {
    return prisma.agencyProfile.create({ data });
  }

  async findProfileById(id: string) {
    return prisma.agencyProfile.findUnique({ where: { id } });
  }

  async findFullProfileById(id: string) {
    return prisma.agencyProfile.findUnique({
      where: { id },
      include: {
        person: true,
        personal: true,
        educations: true,
        careers: true,
        families: true,
        lifestyles: true,
        preferences: true,
        photos: true,
        documents: true,
        answers: {
          include: {
            question: true,
            selectedOption: true
          }
        },
        profileAccessLogs: {
          include: {
            agency: true,
            viewedByUser: true
          },
          orderBy: { viewedAt: 'desc' }
        }
      },
    });
  }

  async findAllProfiles(agencyId?: string) {
    return prisma.agencyProfile.findMany({
      where: agencyId ? { agencyId } : undefined,
      include: {
        person: true,
        personal: true,
        _count: {
          select: {
            compatibilitiesSent: true
          }
        }
      },
    });
  }

  async findProfilePersonalByProfileId(profileId: string) {
    return prisma.profilePersonal.findUnique({ where: { profileId } });
  }

  async createProfilePersonal(data: Prisma.ProfilePersonalUncheckedCreateInput) {
    return prisma.profilePersonal.create({ data });
  }

  async createProfileEducation(data: Prisma.ProfileEducationUncheckedCreateInput) {
    return prisma.profileEducation.create({ data });
  }

  async createProfileCareer(data: Prisma.ProfileCareerUncheckedCreateInput) {
    return prisma.profileCareer.create({ data });
  }

  async createProfileFamily(data: Prisma.ProfileFamilyUncheckedCreateInput) {
    return prisma.profileFamily.create({ data });
  }

  async createProfileLifestyle(data: Prisma.ProfileLifestyleUncheckedCreateInput) {
    return prisma.profileLifestyle.create({ data });
  }

  async createProfilePreference(data: Prisma.ProfilePreferenceUncheckedCreateInput) {
    return prisma.profilePreference.create({ data });
  }

  async findProfileAnswers(profileId: string) {
    return prisma.profileAnswer.findMany({
      where: { profileId },
      include: {
        question: true,
        selectedOption: true
      }
    });
  }

  async findQuestionOptionById(id: string) {
    return prisma.questionOption.findUnique({ where: { id } });
  }

  async upsertProfileAnswer(profileId: string, data: Prisma.ProfileAnswerUncheckedCreateInput) {
    return prisma.profileAnswer.upsert({
      where: {
        profileId_questionId: { profileId, questionId: data.questionId }
      },
      update: { selectedOptionId: data.selectedOptionId, importance: data.importance },
      create: data
    });
  }

  async hasAcceptedProposal(profileId: string, agencyId: string): Promise<boolean> {
    const proposal = await prisma.proposal.findFirst({
      where: {
        proposalStatus: "ACCEPTED",
        OR: [
          { brideProfileId: profileId },
          { groomProfileId: profileId }
        ],
        AND: {
          OR: [
            { senderAgencyId: agencyId },
            { receiverAgencyId: agencyId }
          ]
        }
      }
    });
    return !!proposal;
  }

  async updateStatus(id: string, status: any) {
    return prisma.agencyProfile.update({
      where: { id },
      data: { status },
      include: {
        person: true,
        personal: true,
      }
    });
  }
}
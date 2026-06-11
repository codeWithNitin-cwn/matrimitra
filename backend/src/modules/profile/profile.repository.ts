import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class ProfileRepository {
  async createDraftTransaction(agencyId: string, assignedUserId: string | undefined, profileNumber: string, profileType: string, data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Split name to satisfy Person constraints
      const nameParts = data.name ? data.name.trim().split(' ') : ['Draft'];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      // 2. Safely parse numeric fields
      const heightCm = data.height ? parseInt(data.height, 10) : undefined;
      const salary = data.salary ? parseFloat(data.salary) : undefined;
      const minAge = data.ageRange ? parseInt(data.ageRange.split('-')[0], 10) : undefined;
      const maxAge = data.ageRange ? parseInt(data.ageRange.split('-')[1], 10) : undefined;

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
      const personalCreate = (data.religion || data.caste || data.motherTongue || data.maritalStatus || data.city || !isNaN(heightCm as number)) ? {
        create: {
          religion: data.religion,
          caste: data.caste,
          motherTongue: data.motherTongue,
          maritalStatus: data.maritalStatus,
          city: data.city,
          heightCm: !isNaN(heightCm as number) ? heightCm : undefined,
        }
      } : undefined;

      const educationsCreate = (data.degree || data.college) ? {
        create: [{
          qualification: data.degree || 'Draft', // required field
          institution: data.college,
        }]
      } : undefined;

      const careersCreate = (data.occupation || data.company || data.salary) ? {
        create: [{
          profession: data.occupation,
          employer: data.company,
          annualIncome: !isNaN(salary as number) ? salary : undefined,
        }]
      } : undefined;

      const familiesCreate = (data.father || data.mother || data.siblings) ? {
        create: [{
          fatherName: data.father,
          motherName: data.mother,
          familyType: data.siblings, // Using string field to store textarea draft
        }]
      } : undefined;

      const preferencesCreate = (data.ageRange || data.educationPreference) ? {
        create: [{
          minAge: !isNaN(minAge as number) ? minAge : undefined,
          maxAge: !isNaN(maxAge as number) ? maxAge : undefined,
          education: data.educationPreference,
        }]
      } : undefined;

      // 5. Create base Profile and sub-records simultaneously
      return tx.agencyProfile.create({
        data: {
          agencyId,
          personId: person.id,
          assignedUserId: assignedUserId || null,
          profileNumber,
          profileType,
          status: 'DRAFT',
          ...(personalCreate && { personal: personalCreate }),
          ...(educationsCreate && { educations: educationsCreate }),
          ...(careersCreate && { careers: careersCreate }),
          ...(familiesCreate && { families: familiesCreate }),
          ...(preferencesCreate && { preferences: preferencesCreate }),
        },
        include: {
          person: true,
          personal: true,
          educations: true,
          careers: true,
          families: true,
          preferences: true,
        }
      });
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
      const heightCm = data.height ? parseInt(data.height, 10) : undefined;
      const salary = data.salary ? parseFloat(data.salary) : undefined;
      const minAge = data.ageRange ? parseInt(data.ageRange.split('-')[0], 10) : undefined;
      const maxAge = data.ageRange ? parseInt(data.ageRange.split('-')[1], 10) : undefined;

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

      // 4. Build strictly typed nested writes
      // 4. Build strictly typed nested writes for upserts and replacements
      const personalData = {
        religion: data.religion,
        caste: data.caste,
        motherTongue: data.motherTongue,
        maritalStatus: data.maritalStatus,
        city: data.city,
        heightCm: !isNaN(heightCm as number) ? heightCm : undefined,
      };

      const personalUpdate = (data.religion || data.caste || data.motherTongue || data.maritalStatus || data.city || !isNaN(heightCm as number)) ? {
        upsert: {
          create: personalData,
          update: personalData
        }
      } : undefined;

      const educationsUpdate = {
        deleteMany: {},
        ...(data.degree || data.college ? {
          create: [{
            qualification: data.degree || 'Draft',
            institution: data.college,
          }]
        } : {})
      };

      const careersUpdate = {
        deleteMany: {},
        ...(data.occupation || data.company || data.salary ? {
          create: [{
            profession: data.occupation,
            employer: data.company,
            annualIncome: !isNaN(salary as number) ? salary : undefined,
          }]
        } : {})
      };

      const familiesUpdate = {
        deleteMany: {},
        ...(data.father || data.mother || data.siblings ? {
          create: [{
            fatherName: data.father,
            motherName: data.mother,
            familyType: data.siblings,
          }]
        } : {})
      };

      const preferencesUpdate = {
        deleteMany: {},
        ...(data.ageRange || data.educationPreference ? {
          create: [{
            minAge: !isNaN(minAge as number) ? minAge : undefined,
            maxAge: !isNaN(maxAge as number) ? maxAge : undefined,
            education: data.educationPreference,
          }]
        } : {})
      };

      // 5. Update base Profile and sub-records simultaneously
      // 5. Update base Profile and completely replace sub-records simultaneously
      return tx.agencyProfile.update({
        where: { id: profileId },
        data: {
          ...(personalUpdate && { personal: personalUpdate }),
          educations: educationsUpdate,
          careers: careersUpdate,
          families: familiesUpdate,
          preferences: preferencesUpdate,
        },
        include: {
          person: true,
          personal: true,
          educations: true,
          careers: true,
          families: true,
          preferences: true,
        }
      });
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
      },
    });
  }

  async findAllProfiles() {
  return prisma.agencyProfile.findMany({
    include: {
      person: true,
      personal: true,
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
}
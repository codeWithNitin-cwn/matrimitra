import { prisma } from "../../backend/src/config/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting seed database...");

  // 1. Clean up existing records in dependency order
  console.log("🗑 Cleaning up existing data...");
  await prisma.profileAnswer.deleteMany({});
  await prisma.profilePersonal.deleteMany({});
  await prisma.agencyProfile.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.clientNote.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.agencyUser.deleteMany({});
  await prisma.agency.deleteMany({});

  // 2. Create Agency
  console.log("🏢 Seeding Agency...");
  const agency = await prisma.agency.create({
    data: {
      name: "MatriMitra Premier Matrimonial",
      email: "info@matrimitra.com",
      mobile: "+919876543210",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      agencyCode: "MM-PREMIER-01",
      status: "ACTIVE",
    },
  });

  // 3. Create Agency Users
  console.log("👥 Seeding Agency Users...");
  const passwordHash = bcrypt.hashSync("MatriMitra@123", 10);

  const owner = await prisma.agencyUser.create({
    data: {
      agencyId: agency.id,
      username: "agency_owner",
      email: "owner@matrimitra.com",
      passwordHash,
      firstName: "Rajesh",
      lastName: "Kumar",
      mobile: "+919876543211",
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  const exec1 = await prisma.agencyUser.create({
    data: {
      agencyId: agency.id,
      username: "executive_priya",
      email: "priya@matrimitra.com",
      passwordHash,
      firstName: "Priya",
      lastName: "Sharma",
      mobile: "+919876543212",
      role: "EXECUTIVE",
      status: "ACTIVE",
    },
  });

  const exec2 = await prisma.agencyUser.create({
    data: {
      agencyId: agency.id,
      username: "executive_amit",
      email: "amit@matrimitra.com",
      passwordHash,
      firstName: "Amit",
      lastName: "Patel",
      mobile: "+919876543213",
      role: "EXECUTIVE",
      status: "ACTIVE",
    },
  });

  // 4. Create Clients
  console.log("💼 Seeding Clients...");
  const client1 = await prisma.client.create({
    data: {
      agencyId: agency.id,
      clientCode: "CL-20260614-001",
      firstName: "Harish",
      lastName: "Rao",
      email: "harish.rao@gmail.com",
      mobile: "+919876543214",
      address: "H.No. 12-4-56, Jubilee Hills, Hyderabad",
      status: "ACTIVE",
      leadSource: "REFERENCE",
      assignedUserId: exec1.id,
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
    },
  });

  const client2 = await prisma.client.create({
    data: {
      agencyId: agency.id,
      clientCode: "CL-20260614-002",
      firstName: "Sunitha",
      lastName: "Reddy",
      email: "sunitha.reddy@yahoo.com",
      mobile: "+919876543215",
      address: "Flat 402, Gachibowli, Hyderabad",
      status: "LEAD",
      leadSource: "WEBSITE",
      assignedUserId: exec2.id,
      nextFollowUpAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
    },
  });

  // 5. Create Persons and Profiles
  console.log("👤 Seeding Profiles...");
  
  // Person 1 (Son of Harish Rao)
  const person1 = await prisma.person.create({
    data: {
      firstName: "Karthik",
      lastName: "Rao",
      gender: "MALE",
      mobile: "+919876543216",
      email: "karthik.rao@gmail.com",
      dob: new Date("1996-05-15"),
    },
  });

  const profile1 = await prisma.agencyProfile.create({
    data: {
      agencyId: agency.id,
      personId: person1.id,
      clientId: client1.id,
      assignedUserId: exec1.id,
      profileNumber: "MM-M-0001",
      profileType: "SON",
      status: "APPROVED",
      completionPercent: 80,
    },
  });

  await prisma.profilePersonal.create({
    data: {
      profileId: profile1.id,
      religion: "Hindu",
      caste: "Reddy",
      motherTongue: "Telugu",
      heightCm: 178,
      weightKg: 74,
      maritalStatus: "Never Married",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
  });

  // Person 2 (Daughter of Sunitha Reddy)
  const person2 = await prisma.person.create({
    data: {
      firstName: "Anjali",
      lastName: "Reddy",
      gender: "FEMALE",
      mobile: "+919876543217",
      email: "anjali.reddy@yahoo.com",
      dob: new Date("1998-09-22"),
    },
  });

  const profile2 = await prisma.agencyProfile.create({
    data: {
      agencyId: agency.id,
      personId: person2.id,
      clientId: client2.id,
      assignedUserId: exec2.id,
      profileNumber: "MM-F-0002",
      profileType: "DAUGHTER",
      status: "DRAFT",
      completionPercent: 40,
    },
  });

  await prisma.profilePersonal.create({
    data: {
      profileId: profile2.id,
      religion: "Hindu",
      caste: "Reddy",
      motherTongue: "Telugu",
      heightCm: 164,
      weightKg: 58,
      maritalStatus: "Never Married",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
  });

  // 6. Create Notes
  console.log("📝 Seeding Client Notes...");
  await prisma.clientNote.create({
    data: {
      clientId: client1.id,
      authorId: exec1.id,
      content: "Called client Harish Rao. He is happy with the progress. Requested to share matching profiles for Karthik Rao.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  await prisma.clientNote.create({
    data: {
      clientId: client2.id,
      authorId: exec2.id,
      content: "Sunitha Reddy submitted inquiry form. Wants to register her daughter Anjali. Scheduled initial consultation call.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  // 7. Create Payments
  console.log("💳 Seeding Client Payments...");
  await prisma.payment.create({
    data: {
      clientId: client1.id,
      agencyId: agency.id,
      amount: 15000,
      currency: "INR",
      status: "COMPLETED",
      paymentMethod: "UPI",
      transactionId: "TXN123456789",
      remarks: "Registration & first installment payment received.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  await prisma.payment.create({
    data: {
      clientId: client2.id,
      agencyId: agency.id,
      amount: 15000,
      currency: "INR",
      status: "PENDING",
      remarks: "Invoice sent for package registration.",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    },
  });

  console.log("✅ Seed database completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed database failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

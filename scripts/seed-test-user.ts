import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const attendee = await prisma.attendee.upsert({
    where: { email: "example@kiit.ac.in" },
    update: {
      fullName: "example",
      personalEmail: "example@gmail.com",
      phone: "1122334455",
      college: "KIIT University",
      branch: "CSE",
      academicYear: "1st Year (Freshers Batch '26)",
      phoneVerified: true,
      emailVerified: true,
    },
    create: {
      fullName: "example",
      email: "example@kiit.ac.in",
      personalEmail: "example@gmail.com",
      phone: "1122334455",
      college: "KIIT University",
      branch: "CSE",
      academicYear: "1st Year (Freshers Batch '26)",
      phoneVerified: true,
      emailVerified: true,
    },
  });

  console.log("Successfully seeded test attendee:", attendee);
}

main()
  .catch((e) => {
    console.error("Error creating test attendee:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

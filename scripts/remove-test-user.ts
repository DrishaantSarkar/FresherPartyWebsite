import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.attendee.deleteMany({
    where: {
      OR: [
        { email: "example@kiit.ac.in" },
        { phone: "1122334455" },
        { personalEmail: "example@gmail.com" },
      ],
    },
  });

  console.log("Successfully removed test attendee(s):", deleted);
}

main()
  .catch((e) => {
    console.error("Error removing test attendee:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

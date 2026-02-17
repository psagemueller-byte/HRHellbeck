import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the default admin password
  const passwordHash = await bcrypt.hash("Hellbeck2024!", 12);

  await prisma.user.upsert({
    where: { email: "p.sagemueller@hellbeck.info" },
    update: {},
    create: {
      email: "p.sagemueller@hellbeck.info",
      name: "Patrick Sagemüller",
      firstName: "Patrick",
      lastName: "Sagemüller",
      position: "HR-Administrator",
      department: "HR",
      role: "admin",
      phone: "",
      street: "",
      city: "Borchen",
      zipCode: "",
      country: "Deutschland",
      birthDate: "1985-01-01",
      startDate: "2019-01-01",
      isActive: true,
      passwordHash,
    },
  });

  console.log("Seed completed: Admin user created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

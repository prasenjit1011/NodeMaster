import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateEmployees(count: number) {
  const employees = [];

  for (let i = 1; i <= count; i++) {
    employees.push({
      name: `Employee ${i}`,
      email: `employee${i}@example.com`, // ✅ unique
      salary: Math.floor(Math.random() * (100000 - 25000) + 25000), // 25k–100k
      imageUrl: null,
    });
  }

  return employees;
}

async function main() {
  console.log("🌱 Seeding 2000 employees...");

  const data = generateEmployees(2000);

  await prisma.employee.createMany({
    data,
    skipDuplicates: true, // ✅ safe re-run
  });

  console.log("✅ Seeding completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
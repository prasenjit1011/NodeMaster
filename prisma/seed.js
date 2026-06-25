const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // =====================================================
  // User + Profile + Posts (1:1 and 1:N)
  // =====================================================

  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      profile: {
        create: {
          bio: "Full Stack Developer",
        },
      },
      posts: {
        create: [
          { title: "Getting Started with Prisma" },
          { title: "Node.js Basics" },
        ],
      },
    },
    include: {
      profile: true,
      posts: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      profile: {
        create: {
          bio: "Frontend Developer",
        },
      },
      posts: {
        create: [
          { title: "React Hooks Guide" },
          { title: "Next.js Introduction" },
        ],
      },
    },
  });

  console.log("Users created");

  // =====================================================
  // Students & Courses (N:N)
  // =====================================================

  const reactCourse = await prisma.course.create({
    data: {
      title: "React",
    },
  });

  const nodeCourse = await prisma.course.create({
    data: {
      title: "Node.js",
    },
  });

  const student1 = await prisma.student.create({
    data: {
      name: "Rahul",
      courses: {
        connect: [
          { id: reactCourse.id },
          { id: nodeCourse.id },
        ],
      },
    },
    include: {
      courses: true,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: "Priya",
      courses: {
        connect: [{ id: reactCourse.id }],
      },
    },
  });

  console.log("Students and Courses created");

  // =====================================================
  // Self Relation (Employee -> Manager)
  // =====================================================

  const manager = await prisma.employee.create({
    data: {
      name: "Alice",
    },
  });

  await prisma.employee.create({
    data: {
      name: "Bob",
      manager: {
        connect: {
          id: manager.id,
        },
      },
    },
  });

  await prisma.employee.create({
    data: {
      name: "Charlie",
      manager: {
        connect: {
          id: manager.id,
        },
      },
    },
  });

  console.log("Employees created");

  console.log("Seeding completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
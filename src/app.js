// app.js
// Express + Prisma CRUD example for all relations
// npm install express @prisma/client
// npm install -D nodemon
console.clear();
console.log('-- Start Time --', (new Date).toLocaleTimeString())

const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

/* =========================================================
   1. ONE-TO-ONE (User <-> Profile)
   ========================================================= */

/*
POST /users

{
  "name": "John",
  "bio": "Full Stack Developer"
}
*/

app.post("/users", async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        profile: {
          create: {
            bio,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
GET /users
*/

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        posts: true,
      },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   2. ONE-TO-MANY & MANY-TO-ONE
   User -> Posts
   ========================================================= */

/*
POST /posts

{
  "title": "Learning Prisma",
  "authorId": "USER_ID"
}
*/

app.post("/posts", async (req, res) => {
  try {
    const { title, authorId } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        author: {
          connect: {
            id: authorId,
          },
        },
      },
      include: {
        author: true,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
GET /posts
*/

app.get("/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
      },
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   3. MANY-TO-MANY
   Student <-> Course
   ========================================================= */

/*
POST /students

{
  "name": "Rahul"
}
*/

app.post("/students", async (req, res) => {
  try {
    const { name } = req.body;

    const student = await prisma.student.create({
      data: { name },
    });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
POST /courses

{
  "title": "React"
}
*/

app.post("/courses", async (req, res) => {
  try {
    const { title } = req.body;

    const course = await prisma.course.create({
      data: { title },
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
POST /enroll

{
  "studentId": "STUDENT_ID",
  "courseId": "COURSE_ID"
}
*/

app.post("/enroll", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        courses: {
          connect: {
            id: courseId,
          },
        },
      },
      include: {
        courses: true,
      },
    });

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
GET /students
*/

app.get("/students", async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        courses: true,
      },
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   4. SELF RELATION
   Employee -> Manager
   ========================================================= */

/*
POST /employees

Manager:
{
  "name": "Alice"
}

Employee:
{
  "name": "Bob",
  "managerId": "MANAGER_ID"
}
*/

app.post("/employees", async (req, res) => {
  try {
    const { name, managerId } = req.body;

    const employee = await prisma.employee.create({
      data: {
        name,
        ...(managerId && {
          manager: {
            connect: {
              id: managerId,
            },
          },
        }),
      },
      include: {
        manager: true,
      },
    });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
GET /employees
*/

app.get("/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        manager: true,
        employees: true,
      },
    });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ========================================================= */

// --------------------
// START SERVER
// --------------------

const PORT = 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to MongoDB");

    // Test query
    await prisma.customer.count();
    console.log("✅ Database query successful");

    app.listen(PORT, () => {
      console.log(`🚀 Src/App.js Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);

    process.exit(1);
  }
}

startServer();
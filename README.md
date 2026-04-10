# 🚀 Item CRUD REST API  
Built with **TypeScript + Fastify + MariaDB + Prisma ORM**

# 🚀 Node Master Repo
Built with **Node + Express + MySQL + Sequelize ORM**

---

## 📌 Overview
This project is a **RESTful API** for managing items with full CRUD functionality (Create, Read, Update, Delete).  
It uses modern backend technologies for **performance, scalability, and type safety**.

---

## 🛠️ Tech Stack
- Fastify – High-performance web framework  
- TypeScript – Type-safe JavaScript  
- MariaDB – Relational database  
- Prisma – Modern ORM for database access  

---

## 📂 Project Structure

src/
│
├── controllers/      # Request handlers
├── services/         # Business logic
├── routes/           # API routes
├── prisma/           # Prisma schema & config
├── types/            # TypeScript types
└── server.ts         # Entry point

---

## ⚙️ Installation

### 1️⃣ Clone the repository
git clone https://github.com/your-username/item-api.git
cd item-api

### 2️⃣ Install dependencies
npm install

### 3️⃣ Setup environment variables
Create a `.env` file:

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DB_NAME"
PORT=3000

---

## 🗄️ Prisma Setup

### Generate Prisma client
npx prisma generate

### Run migrations
npx prisma migrate dev --name init

---

## ▶️ Run the Application

### Development
npm run dev

### Production
npm run build
npm start

Server will run on:  
http://localhost:3000

---

## 📌 API Endpoints

### 🔹 Create Item
POST /items

Body:
{
  "name": "Item 1",
  "price": 100
}

---

### 🔹 Get All Items
GET /items

---

### 🔹 Get Item By ID
GET /items/:id

---

### 🔹 Update Item
PUT /items/:id

---

### 🔹 Delete Item
DELETE /items/:id

---

## 📄 Sample Response

{
  "id": "1",
  "name": "Item 1",
  "price": 100
}

---

## ⚠️ Known Issue & Fix

### BigInt Serialization Error
Do not know how to serialize a BigInt

### ✅ Fix (Fastify hook)
app.addHook("onSend", async (_req, _reply, payload) => {
  return JSON.stringify(payload, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
});

---

## 🧪 API Testing
Use REST Client, Thunder Client, or Postman.

---

## 🚀 Features
- CRUD operations  
- Type-safe APIs  
- Fastify performance  
- Prisma ORM integration  
- Clean architecture (Controller → Service → DB)  

---

## 📈 Future Improvements
- Authentication (JWT)  
- Pagination & filtering  
- Logging & monitoring  
- Unit & integration tests  

---

## 👨‍💻 Author
Your Name  
GitHub: https://github.com/your-username  

---

## 📜 License
MIT License

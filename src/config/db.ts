import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Initialize Prisma Client
let prisma: PrismaClient;

function getPrismaInstance(): PrismaClient {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        errorFormat: "pretty",
      });
      console.log("✅ Prisma Client initialized");
    } catch (error) {
      console.error("❌ Prisma initialization failed:", (error as Error).message);
      throw error;
    }
  }
  return prisma;
}

// Initialize on module load
const prismaInstance: PrismaClient = (() => {
  try {
    return new PrismaClient({
      errorFormat: "pretty",
    });
  } catch (error) {
    console.error("⚠️ Prisma Client initialization failed:", (error as Error).message);
    throw error;
  }
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
  process.exit(0);
});

export default prismaInstance;
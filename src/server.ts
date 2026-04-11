import { buildApp } from "./app";
import { prisma } from "./config/db";
import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const numCPUs = os.cpus().length;

// -----------------------------
// CLUSTER SETUP
// -----------------------------
if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart worker if it crashes
  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} died. Restarting...`
    );
    cluster.fork();
  });

} else {
  // -----------------------------
  // WORKER PROCESS
  // -----------------------------
  const app = buildApp();

  // -----------------------------
  // Start Server
  // -----------------------------
  async function start() {
    try {
      await prisma.$connect();
      app.log.info('Database connected');

      await app.listen({ port: PORT, host: HOST });
      app.log.info(
        `Worker ${process.pid} running on http://localhost:${PORT}`
      );
    } catch (err) {
      app.log.error({ err }, "Failed to start server");
      process.exit(1);
    }
  }

  // -----------------------------
  // Graceful Shutdown
  // -----------------------------
  let isShuttingDown = false;

  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info(`Worker ${process.pid} received ${signal}`);

    const forceExit = setTimeout(() => {
      app.log.error("Force shutdown due to timeout");
      process.exit(1);
    }, 10000).unref();

    try {
      await app.close();
      clearTimeout(forceExit);

      app.log.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  }

  // -----------------------------
  // Signals
  // -----------------------------
  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.once(signal, shutdown);
  });

  // -----------------------------
  // Global Errors (SAFE)
  // -----------------------------
  process.on("uncaughtException", (err) => {
    app.log.error({ err }, "Uncaught Exception");
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (err) => {
    app.log.error({ err }, "Unhandled Rejection");
    shutdown("unhandledRejection");
  });

  // -----------------------------
  start();
}
import Fastify from "fastify";
import compress from "@fastify/compress";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const numCPUs = os.cpus().length;

// -----------------------------
// BUILD APP
// -----------------------------
function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Compression
  app.register(compress);

  // JWT (kept minimal, optional)
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // ✅ Only Home Route
  app.get("/", async () => {
    return { message: "🚀 Welcome to Fastify API" };
  });

  return app;
}

// -----------------------------
// CLUSTER MODE
// -----------------------------
if (cluster.isPrimary) {
  console.log(`02. Primary process ${process.pid} running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.error(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

} else {
  // -----------------------------
  // WORKER
  // -----------------------------
  console.log(`01. Worker ${process.pid} started`);
  const app = buildApp();

  let isShuttingDown = false;

  async function start() {
    try {
      await app.listen({ port: PORT, host: HOST });
      app.log.info(`Worker ${process.pid} running on http://localhost:${PORT}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  }

  // -----------------------------
  // GRACEFUL SHUTDOWN
  // -----------------------------
  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info(`Received ${signal}`);

    const timeout = setTimeout(() => {
      app.log.error("Force shutdown");
      process.exit(1);
    }, 10000).unref();

    try {
      await app.close();
      clearTimeout(timeout);
      process.exit(0);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  }

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.once(signal, shutdown);
  });

  process.on("uncaughtException", (err) => {
    app.log.error(err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (err) => {
    app.log.error(err);
    shutdown("unhandledRejection");
  });

  start();
}
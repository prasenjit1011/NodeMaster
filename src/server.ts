import { buildApp } from "./app";
import dotenv from "dotenv";

dotenv.config();

const app = buildApp();

const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3000;

    await app.listen({ port: PORT, host: "0.0.0.0" });

    app.log.info(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// // -----------------------------
// // Graceful Shutdown
// // -----------------------------
// const shutdown = async (signal) => {
//   app.log.info(`Received ${signal}. Shutting down...`);

//   // Force exit if something hangs
//   const forceExit = setTimeout(() => {
//     app.log.error("Could not close connections in time, forcing shutdown");
//     process.exit(1);
//   }, 10000); // 10 seconds

//   try {
//     await app.close(); // Fastify handles open requests gracefully
//     clearTimeout(forceExit);

//     app.log.info("Shutdown complete");
//     process.exit(0);
//   } catch (err) {
//     app.log.error("Error during shutdown", err);
//     process.exit(1);
//   }
// };

// // Listen to system signals
// process.on("SIGINT", shutdown);   // Ctrl+C
// process.on("SIGTERM", shutdown);  // Docker/K8s
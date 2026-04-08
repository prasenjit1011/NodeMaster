import { buildApp } from "./app";
import dotenv from "dotenv";

dotenv.config();

const app = buildApp();

const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3000;

    await app.listen({ port: PORT, host: "0.0.0.0" }); // include host for Windows

    app.log.info(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
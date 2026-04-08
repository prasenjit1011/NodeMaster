import Fastify from "fastify";
import dotenv from "dotenv";
import itemRoutes from "./routes/item.routes";

dotenv.config();

const app = Fastify({
  logger: true
});

// Register routes
app.register(itemRoutes, { prefix: "/items" });

// Root route
app.get("/", async () => {
  return "Welcome to the Item API!";
});

// Start server
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
import Fastify from "fastify";
import itemRoutes from "./routes/item.routes";

// Function to create Fastify app
export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(itemRoutes, { prefix: "/items" });

  app.get("/", async () => "Welcome to the Item API!");

  return app;
};

// For backwards compatibility (optional)
// export default buildApp();
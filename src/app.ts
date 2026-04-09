import Fastify from "fastify";
import compress from "@fastify/compress";
import itemRoutes from "./routes/item.routes";
import http from "http";

// Keep-alive agent (for outbound HTTP calls if needed)
export const agent = new http.Agent({
  keepAlive: true,
});

// Function to create Fastify app
export const buildApp = () => {
  const app = Fastify({
    logger: true,
  });

  // Optional compression
  app.register(compress, {
    global: true,
  });

  app.register(itemRoutes, { prefix: "/items" });

  app.get("/", async () => "Welcome to the Item API!");

  return app;
};
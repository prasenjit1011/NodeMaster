import Fastify from "fastify";
import compress from "@fastify/compress";
import itemRoutes from "./modules/item/item.routes";
import http from "http";
import authRoutes from "./modules/auth/auth.routes";
import fastifyJwt from '@fastify/jwt';
import orderRoutes from "./modules/order/order.routes";
import { employeeRoutes } from "./modules/employee/employee.route";


// Keep-alive agent (for outbound HTTP calls if needed)
export const agent = new http.Agent({
  keepAlive: true,
});

// Function to create Fastify app
export const buildApp = () => {
  const app = Fastify({
    logger: true,
    bodyLimit: 5 * 1024 * 1024 // 100MB
  });

  // Optional compression
  app.register(compress, {
    global: true,
  });
  console.log('app.initialConfig.bodyLimit : ',app.initialConfig.bodyLimit);

  

  app.register(fastifyJwt, {secret: process.env.JWT_SECRET || 'supersecret'});
  app.register(itemRoutes, { prefix: "/items" });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(orderRoutes, { prefix: '/customers' });
  app.register(employeeRoutes,{prefix:'/employees'});
  app.get("/", async () => "Welcome to the Item API!");

  return app;
};
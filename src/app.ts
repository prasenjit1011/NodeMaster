import Fastify from "fastify";
import compress from "@fastify/compress";
import itemRoutes from "./modules/item/item.routes";
import http from "http";
import authRoutes from "./modules/auth/auth.routes";
import fastifyJwt from '@fastify/jwt';
import orderRoutes from "./modules/order/order.routes";
import countryRoutes from "./modules/geomaster/country/country.routes";
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

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

  // Swagger (OpenAPI)
  app.register(swagger, {
    openapi: {
      info: {
        title: "Item API",
        description: "API documentation for Item service",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
        },
      ],
    },
  });
  app.register(swaggerUI, { routePrefix: "/docs"});

  app.register(fastifyJwt, {secret: process.env.JWT_SECRET || 'supersecret'});
  app.register(itemRoutes, { prefix: "/items" });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(orderRoutes, { prefix: '/customers' });
  app.register(countryRoutes, { prefix: '/countries' });

  app.get("/", async () => "Welcome to the Item API!");

  return app;
};
// app.ts

import Fastify, {
  FastifyReply,
  FastifyRequest,
} from 'fastify';

const app = Fastify({
  logger: true,
});

const PORT = 3000;

/*
========================================
1. BASIC MIDDLEWARE (HOOK)
========================================
*/
app.addHook(
  'onRequest',
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    console.log(`${request.method} ${request.url}`);
  }
);

/*
========================================
2. ASYNC WRAPPER FUNCTION
========================================
*/
const asyncHandler =
  (fn: Function) =>
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      await fn(request, reply);
    } catch (error) {
      throw error;
    }
  };

/*
========================================
3. ROUTES
========================================
*/

// Normal Route
app.get('/', async (request, reply) => {
  return {
    message: 'Home Page',
  };
});

// Async Route with Error
app.get(
  '/error',
  asyncHandler(async () => {
    // Simulate async error
    throw new Error('Something went wrong!');
  })
);


// Unhandled Promise Rejection Example
app.get('/testing', async () => {
  Promise.reject('Unhandled Promise Rejection Example');
  throw new Error('Unhandled Promise Rejection Example');
});



/*
========================================
4. GLOBAL ERROR HANDLER
========================================
*/
app.setErrorHandler((error, request, reply) => {
  console.error('Error:', error.message);

  reply.status(500).send({
    success: false,
    message: error.message,
  });
});

/*
========================================
5. UNCAUGHT EXCEPTION
========================================
*/
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception');
  console.error(err.message);

  process.exit(1);
});

/*
========================================
6. UNHANDLED PROMISE REJECTION
========================================
*/
process.on(
  'unhandledRejection',
  (reason: unknown) => {
    console.error(
      'Unhandled Promise Rejection'
    );
    console.error(reason);

    process.exit(1);
  }
);

/*
========================================
7. START SERVER
========================================
*/
const startServer = async () => {
  try {
    await app.listen({
      port: PORT,
      host: '0.0.0.0',
    });

    console.log(
      `Server running on port ${PORT}`
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

startServer();
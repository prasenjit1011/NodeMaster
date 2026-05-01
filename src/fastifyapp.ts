import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Init
const fastify = Fastify({ logger: true });

// Plugins
fastify.register(jwt, { secret: 'secret' });
fastify.register(multipart);
fastify.register(cookie);
fastify.register(rateLimit, {
  max: 5,
  timeWindow: '1 minute'
});

// Event system
class MyEmitter extends EventEmitter {}
const emitter = new MyEmitter();

// Types (Interface)
interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Fake DB
let users: IUser[] = [];
let idCounter = 1;

// Auth middleware
fastify.decorate("auth", async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ msg: 'Unauthorized' });
  }
});

// Global middleware
fastify.addHook('preHandler', async (req) => {
  console.log(`Request: ${req.method} ${req.url}`);
});

/**
 * REGISTER
 */
fastify.post('/register', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}, async (req: FastifyRequest<{ Body: IUser }>, reply) => {
  const { name, email, password } = req.body;

  const user: IUser = {
    id: idCounter++,
    name,
    email,
    password
  };

  users.push(user);
  emitter.emit('user_created', user);

  return reply.code(201).send(user);
});

/**
 * LOGIN
 */
fastify.post('/login', async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return reply.code(401).send({ msg: 'Invalid' });

  const token = fastify.jwt.sign({ id: user.id });

  reply.setCookie('token', token, { httpOnly: true });

  return { token };
});

/**
 * FILE UPLOAD
 */
fastify.post('/upload', {
  preHandler: [fastify.auth as any]
}, async (req: any) => {
  const file = await req.file();

  const filePath = path.join(__dirname, 'uploads', file.filename);

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    file.file.pipe(ws);
    file.file.on('end', resolve);
    file.file.on('error', reject);
  });

  return { msg: 'uploaded' };
});

/**
 * CRUD
 */
fastify.get('/users', { preHandler: [fastify.auth as any] }, async () => users);

fastify.get('/users/:id', {
  preHandler: [fastify.auth as any]
}, async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const user = users.find(u => u.id == Number(req.params.id));
  if (!user) return reply.code(404).send({ msg: 'Not found' });
  return user;
});

fastify.put('/users/:id', {
  preHandler: [fastify.auth as any]
}, async (
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<IUser> }>,
  reply
) => {
  const index = users.findIndex(u => u.id == Number(req.params.id));
  if (index === -1) return reply.code(404).send({ msg: 'Not found' });

  users[index] = { ...users[index], ...req.body };
  return users[index];
});

fastify.delete('/users/:id', {
  preHandler: [fastify.auth as any]
}, async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
  const index = users.findIndex(u => u.id == Number(req.params.id));
  if (index === -1) return reply.code(404).send({ msg: 'Not found' });

  return users.splice(index, 1)[0];
});

/**
 * STREAMING
 */
fastify.get('/stream', async (_, reply) => {
  const stream = fs.createReadStream(__filename);
  reply.type('text/plain').send(stream);
});

/**
 * QUEUE (basic)
 */
type Job = { task: string };
let queue: Job[] = [];

setInterval(() => {
  if (queue.length) {
    const job = queue.shift();
    console.log('Processing job:', job);
  }
}, 3000);

fastify.post('/job', async (req: FastifyRequest<{ Body: Job }>) => {
  queue.push(req.body);
  return { msg: 'Job added' };
});

/**
 * EVENTS
 */
emitter.on('user_created', (user: IUser) => {
  console.log('Event: New user →', user.email);
});

/**
 * START
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
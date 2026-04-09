import { FastifyInstance } from 'fastify';
import {
  registerController,
  loginController,
} from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../middleware/auth.validation';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', { schema: registerSchema }, registerController);
  app.post('/login', { schema: loginSchema }, loginController);
}
import { FastifyReply, FastifyRequest } from 'fastify';
import * as authService from './auth.service';

export const registerController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, email, password } = req.body as any;

    const user = await authService.register(name, email, password);

    delete (user as any).password;

    reply.send(user);
  } catch (err: any) {
    reply.status(400).send({ error: err.message });
  }
};

export const loginController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = req.body as any;

    const data = await authService.login(email, password);

    delete (data.user as any).password;

    reply.send(data);
  } catch (err: any) {
    reply.status(400).send({ error: err.message });
  }
};
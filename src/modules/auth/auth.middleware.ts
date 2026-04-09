import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}


export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    
    const authHeader = request.headers.authorization;

    
    if (!authHeader) {
      return reply.status(401).send({ message: 'No token provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Invalid token format' });
    }
    
    const token = authHeader.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ message: 'Token missing' });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // const safeRequest = {
    //   url: request.url,
    //   method: request.method,
    //   params: request.params,
    //   query: request.query,
    //   body: request.body
    // };

     
    (request as any).user = decoded;

    // return reply.status(200).send({
    //   message: 'Authenticated Success 09',
    //   body: request.user,
    //   decoded,
    //   token,
    //   authHeader
    // }); 


  } catch (err) {
    console.error('JWT ERROR:', err);
    return reply.status(401).send({ message: 'Invalid token' });
  }
}
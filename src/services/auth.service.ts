import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../repositories/auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (name: string, email: string, password: string) => {
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error('Email already exists');
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashed,
  });

  return user;
};

export const login = async (email: string, password: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user, token };
};
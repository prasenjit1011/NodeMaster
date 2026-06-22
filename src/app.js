require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();

const prisma = new PrismaClient();


app.get('/user', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
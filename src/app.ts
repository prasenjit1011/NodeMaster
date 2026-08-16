import express, { NextFunction, Request, Response } from 'express';
import { handler } from './handler';

const app = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('-: Welcome :-');
});

app.post('/notify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await handler({
      body: JSON.stringify(req.body),
    });
    res.status(result.statusCode).type('json').send(result.body);
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Central Error Handler:', err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`-: App Running on ${port} :-`);
  });
}

export default app;

console.clear();
console.log('\n\n-: App Started :-');

import express, { Request, Response, NextFunction } from 'express';
import Item from './models/item';
import cron from 'node-cron';

const app = express();

// Schedule a task to run every minute
cron.schedule('* * * * *', () => {
  const dtd = new Date();
  console.log(
    'This task runs every minute ' +
      dtd.getHours() +
      '/' +
      dtd.getMinutes() +
      ' / ' +
      dtd.getSeconds()
  );
});

app.use('/', async (req: Request, res: Response, next: NextFunction) => {
  console.log('-: Welcome :-');

  try {
    await Item.create({
      name: 'Sanjay ' + Math.floor(100 * Math.random()),
    });

    const fetchData = await Item.findAll({ raw: true });
    console.log(fetchData);

    res.send('-: Welcome :-');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

app.listen(3500, () => {
  console.log('-: App Running ::-');
});
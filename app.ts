import { NextFunction } from "express";
import express, { Request, Response } from "express";
console.clear();
console.log('\n\n-: App Started :-');

const app       = express();

app.use('/', (req:Request, res:Response, next:NextFunction)=>{
    console.log('-: Welcome :-');
    res.status(200).send('-: Welcome :-');

    next()
});

// Centralized Error Handler
app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
    console.error('Central Error Handler:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

console.log('-: App Running :-');
app.listen(3000);
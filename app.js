console.clear();
console.log('\n\n-: App Started :-');

const express   = require('express');
const app       = express();
const PORT      = process.env.PORT || 8040;

app.use('/test', (req, res, next)=>{
    console.log('-: Welcome Page :-');
    res.send('-: Welcome Test Page:-');
});

app.use('/aboutus', (req, res, next)=>{
    let data = {
        "title":"About Us",
        "content":"Loren ipsum txt. Loren ipsum txt."
    }
    res.json(data);
});

app.use('/home', (req, res, next)=>{
    console.log('-: Welcome Home Page :-');
    res.send('-: Welcome My Home Page:-');
});

app.use('/', (req, res, next)=>{
    console.log('-: Welcome :-');
    res.send('-: Welcome Home Page:-');
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('Central Error Handler:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

console.log('-: App Running :-');
app.listen(PORT);
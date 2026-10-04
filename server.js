try {
    require('dotenv').config();
} catch {
    // dotenv is optional for local development
}

const { app, connectMongo } = require('./app');

const PORT = process.env.PORT || 3000;

connectMongo()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`-: Local server listening on ${PORT} :-`);
        });
    })
    .catch((err) => {
        console.error('Failed to start local server', err);
        process.exit(1);
    });

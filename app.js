console.log('\n\n-: App Started :-');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const tradebookDir = require('./util/tradebookPath');

// Deploy: GitHub secret → Terraform → Lambda env
// Local: .env (see .env.example)
const MONGODB_URI = process.env.MONGODB_URI_TICKERTAPE || process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.warn('Mongo URI missing. Set MONGODB_URI_TICKERTAPE or MONGODB_URI (GitHub secret / .env).');
}

const app = express();

app.use(express.static('images'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const fileStorage = multer.diskStorage({
    destination: tradebookDir,
    filename: (req, file, cb) => {
        cb(null, parseInt(100 * Math.random()) + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
};

app.use(multer({ storage: fileStorage, fileFilter }).single('tradebook'));

const stock = require('./routes/stockapi');
app.use(stock);

app.use('/', (req, res, next) => {
    console.log('-: Welcome :-');
    res.send('-: Welcome :-');
    next();
});

console.log('-: App Running :-');

let mongoReady;

async function connectMongo() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI_TICKERTAPE or MONGODB_URI environment variable is required');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!mongoReady) {
        mongoReady = mongoose
            .connect(MONGODB_URI)
            .then((connection) => {
                console.log('-: MongoDB connected :-');
                return connection;
            })
            .catch((err) => {
                mongoReady = undefined;
                console.log('MongoDB not connected');
                console.log(err);
                throw err;
            });
    }

    return mongoReady;
}

module.exports = { app, connectMongo };

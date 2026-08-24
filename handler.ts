const serverless = require('serverless-http');
const { app, ensureMongo } = require('./app');

const proxy = serverless(app);

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    await ensureMongo();
    return proxy(event, context);
};

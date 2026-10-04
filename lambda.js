const serverlessExpress = require('@codegenie/serverless-express');
const { app, connectMongo } = require('./app');

let serverlessExpressInstance;

async function setup(event, context) {
    await connectMongo();
    serverlessExpressInstance = serverlessExpress({ app });
    return serverlessExpressInstance(event, context);
}

exports.handler = async (event, context) => {
    // Allow Lambda to freeze while Mongo keep-alive sockets remain open
    context.callbackWaitsForEmptyEventLoop = false;

    if (serverlessExpressInstance) {
        return serverlessExpressInstance(event, context);
    }

    return setup(event, context);
};

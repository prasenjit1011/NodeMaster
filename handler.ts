const serverless = require("serverless-http");

const { app, ensureMongo } = require("./app");

const proxy = serverless(app);

let mongoInitialized = false;
let mongoInitPromise = null;

async function initializeMongo() {
  if (mongoInitialized) {
    return;
  }

  if (!mongoInitPromise) {
    mongoInitPromise = ensureMongo()
      .then(() => {
        mongoInitialized = true;
        console.log("MongoDB connection initialized.");
      })
      .catch((error) => {
        mongoInitPromise = null;
        console.error("MongoDB initialization failed:", error);
        throw error;
      });
  }

  await mongoInitPromise;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log("Lambda request:", {
      requestContext: event?.requestContext,
      rawPath: event?.rawPath,
      path: event?.path,
      httpMethod: event?.httpMethod
    });

    await initializeMongo();

    return await proxy(event, context);

  } catch (error) {
    console.error("Lambda handler error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "production"
          ? undefined
          : error.message
      })
    };
  }
};
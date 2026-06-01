const {
  SFNClient,
  StartSyncExecutionCommand
} = require("@aws-sdk/client-sfn");

const client = new SFNClient({});

exports.handler = async (event) => {
  try {
    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : event;

    const result = await client.send(
      new StartSyncExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: JSON.stringify(body)
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: result.output
    };

  } catch (err) {
    console.error("Step Function Invocation Error:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        message: err.message
      })
    };
  }
};
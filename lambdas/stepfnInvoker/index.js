const {
  SFNClient,
  StartSyncExecutionCommand
} = require("@aws-sdk/client-sfn");

const client = new SFNClient({});

exports.handler = async (event) => {
  try {
    console.log('Hello: Step Function Invoker Lambda');
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

    console.log("Step Function Result");
    console.log(JSON.stringify(result, null, 2));
    console.log("StepFn Result:", JSON.stringify(result));

    // Workflow failed
    if (result.status === "FAILED") {
      let details = result.cause;

      try {
        details = JSON.parse(result.cause);
      } catch (e) {
        // leave as string
      }

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          executionArn: result.executionArn,
          error: result.error,
          details: details
        })
      };
    }

    // Workflow succeeded
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: result.output || JSON.stringify({
        success: true,
        executionArn: result.executionArn
      })
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
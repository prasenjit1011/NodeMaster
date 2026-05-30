const {
  SFNClient,
  StartSyncExecutionCommand
} = require("@aws-sdk/client-sfn");

const client = new SFNClient({});

exports.handler = async (event) => {
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
};
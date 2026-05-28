const AWS = require('aws-sdk');

const stepfunctions = new AWS.StepFunctions();

exports.handler = async (event) => {

    try {

        const body =
            typeof event.body === 'string'
                ? JSON.parse(event.body)
                : event.body;

        const execution =
            await stepfunctions.startExecution({

                stateMachineArn:
                    process.env.STATE_MACHINE_ARN,

                input: JSON.stringify({
                    headers: event.headers,
                    body: body,
                    action: body.action
                })

            }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                executionArn:
                    execution.executionArn
            })
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: error.message
            })
        };
    }
};
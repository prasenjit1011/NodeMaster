const {
  SESv2Client,
  SendEmailCommand
} = require("@aws-sdk/client-sesv2");

const ses = new SESv2Client({});

exports.handler = async (event) => {
  try {
    const recipient =
      event.email ||
      event.employeeEmail ||
      "prasenjit10112@gmail.com";

    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.FROM_EMAIL,
        Destination: {
          ToAddresses: [recipient]
        },
        Content: {
          Simple: {
            Subject: {
              Data: "Leave Request Approved"
            },
            Body: {
              Text: {
                Data: `
Hello ${event.employeeName},

Your leave request has been approved.

Leave Type : ${event.leaveType}
From Date  : ${event.fromDate}
To Date    : ${event.toDate}
Status     : ${event.status}
`
              }
            }
          }
        }
      })
    );

    return {
      ...event,
      emailSent: true
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};
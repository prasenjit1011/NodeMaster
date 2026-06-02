exports.handler = async (event) => {
  try {
    console.log('Hello: Send Email Lambda');
    const emailMessage = {
      to: event.employeeEmail || "prasenjit10112@gmail.com",
      subject: "Leave Request Approved",
      body: `
Hello ${event.employeeName},

Your leave request has been approved.

Leave Type : ${event.leaveType}
From Date  : ${event.fromDate}
To Date    : ${event.toDate}
Status     : ${event.status}

Thank you.
HR Department
`
    };

    
    console.log("EMAIL NOTIFICATION");
    console.log(JSON.stringify(emailMessage, null, 2));

    return {
      ...event,
      emailSent: true,
      message: "Leave approved and email notification sent"
    };
  } catch (err) {
    console.error("Send Email Error:", err);

    throw new Error(err.message);
  }
};
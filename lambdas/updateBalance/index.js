const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  let client;

  try {
    console.log('Hello: Update Balance Lambda');
    client = new MongoClient(process.env.MONGO_URI);

    await client.connect();

    const db = client.db("demodb");

    const leaveBalances = db.collection("leave_balances");

    const fromDate = new Date(event.fromDate);
    const toDate = new Date(event.toDate);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const leaveDays =
      Math.floor((toDate - fromDate) / millisecondsPerDay) + 1;

    await leaveBalances.updateOne(
      {
        employeeId: event.employeeId
      },
      {
        $inc: {
          remainingLeaves: -leaveDays
        }
      },
      {
        upsert: true
      }
    );

    return {
      ...event,
      leaveDays,
      balanceUpdated: true
    };

  } catch (err) {
    console.error("Update Balance Error:", err);
    throw new Error(err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
};
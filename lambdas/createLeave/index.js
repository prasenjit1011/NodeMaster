const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  let client;

  

  try {
    console.log("Create Leave Event:", JSON.stringify(event));
    console.log("Mongo URI:", process.env.MONGO_URI);
    
    client = new MongoClient(process.env.MONGO_URI);

    await client.connect();

    const db = client.db("hrdb");
    const collection = db.collection("leave_requests");

    const leaveRequest = {
      employeeId: event.employeeId,
      employeeName: event.employeeName,
      leaveType: event.leaveType,
      fromDate: event.fromDate,
      toDate: event.toDate,
      reason: event.reason,

      status: "PENDING_MANAGER",

      managerApproved: false,
      hrApproved: false,

      createdAt: new Date()
    };

    const result = await collection.insertOne(leaveRequest);

    return {
      leaveId: result.insertedId.toString(),

      employeeId: event.employeeId,
      employeeName: event.employeeName,
      leaveType: event.leaveType,
      fromDate: event.fromDate,
      toDate: event.toDate,
      reason: event.reason,

      status: "PENDING_MANAGER"
    };

  } catch (err) {
    console.error("Create Leave Error:", err);

    throw new Error(err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
};
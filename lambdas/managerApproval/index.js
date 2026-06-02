const { MongoClient, ObjectId } = require("mongodb");

exports.handler = async (event) => {
  let client;

  try {
    client = new MongoClient(process.env.MONGO_URI);

    await client.connect();

    const db = client.db("demodb");
    const collection = db.collection("leave_requests");

    await collection.updateOne(
      { _id: new ObjectId(event.leaveId) },
      {
        $set: {
          managerApproved: true,
          status: "PENDING_HR",
          managerApprovedAt: new Date()
        }
      }
    );

    return {
      ...event,
      managerApproved: true,
      status: "PENDING_HR"
    };

  } catch (err) {
    console.error("Manager Approval Error:", err);
    throw new Error(err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
};
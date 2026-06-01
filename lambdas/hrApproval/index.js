const { MongoClient, ObjectId } = require("mongodb");

exports.handler = async (event) => {
  let client;

  try {
    client = new MongoClient(process.env.MONGO_URI);

    await client.connect();

    const db = client.db("hrdb");
    const collection = db.collection("leave_requests");

    await collection.updateOne(
      { _id: new ObjectId(event.leaveId) },
      {
        $set: {
          hrApproved: true,
          status: "APPROVED",
          hrApprovedAt: new Date()
        }
      }
    );

    return {
      ...event,
      hrApproved: true,
      status: "APPROVED"
    };

  } catch (err) {
    console.error("HR Approval Error:", err);
    throw new Error(err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
};
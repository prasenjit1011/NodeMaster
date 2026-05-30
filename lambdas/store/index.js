const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  let client;

  try {
    client = new MongoClient(process.env.MONGO_URI);

    await client.connect();

    const db = client.db("demodb");
    const col = db.collection("faqs");

    const result = await col.insertOne({
      question: event.answer,
      answer: "FAQ ANSWER : " + event.answer,
      createdAt: new Date()
    });

    return {
      found: true,
      answer: "FAQ ANSWER : " + event.answer,
      id: result.insertedId.toString()
    };
  } catch (err) {
    console.error("Store Lambda Error:", err);

    return {
      found: false,
      error: err.message
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};
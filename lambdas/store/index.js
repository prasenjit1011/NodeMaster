const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGO_URI);

  await client.connect();
  const db = client.db("faq");
  const col = db.collection("answers");

  await col.insertOne({
    question: event.question,
    answer: event.answer,
    createdAt: new Date()
  });

  await client.close();

  return { stored: true };
};
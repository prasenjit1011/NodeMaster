const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGO_URI);

  await client.connect();
  const db = client.db("demodb");
  const col = db.collection("faqs");

  const result = await col.insertOne({
    question: event.answer,
    answer: 'FAQ ANSWER : '+event.answer,
    createdAt: new Date()
  });

  await client.close();

  return { stored: true, id: result.insertedId, question: event.answer, msg : "FAQ stored successfully!" };
};
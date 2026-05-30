const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  const client = new MongoClient(process.env.MONGO_URI);

  await client.connect();
  const db = client.db("demodb");
  const col = db.collection("faqs");

  const result = await col.findOne({ question: event.question });
  const result = await col.findOne({
                      $or: [
                        { question: event.question },
                        { answer: event.question }
                      ]
                    });

  await client.close();

  if (result) {
    return { found: true, answer: result.answer };
  }

  return { found: false, question: event.question };
};
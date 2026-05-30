exports.handler = async (event) => {
  const question = event.question;

  console.log("EVENT:", JSON.stringify(event));

  if (!question) {
    throw new Error("Question missing in input!!!");
  }

  if (question.length < 300) {
    throw new Error("Invalid question");
  }

  return { question };
};
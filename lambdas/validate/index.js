exports.handler = async (event) => {
  const question = event.question;

  if (!question || question.length < 3) {
    throw new Error("Invalid question!");
  }

  return { question };
};
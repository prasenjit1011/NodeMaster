exports.handler = async (event) => {
  const answer = `Fallback answer for: ${event.question}`;
  return { answer };
};
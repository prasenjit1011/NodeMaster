export const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda Working",
      input: event
    })
  };
};
export async function test(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Test",
    }),
  };
}

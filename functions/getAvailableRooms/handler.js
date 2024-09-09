export async function availableRooms(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Test",
    }),
  };
}

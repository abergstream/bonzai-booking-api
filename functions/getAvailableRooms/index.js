export const getAvailableRooms = async () => {
  const date_today = new Date().toISOString().split("T")[0];
  const availableRoomsParams = {
    TableName: "bonzai_bookings",
    FilterExpression: "date_in >= :today",
    ExpressionAttributeValues: {
      ":today": date_today,
    },
  };
  const { Items } = await db.scan(availableRoomsParams);
  let roomsBooked = 0;
  Items.forEach((item) => {
    roomsBooked += item.room_type.length;
  });
  return 20 - roomsBooked;
};
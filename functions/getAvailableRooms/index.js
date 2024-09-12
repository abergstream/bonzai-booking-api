import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";

export const getAvailableRooms = async () => {
  const date_today = new Date().toISOString().split("T")[0];
  const availableRoomsParams = {
    TableName: "bonzai_bookings",
    FilterExpression: "date_in >= :today",
    ExpressionAttributeValues: {
      ":today": date_today,
    },
  };

  try {
    const { Items } = await db.scan(availableRoomsParams);
    let roomsBooked = 0;

    // Räknar bokade rum baserat på rumstyper
    Items.forEach((item) => {
      roomsBooked += item.room_type.length;
    });

    // Hotellet har totalt 20 rum
    return 20 - roomsBooked;
  } catch (error) {
    return sendError(500, error);
  }
};

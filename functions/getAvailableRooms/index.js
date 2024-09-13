import { db } from "../../services/db.js"; // Importerar DynamoDB-klienten
import { sendResponse, sendError } from "../../services/responses.js"; // Importerar svarshantering

// Hämtar tillgängliga rum från bokningstabellen
export const handler = async () => {
  const date_today = new Date().toISOString().split("T")[0]; // Hämta dagens datum

  const availableRoomsParams = {
    TableName: "bonzai_bookings", // Tabell med bokningar
    FilterExpression: "date_in >= :today", // Endast bokningar från och med idag
    ExpressionAttributeValues: {
      ":today": date_today,
    },
  };

  try {
    const { Items } = await db.scan(availableRoomsParams); // Skanna bokningar från dagens datum

    let roomsBooked = 0;
    Items.forEach((item) => {
      roomsBooked += item.room_type.length; // Räkna bokade rum
    });

    const availableRooms = 20 - roomsBooked;
    return sendResponse({ availableRooms });
  } catch (error) {
    return sendError(500, error); // Returnera felmeddelande vid problem
  }
};
handler();

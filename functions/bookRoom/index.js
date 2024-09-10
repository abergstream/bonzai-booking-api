import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";
import { validateBooking, getParams } from "../../services/bookingFunctions.js";

export const handler = async (event) => {
  const { room_type } = JSON.parse(event.body);

  // Converts object to an array
  const roomType = Object.entries(room_type).flatMap(([key, value]) =>
    Array(value).fill(key)
  );

  // Get available rooms from database
  const getRoomsParams = {
    TableName: "bonzai_rooms",
  };
  try {
    // Get Items as rooms from table bonzai_rooms
    const { Items: rooms } = await db.scan(getRoomsParams);

    // Check for errors
    const validationErrors = validateBooking(event, roomType, rooms);

    // Return error message(s) if there are any
    if (validationErrors.length > 0) {
      return sendError(400, validationErrors);
    }

    // If no errors, get params to post to table
    const insertParams = getParams(event, rooms, roomType);

    try {
      const data = await db.put(insertParams);
      return sendResponse({ message: data });
    } catch (error) {
      return sendError(500, error);
    }
  } catch (error) {
    return sendError(500, error);
  }
};
// Påbörjad funktion för att se hur många lediga rum det finns
async function test() {
  const dateInValue = "2024-09-13";
  const dateOutValue = "2024-09-15";

  const params = {
    TableName: "bonzai_bookings",
    FilterExpression:
      "(#date_in <= :dateOutValue AND #date_out > :dateInValue) AND NOT (#date_in = :dateOutValue AND #date_out = :dateInValue)",
    ExpressionAttributeNames: {
      "#date_in": "date_in",
      "#date_out": "date_out",
    },
    ExpressionAttributeValues: {
      ":dateInValue": dateInValue,
      ":dateOutValue": dateOutValue,
    },
  };

  const { Count } = await db.scan(params);
  console.log(Count);
}
test();

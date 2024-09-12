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

    const availableRooms = await getAvailableRooms();
    if (availableRooms < roomType.length) {
      return sendError(400, "Not enough rooms available");
    }
    // If no errors, get params to post to table
    const insertParams = getParams(event, rooms, roomType);

    try {
      await db.put(insertParams);
      return sendResponse({ message: getResponse(insertParams) });
    } catch (error) {
      return sendError(500, error);
    }
  } catch (error) {
    return sendError(500, error);
  }
};

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
const getResponse = (params) => {
  const {
    name,
    email,
    id,
    date_in,
    date_out,
    number_of_guests,
    room_type,
    price,
  } = params.Item;
  const response = {
    bookingNumber: id,
    name: name,
    email: email,
    number_of_guests: number_of_guests,
    rooms: room_type,
    price: price,
    checkin_date: date_in,
    checkout_date: date_out,
  };
  return response;
};

import { nanoid } from "nanoid";
import { db } from "../../services/db.js";
import { format } from "date-fns-tz";
import { validateDate } from "../../services/validation.js";
import { sendResponse, sendError } from "../../services/responses.js";

export const handler = async (event) => {
  const {
    from: date_in,
    to: date_out,
    guests,
    room_type,
  } = JSON.parse(event.body);

  // Converts object to an array
  const roomType = Object.entries(room_type).flatMap(([key, value]) =>
    Array(value).fill(key)
  );

  const getRoomsParams = {
    TableName: "bonzai_rooms",
  };
  try {
    const { Items: rooms } = await db.scan(getRoomsParams);
    const insertParams = checkParams(event, rooms, roomType);

    const validationErrors = validateBooking({
      date_in,
      date_out,
      guests,
      roomType,
      rooms,
    });

    if (validationErrors.length > 0) {
      // Return the first error or a combined error message
      return sendError(400, validationErrors);
    }

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

function calculatePrice(items, roomType) {
  const roomTypePriceMap = items.reduce((map, item) => {
    map[item.room_type] = item.price;
    return map;
  }, {});

  // Step 2: Calculate the total price based on insertParams.room_type
  const totalPrice = roomType.reduce((total, type) => {
    const price = roomTypePriceMap[type] || 0;
    return total + price;
  }, 0);
  return totalPrice;
}

function checkParams(event, rooms, roomType) {
  const bookingID = nanoid();

  const {
    name,
    email,
    from: date_in,
    to: date_out,
    guests,
    room_type,
  } = JSON.parse(event.body);

  // Gets the total price
  const price = calculatePrice(rooms, roomType);
  return {
    TableName: "bonzai_bookings",
    Item: {
      id: bookingID,
      date_created: getCurrentDateTime(),
      date_in: date_in,
      date_out: date_out,
      email: email,
      name: name,
      number_of_guests: guests,
      room_type: roomType,
      price: price,
    },
  };
}
function getCurrentDateTime() {
  const now = new Date();
  return format(now, "yyyy-MM-dd HH:mm:ss", { timeZone: "Europe/Stockholm" });
}

function checkCapacity(rooms, roomType, guests) {
  // Create a map of room type to its capacity
  const roomTypeCapacityMap = rooms.reduce((map, room) => {
    if (!map[room.room_type]) {
      map[room.room_type] = 0;
    }

    // Sum up the capacities for each room type
    map[room.room_type] += room.guests;
    return map;
  }, {});

  // Calculate total available capacity for requested room types
  const totalCapacity = roomType.reduce((total, type) => {
    return total + (roomTypeCapacityMap[type] || 0);
  }, 0);

  // Check if total capacity is enough
  return totalCapacity >= guests;
}
function validateRooms(rooms, roomType) {
  // Extract unique room types from the items array
  const availableRoomTypes = new Set(rooms.map((item) => item.room_type));

  // Check if every requested room type is in the available room types
  return roomType.every((type) => availableRoomTypes.has(type));
}

function validateBooking({ date_in, date_out, guests, roomType, rooms }) {
  const errors = [];

  // Validate date format
  if (!validateDate(date_in)) {
    errors.push("From: Enter date format in YYYY-mm-dd");
  }
  if (!validateDate(date_out)) {
    errors.push("To: Enter date format in YYYY-mm-dd");
  }

  // Validate number of guests vs. room types
  if (parseInt(guests) < roomType.length) {
    errors.push("You can not book more rooms than there are guests");
  }

  // Validate room capacity
  if (!checkCapacity(rooms, roomType, guests)) {
    errors.push("Room capacity too low");
  }

  // Validate room types
  if (!validateRooms(rooms, roomType)) {
    errors.push(
      "Room validation error, please use 'Enkelrum', 'Dubbelrum' or 'Svit'"
    );
  }

  return errors;
}

import { nanoid } from "nanoid";
import { format } from "date-fns-tz";

export const getParams = (event, rooms, roomType) => {
  const bookingID = nanoid();

  const {
    name,
    email,
    from: date_in,
    to: date_out,
    guests,
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
};

export const calculatePrice = (items, roomType) => {
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
};

const getCurrentDateTime = () => {
  const now = new Date();
  return format(now, "yyyy-MM-dd HH:mm:ss", { timeZone: "Europe/Stockholm" });
};

export const validateBooking = (event, roomType, rooms, change) => {
  const errors = [];

  const {
    name,
    email,
    from: date_in,
    to: date_out,
    guests,
  } = JSON.parse(event.body);
  // Get todays date in YYYY-mm-dd format
  const date_today = new Date().toISOString().split("T")[0];

  // Convert dates to Date objects
  const outDate = new Date(date_out);
  const inDate = new Date(date_in);

  // Calculate the difference in time (milliseconds)
  const differenceInTime = inDate - outDate;
  if (differenceInTime >= 0) {
    errors.push(
      "Check-in date can not be after check out date. Check-in and check out can not be in the same day"
    );
  }
  // Validate that name contains a firstname and a surname
  if (!change) {
    if (!validateName(name)) {
      errors.push("Name must contain a firstname and a surname");
    }
    if (!validateEmail(email)) {
      errors.push("Invalid e-mail address");
    }
  }

  // Validate date format
  if (!validateDate(date_in, date_today)) {
    errors.push("From date needs to be today or later, in YYYY-mm-dd format");
  }
  if (!validateDate(date_out, date_today)) {
    errors.push("To date needs to be today or later, in YYYY-mm-dd format");
  }

  // Validate number of guests vs. room types
  if (parseInt(guests) < roomType.length) {
    errors.push("You cannot book more rooms than there are guests");
  }

  // Validate room capacity
  if (!validateCapacity(rooms, roomType, guests)) {
    errors.push("Room capacity is too low");
  }

  // Validate room types
  if (!validateRooms(rooms, roomType)) {
    errors.push(
      "Room validation error, please use 'Enkelrum', 'Dubbelrum' or 'Svit'"
    );
  }

  return errors;
};

// Functions that are used in validateBooking
const validateCapacity = (rooms, roomType, guests) => {
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
};

const validateRooms = (rooms, roomType) => {
  // Extract unique room types from the items array
  const availableRoomTypes = new Set(rooms.map((item) => item.room_type));

  // Check if every requested room type is in the available room types
  return roomType.every((type) => availableRoomTypes.has(type));
};

const validateName = (name) => {
  // Check if the name contains a space and has at least two parts
  const nameParts = name.trim().split(/\s+/); // Split by one or more spaces
  if (nameParts.length < 2) {
    return false; // Invalid if there aren't at least two parts
  }

  // Ensure both parts contain at least one character (not just spaces)
  const [firstName, lastName] = nameParts;
  if (firstName.length === 0 || lastName.length === 0) {
    return false;
  }
  return true;
};
const validateEmail = (email) => {
  // Regular expression for validating an email
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Test the email against the regular expression
  return re.test(String(email).toLowerCase());
};
const validateDate = (dateString, date_today) => {
  // Regex to match the date format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  // Check if the date string matches the regex
  if (!regex.test(dateString)) {
    return false;
  }

  // Check if the date string is older than todays date
  if (dateString < date_today) {
    return false;
  }
  // Check if the date is a valid date
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Check if the date object is valid and matches the input
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

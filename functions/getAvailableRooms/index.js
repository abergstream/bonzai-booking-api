import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";

export const handler = async (event) => {
  const { date_in, date_out } = JSON.parse(event.body);

  if (!date_in || !date_out) {
    return sendError(400, "Both check-in and check-out dates are required.");
  }

  try {
    // Hämta alla rum från bonzai_rooms tabellen
    const { Items: allRooms } = await db.scan({ TableName: "bonzai_rooms" });

    // Hämta alla bokningar som överlappar med de angivna datumen
    const params = {
      TableName: "bonzai_bookings",
      FilterExpression:
        "(#date_in <= :dateOut AND #date_out >= :dateIn) AND NOT (#date_in = :dateOut AND #date_out = :dateIn)",
      ExpressionAttributeNames: {
        "#date_in": "date_in",
        "#date_out": "date_out",
      },
      ExpressionAttributeValues: {
        ":dateIn": date_in,
        ":dateOut": date_out,
      },
    };

    const { Items: bookings } = await db.scan(params);

    // Räkna antalet bokade rum per typ
    const bookedRoomsCount = {
      single: 0,
      double: 0,
      suite: 0,
    };

    bookings.forEach((booking) => {
      bookedRoomsCount[booking.room_type] += booking.number_of_rooms;
    });

    // Beräkna tillgängliga rum
    const totalRooms = {
      single: 10, 
      double: 6,
      suite: 4,
    };

    const availableRooms = {
      single: totalRooms.single - bookedRoomsCount.single,
      double: totalRooms.double - bookedRoomsCount.double,
      suite: totalRooms.suite - bookedRoomsCount.suite,
    };

    // Returnera resultatet
    return sendResponse(availableRooms);
  } catch (error) {
    console.error(error);
    return sendError(500, "Could not retrieve available rooms.");
  }
};

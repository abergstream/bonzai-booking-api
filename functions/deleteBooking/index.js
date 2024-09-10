import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";

export const handler = async (event) => {
  const { bookingNumber: bookingID } = JSON.parse(event.body);

  try {
    const params = {
      TableName: "bonzai_bookings",
      Key: {
        id: bookingID,
      },
    };

    const { Item } = await db.get(params);

    // If no item is returned, send a 404 error
    if (!Item) {
      return sendError(
        404,
        `No booking found with reference number: ${bookingNumber}`
      );
    }
    // Get todays date in YYYY-mm-dd format
    const date_today = new Date().toISOString().split("T")[0];

    // Get check-in date from database
    const date_in = Item.date_in;

    // Convert dates to Date objects
    const todayDate = new Date(date_today);
    const inDate = new Date(date_in);

    // Calculate the difference in time (milliseconds)
    const differenceInTime = inDate - todayDate;

    // Convert the time difference to days
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);

    // If difference in days is less than 2, return a bad request
    if (differenceInDays < 2) {
      return sendError(
        400,
        "You cannot cancel your stay later than 2 days before check-in."
      );
    }

    try {
      await db.delete(params);
      return sendResponse({ message: "Booking removed" });
    } catch (error) {
      return sendError(500, error);
    }
  } catch (error) {
    return sendError(500, error);
  }
};

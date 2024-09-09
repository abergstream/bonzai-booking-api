import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";

export const handler = async (event) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const params = {
      TableName: "bonzai_bookings",
      FilterExpression: "date_in >= :today",
      ExpressionAttributeValues: {
        ":today": today,
      },
    };
    const { Items } = await db.scan(params);
    return sendResponse(Items);
  } catch (error) {
    return sendError(500, error);
  }
};

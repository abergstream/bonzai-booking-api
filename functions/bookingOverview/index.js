import { db } from "../../services/db.js";
import { sendResponse, sendError } from "../../services/responses.js";
export const handler = async (event) => {
  try {
    const { Items } = await db.scan({ TableName: "bonzai_bookings" });
    return sendResponse(Items);
  } catch (error) {
    return sendError(404, error);
  }
};

import { sendResponse, sendError } from '../../services/responses.js';
import { db } from "../../services/db.js";

export const handler = async (event, context) => {
    const { id } = event.pathParameters;
    const { email, name, date_in, date_out, number_of_guests, room_type } = JSON.parse(event.body);

    console.log('Updating booking with ID:', id);
    console.log('Update details:', { date_in, date_out, number_of_guests, room_type });

    try {
        // Use await directly without .promise()
        const result = await db.update({
            TableName: 'bonzai_bookings',
            Key: { id: id }, 
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set date_in = :date_in, date_out = :date_out, number_of_guests = :number_of_guests, room_type = :room_type',
            ExpressionAttributeValues: {
                ':date_in': date_in,
                ':date_out': date_out,
                ':number_of_guests': number_of_guests,
                ':room_type': room_type
            }
        });

        console.log('DynamoDB update result:', result);

        return sendResponse(200, { 
                success: true,
                message: 'Booking updated successfully',
                updatedAttributes: result.Attributes
             });
    } catch (error) {
        console.error('DynamoDB update error:', error);
        return sendError(500, { success: false, message: 'Could not update the booking' });
    }
};

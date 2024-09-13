import { sendResponse, sendError } from '../../services/responses.js';
import { db } from "../../services/db.js";
import { validateBooking } from '../../services/bookingFunctions.js';
import { calculatePrice } from '../../services/bookingFunctions.js';

export const handler = async (event, context) => {
    const { id } = event.pathParameters;
    const { from, to, guests, room_type } = JSON.parse(event.body);

    try {
        // Hämta alla rum från databasen
        const { Items: rooms } = await db.scan({ TableName: "bonzai_rooms" });

        // Kolla om det finns några rum tillgängliga
        if (!rooms || rooms.length === 0) {
            console.log('No available rooms found');
            return sendError(404, { success: false, message: 'No available rooms found' });
        }
            // Andreas kod
        const roomType = Object.entries(room_type).flatMap(([key, value]) =>
            Array(value).fill(key)
        );

    
        // Kolla om ID:t finns annars returnera 404
        const checkId = await db.get({
            TableName: 'bonzai_bookings',
            Key: { id: id }
        });

        if (!checkId.Item) {
            console.log('Booking not found for ID:', id);
            return sendError(404, { success: false, message: 'Booking not found, wrong booking number!' });
        }

        


     const validationErrors = validateBooking(event, roomType, rooms, true);
        if (validationErrors.length > 0) {
            console.log('Validation errors:', validationErrors);
            return sendError(400, { success: false, message: 'Validation failed', errors: validationErrors });
        }

        const price = calculatePrice(rooms, roomType);

        console.log('Updating booking with ID:', id);

        // Uppdatera bokningen i databasen och returnera den uppdaterade bokningen
        const result = await db.update({
            TableName: 'bonzai_bookings',
            Key: { id: id }, 
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set date_in = :date_in, date_out = :date_out, number_of_guests = :number_of_guests, room_type = :room_type, price = :price',
            ExpressionAttributeValues: {
                ':date_in': from,
                ':date_out': to,
                ':number_of_guests': guests,
                ':room_type': roomType,
                ':price': price
            }
        });

        console.log('DynamoDB update result:', result);

        return sendResponse({ 
            success: true,
            message: 'Booking updated successfully',
            updatedAttributes: result.Attributes
        });

    } catch (error) {
        console.error('DynamoDB update error:', error);
        return sendError(500, { success: false, message: 'Could not update the booking' });
    }
};

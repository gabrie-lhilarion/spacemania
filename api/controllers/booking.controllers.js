const db = require('../database/connection/connect.connection');
const { BadRequestError } = require('../errors/index.errors');
const bookingsDb = require('../database/bookings/booking.database');

/**
 * Create a new workspace booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function createBooking(req, res, next) {
    const client = await db.pool.connect();

    try {
        const {
            workspaceId,
            startTime,
            endTime,
            attendees = 1,
            specialRequests,
        } = req.body;
        const userId = 6;

        // Convert string dates to Date objects if needed
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Basic validation
        if (start >= end) {
            console.log('End time must be after start time');
            throw new BadRequestError('End time must be after start time');
        }

        if (start < new Date()) {
            console.log('Cannot book in the past');
            throw new BadRequestError('Cannot book in the past');
        }

        await client.query('BEGIN');

        // Check availability first
        const availability = await bookingsDb.getWorkspaceAvailability(
            workspaceId,
            start,
            end,
            attendees
        );

        if (!availability.is_available) {
            console.log('Workspace not available for the requested time/slots');

            throw new BadRequestError(
                'Workspace not available for the requested time/slots'
            );
        }

        // Create the booking

        const booking = await bookingsDb.createBooking(
            userId,
            workspaceId,
            start,
            end,
            attendees,
            specialRequests
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: booking,
            message:
                booking.status === 'pending'
                    ? 'Booking request submitted for approval'
                    : 'Booking confirmed',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err);
        if (err.code === '23505') {
            next(new BadRequestError('Timeslot already booked'));
        } else if (err instanceof BadRequestError) {
            next(err);
        } else {
            next(new BadRequestError('Failed to create booking', err));
        }
    } finally {
        client.release();
    }
}

/**
 * Check workspace availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */

// Declare an asynchronous function that handles workspace availability checks
// Takes Express middleware parameters: request, response, and next
async function checkAvailability(req, res, next) {
    try {
        const { workspaceId } = req.params;
        const { startTime, endTime, attendees = 1 } = req.query;

        // Convert and validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        // Add 24-hour buffer period (in milliseconds)
        const MIN_BOOKING_BUFFER = 24 * 60 * 60 * 1000;
        const earliestAllowedStart = new Date(now.getTime() + MIN_BOOKING_BUFFER);

        // Validate date objects
        if (isNaN(start.getTime()))
            throw new BadRequestError('Invalid start time format');
        if (isNaN(end.getTime()))
            throw new BadRequestError('Invalid end time format');

        // Time validations
        if (start >= end) {
            throw new BadRequestError('End time must be after start time');
        }

        if (start < earliestAllowedStart) {
            throw new BadRequestError(
                'Bookings require at least 24 hours advance notice'
            );
        }

        // Validate attendees is a positive number
        if (isNaN(attendees) || attendees < 1) {
            throw new BadRequestError('Attendees must be a positive number');
        }

        // Check workspace capacity
        const workspace = await bookingsDb.getWorkspaceCapacity(workspaceId);
        if (attendees > workspace.capacity) {
            throw new BadRequestError(
                `Workspace only accommodates ${workspace.capacity} attendees`
            );
        }

        const availability = await bookingsDb.getWorkspaceAvailability(
            workspaceId,
            start,
            end,
            attendees
        );

        res.json({
            success: true,
            data: {
                ...availability,
                bufferNotice: 'All bookings require 24-hour advance notice',
            },
        });
    } catch (err) {
        console.log(err);
        next(
            err instanceof BadRequestError
                ? err
                : new BadRequestError('Availability check failed')
        );
    }
}

/**
 * Get user's booking history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function getUserBookings(req, res, next) {
    try {
        const userId = req.user.id;
        console.log(userId);
        const { upcoming = 'true', page = 1, limit = 10 } = req.query;

        const bookings = await bookingsDb.getUserBookings(userId, {
            upcoming: upcoming === 'true',
            offset: (page - 1) * limit,
            limit: parseInt(limit),
        });

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: bookings.length,
            },
        });
    } catch (err) {
        next(new BadRequestError('Failed to fetch bookings', err));
    }
}

/**
 * Cancel a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function cancelBooking(req, res, next) {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Verify booking belongs to user
        const booking = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (booking.rows.length === 0) {
            throw new BadRequestError(404, 'Booking not found');
        }

        // Don't allow cancelling completed or already cancelled bookings
        if (['cancelled', 'completed'].includes(booking.rows[0].status)) {
            throw new BadRequestError(
                'Cannot cancel a completed or already cancelled booking'
            );
        }

        // Update status to cancelled
        await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [
            'cancelled',
            id,
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(
            err instanceof BadRequestError
                ? err
                : new BadRequestError('Failed to cancel booking', err)
        );
    } finally {
        client.release();
    }
}

module.exports = {
    createBooking,
    checkAvailability,
    getUserBookings,
    cancelBooking,
};

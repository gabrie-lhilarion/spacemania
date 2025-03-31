/**
 * @file Bookings database operations for SpaceMania workspace management system
 * @module booking/bookings
 * @description Handles all database operations related to workspace bookings including:
 * - Creating new bookings
 * - Checking workspace availability
 * - Retrieving user booking history
 * @requires ../connection/connect
 */

const db = require('../connection/connect');

/**
 * @async
 * @function createBooking
 * @description Creates a new workspace booking in the database
 * @param {number} userId - ID of the user making the booking
 * @param {number} workspaceId - ID of the workspace being booked
 * @param {Date|string} startTime - Booking start time (ISO string or Date object)
 * @param {Date|string} endTime - Booking end time (ISO string or Date object)
 * @param {string|null} [specialRequests=null] - Optional special requests for the booking
 * @returns {Promise<Object>} The newly created booking record
 * @throws {Error} Will throw an error if:
 * - Timeslot is already booked (violates exclusion constraint)
 * - Invalid user_id or workspace_id (foreign key violation)
 * - Invalid time range (end_time before start_time)
 */
const createBooking = async (userId, workspaceId, startTime, endTime, specialRequests = null) => {
    const result = await db.query(
        `INSERT INTO bookings 
         (user_id, workspace_id, start_time, end_time, special_requests) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, workspaceId, startTime, endTime, specialRequests]
    );
    return result.rows[0];
};

/**
 * @async
 * @function getWorkspaceAvailability
 * @description Checks if a workspace is available for a given time range
 * @param {number} workspaceId - ID of the workspace to check
 * @param {Date|string} startTime - Desired start time (ISO string or Date object)
 * @param {Date|string} endTime - Desired end time (ISO string or Date object)
 * @returns {Promise<boolean>} True if the workspace is available, false if already booked
 * @throws {Error} Will throw an error if database query fails
 */
const getWorkspaceAvailability = async (workspaceId, startTime, endTime) => {
    const result = await db.query(
        `SELECT COUNT(*) = 0 AS is_available
         FROM bookings
         WHERE workspace_id = $1
         AND tsrange(start_time, end_time) && tsrange($2, $3)`,
        [workspaceId, startTime, endTime]
    );
    return result.rows[0].is_available;
};

/**
 * @async
 * @function getUserBookings
 * @description Retrieves all bookings for a specific user
 * @param {number} userId - ID of the user whose bookings to retrieve
 * @returns {Promise<Array<Object>>} Array of booking records with workspace details
 * @throws {Error} Will throw an error if database query fails
 * @example
 * // Returns:
 * // [{
 * //   id: 1,
 * //   user_id: 5,
 * //   workspace_id: 3,
 * //   start_time: '2023-06-15T09:00:00Z',
 * //   end_time: '2023-06-15T11:00:00Z',
 * //   workspace_name: 'Conference Room A',
 * //   // ... other booking fields
 * // }]
 */
const getUserBookings = async (userId) => {
    const result = await db.query(
        `SELECT b.*, w.name as workspace_name
         FROM bookings b
         JOIN workspaces w ON b.workspace_id = w.id
         WHERE b.user_id = $1
         ORDER BY b.start_time DESC`,
        [userId]
    );
    return result.rows;
};

module.exports = {
    createBooking,
    getWorkspaceAvailability,
    getUserBookings
};
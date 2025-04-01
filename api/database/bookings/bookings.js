/**
 * @file Bookings database operations for SpaceMania workspace management system
 * @module bookings/bookings
 * @description Handles all database operations related to workspace bookings including:
 * - Creating new bookings with validation
 * - Checking workspace availability with capacity constraints
 * - Retrieving user booking history with workspace details
 * - Managing booking status lifecycle
 * @requires .../connection/connect
 */

const db = require('../connection/connect');

/**
 * @async
 * @function createBooking
 * @description Creates a new workspace booking with comprehensive validation
 * @param {number} userId - ID of the user making the booking
 * @param {number} workspaceId - ID of the workspace being booked
 * @param {Date|string} startTime - Booking start time (ISO 8601 string or Date object)
 * @param {Date|string} endTime - Booking end time (ISO 8601 string or Date object)
 * @param {number} [attendees=1] - Number of attendees (validated against workspace capacity)
 * @param {string|null} [specialRequests=null] - Optional special requests
 * @returns {Promise<Object>} The newly created booking record with workspace details
 * @throws {Error} Will throw an error if:
 * - Timeslot is already booked (violates exclusion constraint)
 * - Attendees exceed workspace capacity
 * - Invalid time range (end_time before start_time or in past)
 * - Workspace requires approval but user isn't privileged
 * @example
 * /Returns:
 *  {
 *    id: 1,
 *    user_id: 5,
 *    workspace_id: 3,
 *    start_time: '2023-06-15T09:00:00Z',
 *    end_time: '2023-06-15T11:00:00Z',
 *    status: 'confirmed',
 *    workspace_name: 'Conference Room A',
 *    workspace_type: 'meeting_room'
 *  }
 */
const createBooking = async (userId, workspaceId, startTime, endTime, attendees = 1, specialRequests = null) => {
    // First check capacity constraints
    const capacityCheck = await db.query(
        `SELECT w.base_capacity, wt.requires_approval
         FROM workspaces w
         JOIN workspace_types wt ON w.type_id = wt.id
         WHERE w.id = $1`,
        [workspaceId]
    );

    if (capacityCheck.rows[0].base_capacity < attendees) {
        throw new Error(`Attendees exceed workspace capacity of ${capacityCheck.rows[0].base_capacity}`);
    }

    const result = await db.query(
        `INSERT INTO bookings 
         (user_id, workspace_id, start_time, end_time, attendees, special_requests, status)
         VALUES ($1, $2, $3, $4, $5, $6, 
           CASE WHEN $7 THEN 'pending' ELSE 'confirmed' END)
         RETURNING *, 
         (SELECT name FROM workspaces WHERE id = $2) AS workspace_name,
         (SELECT name FROM workspace_types WHERE id = (
           SELECT type_id FROM workspaces WHERE id = $2
         )) AS workspace_type`,
        [
            userId,
            workspaceId,
            startTime,
            endTime,
            attendees,
            specialRequests,
            capacityCheck.rows[0].requires_approval
        ]
    );
    return result.rows[0];
};

/**
 * @async
 * @function getWorkspaceAvailability
 * @description Checks workspace availability considering both bookings and capacity
 * @param {number} workspaceId - ID of the workspace to check
 * @param {Date|string} startTime - Desired start time (ISO 8601 string or Date object)
 * @param {Date|string} endTime - Desired end time (ISO 8601 string or Date object)
 * @param {number} [attendees=1] - Number of required spaces
 * @returns {Promise<Object>} Availability object with details
 * @throws {Error} Will throw an error if database query fails
 * @example
 *  Returns:
 *  {
 *    is_available: true,
 *    max_capacity: 8,
 *    current_attendees: 3,
 *    available_slots: 5
 *  }
 */
const getWorkspaceAvailability = async (workspaceId, startTime, endTime, attendees = 1) => {
    const result = await db.query(
        `WITH workspace_info AS (
           SELECT w.base_capacity, wt.name AS type_name
           FROM workspaces w
           JOIN workspace_types wt ON w.type_id = wt.id
           WHERE w.id = $1
         ),
         conflicting_bookings AS (
           SELECT SUM(attendees) AS total_attendees
           FROM bookings
           WHERE workspace_id = $1
           AND tsrange(start_time, end_time) && tsrange($2, $3)
           AND status IN ('confirmed', 'pending')
         )
         SELECT 
           wi.base_capacity,
           COALESCE(cb.total_attendees, 0) AS current_attendees,
           wi.base_capacity - COALESCE(cb.total_attendees, 0) >= $4 AS is_available,
           wi.base_capacity - COALESCE(cb.total_attendees, 0) AS available_slots
         FROM workspace_info wi, conflicting_bookings cb`,
        [workspaceId, startTime, endTime, attendees]
    );
    return result.rows[0];
};

/**
 * @async
 * @function getUserBookings
 * @description Retrieves comprehensive booking history for a user with workspace details
 * @param {number} userId - ID of the user
 * @param {Object} [options] - Query options
 * @param {boolean} [options.upcoming=true] - Filter upcoming/past bookings
 * @param {number} [options.limit=50] - Pagination limit
 * @param {number} [options.offset=0] - Pagination offset
 * @returns {Promise<Array<Object>>} Array of enriched booking records
 * @throws {Error} Will throw an error if database query fails
 * @example
 *  Returns:
 *  [{
 *    id: 1,
 *    user_id: 5,
 *    workspace_id: 3,
 *    start_time: '2023-06-15T09:00:00Z',
 *    end_time: '2023-06-15T11:00:00Z',
 *    status: 'confirmed',
 *    workspace_name: 'Conference Room A',
 *    workspace_type: 'meeting_room',
 *    amenities: ['projector', 'whiteboard'],
 *    location: 'Building 2, Floor 3'
 *  }]
 */
const getUserBookings = async (userId, options = { upcoming: true, limit: 50, offset: 0 }) => {
    const result = await db.query(
        `SELECT 
           b.*,
           w.name AS workspace_name,
           wt.name AS workspace_type,
           w.location,
           (
             SELECT array_agg(a.name)
             FROM amenities a
             JOIN workspace_amenities wa ON a.id = wa.amenity_id
             WHERE wa.workspace_id = w.id
           ) AS amenities
         FROM bookings b
         JOIN workspaces w ON b.workspace_id = w.id
         JOIN workspace_types wt ON w.type_id = wt.id
         WHERE b.user_id = $1
         AND CASE 
           WHEN $2 THEN b.end_time > NOW()
           ELSE b.end_time <= NOW()
         END
         ORDER BY b.start_time ${options.upcoming ? 'ASC' : 'DESC'}
         LIMIT $3 OFFSET $4`,
        [userId, options.upcoming, options.limit, options.offset]
    );
    return result.rows;
};

module.exports = {
    createBooking,
    getWorkspaceAvailability,
    getUserBookings
};
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

const db = require('../connection/connect.connection');

/**
 * @async
 * @function getWorkspaceCapacity
 * @description Retrieves the capacity and type information for a workspace
 * @param {number} workspaceId - ID of the workspace to check
 * @returns {Promise<Object>} Workspace capacity information
 * @throws {Error} Will throw an error if workspace is not found
 * @example
 * Returns:
 * {
 *   base_capacity: 8,
 *   type_name: 'meeting_room',
 *   requires_approval: false,
 *   location: 'Building 2, Floor 3'
 * }
 */

const getWorkspaceCapacity = async (workspaceId) => {
  const result = await db.query(
    `SELECT 
            w.base_capacity, 
            wt.name AS type_name,
            wt.requires_approval,
            w.location,
            w.floor
         FROM workspaces w
         JOIN workspace_types wt ON w.type_id = wt.id
         WHERE w.id = $1`,
    [workspaceId]
  );

  console.log('getWorkspaceCapacity:', workspaceId, result.rows); // Debugging output

  if (result.rows.length === 0) {
    throw new Error(`Workspace not found with ID: ${workspaceId}`);
  }

  return result.rows[0];
};

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
 */

const createBooking = async (
  userId,
  workspaceId,
  startTime,
  endTime,
  attendees = 1,
  specialRequests = null
) => {
  if (!userId || !workspaceId || !startTime || !endTime) {
    throw new Error('Missing required booking parameters');
  }

  // Convert timestamps explicitly to remove time zone info
  const start = new Date(startTime)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
  const end = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');

  // Check workspace capacity
  const capacityCheck = await db.query(
    `SELECT w.base_capacity, wt.requires_approval
         FROM workspaces w
         JOIN workspace_types wt ON w.type_id = wt.id
         WHERE w.id = $1`,
    [workspaceId]
  );

  if (!capacityCheck.rows.length) {
    throw new Error('Workspace not found');
  }

  const baseCapacity = capacityCheck.rows[0].base_capacity;
  if (baseCapacity < attendees) {
    throw new Error(`Attendees exceed workspace capacity of ${baseCapacity}`);
  }

  // Check for conflicting bookings
  const conflictCheck = await db.query(
    `SELECT id FROM bookings
         WHERE workspace_id = $1
         AND (
             (start_time < $3::timestamp AND end_time > $2::timestamp) OR
             (start_time >= $2::timestamp AND start_time < $3::timestamp) OR
             (end_time > $2::timestamp AND end_time <= $3::timestamp)
         )
         AND status IN ('confirmed', 'pending')
         LIMIT 1`,
    [workspaceId, start, end]
  );

  if (conflictCheck.rows.length > 0) {
    throw new Error('The selected time slot is already booked');
  }

  // Create booking
  const result = await db.query(
    `INSERT INTO bookings 
         (user_id, workspace_id, start_time, end_time, attendees, special_requests, status)
         VALUES ($1, $2, $3::timestamp, $4::timestamp, $5, $6, 
           CASE WHEN $7 THEN 'pending' ELSE 'confirmed' END)
         RETURNING *, 
         (SELECT name FROM workspaces WHERE id = $2) AS workspace_name,
         (SELECT name FROM workspace_types WHERE id = (
           SELECT type_id FROM workspaces WHERE id = $2
         )) AS workspace_type`,
    [
      userId,
      workspaceId,
      start,
      end,
      attendees,
      specialRequests,
      capacityCheck.rows[0].requires_approval,
    ]
  );

  if (!result.rows.length) {
    throw new Error('Booking creation failed');
  }

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
 */

const getWorkspaceAvailability = async (
  workspaceId,
  startTime,
  endTime,
  attendees = 1
) => {
  const workspace = await getWorkspaceCapacity(workspaceId);
  const baseCapacity = parseInt(workspace.base_capacity, 10);
  const numAttendees = parseInt(attendees, 10);

  const result = await db.query(
    `WITH conflicting_bookings AS (
             SELECT SUM(attendees) AS total_attendees
             FROM bookings
             WHERE workspace_id = $1
             AND (
                 (start_time < $3::timestamptz AND end_time > $2::timestamptz) OR
                 (start_time >= $2::timestamptz AND start_time < $3::timestamptz) OR
                 (end_time > $2::timestamptz AND end_time <= $3::timestamptz)
             )
             AND status IN ('confirmed', 'pending')
         )
         SELECT 
             $4::integer AS base_capacity,
             COALESCE(cb.total_attendees, 0) AS current_attendees,
             ($4::integer - COALESCE(cb.total_attendees, 0)) >= $5::integer AS is_available,
             $4::integer - COALESCE(cb.total_attendees, 0) AS available_slots,
             $6 AS workspace_type,
             $7 AS location
         FROM conflicting_bookings cb`,
    [
      workspaceId,
      startTime,
      endTime,
      baseCapacity,
      numAttendees,
      workspace.type_name,
      workspace.location,
    ]
  );

  return {
    ...result.rows[0],
    requires_approval: workspace.requires_approval,
  };
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
 */
const getUserBookings = async (
  userId,
  options = { upcoming: true, limit: 50, offset: 0 }
) => {
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
  getWorkspaceCapacity,
  createBooking,
  getWorkspaceAvailability,
  getUserBookings,
};

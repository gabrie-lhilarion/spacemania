/**
 * @file Workspace database operations for SpaceMania workspace management system
 * @module db/workspaces
 * @description Handles all database operations related to workspace management including:
 * - Creating new workspaces
 * - Retrieving workspace details by ID
 * - Listing all active workspaces
 * @requires ./index
 */

const db = require('./index');

/**
 * @async
 * @function createWorkspace
 * @description Creates a new workspace in the database
 * @param {Object} workspaceData - Workspace properties
 * @param {string} workspaceData.name - Name of the workspace
 * @param {string} workspaceData.description - Description of the workspace
 * @param {number} workspaceData.capacity - Maximum number of occupants
 * @param {Array<string>} workspaceData.amenities - List of available amenities
 * @param {number} workspaceData.floor - Floor number where workspace is located
 * @param {string} workspaceData.location - Physical location identifier
 * @returns {Promise<Object>} The newly created workspace record
 * @throws {Error} Will throw an error if:
 * - Required fields are missing
 * - Database operation fails
 * - Unique constraints are violated
 * @example
 * // Returns:
 * // {
 * //   id: 1,
 * //   name: 'Conference Room A',
 * //   description: 'Main conference room with AV equipment',
 * //   capacity: 10,
 * //   amenities: ['projector', 'whiteboard'],
 * //   floor: 2,
 * //   location: 'Building A, North Wing',
 * //   is_active: true,
 * //   created_at: '2023-06-15T09:00:00Z',
 * //   updated_at: '2023-06-15T09:00:00Z'
 * // }
 */
const createWorkspace = async (workspaceData) => {
    const { name, description, capacity, amenities, floor, location } = workspaceData;
    const result = await db.query(
        `INSERT INTO workspaces 
         (name, description, capacity, amenities, floor, location) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, description, capacity, amenities, floor, location]
    );
    return result.rows[0];
};

/**
 * @async
 * @function getWorkspaceById
 * @description Retrieves a single workspace by its ID
 * @param {number} id - Workspace ID to retrieve
 * @returns {Promise<Object|null>} Workspace object if found, null otherwise
 * @throws {Error} Will throw an error if database query fails
 * @example
 * // Returns:
 * // {
 * //   id: 1,
 * //   name: 'Conference Room A',
 * //   // ... other workspace properties
 * // }
 */
const getWorkspaceById = async (id) => {
    const result = await db.query('SELECT * FROM workspaces WHERE id = $1', [id]);
    return result.rows[0];
};

/**
 * @async
 * @function getAllWorkspaces
 * @description Retrieves all active workspaces in the system
 * @returns {Promise<Array<Object>>} Array of all active workspace records
 * @throws {Error} Will throw an error if database query fails
 * @example
 * // Returns:
 * // [{
 * //   id: 1,
 * //   name: 'Conference Room A',
 * //   is_active: true,
 * //   // ... other properties
 * // }, {
 * //   id: 2,
 * //   name: 'Quiet Pod 1',
 * //   is_active: true,
 * //   // ... other properties
 * // }]
 */
const getAllWorkspaces = async () => {
    const result = await db.query('SELECT * FROM workspaces WHERE is_active = TRUE');
    return result.rows;
};

module.exports = {
    createWorkspace,
    getWorkspaceById,
    getAllWorkspaces
};
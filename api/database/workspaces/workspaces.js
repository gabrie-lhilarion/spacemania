/**
 * @file Workspace database operations for SpaceMania workspace management system
 * @module databases/workspaces
 * @description Handles all database operations related to workspace management including:
 * - Creating new workspaces with type associations
 * - Retrieving enriched workspace details
 * - Listing workspaces with advanced filtering
 * - Managing workspace amenities
 * @requires ../connection/connect
 */

const db = require('../connection/connect');

/**
 * @async
 * @function createWorkspace
 * @description Creates a new workspace with type association and amenities
 * @param {Object} workspaceData - Workspace properties
 * @param {string} workspaceData.name - Name of the workspace (required)
 * @param {string} workspaceData.description - Description of the workspace
 * @param {number} workspaceData.type_id - ID of the workspace type (required)
 * @param {number} workspaceData.floor - Floor number (required)
 * @param {string} workspaceData.location - Physical location (required)
 * @param {number} workspaceData.base_capacity - Maximum occupants (required)
 * @param {Object} [workspaceData.type_specific_attributes] - Type-specific properties
 * @param {Array<number>} [workspaceData.amenity_ids] - Array of amenity IDs
 * @returns {Promise<Object>} The newly created workspace with full details
 * @throws {Error} Will throw an error if:
 * - Required fields are missing
 * - Invalid type_id or amenity_ids
 * - Database operation fails
 * @example
 *  Returns:
 *  {
 *    id: 1,
 *    name: 'Conference Room A',
 *    type_id: 3,
 *    type_name: 'meeting_room',
 *    floor: 2,
 *    location: 'North Wing',
 *    base_capacity: 8,
 *    amenities: ['projector', 'whiteboard'],
 *    is_active: true,
 *    created_at: '2023-06-15T09:00:00Z'
 *  }
 */
const createWorkspace = async (workspaceData) => {
    const { amenity_ids = [], ...workspaceProps } = workspaceData;

    // Start transaction for atomic operations
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Insert workspace
        const workspaceResult = await client.query(
            `INSERT INTO workspaces 
             (name, description, type_id, floor, location, base_capacity, type_specific_attributes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                workspaceProps.name,
                workspaceProps.description,
                workspaceProps.type_id,
                workspaceProps.floor,
                workspaceProps.location,
                workspaceProps.base_capacity,
                workspaceProps.type_specific_attributes || null
            ]
        );

        const workspace = workspaceResult.rows[0];

        // Add amenities if provided
        if (amenity_ids.length > 0) {
            await client.query(
                `INSERT INTO workspace_amenities (workspace_id, amenity_id)
                 SELECT $1, unnest($2::int[])`,
                [workspace.id, amenity_ids]
            );
        }

        await client.query('COMMIT');

        // Return enriched workspace data
        return getWorkspaceById(workspace.id);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * @async
 * @function getWorkspaceById
 * @description Retrieves a workspace with complete details including type and amenities
 * @param {number} id - Workspace ID to retrieve
 * @param {boolean} [includeInactive=false] - Whether to include inactive workspaces
 * @returns {Promise<Object|null>} Enriched workspace object or null if not found
 * @throws {Error} Will throw an error if database query fails
 * @example
 *  Returns:
 *  {
 *    id: 1,
 *    name: 'Conference Room A',
 *    description: 'Main meeting space',
 *    type_id: 3,
 *    type_name: 'meeting_room',
 *    floor: 2,
 *    location: 'North Wing',
 *    base_capacity: 8,
 *    is_active: true,
 *    amenities: [
 *      { id: 1, name: 'projector', quantity: 1 },
 *      { id: 2, name: 'whiteboard', quantity: 1 }
 *    ],
 *    type_specific_attributes: { has_vc: true },
 *    created_at: '2023-06-15T09:00:00Z'
 *  }
 */
const getWorkspaceById = async (id, includeInactive = false) => {
    const result = await db.query(
        `SELECT 
            w.*,
            wt.name AS type_name,
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', a.id,
                    'name', a.name,
                    'quantity', wa.quantity
                ))
                FROM amenities a
                JOIN workspace_amenities wa ON a.id = wa.amenity_id
                WHERE wa.workspace_id = w.id
            ) AS amenities
         FROM workspaces w
         JOIN workspace_types wt ON w.type_id = wt.id
         WHERE w.id = $1
         ${includeInactive ? '' : 'AND w.is_active = true'}`,
        [id]
    );
    return result.rows[0] || null;
};

/**
 * @async
 * @function getAllWorkspaces
 * @description Retrieves workspaces with advanced filtering and pagination
 * @param {Object} [filters] - Filtering options
 * @param {number} [filters.type_id] - Filter by workspace type
 * @param {number} [filters.floor] - Filter by floor number
 * @param {boolean} [filters.includeInactive=false] - Include inactive workspaces
 * @param {number} [filters.limit=50] - Pagination limit
 * @param {number} [filters.offset=0] - Pagination offset
 * @returns {Promise<Array<Object>>} Array of enriched workspace records
 * @throws {Error} Will throw an error if database query fails
 * @example
 *  Returns:
 *  [{
 *    id: 1,
 *    name: 'Conference Room A',
 *    type_name: 'meeting_room',
 *    floor: 2,
 *    amenities: ['projector', 'whiteboard'],
 *     ... other properties
 *  }]
 */
const getAllWorkspaces = async (filters = {}) => {
    const {
        type_id,
        floor,
        includeInactive = false,
        limit = 50,
        offset = 0
    } = filters;

    const queryParams = [];
    let paramCount = 0;

    let query = `
        SELECT 
            w.*,
            wt.name AS type_name,
            (
                SELECT array_agg(a.name)
                FROM amenities a
                JOIN workspace_amenities wa ON a.id = wa.amenity_id
                WHERE wa.workspace_id = w.id
            ) AS amenities
        FROM workspaces w
        JOIN workspace_types wt ON w.type_id = wt.id
        WHERE 1=1`;

    if (!includeInactive) {
        query += ` AND w.is_active = true`;
    }

    if (type_id) {
        paramCount++;
        query += ` AND w.type_id = $${paramCount}`;
        queryParams.push(type_id);
    }

    if (floor) {
        paramCount++;
        query += ` AND w.floor = $${paramCount}`;
        queryParams.push(floor);
    }

    query += `
        ORDER BY w.name ASC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    return result.rows;
};

module.exports = {
    createWorkspace,
    getWorkspaceById,
    getAllWorkspaces
};
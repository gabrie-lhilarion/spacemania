const db = require('../connection/connect.connection');
const {
  createExtension,
  createUserTable,
  createWorkspaceTypeTable,
  createWorkspacesTable,
  createAmenitiesTable,
  createWorkspaceAmenitiesTable,
  createBookingsTable,
  createBookingsTimeRangeIndex,
  createNoDoubleBookingConstraint,
  insertDefaultWorkspaceTypes,
  insertDefaultAmenities,
} = require('./queries');

/**
 * Initializes the database by creating necessary tables, constraints, indexes, and default data.
 * @async
 * @function setupDatabase
 * @returns {Promise<void>} Resolves when the database is successfully set up.
 */
async function setupDatabase() {
  const client = await db.pool.connect();
  try {
    console.log('Starting database initialization...');
    await client.query('BEGIN');
    await client.query(createExtension);
    await client.query(createUserTable);
    await client.query(createWorkspaceTypeTable);
    await client.query(createWorkspacesTable);
    await client.query(createAmenitiesTable);
    await client.query(createWorkspaceAmenitiesTable);
    await client.query(createBookingsTable);
    await client.query(createBookingsTimeRangeIndex);
    await client.query(createNoDoubleBookingConstraint);
    await client.query(insertDefaultWorkspaceTypes);
    await client.query(insertDefaultAmenities);
    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', err.message);
  } finally {
    client.release();
  }
}

module.exports = setupDatabase;

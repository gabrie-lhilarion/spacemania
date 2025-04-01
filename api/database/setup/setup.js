const db = require('../connection/connect');

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

        /**
         * Enables the PostgreSQL `btree_gist` extension.
         * This extension is required for the `EXCLUDE USING gist` constraint in the `bookings` table.
         */
        await client.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

        // ====================== USERS TABLE ======================
        /**
         * Creates the `users` table to store application users.
         * 
         * - `role`: Defines the user's role (`user`, `admin`, `manager`).
         * - `created_at` and `updated_at` timestamps for record tracking.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'user' 
                  CHECK (role IN ('user', 'admin', 'manager')),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // ====================== WORKSPACE TYPES TABLE ======================
        /**
         * Stores different types of workspaces.
         * 
         * - `default_capacity`: The default number of users a workspace type can accommodate.
         * - `requires_approval`: If true, bookings for this type need admin approval.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS workspace_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                default_capacity INTEGER,
                icon VARCHAR(100),
                requires_approval BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // ====================== WORKSPACES TABLE ======================
        /**
         * Stores workspace details.
         * 
         * - `type_id`: Foreign key linking to `workspace_types`.
         * - `location`: Description of the workspace location.
         * - `type_specific_attributes`: JSONB column to store flexible attributes.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS workspaces (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type_id INTEGER NOT NULL,
                floor INTEGER NOT NULL,
                location VARCHAR(255) NOT NULL,
                base_capacity INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                type_specific_attributes JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT workspaces_type_fk FOREIGN KEY (type_id) 
                    REFERENCES workspace_types(id) ON DELETE CASCADE
            )
        `);

        // ====================== AMENITIES TABLE ======================
        /**
         * Stores available amenities (e.g., projectors, whiteboards).
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS amenities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // ====================== WORKSPACE AMENITIES TABLE ======================
        /**
         * Many-to-many relationship between workspaces and amenities.
         * 
         * - `workspace_id`: References a workspace.
         * - `amenity_id`: References an amenity.
         * - `quantity`: Number of amenities available in that workspace.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS workspace_amenities (
                workspace_id INTEGER NOT NULL,
                amenity_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                notes TEXT,
                PRIMARY KEY (workspace_id, amenity_id),
                CONSTRAINT workspace_amenities_workspace_fk FOREIGN KEY (workspace_id) 
                    REFERENCES workspaces(id) ON DELETE CASCADE,
                CONSTRAINT workspace_amenities_amenity_fk FOREIGN KEY (amenity_id) 
                    REFERENCES amenities(id) ON DELETE CASCADE
            )
        `);

        // ====================== BOOKINGS TABLE ======================
        /**
         * Stores bookings for workspaces.
         * 
         * - `start_time` and `end_time`: Define the booked time range.
         * - `status`: Represents booking status (`pending`, `confirmed`, `cancelled`, etc.).
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                workspace_id INTEGER NOT NULL,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
                attendees INTEGER DEFAULT 1,
                special_requests TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT bookings_user_fk FOREIGN KEY (user_id) 
                    REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT bookings_workspace_fk FOREIGN KEY (workspace_id) 
                    REFERENCES workspaces(id) ON DELETE CASCADE
            )
        `);

        // ====================== GIST INDEX FOR TIME CONFLICT CHECK ======================
        /**
         * Creates a GIST index to improve query performance for overlapping time range checks.
         */
        await client.query(`
            CREATE INDEX IF NOT EXISTS bookings_time_range_idx 
            ON bookings USING gist (workspace_id, tstzrange(start_time, end_time, '[]'))
        `);

        /**
         * Ensures that a workspace cannot be double-booked for the same time range.
         */
        await client.query(`
            ALTER TABLE bookings ADD CONSTRAINT no_double_booking
            EXCLUDE USING gist (
                workspace_id WITH =,
                tstzrange(start_time, end_time, '[]') WITH &&
            )
        `);

        // ====================== DEFAULT DATA ======================
        /**
         * Inserts default workspace types if they do not already exist.
         */
        await client.query(`
            INSERT INTO workspace_types (name, description, default_capacity, requires_approval)
            VALUES ('hot_desk', 'Flexible unassigned workstations', 1, false)
            ON CONFLICT (name) DO NOTHING
        `);

        await client.query(`
            INSERT INTO workspace_types (name, description, default_capacity, requires_approval)
            VALUES ('meeting_room', 'Spaces for team meetings', 8, true)
            ON CONFLICT (name) DO NOTHING
        `);

        /**
         * Inserts default amenities if they do not already exist.
         */
        await client.query(`
            INSERT INTO amenities (name, description)
            VALUES ('projector', 'Presentation projector')
            ON CONFLICT (name) DO NOTHING
        `);

        await client.query(`
            INSERT INTO amenities (name, description)
            VALUES ('whiteboard', 'Writing surface')
            ON CONFLICT (name) DO NOTHING
        `);

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

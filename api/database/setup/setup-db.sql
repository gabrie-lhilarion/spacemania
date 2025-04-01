/* =============================================
 * SPACEMANIA DATABASE SCHEMA - NORMALIZED DESIGN
 * =============================================
 * This schema implements a robust workspace management system with:
 * - Proper type classification for workspaces
 * - Comprehensive booking capabilities
 * - Amenity tracking
 * - Audit logging
 * 
 * Designed for PostgreSQL 12+ with TimescaleDB compatibility
 */

-- Enable essential PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Provides cryptographic functions for password hashing
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Required for exclusion constraints on booking time ranges

/* =============================================
 * CORE TABLES
 * =============================================
 * These tables form the foundation of the system
 */

-- USERS: Stores all user accounts with authentication data
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                         -- Auto-incrementing unique identifier
  name VARCHAR(255) NOT NULL,                   -- Full name of the user (required)
  email VARCHAR(255) UNIQUE NOT NULL,           -- Email address (unique, required for login)
  password VARCHAR(255) NOT NULL,               -- Hashed password (using bcrypt)
  role VARCHAR(50) NOT NULL DEFAULT 'user'      -- Role-based access control
    CHECK (role IN ('user', 'admin', 'manager')), -- Only allowed role values
  created_at TIMESTAMPTZ DEFAULT NOW(),         -- Timestamp of record creation (with timezone)
  updated_at TIMESTAMPTZ DEFAULT NOW()          -- Timestamp of last update (with timezone)
);

COMMENT ON TABLE users IS 'Stores all user accounts and authentication information';
COMMENT ON COLUMN users.role IS 'Determines access levels: user (basic), admin (full access), manager (limited admin)';

-- WORKSPACE_TYPES: Defines different categories of workspaces
CREATE TABLE IF NOT EXISTS workspace_types (
  id SERIAL PRIMARY KEY,                         -- Auto-incrementing unique identifier
  name VARCHAR(50) NOT NULL,                    -- Type name (e.g., "meeting_room", "hot_desk")
  description TEXT,                              -- Detailed description of the type
  default_capacity INTEGER,                      -- Typical capacity for this type
  icon VARCHAR(100),                             -- UI icon reference for this type
  requires_approval BOOLEAN DEFAULT FALSE,       -- Whether bookings need manual approval
  created_at TIMESTAMPTZ DEFAULT NOW(),         -- Record creation timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW(),         -- Last update timestamp
  CONSTRAINT unique_workspace_type_name UNIQUE (name) -- Ensure type names are unique
);

COMMENT ON TABLE workspace_types IS 'Master list of all workspace classifications';
COMMENT ON COLUMN workspace_types.requires_approval IS 'When true, bookings require manager approval';

-- WORKSPACES: Physical spaces that can be booked
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,                         -- Auto-incrementing unique identifier
  name VARCHAR(255) NOT NULL,                   -- Display name of the workspace
  description TEXT,                              -- Detailed description
  type_id INTEGER NOT NULL REFERENCES workspace_types(id), -- Link to workspace type
  floor INTEGER NOT NULL,                        -- Floor number where located
  location VARCHAR(255) NOT NULL,                -- Physical location description
  base_capacity INTEGER NOT NULL,                -- Maximum number of occupants
  is_active BOOLEAN DEFAULT TRUE,                -- Soft-delete flag
  type_specific_attributes JSONB,                -- Flexible storage for type-specific properties
  created_at TIMESTAMPTZ DEFAULT NOW(),         -- Record creation timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW(),         -- Last update timestamp
  CONSTRAINT valid_capacity CHECK (base_capacity > 0) -- Prevent invalid capacity values
);

COMMENT ON TABLE workspaces IS 'Physical spaces available for booking';
COMMENT ON COLUMN workspaces.type_specific_attributes IS 'JSON structure for type-specific properties like {has_projector: true, has_whiteboard: false}';

-- AMENITIES: Available features and equipment
CREATE TABLE IF NOT EXISTS amenities (
  id SERIAL PRIMARY KEY,                         -- Auto-incrementing unique identifier
  name VARCHAR(100) NOT NULL,                   -- Name of the amenity (e.g., "Projector")
  description TEXT,                              -- Detailed description
  icon VARCHAR(100),                             -- UI icon reference
  created_at TIMESTAMPTZ DEFAULT NOW(),         -- Record creation timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW()          -- Last update timestamp
);

COMMENT ON TABLE amenities IS 'Available features and equipment that can be associated with workspaces';

-- WORKSPACE_AMENITIES: Junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS workspace_amenities (
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,                    -- How many of this amenity exists here
  notes TEXT,                                    -- Additional details about this amenity
  PRIMARY KEY (workspace_id, amenity_id)         -- Composite primary key
);

COMMENT ON TABLE workspace_amenities IS 'Associates amenities with workspaces and tracks quantities';

-- BOOKINGS: Reservation records
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,                         -- Auto-incrementing unique identifier
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,              -- Booking start (with timezone)
  end_time TIMESTAMPTZ NOT NULL,                -- Booking end (with timezone)
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed' -- Booking lifecycle state
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
  attendees INTEGER DEFAULT 1,                   -- Number of people expected
  special_requests TEXT,                         -- Custom user requests
  created_at TIMESTAMPTZ DEFAULT NOW(),         -- Record creation timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW(),         -- Last update timestamp
  
  -- Prevent double-booking of the same workspace for overlapping times
  EXCLUDE USING gist (
    workspace_id WITH =,
    tsrange(start_time, end_time) WITH &&
  ),
  
  -- Ensure logical time ranges (end after start)
  CONSTRAINT valid_booking_time CHECK (end_time > start_time),
  
  -- Validate attendee count is positive and doesn't exceed capacity
  CONSTRAINT valid_attendee_count CHECK (attendees > 0)
);

COMMENT ON TABLE bookings IS 'Records all workspace reservations and their status';
COMMENT ON COLUMN bookings.status IS 'Lifecycle state: pending, confirmed, cancelled, completed, rejected';

/* =============================================
 * PERFORMANCE OPTIMIZATIONS
 * =============================================
 * Indexes to ensure fast query performance
 */

-- Workspace indexes
CREATE INDEX IF NOT EXISTS workspaces_type_idx ON workspaces(type_id);
COMMENT ON INDEX workspaces_type_idx IS 'Speeds up queries filtering by workspace type';

CREATE INDEX IF NOT EXISTS workspaces_location_idx ON workspaces(location);
COMMENT ON INDEX workspaces_location_idx IS 'Optimizes location-based workspace searches';

CREATE INDEX IF NOT EXISTS workspaces_floor_idx ON workspaces(floor);
COMMENT ON INDEX workspaces_floor_idx IS 'Improves performance for floor-based queries';

-- Booking indexes
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
COMMENT ON INDEX bookings_user_idx IS 'Speeds up retrieval of user booking history';

CREATE INDEX IF NOT EXISTS bookings_workspace_idx ON bookings(workspace_id);
COMMENT ON INDEX bookings_workspace_idx IS 'Optimizes workspace booking history lookups';

CREATE INDEX IF NOT EXISTS bookings_time_range_idx ON bookings USING gist (tsrange(start_time, end_time));
COMMENT ON INDEX bookings_time_range_idx IS 'Specialized index for time range queries';

CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
COMMENT ON INDEX bookings_status_idx IS 'Improves performance for status-based booking filters';

/* =============================================
 * DEFAULT REFERENCE DATA
 * =============================================
 * Pre-populates common types and amenities
 */

-- Standard workspace types
INSERT INTO workspace_types (name, description, default_capacity, requires_approval) VALUES
  ('hot_desk', 'Flexible unassigned workstations', 1, false),
  ('dedicated_desk', 'Permanently assigned workstations', 1, false),
  ('meeting_room', 'Spaces for team meetings', 8, true),
  ('conference_room', 'Larger spaces for presentations', 20, true),
  ('focus_booth', 'Small enclosed spaces for individual work', 1, false),
  ('lounge_area', 'Informal collaborative spaces', 6, false)
ON CONFLICT (name) DO NOTHING;

-- Common amenities
INSERT INTO amenities (name, description) VALUES
  ('monitor', 'External display monitor'),
  ('dock', 'Laptop docking station'),
  ('keyboard', 'External keyboard'),
  ('mouse', 'External mouse'),
  ('whiteboard', 'Writing surface'),
  ('projector', 'Presentation projector'),
  ('teleconference', 'Video conferencing equipment'),
  ('power_outlets', 'Accessible power sources'),
  ('adjustable_chair', 'Ergonomic seating')
ON CONFLICT (name) DO NOTHING;

/* =============================================
 * AUDIT TRAIL TABLES
 * =============================================
 * For tracking changes to critical data
 */

-- Workspace change history
CREATE TABLE IF NOT EXISTS workspace_audit_log (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL,                 -- Reference to changed workspace
  changed_by INTEGER REFERENCES users(id),      -- Who made the change
  change_type VARCHAR(20) NOT NULL              -- Type of change
    CHECK (change_type IN ('create', 'update', 'deactivate')),
  old_values JSONB,                             -- Snapshot before change
  new_values JSONB,                             -- Snapshot after change
  changed_at TIMESTAMPTZ DEFAULT NOW()          -- When change occurred
);

COMMENT ON TABLE workspace_audit_log IS 'Tracks all modifications to workspace records';
COMMENT ON COLUMN workspace_audit_log.old_values IS 'JSON snapshot of pre-change state';

-- Booking change history
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,                  -- Reference to changed booking
  changed_by INTEGER REFERENCES users(id),      -- Who made the change
  change_type VARCHAR(20) NOT NULL              -- Type of change
    CHECK (change_type IN ('create', 'update', 'status_change')),
  old_values JSONB,                             -- Snapshot before change
  new_values JSONB,                             -- Snapshot after change
  changed_at TIMESTAMPTZ DEFAULT NOW()          -- When change occurred
);

COMMENT ON TABLE booking_audit_log IS 'Tracks all modifications to booking records';
COMMENT ON COLUMN booking_audit_log.change_type IS 'Categorizes the type of change made';

/* =============================================
 * END OF SCHEMA DEFINITION
 * =============================================
 */
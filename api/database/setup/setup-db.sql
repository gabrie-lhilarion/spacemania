-- Creates the users table for storing all user accounts
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                     -- Auto-incrementing primary key
  name VARCHAR(255) NOT NULL,                -- User's full name (required)
  email VARCHAR(255) UNIQUE NOT NULL,        -- Email address (must be unique and required)
  password VARCHAR(255) NOT NULL,            -- Hashed password (required)
  role VARCHAR(50) DEFAULT 'user'            -- User role with default value
    CHECK (role IN ('user', 'admin', 'manager')),  -- Only allowed role values
  created_at TIMESTAMP DEFAULT NOW(),        -- Automatic creation timestamp
  updated_at TIMESTAMP DEFAULT NOW()         -- Automatic update timestamp
);

-- Creates the workspaces table for storing available workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,                     -- Auto-incrementing primary key
  name VARCHAR(255) NOT NULL,               -- Workspace name (required)
  description TEXT,                          -- Optional detailed description
  capacity INTEGER NOT NULL,                 -- Maximum occupancy (required)
  amenities TEXT[],                          -- Array of available amenities
  floor INTEGER NOT NULL,                    -- Floor number (required)
  location VARCHAR(255) NOT NULL,            -- Physical location (required)
  is_active BOOLEAN DEFAULT TRUE,            -- Active status flag
  created_at TIMESTAMP DEFAULT NOW(),        -- Automatic creation timestamp
  updated_at TIMESTAMP DEFAULT NOW()         -- Automatic update timestamp
);

-- Creates the bookings table for workspace reservations
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,                     -- Auto-incrementing primary key
  user_id INTEGER REFERENCES users(id)       -- Foreign key to users table
    ON DELETE CASCADE,                       -- Delete bookings if user is deleted
  workspace_id INTEGER REFERENCES workspaces(id)  -- Foreign key to workspaces
    ON DELETE CASCADE,                       -- Delete bookings if workspace is deleted
  start_time TIMESTAMP NOT NULL,             -- Booking start time (required)
  end_time TIMESTAMP NOT NULL,               -- Booking end time (required)
  status VARCHAR(50) DEFAULT 'confirmed'     -- Booking status with default
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),  -- Allowed statuses
  special_requests TEXT,                     -- Optional special requirements
  created_at TIMESTAMP DEFAULT NOW(),        -- Automatic creation timestamp
  updated_at TIMESTAMP DEFAULT NOW(),        -- Automatic update timestamp
  
  -- Exclusion constraint prevents double-booking of workspaces
  -- Uses PostgreSQL's range types to prevent overlapping time slots
  EXCLUDE USING gist (
    workspace_id WITH =,                     -- For the same workspace...
    tsrange(start_time, end_time) WITH &&    -- ...prevent overlapping time ranges
  )
);

-- Creates an index for faster user-based booking queries
CREATE INDEX IF NOT EXISTS bookings_user_idx 
  ON bookings(user_id);

-- Creates an index for faster workspace-based booking queries
CREATE INDEX IF NOT EXISTS bookings_workspace_idx 
  ON bookings(workspace_id);

-- Creates a specialized index for efficient time range queries
CREATE INDEX IF NOT EXISTS bookings_time_range_idx 
  ON bookings USING gist (tsrange(start_time, end_time));
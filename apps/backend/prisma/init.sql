-- Initialize database with extensions and basic setup
-- This file is run when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For similarity searches

-- Create indexes for phone number similarity search
-- (These will be created after table creation via migrations)
-- Initialize the Teen CRM database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (handled by POSTGRES_DB environment variable)
-- Additional initialization can be added here

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (these will be created by Prisma migrations)
-- But we can add custom indexes here if needed

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Teen CRM database initialized successfully';
END $$;
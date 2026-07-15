-- Add updated_at column to app.comment table
ALTER TABLE app.comment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

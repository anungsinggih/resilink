-- Add image_url column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add pdf_url column to orders table for storing uploaded PDF files
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Drop columns that are no longer needed (tracking_number, courier, order_id)
-- We'll use auto-incrementing ID as the order number instead
ALTER TABLE orders DROP COLUMN IF EXISTS tracking_number;
ALTER TABLE orders DROP COLUMN IF EXISTS courier;
ALTER TABLE orders DROP COLUMN IF EXISTS order_id;

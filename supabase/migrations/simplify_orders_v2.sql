-- Simplify orders table - remove product_id requirement
-- Orders now only need PDF and Image pair, no product selection needed

ALTER TABLE orders DROP COLUMN IF EXISTS product_id;
ALTER TABLE orders DROP COLUMN IF EXISTS original_price;

-- Make sure we have the essential columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create storage buckets for PDFs and images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('order-pdfs', 'order-pdfs', true, 10485760, ARRAY['application/pdf']),
  ('order-images', 'order-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies for order-pdfs bucket
CREATE POLICY IF NOT EXISTS "Public can read PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can delete their PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-pdfs');

-- Policies for order-images bucket
CREATE POLICY IF NOT EXISTS "Public can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');

CREATE POLICY IF NOT EXISTS "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');

CREATE POLICY IF NOT EXISTS "Anyone can delete their images"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-images');

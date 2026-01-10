# Supabase Storage Setup

## Required Storage Buckets

You need to create 2 storage buckets in Supabase Dashboard:

### 1. Create `order-pdfs` bucket
- Go to Supabase Dashboard → Storage
- Click "New bucket"
- Name: `order-pdfs`
- Public bucket: **YES** (enable public access)
- File size limit: 10 MB (recommended)
- Allowed MIME types: `application/pdf`

### 2. Create `order-images` bucket
- Click "New bucket"
- Name: `order-images`
- Public bucket: **YES** (enable public access)
- File size limit: 5 MB (recommended)
- Allowed MIME types: `image/*`

## Storage Policies

After creating the buckets, you need to set up RLS (Row Level Security) policies:

### For `order-pdfs` bucket:

**Policy 1: Allow public read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-pdfs');
```

**Policy 2: Allow authenticated insert**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-pdfs' AND auth.role() = 'authenticated');
```

**Policy 3: Allow anon insert (for PWA without login)**
```sql
CREATE POLICY "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-pdfs');
```

### For `order-images` bucket:

**Policy 1: Allow public read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');
```

**Policy 2: Allow anyone to upload**
```sql
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');
```

## Quick Setup via SQL Editor

Run this in Supabase SQL Editor:

```sql
-- Enable public access for storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('order-pdfs', 'order-pdfs', true),
  ('order-images', 'order-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up policies for order-pdfs
CREATE POLICY IF NOT EXISTS "Public read PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-pdfs');

CREATE POLICY IF NOT EXISTS "Anyone can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-pdfs');

-- Set up policies for order-images
CREATE POLICY IF NOT EXISTS "Public read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');

CREATE POLICY IF NOT EXISTS "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');
```

## Verify Setup

After running the SQL, verify:
1. Go to Storage → Buckets
2. You should see `order-pdfs` and `order-images` with "Public" badge
3. Click on each bucket → Policies tab
4. You should see the policies listed above

## Testing

Try uploading a file from the app. If it still fails:
1. Check browser console for error messages
2. Verify your `VITE_SUPABASE_ANON_KEY` in `.env` is correct
3. Make sure buckets are set to **public**

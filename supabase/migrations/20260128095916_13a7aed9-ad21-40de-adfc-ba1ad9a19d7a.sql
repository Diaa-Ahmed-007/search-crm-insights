-- Create storage bucket for unit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-images', 'unit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to unit-images bucket
CREATE POLICY "Authenticated users can upload unit images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'unit-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update unit images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'unit-images');

-- Allow public read access to unit images
CREATE POLICY "Anyone can view unit images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'unit-images');

-- Allow admins to delete unit images
CREATE POLICY "Admins can delete unit images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'unit-images' AND public.has_role(auth.uid(), 'admin'));

-- Add image_url column to units table
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS image_url text;
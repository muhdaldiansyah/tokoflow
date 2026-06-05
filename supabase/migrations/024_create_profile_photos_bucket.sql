-- Create storage bucket for profile/logo photos (public — displayed on order forms and settings)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Users can upload to their own folder
CREATE POLICY "Users can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Users can update/overwrite their own photos
CREATE POLICY "Users can update profile photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own photos
CREATE POLICY "Users can delete profile photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

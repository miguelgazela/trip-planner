'use client';

import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function useSupabaseStorage() {
  const { user } = useAuth();

  const uploadImage = useCallback(
    async (file: File, entity: string, id: string): Promise<string | null> => {
      if (!user) return null;
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${entity}/${id}.${ext}`;

      const { error } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true });

      if (error) {
        console.error('[Storage] upload error:', error.message);
        return null;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      return data.publicUrl;
    },
    [user]
  );

  const uploadDataUrl = useCallback(
    async (dataUrl: string, entity: string, id: string): Promise<string | null> => {
      if (!user) return null;

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] ?? 'jpg';
      const file = new File([blob], `${id}.${ext}`, { type: blob.type });

      return uploadImage(file, entity, id);
    },
    [user, uploadImage]
  );

  const deleteImage = useCallback(
    async (path: string): Promise<void> => {
      const supabase = getSupabaseBrowserClient();
      await supabase.storage.from('images').remove([path]);
    },
    []
  );

  return { uploadImage, uploadDataUrl, deleteImage };
}

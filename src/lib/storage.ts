import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload an image file to Supabase Storage bucket 'inventory-assets'
 * If Supabase is not configured, it gracefully falls back to a base64 Data URL
 */
export async function uploadImage(
  file: File,
  folder: 'companies' | 'products'
): Promise<string> {
  // If Supabase is connected, upload to Supabase Storage bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('inventory-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error, falling back to data URL:', error.message);
      } else if (data) {
        const { data: publicData } = supabase.storage
          .from('inventory-assets')
          .getPublicUrl(data.path);
        
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Failed to upload to Supabase storage:', err);
    }
  }

  // Fallback: Read as base64 Data URL for instant local preview/demo mode
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

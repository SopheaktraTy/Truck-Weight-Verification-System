import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Extract storage relative path (e.g. "companies/17945..._logo.png") from a public URL
 */
export function getStoragePathFromUrl(url: string, bucket: string = 'inventory-assets'): string | null {
  if (!url) return null;
  // Format: https://<id>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const prefix = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(prefix);
  if (index !== -1) {
    return decodeURIComponent(url.substring(index + prefix.length));
  }

  // Format: /<bucket>/<path>
  const altPrefix = `/${bucket}/`;
  const altIndex = url.indexOf(altPrefix);
  if (altIndex !== -1) {
    return decodeURIComponent(url.substring(altIndex + altPrefix.length));
  }

  return null;
}

/**
 * Remove an image file from Supabase Storage bucket 'inventory-assets'
 * Used to delete old images when replaced or deleted, preventing orphaned files.
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = 'inventory-assets'
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !imageUrl) return false;

  // Don't attempt to delete base64 data URLs or local blob previews
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) return false;

  const path = getStoragePathFromUrl(imageUrl, bucket);
  if (!path) return false;

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Supabase storage remove error:', error.message);
      return false;
    }
    console.log(`Deleted old image from storage: ${path}`);
    return true;
  } catch (err) {
    console.warn('Failed to delete image from Supabase storage:', err);
    return false;
  }
}

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

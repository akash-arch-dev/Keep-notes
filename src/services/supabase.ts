import { createClient } from '@supabase/supabase-js';

// User's provided Supabase Project Credentials
export const SUPABASE_PROJECT_URL = 'https://xrlootvjiqetgzwqktly.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lzCJ_gIkYnM0y0ua7fAdeg_AlKoOXz4';
export const SUPABASE_MEDIA_BUCKET = 'media';

// 1. Supabase Client Initialization
export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY);

// 2. Database Schema SQL query requested for the media_files table
export const CREATE_MEDIA_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
create table if not exists public.media_files (
  id text primary key,
  file_name text not null,
  file_path text not null unique,
  file_type text not null check (file_type in ('image', 'video', 'audio')),
  file_size bigint not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) and public access policy for your personal media app
alter table public.media_files enable row level security;

create policy "Allow all operations for personal app"
  on public.media_files
  for all
  using (true)
  with check (true);
`;

export interface SupabaseMediaRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio';
  file_size: number;
  created_at: string;
  public_url?: string;
}

// Convert Base64 data URL to Blob for upload
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1] || 'application/octet-stream';
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return { blob: new Blob([byteArray], { type: mimeType }), mimeType };
}

// 3. File Upload Function: Uploads to "media" bucket and records in media_files table
export async function uploadMediaToSupabase(
  fileOrDataUrl: File | Blob | string,
  fileName: string,
  fileType: 'image' | 'video' | 'audio'
): Promise<SupabaseMediaRecord> {
  let blob: Blob;
  let ext = 'bin';

  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
    const converted = dataUrlToBlob(fileOrDataUrl);
    blob = converted.blob;
    if (converted.mimeType.includes('png')) ext = 'png';
    else if (converted.mimeType.includes('jpeg') || converted.mimeType.includes('jpg')) ext = 'jpg';
    else if (converted.mimeType.includes('svg')) ext = 'svg';
    else if (converted.mimeType.includes('webm')) ext = 'webm';
    else if (converted.mimeType.includes('mp4')) ext = 'mp4';
    else if (converted.mimeType.includes('mpeg') || converted.mimeType.includes('mp3')) ext = 'mp3';
  } else if (fileOrDataUrl instanceof File) {
    blob = fileOrDataUrl;
    const parts = fileOrDataUrl.name.split('.');
    if (parts.length > 1) ext = parts.pop() || 'bin';
  } else {
    blob = fileOrDataUrl as Blob;
    if (fileType === 'image') ext = 'png';
    else if (fileType === 'audio') ext = 'webm';
    else if (fileType === 'video') ext = 'mp4';
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filePath = `${fileType}s/${uniqueId}_${cleanName}.${ext}`;

  // 1. Upload to Supabase Storage Bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: blob.type || (fileType === 'image' ? 'image/png' : fileType === 'audio' ? 'audio/webm' : 'video/mp4'),
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  // 2. Get Public URL for streaming and previewing
  const { data: publicUrlData } = supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  const record: SupabaseMediaRecord = {
    id: uniqueId,
    file_name: fileName,
    file_path: filePath,
    file_type: fileType,
    file_size: blob.size,
    created_at: new Date().toISOString(),
    public_url: publicUrl,
  };

  // 3. Insert record into media_files database table
  try {
    const { error: dbError } = await supabase.from('media_files').insert({
      id: record.id,
      file_name: record.file_name,
      file_path: record.file_path,
      file_type: record.file_type,
      file_size: record.file_size,
      created_at: record.created_at,
    });

    if (dbError) {
      console.warn('Note: media_files table insert returned warning (file is saved in storage bucket):', dbError.message);
    }
  } catch (err) {
    console.warn('Database table sync optional fallback:', err);
  }

  return record;
}

// 4. Media Retrieval Function: Query saved media items from database and retrieve public streaming URLs
export async function fetchSavedMediaFiles(): Promise<SupabaseMediaRecord[]> {
  const records: SupabaseMediaRecord[] = [];

  // Try fetching from media_files database table first
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item) => {
        const { data: urlData } = supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .getPublicUrl(item.file_path);
        return {
          ...item,
          public_url: urlData.publicUrl,
        };
      });
    }
  } catch (err) {
    console.warn('Falling back to direct storage bucket listing:', err);
  }

  // Fallback: List directly from storage bucket folders ('images', 'videos', 'audios')
  const folders = ['images', 'videos', 'audios'];
  for (const folder of folders) {
    try {
      const { data: files, error } = await supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (!error && files) {
        for (const file of files) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const fullPath = `${folder}/${file.name}`;
          const { data: urlData } = supabase.storage
            .from(SUPABASE_MEDIA_BUCKET)
            .getPublicUrl(fullPath);

          let fileType: 'image' | 'video' | 'audio' = 'image';
          if (folder === 'videos') fileType = 'video';
          if (folder === 'audios') fileType = 'audio';

          records.push({
            id: file.id || file.name,
            file_name: file.name.replace(/^media_\d+_[a-z0-9]+_/, ''),
            file_path: fullPath,
            file_type: fileType,
            file_size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            public_url: urlData.publicUrl,
          });
        }
      }
    } catch (err) {
      console.warn(`Could not list folder ${folder}:`, err);
    }
  }

  return records;
}

// Delete media item from Supabase storage and database
export async function deleteMediaFromSupabase(id: string, filePath: string): Promise<boolean> {
  // 1. Delete from bucket
  const { error: storageError } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .remove([filePath]);

  if (storageError) {
    console.warn('Supabase storage delete warning:', storageError.message);
  }

  // 2. Delete from database table
  try {
    await supabase.from('media_files').delete().eq('id', id);
    await supabase.from('media_files').delete().eq('file_path', filePath);
  } catch (err) {
    console.warn('Table delete warning:', err);
  }

  return true;
}

// Helper to download a media file for Offline Backup to Laptop/Mobile
export async function downloadMediaForOfflineBackup(fileUrl: string, fileName: string) {
  try {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed:', err);
    // Fallback: direct window link trigger
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    a.click();
  }
}

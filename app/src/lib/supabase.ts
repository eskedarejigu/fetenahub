import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbodxizbkfnsaiuznsxf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib2R4aXpia2Zuc2FpdXpuc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDg0NzUsImV4cCI6MjA4MjY4NDQ3NX0.xGsFBBbAUD5gdiYbiYLrvPu3p0lVn6tKdGCtGhZD7CM';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage helper functions
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

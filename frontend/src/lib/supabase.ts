import { createClient } from "@supabase/supabase-js";
import config from "../../config";

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
);

export async function uploadFile(
  bucket: string,
  file: File,
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
}

export async function deleteFile(
  bucket: string,
  fileName: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([fileName]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export function getPublicUrl(bucket: string, fileName: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
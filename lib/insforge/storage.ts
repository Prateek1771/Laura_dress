import { createServerClient } from './server';

export async function uploadInventoryImage(
  itemId: string,
  index: number,
  file: Blob,
): Promise<string> {
  const storage = createServerClient().storage;
  const { data, error } = await storage
    .from('inventory-images')
    .upload(`${itemId}/${index}.jpg`, file);
  if (error || !data) throw new Error(`Storage upload failed: ${error?.message}`);
  return data.url;
}

export async function uploadCustomerPhoto(
  sessionId: string,
  file: Blob,
): Promise<string> {
  const storage = createServerClient().storage;
  const { data, error } = await storage
    .from('customer-photos')
    .upload(`${sessionId}.jpg`, file);
  if (error || !data) throw new Error(`Customer photo upload failed: ${error?.message}`);
  return data.url;
}

export async function downloadCustomerPhoto(sessionId: string): Promise<Blob> {
  const storage = createServerClient().storage;
  const { data, error } = await storage
    .from('customer-photos')
    .download(`${sessionId}.jpg`);
  if (error || !data) throw new Error(`Customer photo download failed: ${error?.message}`);
  return data;
}

export async function uploadTryonPreview(
  tryonId: string,
  base64: string,
): Promise<string> {
  const storage = createServerClient().storage;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/jpeg' });
  const { data, error } = await storage
    .from('tryon-previews')
    .upload(`${tryonId}.jpg`, blob);
  if (error || !data) throw new Error(`Tryon preview upload failed: ${error?.message}`);
  return data.url;
}

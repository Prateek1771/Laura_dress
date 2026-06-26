import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';

// Streams a private tryon-previews object (no signed URLs in the InsForge SDK).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole(['stylist', 'owner']);
  const { id } = await params;
  try {
    const storage = createServerClient().storage;
    const { data, error } = await storage.from('tryon-previews').download(`${id}.jpg`);
    if (error || !data) throw error ?? new Error('not found');
    const buf = await data.arrayBuffer();
    return new Response(buf, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('[tryon] image stream failed:', error);
    return new Response('Not found', { status: 404 });
  }
}

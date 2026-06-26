import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';
import { downloadCustomerPhoto, uploadTryonPreview } from '@/lib/insforge/storage';

// API4.AI demo contract (verified): multipart file fields `image` (person) + `image-apparel`
// (garment); response `results[0].entities[0].image` is base64.
async function callApi4ai(person: Blob, garment: Blob): Promise<string> {
  const form = new FormData();
  form.append('image', person, 'person.jpg');
  form.append('image-apparel', garment, 'garment.jpg');
  const res = await fetch(process.env.API4AI_ENDPOINT!, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  const data = await res.json();
  const base64 = data?.results?.[0]?.entities?.[0]?.image;
  if (typeof base64 !== 'string' || !base64) throw new Error('No image in API4.AI response');
  return base64;
}

export async function POST(req: Request) {
  const staff = await requireRole(['stylist', 'owner']);
  const { sessionId, itemId } = await req.json();
  if (typeof sessionId !== 'string' || typeof itemId !== 'string' || !sessionId || !itemId) {
    return Response.json({ ok: false, error: 'Missing session or item.' }, { status: 400 });
  }
  const db = createServerClient().database;

  const { data: tryon, error: insErr } = await db
    .from('tryons')
    .insert({ session_id: sessionId, item_id: itemId, status: 'generating' })
    .select()
    .single();
  if (insErr || !tryon) {
    console.error('[tryon] insert failed:', insErr);
    return Response.json({ ok: false, error: 'Could not start the try-on.' }, { status: 500 });
  }
  const tryonId = tryon.id as string;

  try {
    const { data: item, error: itemErr } = await db
      .from('inventory_items')
      .select('images')
      .eq('id', itemId)
      .single();
    if (itemErr) throw itemErr;
    const garmentUrl = (item?.images as string[] | undefined)?.[0];
    if (!garmentUrl) throw new Error('No garment image');

    const person = await downloadCustomerPhoto(sessionId);
    const garment = await (await fetch(garmentUrl)).blob();

    let base64: string;
    try {
      base64 = await callApi4ai(person, garment);
    } catch {
      base64 = await callApi4ai(person, garment); // one retry
    }

    const url = await uploadTryonPreview(tryonId, base64);
    await db.from('tryons').update({ status: 'ready', result_image_url: url }).eq('id', tryonId);
    void captureServerEvent(staff.staffId, 'tryon_generated', { sessionId, itemId, success: true });

    return Response.json({ ok: true, data: { tryonId, image: `data:image/png;base64,${base64}` } });
  } catch (error) {
    console.error('[tryon] generate failed:', error);
    await db.from('tryons').update({ status: 'failed' }).eq('id', tryonId);
    void captureServerEvent(staff.staffId, 'tryon_generated', { sessionId, itemId, success: false });
    return Response.json({ ok: false, error: "Couldn't create this preview. Try again." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await requireRole(['stylist', 'owner']);
  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return Response.json({ ok: false, error: 'Missing session.' }, { status: 400 });
  try {
    const db = createServerClient().database;
    const { data, error } = await db
      .from('tryons')
      .select('id, created_at, inventory_items(name)')
      .eq('session_id', sessionId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const tryons = (data ?? []).map((t) => ({
      id: t.id as string,
      // PostGREST types the to-one embed as an array; runtime is an object.
      name: (t.inventory_items as unknown as { name: string } | null)?.name ?? 'Dress',
      createdAt: t.created_at as string,
    }));
    return Response.json({ ok: true, data: { tryons } });
  } catch (error) {
    console.error('[tryon] list failed:', error);
    return Response.json({ ok: false, error: 'Could not load try-ons.' }, { status: 500 });
  }
}

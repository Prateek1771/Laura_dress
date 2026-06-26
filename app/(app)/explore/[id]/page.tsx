import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { DressActions } from '@/components/dress/DressActions';
import { getSession } from '@/lib/auth';
import { createServerClient } from '@/lib/insforge/server';
import { captureServerEvent } from '@/lib/posthog';
import { formatINR } from '@/lib/format';
import type { InventoryItem } from '@/lib/insforge/types';

const labelize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default async function DressDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sessionId = typeof sp.session === 'string' ? sp.session : null;

  const db = createServerClient().database;
  const { data, error } = await db.from('inventory_items').select('*').eq('id', id).maybeSingle();
  if (error) console.error('[dress] fetch failed:', error);
  if (!data) notFound();
  const item = data as InventoryItem;

  let match: { score: number; reasons: string[] } | null = null;
  let hasPhoto = false;
  if (sessionId) {
    const rec = await db
      .from('recommendations')
      .select('match_score, match_reasons')
      .eq('session_id', sessionId)
      .eq('item_id', id)
      .maybeSingle();
    if (rec.data) match = { score: rec.data.match_score as number, reasons: (rec.data.match_reasons as string[]) ?? [] };

    const sess = await db
      .from('styling_sessions')
      .select('customer_photo_url')
      .eq('id', sessionId)
      .maybeSingle();
    hasPhoto = Boolean(sess.data?.customer_photo_url);
  }

  const session = await getSession();
  if (session) {
    void captureServerEvent(session.staffId, 'dress_viewed', { sessionId, itemId: id });
  }
  const role = session?.role ?? 'stylist';

  const backHref = sessionId ? `/explore?session=${sessionId}` : '/explore';

  return (
    <div className="flex flex-col gap-5">
      <Link href={backHref} className="text-sm font-medium text-ink-secondary hover:text-ink">
        ← Back to Explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={item.images} alt={item.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">{item.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{labelize(item.category)}</Badge>
              <Badge variant="neutral">{item.gender === 'men' ? 'Men' : 'Women'}</Badge>
              <Badge variant="dress-id">{item.dress_id}</Badge>
            </div>
            <p className="text-2xl font-bold text-ink">{formatINR(item.price)}</p>
          </div>

          {match && (
            <div className="flex flex-col gap-2 rounded-[--radius-card] border border-border bg-surface p-4">
              <ScoreBar score={match.score} />
              {match.reasons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {match.reasons.map((r) => (
                    <span key={r} className="rounded-[--radius-badge] bg-surface-soft px-2.5 py-1 text-xs text-ink-secondary">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <dl className="flex flex-col gap-3 text-sm">
            {item.fabric && <Detail label="Fabric" value={labelize(item.fabric)} />}
            {item.colors.length > 0 && (
              <DetailChips label="Colors" values={item.colors.map(labelize)} />
            )}
            {item.sizes.length > 0 && <DetailChips label="Sizes" values={item.sizes} />}
            {item.tags.length > 0 && <DetailChips label="Tags" values={item.tags} />}
          </dl>

          <DressActions
            role={role}
            dressId={item.dress_id}
            itemId={item.id}
            sessionId={sessionId}
            hasPhoto={hasPhoto}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function DetailChips({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="rounded-[--radius-badge] bg-surface-soft px-2.5 py-1 text-xs capitalize text-ink-secondary">
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

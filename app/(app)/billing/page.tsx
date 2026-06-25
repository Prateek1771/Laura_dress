import { BillingClient } from '@/components/billing/BillingClient';
import { createServerClient } from '@/lib/insforge/server';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const prefill = typeof sp.item === 'string' ? sp.item : '';

  const db = createServerClient().database;
  const { data } = await db.from('store_settings').select('tax_percent').maybeSingle();
  const taxPercent = Number(data?.tax_percent ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Billing</h1>
      <BillingClient taxPercent={taxPercent} prefillDressId={prefill} />
    </div>
  );
}

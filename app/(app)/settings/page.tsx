import { SettingsClient } from '@/components/settings/SettingsClient';
import { createServerClient } from '@/lib/insforge/server';
import type { StaffRole } from '@/lib/constants';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

export default async function SettingsPage() {
  const db = createServerClient().database;
  const { data: store } = await db
    .from('store_settings')
    .select('store_name, store_code, currency, tax_percent')
    .limit(1)
    .maybeSingle();
  const { data: staffData } = await db
    .from('staff')
    .select('id, name, role, active')
    .order('created_at', { ascending: true });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <SettingsClient
        store={{
          storeName: (store?.store_name as string) ?? '—',
          storeCode: (store?.store_code as string) ?? '—',
          currency: (store?.currency as string) ?? 'INR',
          taxPercent: store?.tax_percent != null ? Number(store.tax_percent) : 0,
        }}
        staff={(staffData ?? []) as StaffMember[]}
      />
    </div>
  );
}

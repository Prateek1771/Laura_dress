// Seed the store + staff accounts. Idempotent — safe to re-run.
// Run: node --env-file=.env.local scripts/seed.mjs
import { createClient } from '@insforge/sdk';
import bcrypt from 'bcryptjs';

// ponytail: demo credentials, fine to commit for a single-store in-store app.
// Change these (or the staff passwords) before any real deployment.
const STORE = { store_code: 'VIVAH01', store_name: 'VivahStyle Boutique', currency: 'INR', tax_percent: 5 };
const STAFF = [
  { name: 'Owner', role: 'owner', password: 'owner123' },
  { name: 'Cashier', role: 'cashier', password: 'cashier123' },
  { name: 'Stylist', role: 'stylist', password: 'stylist123' },
];

const db = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
}).database;

function check(error, what) {
  if (error) {
    console.error(`[seed] ${what} failed:`, error);
    process.exit(1);
  }
}

// store_settings (single row, keyed by store_code)
const existingStore = await db.from('store_settings').select('id').eq('store_code', STORE.store_code).maybeSingle();
check(existingStore.error, 'store lookup');
if (existingStore.data) {
  console.log(`store ${STORE.store_code} already exists — skipped`);
} else {
  const { error } = await db.from('store_settings').insert(STORE).select().single();
  check(error, 'store insert');
  console.log(`store ${STORE.store_code} created`);
}

// staff (keyed by name)
for (const s of STAFF) {
  const existing = await db.from('staff').select('id').eq('name', s.name).maybeSingle();
  check(existing.error, `staff lookup (${s.name})`);
  if (existing.data) {
    console.log(`staff ${s.name} already exists — skipped`);
    continue;
  }
  const password_hash = await bcrypt.hash(s.password, 10);
  const { error } = await db.from('staff').insert({ name: s.name, role: s.role, password_hash, active: true }).select().single();
  check(error, `staff insert (${s.name})`);
  console.log(`staff ${s.name} (${s.role}) created`);
}

console.log('\nLogin with store code: ' + STORE.store_code);
for (const s of STAFF) console.log(`  ${s.role.padEnd(8)} password: ${s.password}`);

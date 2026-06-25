import { createClient } from '@insforge/sdk';

// Server-only: uses the privileged InsForge API key (server-side env, never bundled
// to the client) so DB writes and storage uploads are authorized. The browser client
// (lib/insforge/client.ts) keeps the anon key for read-only dress_id lookups.
export function createServerClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.INSFORGE_API_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
}

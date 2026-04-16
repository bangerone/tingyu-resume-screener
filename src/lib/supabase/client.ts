// Browser-side Supabase client.
// TODO[D1]: implement using @supabase/ssr createBrowserClient
// Used by:
//   - candidate apply form (resume upload)
//   - HR client components that read live data
//
// Do NOT use the service-role key here — anon key only.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

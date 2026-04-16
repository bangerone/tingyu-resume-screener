// Server-side Supabase clients.
// TODO[D1]: wire into route handlers / server actions
//
// Two flavors:
//   - createServerClient: respects cookies, used in RSC / route handlers
//   - createAdminClient: uses SERVICE_ROLE_KEY, bypasses RLS — only for trusted server code
//     (resume parsing job, scoring job, feishu push)

import { cookies } from "next/headers";
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const cookieStore = cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          /* server components can't set cookies — handled in middleware/route handlers */
        },
        remove() {
          /* see above */
        },
      },
    },
  );
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

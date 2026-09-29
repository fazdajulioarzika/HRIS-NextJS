import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client dengan service role key — bypass RLS sepenuhnya.
 * HANYA dipakai di server actions/route handlers untuk operasi privileged
 * seperti membuat akun user (invite), reset password orang lain, dsb.
 * JANGAN PERNAH diimpor di file yang berjalan di client ("use client").
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset di environment variables"
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

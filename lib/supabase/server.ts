import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const sevenDaysInSeconds = 60 * 60 * 24 * 7;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, maxAge: sevenDaysInSeconds })
          );
        } catch {
          // ponytail: server components can't always write cookies, proxy handles refresh writes
        }
      }
    }
  });
}

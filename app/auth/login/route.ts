import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/env";
import { applyRateLimit } from "@/lib/security";

const providers = new Set(["google"]);

export async function GET(request: Request) {
  const rateLimit = applyRateLimit(request, {
    key: "auth-login",
    limit: 20,
    windowMs: 60_000
  });
  if (rateLimit) return rateLimit;

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "";
  const next = url.searchParams.get("next") ?? "/";
  const mode = url.searchParams.get("mode") === "admin" ? "admin" : "user";
  const loginPath = mode === "admin" ? "/admin/login" : "/login";

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.redirect(new URL(`${loginPath}?error=supabase_not_configured`, url.origin));
  }

  if (!providers.has(provider) || !next.startsWith("/")) {
    return NextResponse.redirect(new URL(`${loginPath}?error=invalid_oauth_request`, url.origin));
  }

  const supabase = await createClient();
  const callbackUrl = new URL("/auth/callback", url.origin);
  callbackUrl.searchParams.set("next", next);
  callbackUrl.searchParams.set("mode", mode);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString()
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL(`${loginPath}?error=oauth_start_failed`, url.origin));
  }

  return NextResponse.redirect(data.url);
}

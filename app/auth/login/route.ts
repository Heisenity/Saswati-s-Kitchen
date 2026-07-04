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
  const mode = url.searchParams.get("mode") === "admin" ? "admin" : "user";
  const requestedNext = url.searchParams.get("next") ?? "/";
  const validNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//");
  const next = mode === "admin" ? "/admin/dashboard" : validNext ? requestedNext : "/";
  const loginPath = mode === "admin" ? "/admin/login" : "/login";

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.redirect(new URL(`${loginPath}?error=supabase_not_configured`, url.origin));
  }

  if (!providers.has(provider) || !validNext) {
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

  const response = NextResponse.redirect(data.url);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  };
  response.cookies.set("sk_oauth_mode", mode, cookieOptions);
  response.cookies.set("sk_oauth_next", next, cookieOptions);
  return response;
}

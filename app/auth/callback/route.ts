import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const mode = url.searchParams.get("mode") === "admin" ? "admin" : "user";
  const loginPath = mode === "admin" ? "/admin/login" : "/login";

  if (!code || !next.startsWith("/")) {
    return NextResponse.redirect(new URL(`${loginPath}?error=oauth_callback_failed`, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`${loginPath}?error=oauth_callback_failed`, url.origin));
  }

  if (mode === "admin") {
    const { profile } = await getSessionContext();
    if (profile?.role !== "ADMIN") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=admin_required", url.origin));
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

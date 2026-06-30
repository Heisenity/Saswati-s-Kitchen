import { NextResponse } from "next/server";
import { isWhitelistedAdminEmail, isDatabaseConfigured } from "@/lib/env";
import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { logDeniedAdminLogin } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

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
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.email || !user.email_confirmed_at || !isWhitelistedAdminEmail(user.email)) {
      await logDeniedAdminLogin(request, user?.email);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=admin_required", url.origin));
    }

    if (isDatabaseConfigured()) {
      try {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : null,
            avatarUrl:
              typeof user.user_metadata?.avatar_url === "string"
                ? user.user_metadata.avatar_url
                : null,
            role: "ADMIN"
          },
          create: {
            id: user.id,
            email: user.email,
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : null,
            avatarUrl:
              typeof user.user_metadata?.avatar_url === "string"
                ? user.user_metadata.avatar_url
                : null,
            role: "ADMIN"
          }
        });
      } catch (profileError) {
        if (isPrismaConnectionError(profileError)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/admin/login?error=oauth_callback_failed", url.origin));
        }

        throw profileError;
      }
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

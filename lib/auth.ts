import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { isDatabaseConfigured, isSupabaseAuthConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type SessionContext = {
  user: User | null;
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    role: "USER" | "ADMIN";
  } | null;
};

async function ensureProfile(user: User) {
  const fallbackProfile = {
    id: user.id,
    email: user.email ?? null,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
    role: "USER" as const
  };

  if (!isDatabaseConfigured()) {
    return fallbackProfile;
  }

  try {
    return await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email ?? null,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        avatarUrl:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null
      },
      create: {
        id: user.id,
        email: user.email ?? null,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        avatarUrl:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
        role: "USER"
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true
      }
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) return fallbackProfile;
    throw error;
  }
}

export async function getSessionContext(): Promise<SessionContext> {
  if (!isSupabaseAuthConfigured()) {
    return { user: null, profile: null };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await ensureProfile(user);
  return { user, profile };
}

export async function verifyAdminSession() {
  const { user, profile } = await getSessionContext();
  return Boolean(user && profile?.role === "ADMIN");
}

export async function requireUserSession(redirectTo = "/login") {
  const { user } = await getSessionContext();
  if (!user) redirect(redirectTo);
}

export async function requireAdminSession() {
  if (!(await verifyAdminSession())) {
    redirect("/admin/login?error=admin_required");
  }
}

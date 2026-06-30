import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isDatabaseConfigured, isSupabaseAuthConfigured, isWhitelistedAdminEmail } from "@/lib/env";
import { isPrismaConnectionError, isPrismaSchemaMismatchError, prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type ProfileShape = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
};

type SessionContext = {
  user: User | null;
  profile: ProfileShape | null;
};

export class AdminApiAuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string
  ) {
    super(message);
  }
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function isVerifiedUser(user?: User | null) {
  return Boolean(user?.email && user.email_confirmed_at);
}

async function ensureProfile(user: User) {
  const role = isWhitelistedAdminEmail(user.email) ? ("ADMIN" as const) : ("USER" as const);
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
    role
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
            : null,
        role
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
        role
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

export async function getServerAdminContext() {
  if (!isSupabaseAuthConfigured() || !isDatabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = normalizeEmail(user?.email);
  if (!user || !isVerifiedUser(user) || !email || !isWhitelistedAdminEmail(email)) {
    return null;
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true
      }
    });

    if (!profile || profile.role !== "ADMIN" || normalizeEmail(profile.email) !== email) {
      return null;
    }

    return { user, profile };
  } catch (error) {
    if (isPrismaConnectionError(error) || isPrismaSchemaMismatchError(error)) {
      return null;
    }
    throw error;
  }
}

export async function verifyStrictAdminSession() {
  return Boolean(await getServerAdminContext());
}

export async function verifyAdminSession() {
  return verifyStrictAdminSession();
}

export async function requireUserSession(redirectTo = "/login") {
  const { user } = await getSessionContext();
  if (!user) redirect(redirectTo);
}

export async function requireStrictAdminSession() {
  if (!isSupabaseAuthConfigured()) {
    redirect("/admin/login?error=login_required");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?error=login_required");
  }

  const admin = await getServerAdminContext();
  if (!admin) {
    redirect("/admin/login?error=admin_required");
  }

  return admin;
}

export async function requireAdminSession() {
  return requireStrictAdminSession();
}

export async function requireStrictAdminApiSession() {
  if (!isSupabaseAuthConfigured()) {
    throw new AdminApiAuthError(401, "Unauthorized");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminApiAuthError(401, "Unauthorized");
  }

  const admin = await getServerAdminContext();
  if (!admin) {
    throw new AdminApiAuthError(403, "Forbidden");
  }

  return admin;
}

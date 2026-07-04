import { NextResponse } from "next/server";
import { isSupabaseAuthConfigured, isWhitelistedAdminEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ authenticated: false, role: "USER" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json(
    {
      authenticated: Boolean(user),
      role: isWhitelistedAdminEmail(user?.email) ? "ADMIN" : "USER"
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

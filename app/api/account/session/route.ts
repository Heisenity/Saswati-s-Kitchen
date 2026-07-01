import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";

export async function GET() {
  const { user, profile } = await getSessionContext();
  return NextResponse.json(
    { authenticated: Boolean(user), role: profile?.role ?? "USER" },
    { headers: { "Cache-Control": "no-store" } }
  );
}

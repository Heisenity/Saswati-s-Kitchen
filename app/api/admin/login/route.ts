import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    if (payload.username !== env.adminUsername || payload.password !== env.adminPassword) {
      return NextResponse.json({ ok: false, error: "Invalid admin credentials." }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not sign in."
      },
      { status: 400 }
    );
  }
}

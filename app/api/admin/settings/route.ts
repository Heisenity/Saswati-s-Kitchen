import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { settingSchema } from "@/lib/validation";
import { isDatabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 400 });
  }

  const payload = settingSchema.parse(await request.json());
  const existing = await prisma.setting.findFirst();
  const settings = existing
    ? await prisma.setting.update({
        where: { id: existing.id },
        data: payload
      })
    : await prisma.setting.create({
        data: payload
      });

  return NextResponse.json({ ok: true, settings });
}

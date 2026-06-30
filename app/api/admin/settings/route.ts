import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AdminApiAuthError, requireStrictAdminApiSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { logAdminAction, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { settingSchema } from "@/lib/validation";

function handleAdminError(error: unknown) {
  if (error instanceof AdminApiAuthError) {
    return rejectJson(error.status, error.message);
  }

  if (error instanceof ZodError) {
    return rejectJson(400, "Invalid request");
  }

  console.error(error);
  return rejectJson(500, "Could not complete this admin action.");
}

export async function GET() {
  try {
    await requireStrictAdminApiSession();
    const settings = await getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    if (!isDatabaseConfigured()) {
      return rejectJson(400, "Invalid request");
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

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: "settings.update",
      targetType: "setting",
      targetId: settings.id
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return handleAdminError(error);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validation";
import { isDatabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true, items: [] });

  const items = await prisma.menuItem.findMany({
    include: { components: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 400 });
  }

  const payload = menuItemSchema.parse(await request.json());
  const item = await prisma.menuItem.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.imageUrl,
      mealType: payload.mealType,
      badge: payload.badge,
      isActive: payload.isActive,
      stockLimit: payload.stockLimit,
      components: {
        create: payload.components.map((component) => ({
          itemName: component
        }))
      }
    },
    include: { components: true }
  });

  return NextResponse.json({ ok: true, item });
}

export async function PUT(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 400 });
  }

  const payload = menuItemSchema.parse(await request.json());
  if (!payload.id) {
    return NextResponse.json({ ok: false, error: "Menu item id is required." }, { status: 400 });
  }

  await prisma.menuItemComponent.deleteMany({
    where: { menuItemId: payload.id }
  });
  const item = await prisma.menuItem.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.imageUrl,
      mealType: payload.mealType,
      badge: payload.badge,
      isActive: payload.isActive,
      stockLimit: payload.stockLimit,
      components: {
        create: payload.components.map((component) => ({
          itemName: component
        }))
      }
    },
    include: { components: true }
  });

  return NextResponse.json({ ok: true, item });
}

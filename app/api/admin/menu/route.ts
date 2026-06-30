import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireStrictAdminApiSession, AdminApiAuthError } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { logAdminAction, rejectJson, requireTrustedOrigin } from "@/lib/security";
import { bulkMenuComponentSchema, menuItemSchema } from "@/lib/validation";

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
    if (!isDatabaseConfigured()) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.menuItem.findMany({
      include: { components: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    if (!isDatabaseConfigured()) {
      return rejectJson(400, "Invalid request");
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
        itemKind: payload.itemKind,
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

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: "menu.create",
      targetType: "menuItem",
      targetId: item.id,
      metadata: { name: item.name }
    });

    return NextResponse.json({ ok: true, item });
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

    const payload = menuItemSchema.parse(await request.json());
    if (!payload.id) {
      return rejectJson(400, "Invalid request");
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
        itemKind: payload.itemKind,
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

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: "menu.update",
      targetType: "menuItem",
      targetId: item.id,
      metadata: { name: item.name }
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    if (!isDatabaseConfigured()) {
      return rejectJson(400, "Invalid request");
    }

    const payload = bulkMenuComponentSchema.parse(await request.json());
    const componentName = payload.component.trim();
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: payload.menuItemIds } },
      include: { components: true },
      orderBy: { createdAt: "desc" }
    });

    for (const item of menuItems) {
      const existingComponents = item.components.map((component) => component.itemName);
      const hasComponent = existingComponents.some(
        (entry) => entry.trim().toLowerCase() === componentName.toLowerCase()
      );

      const nextComponents =
        payload.action === "add_component"
          ? hasComponent
            ? existingComponents
            : [...existingComponents, componentName]
          : existingComponents.filter(
              (entry) => entry.trim().toLowerCase() !== componentName.toLowerCase()
            );

      if (!nextComponents.length) continue;

      await prisma.menuItemComponent.deleteMany({
        where: { menuItemId: item.id }
      });

      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          components: {
            create: nextComponents.map((entry) => ({ itemName: entry }))
          }
        }
      });
    }

    const items = await prisma.menuItem.findMany({
      include: { components: true },
      orderBy: { createdAt: "desc" }
    });

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: `menu.${payload.action}`,
      targetType: "menuItem",
      metadata: {
        menuItemIds: payload.menuItemIds,
        component: componentName
      }
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireStrictAdminApiSession();
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;
    if (!isDatabaseConfigured()) return rejectJson(400, "Invalid request");

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return rejectJson(400, "Invalid request");

    const item = await prisma.menuItem.delete({ where: { id } });
    if (!item) return rejectJson(404, "Menu item not found");

    await logAdminAction({
      adminId: admin.user.id,
      email: admin.user.email ?? "",
      action: "menu.delete",
      targetType: "menuItem",
      targetId: id,
      metadata: { name: item.name }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error);
  }
}

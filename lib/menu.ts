import { prisma } from "@/lib/prisma";
import { defaultMenuItems } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/env";

export async function getMenuItems() {
  if (!isDatabaseConfigured()) {
    return defaultMenuItems.map((item) => ({
      ...item,
      id: item.slug,
      isActive: true,
      availableDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      components: item.components.map((component, index) => ({
        id: `${item.slug}-${index}`,
        menuItemId: item.slug,
        itemName: component
      }))
    }));
  }

  return prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: [{ price: "desc" }],
    include: { components: true }
  });
}

export async function getAdminMenuItems() {
  if (!isDatabaseConfigured()) return getMenuItems();

  return prisma.menuItem.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { components: true }
  });
}

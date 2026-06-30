import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { defaultMenuItems } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/env";

function getFallbackMenuItems() {
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

export async function getMenuItems() {
  if (!isDatabaseConfigured()) {
    return getFallbackMenuItems();
  }

  try {
    return await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ price: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        badge: true,
        imageUrl: true,
        components: {
          select: {
            itemName: true
          }
        }
      }
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) return getFallbackMenuItems();
    throw error;
  }
}

export async function getAdminMenuItems() {
  if (!isDatabaseConfigured()) return getFallbackMenuItems();

  try {
    return await prisma.menuItem.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: { components: true }
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) return getFallbackMenuItems();
    throw error;
  }
}

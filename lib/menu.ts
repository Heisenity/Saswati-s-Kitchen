import { unstable_cache } from "next/cache";
import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { defaultMenuItems } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/env";

function useCurrentRuiPhoto<T extends { id: string; imageUrl: string }>(item: T) {
  return item.id === "rui-macher-thali"
    ? { ...item, imageUrl: "/brand/rui-thali.jpg" }
    : item;
}

function getFallbackMenuItems() {
  return defaultMenuItems.map((item) =>
    useCurrentRuiPhoto({
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
    })
  );
}

async function loadMenuItems() {
  if (!isDatabaseConfigured()) {
    return getFallbackMenuItems();
  }

  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ price: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        badge: true,
        imageUrl: true,
        mealType: true,
        itemKind: true,
        components: {
          select: {
            itemName: true
          }
        }
      }
    });
    return menuItems.map(useCurrentRuiPhoto);
  } catch (error) {
    if (isPrismaConnectionError(error)) return getFallbackMenuItems();
    throw error;
  }
}

const getCachedMenuItems = unstable_cache(loadMenuItems, ["public-menu-20260812"], {
  revalidate: 300,
  tags: ["public-menu"]
});

export async function getMenuItems() {
  return getCachedMenuItems();
}

export async function getAdminMenuItems() {
  if (!isDatabaseConfigured()) return getFallbackMenuItems();

  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: { components: true }
    });
    return menuItems.map(useCurrentRuiPhoto);
  } catch (error) {
    if (isPrismaConnectionError(error)) return getFallbackMenuItems();
    throw error;
  }
}

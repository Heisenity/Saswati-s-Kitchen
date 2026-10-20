import { unstable_cache } from "next/cache";
import { isPrismaConnectionError, prisma } from "@/lib/prisma";
import { addOnDefinitions, defaultMenuItems } from "@/lib/default-data";
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

function sortMenuItems<T extends { id: string; itemKind: "THALI" | "ADD_ON"; price: number }>(items: T[]): T[] {
  const addOnOrder = addOnDefinitions.map((def) => def.slug);
  return [...items].sort((a, b) => {
    if (a.itemKind === "THALI" && b.itemKind === "THALI") {
      return b.price - a.price;
    }
    if (a.itemKind === "THALI") return -1;
    if (b.itemKind === "THALI") return 1;

    const aBase = a.id.replace(/^(dinner-)?addon-/, "");
    const bBase = b.id.replace(/^(dinner-)?addon-/, "");
    const aIndex = addOnOrder.indexOf(aBase);
    const bIndex = addOnOrder.indexOf(bBase);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return b.price - a.price;
  });
}

async function loadMenuItems() {
  if (!isDatabaseConfigured()) {
    return sortMenuItems(getFallbackMenuItems());
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
    return sortMenuItems(menuItems.map(useCurrentRuiPhoto));
  } catch (error) {
    if (isPrismaConnectionError(error)) return sortMenuItems(getFallbackMenuItems());
    throw error;
  }
}

const getCachedMenuItems = unstable_cache(loadMenuItems, ["public-menu-v10"], {
  revalidate: 172800,
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

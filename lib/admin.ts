import { isPrismaConnectionError, isPrismaSchemaMismatchError, prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";
import { getAdminMenuItems } from "@/lib/menu";
import { getSettings } from "@/lib/settings";

const adminOrderSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  phone: true,
  address: true,
  slotType: true,
  paymentStatus: true,
  orderStatus: true,
  totalAmount: true,
  advanceAmount: true,
  paymentScreenshotUrl: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      itemName: true,
      quantity: true
    }
  }
} as const;

export async function getAdminDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      orderCounts: [],
      latestOrders: [],
      menuCount: (await getAdminMenuItems()).length
    };
  }

  try {
    const [orderCounts, latestOrders, menuCount] = await Promise.all([
      prisma.order.groupBy({
        by: ["orderStatus"],
        _count: true
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: adminOrderSelect
      }),
      prisma.menuItem.count()
    ]);

    return { orderCounts, latestOrders, menuCount };
  } catch (error) {
    if (isPrismaConnectionError(error) || isPrismaSchemaMismatchError(error)) {
      return {
        orderCounts: [],
        latestOrders: [],
        menuCount: (await getAdminMenuItems()).length
      };
    }

    throw error;
  }
}

export async function getAdminOrders() {
  if (!isDatabaseConfigured()) return [];

  try {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      select: adminOrderSelect
    });
  } catch (error) {
    if (isPrismaConnectionError(error) || isPrismaSchemaMismatchError(error)) return [];
    throw error;
  }
}

export async function getAdminSettings() {
  return getSettings();
}

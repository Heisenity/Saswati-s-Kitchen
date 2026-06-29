import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";
import { getAdminMenuItems } from "@/lib/menu";
import { getSettings } from "@/lib/settings";

export async function getAdminDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      orderCounts: [],
      latestOrders: [],
      menuCount: (await getAdminMenuItems()).length
    };
  }

  const [orderCounts, latestOrders, menuCount] = await Promise.all([
    prisma.order.groupBy({
      by: ["orderStatus"],
      _count: true
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { items: true }
    }),
    prisma.menuItem.count()
  ]);

  return { orderCounts, latestOrders, menuCount };
}

export async function getAdminOrders() {
  if (!isDatabaseConfigured()) return [];
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, paymentProof: true }
  });
}

export async function getAdminSettings() {
  return getSettings();
}

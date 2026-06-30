import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { requireStrictAdminSession } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireStrictAdminSession();
  const data = await getAdminDashboardData();

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-stone-500">Menu items</p>
          <p className="mt-3 font-serif text-4xl">{data.menuCount}</p>
        </Card>
        {data.orderCounts.slice(0, 2).map((count) => (
          <Card key={count.orderStatus} className="p-6">
            <p className="text-sm text-stone-500">{count.orderStatus.replaceAll("_", " ")}</p>
            <p className="mt-3 font-serif text-4xl">{count._count}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {data.latestOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{order.orderNumber}</p>
                <h3 className="mt-2 font-serif text-2xl">{order.customerName}</h3>
                <p className="mt-2 text-sm text-stone-600">
                  {formatDateTime(order.createdAt)} · {order.items.map((item) => `${item.itemName} x${item.quantity}`).join(", ")}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

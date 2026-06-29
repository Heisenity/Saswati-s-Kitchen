import { AdminShell } from "@/components/admin/admin-shell";
import { OrderManager } from "@/components/admin/order-manager";
import { requireAdminSession } from "@/lib/auth";
import { getAdminOrders } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminSession();
  const orders = await getAdminOrders();

  return (
    <AdminShell title="Orders">
      <OrderManager initialOrders={orders} />
    </AdminShell>
  );
}

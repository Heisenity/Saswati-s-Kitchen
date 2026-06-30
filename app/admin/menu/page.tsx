import { AdminShell } from "@/components/admin/admin-shell";
import { MenuManager } from "@/components/admin/menu-manager";
import { requireStrictAdminSession } from "@/lib/auth";
import { getAdminMenuItems } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await requireStrictAdminSession();
  const items = await getAdminMenuItems();

  return (
    <AdminShell title="Menu">
      <MenuManager initialItems={items} />
    </AdminShell>
  );
}

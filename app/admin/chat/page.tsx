import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChatPanel } from "@/components/admin/admin-chat-panel";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  await requireAdminSession();

  return (
    <AdminShell title="Live Chat">
      <AdminChatPanel />
    </AdminShell>
  );
}

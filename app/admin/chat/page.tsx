import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChatPanel } from "@/components/admin/admin-chat-panel";
import { requireStrictAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  await requireStrictAdminSession();

  return (
    <AdminShell title="Live Chat">
      <AdminChatPanel />
    </AdminShell>
  );
}

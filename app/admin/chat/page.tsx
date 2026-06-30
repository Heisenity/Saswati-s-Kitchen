import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChatPanel } from "@/components/admin/admin-chat-panel";
import { requireStrictAdminSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  await requireStrictAdminSession();
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/admin/login?error=login_required");
  }

  return (
    <AdminShell title="Live Chat">
      <AdminChatPanel accessToken={session.access_token} />
    </AdminShell>
  );
}

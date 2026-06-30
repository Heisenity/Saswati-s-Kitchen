import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireStrictAdminSession } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireStrictAdminSession();
  const settings = await getAdminSettings();

  return (
    <AdminShell title="Settings">
      <SettingsForm initialSettings={settings} />
    </AdminShell>
  );
}

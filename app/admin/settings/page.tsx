import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getAdminSettings } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminSession();
  const settings = await getAdminSettings();

  return (
    <AdminShell title="Settings">
      <SettingsForm initialSettings={settings} />
    </AdminShell>
  );
}

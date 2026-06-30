import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getServerAdminContext } from "@/lib/auth";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await getServerAdminContext();
  const { error } = await searchParams;

  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9efe3] px-4">
      <AdminLoginForm error={error} />
    </main>
  );
}

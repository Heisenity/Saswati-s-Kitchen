import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9efe3] px-4">
      <AdminLoginForm error={error} />
    </main>
  );
}

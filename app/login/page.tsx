import { CustomerAuthCard } from "@/components/auth/customer-auth-card";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9efe3] px-4">
      <CustomerAuthCard error={error} next={next?.startsWith("/") ? next : "/account"} />
    </main>
  );
}

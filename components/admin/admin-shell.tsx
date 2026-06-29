import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAdminSession } from "@/lib/auth";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/chat", label: "Chat" }
];

export function AdminShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f9efe3]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="surface h-fit w-full p-4 lg:w-72">
            <p className="font-serif text-2xl">Saswati’s Kitchen</p>
            <p className="mt-2 text-sm text-stone-600">Admin dashboard</p>
            <nav className="mt-6 grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <form
              className="mt-6"
              action={async () => {
                "use server";
                await clearAdminSession();
                redirect("/admin/login");
              }}
            >
              <Button variant="outline" className="w-full">
                Logout
              </Button>
            </form>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <h1 className="font-serif text-4xl">{title}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OAuthLoginCard({
  eyebrow,
  title,
  description,
  next,
  mode,
  error
}: {
  eyebrow: string;
  title: string;
  description: string;
  next: string;
  mode: "user" | "admin";
  error?: string;
}) {
  const query = `next=${encodeURIComponent(next)}&mode=${mode}`;

  return (
    <Card className="w-full max-w-md p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-stone-600">{description}</p>
      {error && error !== "supabase_not_configured" ? (
        <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {error === "admin_required"
            ? "This account does not have admin access."
            : "Could not sign in right now. Please try again."}
        </p>
      ) : null}
      <div className="mt-6 grid gap-3">
        <Link
          href={`/auth/login?provider=google&${query}`}
          className={cn(buttonVariants(), "w-full")}
        >
          Continue with Google
        </Link>
      </div>
    </Card>
  );
}

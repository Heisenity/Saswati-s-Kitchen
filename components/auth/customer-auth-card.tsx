"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function CustomerAuthCard({
  error,
  next = "/account"
}: {
  error?: string;
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const query = `next=${encodeURIComponent(next)}&mode=user`;

  async function signInWithEmail() {
    setSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) throw signInError;
      router.push(next);
      router.refresh();
    } catch (signInError) {
      setMessage(signInError instanceof Error ? signInError.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signUpWithEmail() {
    setSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const emailRedirectTo = new URL("/auth/callback", window.location.origin);
      emailRedirectTo.searchParams.set("next", next);
      emailRedirectTo.searchParams.set("mode", "user");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: emailRedirectTo.toString()
        }
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }

      setMessage("Account created. Check your email inbox to confirm and finish signing in.");
    } catch (signUpError) {
      setMessage(signUpError instanceof Error ? signUpError.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
        Customer access
      </p>
      <h1 className="mt-3 font-serif text-4xl">Sign in or sign up</h1>
      <p className="mt-4 text-sm leading-7 text-stone-600">
        Sign in to track your orders and check out faster.
      </p>
      {error && error !== "supabase_not_configured" ? (
        <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          Could not sign in right now. Please try again.
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        <Link href={`/auth/login?provider=google&${query}`} className={cn(buttonVariants(), "w-full")}>
          Continue with Google
        </Link>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-sm font-semibold text-foreground">Email and password</p>
        <p className="mt-2 text-xs leading-6 text-stone-500">
          Use a valid email address and a password with at least 6 characters.
        </p>
        <div className="mt-4 grid gap-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
            disabled={submitting || email.trim().length < 5 || password.length < 6}
            onClick={signInWithEmail}
          >
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in with email
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            disabled={submitting || email.trim().length < 5 || password.length < 6}
            onClick={signUpWithEmail}
          >
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account
          </button>
        </div>
      </div>
    </Card>
  );
}

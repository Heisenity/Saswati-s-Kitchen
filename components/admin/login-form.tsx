"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Protected access</p>
      <h1 className="mt-3 font-serif text-4xl">Admin login</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </Card>
  );
}

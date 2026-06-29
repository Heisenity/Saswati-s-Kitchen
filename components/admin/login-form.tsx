import { OAuthLoginCard } from "@/components/auth/oauth-login-card";

export function AdminLoginForm({ error }: { error?: string }) {
  return (
    <OAuthLoginCard
      eyebrow="Protected access"
      title="Admin login"
      description="Use Google sign in to continue."
      next="/admin/dashboard"
      mode="admin"
      error={error}
    />
  );
}

import { OAuthLoginCard } from "@/components/auth/oauth-login-card";

export function AdminLoginForm({ error }: { error?: string }) {
  return (
    <OAuthLoginCard
      eyebrow="Protected access"
      title="Admin login"
      description="Use an approved Google account to continue."
      next="/admin/dashboard"
      mode="admin"
      error={error}
    />
  );
}

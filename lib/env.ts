const requiredClientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4001",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ovmvmjgutbdtkxnzkvpb.supabase.co",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_pm0UNtRlsHPZJXlv-OMtpA_i7keLyx9"
};

export const env = {
  ...requiredClientEnv,
  databaseUrl: process.env.DATABASE_URL,
  adminEmailAllowlist:
    process.env.ADMIN_EMAIL_ALLOWLIST ??
    "insightsnode@gmail.com,senpintu95@gmail.com,saswatisen1980@gmail.com",
  supabaseProjectRef: process.env.SUPABASE_PROJECT_REF ?? "ovmvmjgutbdtkxnzkvpb",
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,
  r2PublicUrl: process.env.R2_PUBLIC_URL,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM ?? "orders@saswatiskitchen.in"
};

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function isSupabaseAuthConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function getAdminEmailAllowlist() {
  return env.adminEmailAllowlist
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isWhitelistedAdminEmail(email?: string | null) {
  return Boolean(email && getAdminEmailAllowlist().includes(email.trim().toLowerCase()));
}

const requiredClientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  chatServerUrl: process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4001"
};

export const env = {
  ...requiredClientEnv,
  databaseUrl: process.env.DATABASE_URL,
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "change-me",
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "replace-with-a-long-random-secret",
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

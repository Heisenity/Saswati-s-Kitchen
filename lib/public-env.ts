export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4001",
  chatServerUrl: process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ovmvmjgutbdtkxnzkvpb.supabase.co",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_pm0UNtRlsHPZJXlv-OMtpA_i7keLyx9",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999"
};

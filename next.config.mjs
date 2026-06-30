/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4001";
const chatServerUrl = process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4000";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ovmvmjgutbdtkxnzkvpb.supabase.co";
const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "https://pub-9d2bed8b98a0462bb1d4d2a1d7f9fcd6.r2.dev";

function getOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const connectSources = [
  "'self'",
  getOrigin(appUrl),
  getOrigin(chatServerUrl),
  getOrigin(supabaseUrl),
  "https://*.supabase.co",
  "wss://*.supabase.co",
  appUrl.startsWith("https://")
    ? appUrl.replace("https://", "wss://")
    : appUrl.replace("http://", "ws://"),
  chatServerUrl.startsWith("https://")
    ? chatServerUrl.replace("https://", "wss://")
    : chatServerUrl.replace("http://", "ws://")
].filter(Boolean);

const imgSources = [
  "'self'",
  "data:",
  "blob:",
  getOrigin(r2PublicUrl),
  "https://*.r2.dev"
].filter(Boolean);

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src ${connectSources.join(" ")}`,
  `img-src ${imgSources.join(" ")}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "frame-src 'self' https://accounts.google.com https://*.google.com"
].join("; ");

const nextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()"
          },
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ],
    qualities: [75, 82, 84]
  }
};

export default nextConfig;

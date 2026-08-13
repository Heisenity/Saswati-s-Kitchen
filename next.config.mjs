/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.URL ?? "http://localhost:4001";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ovmvmjgutbdtkxnzkvpb.supabase.co";
const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "https://pub-9d2bed8b98a0462bb1d4d2a1d7f9fcd6.r2.dev";
const r2Hostname = new URL(r2PublicUrl).hostname;

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
  getOrigin(supabaseUrl),
  getOrigin(r2PublicUrl),
  "https://*.r2.cloudflarestorage.com",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  appUrl.startsWith("https://")
    ? appUrl.replace("https://", "wss://")
    : appUrl.replace("http://", "ws://")
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
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/brand/logo.jpg", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
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
    // Optimized menu and hero photos are stable public assets. Reuse them for
    // 48 hours instead of re-optimizing the same image for every visit.
    minimumCacheTTL: 172800,
    remotePatterns: [
      {
        protocol: "https",
        hostname: r2Hostname
      }
    ],
    qualities: [75, 82, 84]
  }
};

export default nextConfig;

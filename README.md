# Saswati's Kitchen

Production-ready MVP for a Bengali homemade food delivery service in Barrackpore.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with shadcn-style UI primitives
- Prisma ORM for Supabase Postgres
- Supabase Auth with Google + Facebook OAuth for user and admin login
- Doppler for environment management
- Cloudflare R2 for payment proof storage
- Telegram Bot API + Nodemailer for admin alerts
- Separate Express + Socket.IO chat server
- Render deployment blueprint

## Connected services

- Supabase project ref: `ovmvmjgutbdtkxnzkvpb`
- Local dev ports:
  - Frontend: `http://localhost:4001`
  - Chat server: `http://localhost:4000`
- Local Doppler scope on this machine:
  - Project: `saswatis-kitchen`
  - Config: `dev`

## Folder structure

```text
app/
  admin/                   Admin dashboard pages
  api/                     Order, upload, admin, and chat helper routes
  checkout/                Checkout page
  receipt/[orderNumber]/   Receipt page
chat-server/src/           Separate low-latency Socket.IO server
components/
  admin/                   Admin dashboard client components
  cart/                    Cart provider and drawer
  chat/                    Customer chat widget
  checkout/                Checkout form UI
  receipt/                 Receipt actions
  site/                    Homepage sections
  ui/                      Reusable shadcn-style primitives
lib/                       Business rules, auth, Prisma, notifications, storage
prisma/                    Prisma schema and seed
public/brand/              SVG brand assets and placeholders
render.yaml                Render service definitions
```

## Core features

- Premium Bengali storefront with lunch thali cards
- Cart, checkout, strict slot validation, delivery charge logic
- Static UPI QR payment flow with screenshot + UTR upload
- Receipt page with WhatsApp summary handoff
- Manual admin verification and order status updates
- Realtime website chat with admin presence, offline alerts, and message persistence
- Telegram and email notifications for orders, payment proof, and offline chat

## Environment management

This project is set up to use Doppler instead of a committed `.env.local`.

Required Doppler secrets:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CHAT_SERVER_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROJECT_REF`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Notes:

- Use the Supabase Postgres connection string for both `DATABASE_URL` and `DIRECT_URL`.
- `NEXT_PUBLIC_SUPABASE_URL` should be `https://ovmvmjgutbdtkxnzkvpb.supabase.co`
- `SUPABASE_PROJECT_REF` should be `ovmvmjgutbdtkxnzkvpb`
- If `DATABASE_URL` is missing, the storefront falls back to sample menu/settings data, but orders, chat persistence, admin data, and payment workflows will not be production-ready.

You can use `.env.example` as a value checklist, but the runtime scripts are wired through Doppler.

## Local setup

```bash
npm install
npm run prisma:generate:raw
npm run dev:all
```

If you want Doppler-injected secrets during local development, use:

```bash
npm run dev:all:doppler
```

If you are setting this up on another machine, link the repo to Doppler first:

```bash
doppler setup -p saswatis-kitchen -c dev
```

App URLs:

- Storefront: `http://localhost:4001`
- Chat server health: `http://localhost:4000/health`

## Supabase setup

The Supabase database schema and seed data have already been applied to project `ovmvmjgutbdtkxnzkvpb`.

Configured in the repo:

- SSR auth client via `@supabase/ssr`
- Shared `/auth/callback` PKCE flow
- Google and Facebook login entry points for both `/login` and `/admin/login`
- `profiles` table for role-based authorization
- RLS policies for public menu access and private operational tables

Still required in the Supabase Dashboard:

1. Set **Authentication > URL Configuration**:
   - Site URL: `http://localhost:4001`
   - Redirect URL: `http://localhost:4001/auth/callback`
2. Enable **Google** and **Facebook** providers in **Authentication > Providers**
3. Add provider credentials from Google Cloud and Facebook Developers

Provider callback references:

- Google authorized redirect URI: `https://ovmvmjgutbdtkxnzkvpb.supabase.co/auth/v1/callback`
- Facebook valid OAuth redirect URI: `https://ovmvmjgutbdtkxnzkvpb.supabase.co/auth/v1/callback`

## Admin access

Admins authenticate with the same Supabase OAuth flow as users, but access is granted only when the signed-in profile has role `ADMIN`.

After your first login, promote your admin account in Supabase SQL:

```sql
update public.profiles
set role = 'ADMIN'
where email = 'your-email@example.com';
```

Without this role update, `/admin/login` will sign in successfully and then redirect back with `admin_required`.

## Default business rules

- Lunch closes at `09:00` IST
- Dinner opens at `15:00` IST
- Dinner closes at `17:00` IST
- Free delivery: `₹99+` up to `1 km`
- Free delivery: `₹149+` above `1 km` and up to `2 km`
- Above `2 km`: `₹29`
- Otherwise low-order delivery charge: `₹19`
- Advance payment: `50%`

## Render deployment

`render.yaml` provisions:

- `saswatis-kitchen-web` for Next.js
- `saswatis-kitchen-chat` for Express + Socket.IO

Point both services at the same Postgres database. If you want Supabase-hosted Postgres, keep the DB outside Render and only deploy the app services on Render.

## Notes

- The poster asset was not present in the workspace, so the current build uses code-based Bengali visual assets and placeholders.
- Replace `/public/brand/upi-qr-placeholder.svg` with the real UPI QR image or update it from admin settings.
- Replace the sample SVG thali illustrations with real food photography when available.
- `npm run build` currently passes with the Supabase auth + Doppler setup.

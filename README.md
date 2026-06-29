# Saswati's Kitchen

Production-ready MVP for a Bengali homemade food delivery service in Barrackpore.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with shadcn-style UI primitives
- Prisma ORM for PostgreSQL or Supabase Postgres
- Cloudflare R2 for payment proof storage
- Telegram Bot API + Nodemailer for admin alerts
- Separate Express + Socket.IO chat server
- Render deployment blueprint

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

## Environment variables

Copy `.env.example` to `.env.local` and fill these values:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CHAT_SERVER_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
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

For Supabase Postgres, use the Supabase connection string for both `DATABASE_URL` and `DIRECT_URL`.

## Local setup

```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev:all
```

App URLs:

- Storefront: `http://localhost:3000`
- Chat server health: `http://localhost:4001/health`

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

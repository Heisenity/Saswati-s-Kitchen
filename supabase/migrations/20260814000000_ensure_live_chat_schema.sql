-- Makes the persisted customer/admin chat available on existing Supabase projects.
-- Safe to run after the bootstrap migration: every statement is idempotent.

create table if not exists public."Chat" (
  id text primary key,
  "customerName" text not null,
  phone text not null,
  "orderId" text references public."Order"(id) on delete set null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."ChatMessage" (
  id text primary key,
  "chatId" text not null references public."Chat"(id) on delete cascade,
  "senderType" text not null check ("senderType" in ('CUSTOMER', 'ADMIN')),
  message text not null,
  seen boolean not null default false,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."AdminPresence" (
  id text primary key,
  "adminId" text not null,
  "onlineStatus" boolean not null default false,
  "lastSeenAt" timestamp(3) not null default current_timestamp
);

create index if not exists "Chat_phone_createdAt_idx" on public."Chat" (phone, "createdAt");
create index if not exists "Chat_updatedAt_idx" on public."Chat" ("updatedAt");
create index if not exists "ChatMessage_chatId_createdAt_idx" on public."ChatMessage" ("chatId", "createdAt");
create unique index if not exists "AdminPresence_adminId_key" on public."AdminPresence" ("adminId");

alter table public."Chat" enable row level security;
alter table public."ChatMessage" enable row level security;
alter table public."AdminPresence" enable row level security;

# Security Notes

## Supabase RLS SQL

Apply this in the Supabase SQL editor after `sql/001_schema.sql` is applied. The
server still enforces the stricter email allowlist; RLS below keeps normal users
boxed into their own rows and lets only `Profile.role = 'ADMIN'` read or mutate
operational data.

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public."Profile" profile
    where profile.id = auth.uid()
      and profile.role = 'ADMIN'
  );
$$;

alter table public."Profile" enable row level security;
alter table public."Order" enable row level security;
alter table public."OrderItem" enable row level security;
alter table public."Chat" enable row level security;
alter table public."ChatMessage" enable row level security;
alter table public."Setting" enable row level security;
alter table public."PaymentProof" enable row level security;
alter table public."MenuItem" enable row level security;
alter table public."MenuItemComponent" enable row level security;

drop policy if exists "profile self read" on public."Profile";
create policy "profile self read"
on public."Profile"
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profile self write" on public."Profile";
create policy "profile self write"
on public."Profile"
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "orders self read" on public."Order";
create policy "orders self read"
on public."Order"
for select
using ("userId" = auth.uid() or public.is_admin());

drop policy if exists "orders self write" on public."Order";
create policy "orders self write"
on public."Order"
for insert
with check ("userId" = auth.uid() or public.is_admin());

drop policy if exists "orders admin update" on public."Order";
create policy "orders admin update"
on public."Order"
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order items self read" on public."OrderItem";
create policy "order items self read"
on public."OrderItem"
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public."Order" orders
    where orders.id = "OrderItem"."orderId"
      and orders."userId" = auth.uid()
  )
);

drop policy if exists "order items admin write" on public."OrderItem";
create policy "order items admin write"
on public."OrderItem"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chat self read" on public."Chat";
create policy "chat self read"
on public."Chat"
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public."Order" orders
    where orders.id = "Chat"."orderId"
      and orders."userId" = auth.uid()
  )
);

drop policy if exists "chat admin write" on public."Chat";
create policy "chat admin write"
on public."Chat"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "chat messages self read" on public."ChatMessage";
create policy "chat messages self read"
on public."ChatMessage"
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public."Chat" chat
    join public."Order" orders on orders.id = chat."orderId"
    where chat.id = "ChatMessage"."chatId"
      and orders."userId" = auth.uid()
  )
);

drop policy if exists "chat messages admin write" on public."ChatMessage";
create policy "chat messages admin write"
on public."ChatMessage"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "settings admin only" on public."Setting";
create policy "settings admin only"
on public."Setting"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payment proof self read" on public."PaymentProof";
create policy "payment proof self read"
on public."PaymentProof"
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public."Order" orders
    where orders.id = "PaymentProof"."orderId"
      and orders."userId" = auth.uid()
  )
);

drop policy if exists "payment proof admin write" on public."PaymentProof";
create policy "payment proof admin write"
on public."PaymentProof"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "menu public read active" on public."MenuItem";
create policy "menu public read active"
on public."MenuItem"
for select
using ("isActive" = true or public.is_admin());

drop policy if exists "menu admin write" on public."MenuItem";
create policy "menu admin write"
on public."MenuItem"
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "menu components public read" on public."MenuItemComponent";
create policy "menu components public read"
on public."MenuItemComponent"
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public."MenuItem" item
    where item.id = "MenuItemComponent"."menuItemId"
      and item."isActive" = true
  )
);

drop policy if exists "menu components admin write" on public."MenuItemComponent";
create policy "menu components admin write"
on public."MenuItemComponent"
for all
using (public.is_admin())
with check (public.is_admin());
```

## Notes

- Keep `ADMIN_EMAIL_ALLOWLIST` server-only in Doppler.
- The app now fails closed for admin access if auth, profile lookup, or database
  connectivity is missing.
- Uploads reject mismatched MIME type, extension, and file signature before
  sending anything to R2.

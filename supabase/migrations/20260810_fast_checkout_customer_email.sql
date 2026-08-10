alter table "Order"
  add column if not exists "customerEmail" text;

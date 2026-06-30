begin;

create table if not exists profiles (
  id text primary key,
  email text unique,
  full_name text,
  avatar_url text,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles(role);

create table if not exists "MenuItem" (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null,
  price integer not null,
  "imageUrl" text not null,
  "mealType" text not null check ("mealType" in ('LUNCH', 'DINNER')),
  badge text not null,
  "isActive" boolean not null default true,
  "availableDate" timestamptz,
  "stockLimit" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists menu_item_meal_active_date_idx
  on "MenuItem" ("mealType", "isActive", "availableDate");

create table if not exists "MenuItemComponent" (
  id text primary key,
  "menuItemId" text not null references "MenuItem"(id) on delete cascade,
  "itemName" text not null
);

create index if not exists menu_item_component_menu_item_id_idx
  on "MenuItemComponent" ("menuItemId");

create table if not exists "Order" (
  id text primary key,
  "orderNumber" text not null unique,
  "checkoutToken" text not null unique,
  "userId" text,
  "customerName" text not null,
  phone text not null,
  address text not null,
  landmark text,
  latitude double precision,
  longitude double precision,
  "distanceKm" double precision,
  "slotType" text not null check ("slotType" in ('LUNCH', 'DINNER')),
  subtotal integer not null,
  "deliveryCharge" integer not null,
  "totalAmount" integer not null,
  "advanceAmount" integer not null,
  "balanceAmount" integer not null,
  "paymentStatus" text not null default 'PENDING_VERIFICATION'
    check ("paymentStatus" in ('PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED')),
  "orderStatus" text not null default 'PAYMENT_PENDING_VERIFICATION'
    check ("orderStatus" in (
      'PAYMENT_PENDING_VERIFICATION',
      'CONFIRMED',
      'PREPARING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'REJECTED'
    )),
  "paymentUtr" text,
  "paymentScreenshotUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists order_user_id_created_at_idx
  on "Order" ("userId", "createdAt");
create index if not exists order_phone_created_at_idx
  on "Order" (phone, "createdAt");
create index if not exists order_status_created_at_idx
  on "Order" ("orderStatus", "createdAt");

create table if not exists "OrderItem" (
  id text primary key,
  "orderId" text not null references "Order"(id) on delete cascade,
  "menuItemId" text references "MenuItem"(id) on delete set null,
  "itemName" text not null,
  quantity integer not null,
  "unitPrice" integer not null,
  "totalPrice" integer not null
);

create index if not exists order_item_order_id_idx on "OrderItem" ("orderId");
create index if not exists order_item_menu_item_id_idx on "OrderItem" ("menuItemId");

create table if not exists "Chat" (
  id text primary key,
  "customerName" text not null,
  phone text not null,
  "orderId" text unique references "Order"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists chat_phone_created_at_idx on "Chat" (phone, "createdAt");
create index if not exists chat_updated_at_idx on "Chat" ("updatedAt");

create table if not exists "ChatMessage" (
  id text primary key,
  "chatId" text not null references "Chat"(id) on delete cascade,
  "senderType" text not null check ("senderType" in ('CUSTOMER', 'ADMIN')),
  message text not null,
  seen boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create index if not exists chat_message_chat_id_created_at_idx
  on "ChatMessage" ("chatId", "createdAt");

create table if not exists "AdminPresence" (
  id text primary key,
  "adminId" text not null unique,
  "onlineStatus" boolean not null default false,
  "lastSeenAt" timestamptz not null default now()
);

create table if not exists adminhack (
  id text primary key,
  email text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists adminhack_email_created_at_idx on adminhack(email, created_at);
create index if not exists adminhack_created_at_idx on adminhack(created_at);

create table if not exists "Setting" (
  id text primary key,
  "kitchenLatitude" double precision not null default 22.757527,
  "kitchenLongitude" double precision not null default 88.380229,
  "lunchCloseTime" text not null default '09:00',
  "dinnerOpenTime" text not null default '09:30',
  "dinnerCloseTime" text not null default '18:00',
  "freeDeliveryOneKmMin" integer not null default 99,
  "freeDeliveryTwoKmMin" integer not null default 139,
  "aboveTwoKmDeliveryCharge" integer not null default 29,
  "lowOrderDeliveryCharge" integer not null default 19,
  "upiId" text not null default 'saswatiskitchen@upi',
  "qrImageUrl" text not null default '/brand/upi-qr.jpg',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "PaymentProof" (
  id text primary key,
  "orderId" text not null unique references "Order"(id) on delete cascade,
  "screenshotUrl" text not null,
  utr text not null,
  "verificationStatus" text not null default 'PENDING_VERIFICATION'
    check ("verificationStatus" in ('PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

commit;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TYPE "MealType" AS ENUM ('LUNCH', 'DINNER');
CREATE TYPE "SlotType" AS ENUM ('LUNCH', 'DINNER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED');
CREATE TYPE "OrderStatus" AS ENUM ('PAYMENT_PENDING_VERIFICATION', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED');
CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "badge" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableDate" TIMESTAMP(3),
    "stockLimit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuItemComponent" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,

    CONSTRAINT "MenuItemComponent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuItemComponent_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "checkoutToken" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,
    "slotType" "SlotType" NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "deliveryCharge" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "advanceAmount" INTEGER NOT NULL,
    "balanceAmount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PAYMENT_PENDING_VERIFICATION',
    "paymentUtr" TEXT,
    "paymentScreenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Chat_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "message" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AdminPresence" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "onlineStatus" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPresence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "kitchenLatitude" DOUBLE PRECISION NOT NULL DEFAULT 22.7604,
    "kitchenLongitude" DOUBLE PRECISION NOT NULL DEFAULT 88.3700,
    "lunchCloseTime" TEXT NOT NULL DEFAULT '09:00',
    "dinnerOpenTime" TEXT NOT NULL DEFAULT '15:00',
    "dinnerCloseTime" TEXT NOT NULL DEFAULT '17:00',
    "freeDeliveryOneKmMin" INTEGER NOT NULL DEFAULT 99,
    "freeDeliveryTwoKmMin" INTEGER NOT NULL DEFAULT 149,
    "aboveTwoKmDeliveryCharge" INTEGER NOT NULL DEFAULT 29,
    "lowOrderDeliveryCharge" INTEGER NOT NULL DEFAULT 19,
    "upiId" TEXT NOT NULL DEFAULT 'saswatiskitchen@upi',
    "qrImageUrl" TEXT NOT NULL DEFAULT '/brand/upi-qr-placeholder.svg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "utr" TEXT NOT NULL,
    "verificationStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
CREATE INDEX "profiles_role_idx" ON "profiles"("role");
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");
CREATE INDEX "MenuItem_mealType_isActive_availableDate_idx" ON "MenuItem"("mealType", "isActive", "availableDate");
CREATE INDEX "MenuItemComponent_menuItemId_idx" ON "MenuItemComponent"("menuItemId");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_checkoutToken_key" ON "Order"("checkoutToken");
CREATE INDEX "Order_phone_createdAt_idx" ON "Order"("phone", "createdAt");
CREATE INDEX "Order_orderStatus_createdAt_idx" ON "Order"("orderStatus", "createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");
CREATE UNIQUE INDEX "Chat_orderId_key" ON "Chat"("orderId");
CREATE INDEX "Chat_phone_createdAt_idx" ON "Chat"("phone", "createdAt");
CREATE INDEX "Chat_updatedAt_idx" ON "Chat"("updatedAt");
CREATE INDEX "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId", "createdAt");
CREATE UNIQUE INDEX "AdminPresence_adminId_key" ON "AdminPresence"("adminId");
CREATE UNIQUE INDEX "PaymentProof_orderId_key" ON "PaymentProof"("orderId");

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MenuItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MenuItemComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminPresence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentProof" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "Users can view own profile" ON "profiles"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON "profiles"
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'USER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE private.handle_new_user();

INSERT INTO "Setting" (
  "id",
  "kitchenLatitude",
  "kitchenLongitude",
  "lunchCloseTime",
  "dinnerOpenTime",
  "dinnerCloseTime",
  "freeDeliveryOneKmMin",
  "freeDeliveryTwoKmMin",
  "aboveTwoKmDeliveryCharge",
  "lowOrderDeliveryCharge",
  "upiId",
  "qrImageUrl",
  "createdAt",
  "updatedAt"
)
VALUES (
  'default-setting',
  22.7604,
  88.3700,
  '09:00',
  '15:00',
  '17:00',
  99,
  149,
  29,
  19,
  'saswatiskitchen@upi',
  '/brand/upi-qr-placeholder.svg',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "name", "slug", "description", "price", "imageUrl", "mealType", "badge", "isActive", "stockLimit", "createdAt", "updatedAt")
VALUES
  ('mutton-thali', 'Mutton Thali', 'mutton-thali', 'Rich Bengali mutton kosha for a special lunch.', 249, '/brand/mutton-thali.svg', 'LUNCH', 'Premium', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('chingri-thali', 'Chingri Thali', 'chingri-thali', 'Light, flavorful and comforting prawn meal.', 159, '/brand/chingri-thali.svg', 'LUNCH', 'Chef’s Pick', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pabda-thali', 'Pabda Thali', 'pabda-thali', 'Authentic Bengali sorshe pabda taste.', 159, '/brand/pabda-thali.svg', 'LUNCH', 'Traditional Favorite', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('chicken-thali', 'Chicken Thali', 'chicken-thali', 'Everyday comfort with homestyle chicken curry.', 149, '/brand/chicken-thali.svg', 'LUNCH', 'Most Loved', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('katlaa-macher-thali', 'Katlaa Macher Thali', 'katlaa-macher-thali', 'Balanced Bengali fish thali at a great price.', 139, '/brand/katlaa-thali.svg', 'LUNCH', 'Value Choice', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rui-macher-thali', 'Rui Macher Thali', 'rui-macher-thali', 'Classic rui macher kalia, perfect for regular lunch.', 119, '/brand/rui-thali.svg', 'LUNCH', 'Best Seller', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('egg-thali', 'Egg Thali', 'egg-thali', 'Simple, filling and affordable home-style meal.', 89, '/brand/egg-thali.svg', 'LUNCH', 'Budget Favorite', true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('veg-thali', 'Veg Thali', 'veg-thali', 'Fresh vegetarian Bengali meal for everyday eating.', 79, '/brand/veg-thali.svg', 'LUNCH', 'Light & Comforting', true, 26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItemComponent" ("id", "menuItemId", "itemName")
VALUES
  ('mutton-thali-1', 'mutton-thali', 'Rice'),
  ('mutton-thali-2', 'mutton-thali', 'Moosor daal'),
  ('mutton-thali-3', 'mutton-thali', 'Aloo potol kosha'),
  ('mutton-thali-4', 'mutton-thali', 'Mutton Kosha'),
  ('mutton-thali-5', 'mutton-thali', 'Chutney/aachar'),
  ('mutton-thali-6', 'mutton-thali', 'Papad'),
  ('mutton-thali-7', 'mutton-thali', 'Salad'),
  ('chingri-thali-1', 'chingri-thali', 'Rice'),
  ('chingri-thali-2', 'chingri-thali', 'Moosor daal'),
  ('chingri-thali-3', 'chingri-thali', 'Aloo potol kosha'),
  ('chingri-thali-4', 'chingri-thali', 'Chingri bhaapa'),
  ('chingri-thali-5', 'chingri-thali', 'Chutney/aachar'),
  ('chingri-thali-6', 'chingri-thali', 'Papad'),
  ('chingri-thali-7', 'chingri-thali', 'Salad'),
  ('pabda-thali-1', 'pabda-thali', 'Rice'),
  ('pabda-thali-2', 'pabda-thali', 'Moosor daal'),
  ('pabda-thali-3', 'pabda-thali', 'Aloo potol kosha'),
  ('pabda-thali-4', 'pabda-thali', 'Sorshe Pabda'),
  ('pabda-thali-5', 'pabda-thali', 'Chutney/aachar'),
  ('pabda-thali-6', 'pabda-thali', 'Papad'),
  ('pabda-thali-7', 'pabda-thali', 'Salad'),
  ('chicken-thali-1', 'chicken-thali', 'Rice'),
  ('chicken-thali-2', 'chicken-thali', 'Moosor daal'),
  ('chicken-thali-3', 'chicken-thali', 'Aloo potol kosha'),
  ('chicken-thali-4', 'chicken-thali', 'Chicken Curry'),
  ('chicken-thali-5', 'chicken-thali', 'Chutney/aachar'),
  ('chicken-thali-6', 'chicken-thali', 'Papad'),
  ('chicken-thali-7', 'chicken-thali', 'Salad'),
  ('katlaa-macher-thali-1', 'katlaa-macher-thali', 'Rice'),
  ('katlaa-macher-thali-2', 'katlaa-macher-thali', 'Moosor daal'),
  ('katlaa-macher-thali-3', 'katlaa-macher-thali', 'Aloo potol kosha'),
  ('katlaa-macher-thali-4', 'katlaa-macher-thali', 'Katla curry'),
  ('katlaa-macher-thali-5', 'katlaa-macher-thali', 'Chutney/aachar'),
  ('katlaa-macher-thali-6', 'katlaa-macher-thali', 'Papad'),
  ('katlaa-macher-thali-7', 'katlaa-macher-thali', 'Salad'),
  ('rui-macher-thali-1', 'rui-macher-thali', 'Rice'),
  ('rui-macher-thali-2', 'rui-macher-thali', 'Moosor daal'),
  ('rui-macher-thali-3', 'rui-macher-thali', 'Aloo potol kosha'),
  ('rui-macher-thali-4', 'rui-macher-thali', 'Rui macher kalia'),
  ('rui-macher-thali-5', 'rui-macher-thali', 'Chutney/aachar'),
  ('rui-macher-thali-6', 'rui-macher-thali', 'Papad'),
  ('rui-macher-thali-7', 'rui-macher-thali', 'Salad'),
  ('egg-thali-1', 'egg-thali', 'Rice'),
  ('egg-thali-2', 'egg-thali', 'Moosor daal'),
  ('egg-thali-3', 'egg-thali', 'Aloo potol kosha'),
  ('egg-thali-4', 'egg-thali', 'Egg curry'),
  ('egg-thali-5', 'egg-thali', 'Chutney/aachar'),
  ('egg-thali-6', 'egg-thali', 'Papad'),
  ('egg-thali-7', 'egg-thali', 'Salad'),
  ('veg-thali-1', 'veg-thali', 'Rice'),
  ('veg-thali-2', 'veg-thali', 'Moosor daal'),
  ('veg-thali-3', 'veg-thali', 'Aloo potol kosha'),
  ('veg-thali-4', 'veg-thali', 'Dhokar dalna / Paneer Curry'),
  ('veg-thali-5', 'veg-thali', 'Chutney/aachar'),
  ('veg-thali-6', 'veg-thali', 'Papad'),
  ('veg-thali-7', 'veg-thali', 'Salad')
ON CONFLICT ("id") DO NOTHING;

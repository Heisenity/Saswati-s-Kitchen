CREATE POLICY "Public can view active menu items" ON "MenuItem"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

CREATE POLICY "Public can view active menu item components" ON "MenuItemComponent"
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."MenuItem" AS mi
      WHERE mi."id" = "MenuItemComponent"."menuItemId"
        AND mi."isActive" = true
    )
  );

CREATE POLICY "No direct client access to orders" ON "Order"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to order items" ON "OrderItem"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to chats" ON "Chat"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to chat messages" ON "ChatMessage"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to admin presence" ON "AdminPresence"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to settings" ON "Setting"
  FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "No direct client access to payment proofs" ON "PaymentProof"
  FOR SELECT TO anon, authenticated
  USING (false);

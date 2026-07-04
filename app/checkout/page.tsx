import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { requireUserSession } from "@/lib/auth";
import { getMenuItems } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { getSlotState } from "@/lib/slot";

export const dynamic = "force-dynamic";

export default async function Checkout() {
  await requireUserSession("/login?next=/checkout");
  const [settings, menuItems] = await Promise.all([getSettings(), getMenuItems()]);
  const slotState = getSlotState(settings);

  return (
    <main>
      <Header />
      <CheckoutPage
        settings={settings}
        slotState={slotState}
        recommendations={menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          badge: item.badge,
          mealType: item.mealType,
          itemKind: item.itemKind
        }))}
      />
      <Footer />
    </main>
  );
}

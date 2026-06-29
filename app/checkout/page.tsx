import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getSettings } from "@/lib/settings";
import { getSlotState } from "@/lib/slot";

export const dynamic = "force-dynamic";

export default async function Checkout() {
  const settings = await getSettings();
  const slotState = getSlotState(settings);

  return (
    <main>
      <Header />
      <CheckoutPage settings={settings} slotState={slotState} />
      <Footer />
    </main>
  );
}

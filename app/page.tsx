import { Footer } from "@/components/site/footer";
import { ChatWidgetLazy } from "@/components/chat/chat-widget-lazy";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { MenuSection } from "@/components/site/menu-section";
import { DeliveryRules, SupportSection, TimingSection } from "@/components/site/sections";
import { TrustBadges } from "@/components/site/trust-badges";
import { getMenuItems } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { getSlotState } from "@/lib/slot";

// Public storefront data is cached for 48 hours and instantly cleared by admin menu/settings edits.
export const revalidate = 172800;

export default async function HomePage() {
  const [menuItems, settings] = await Promise.all([getMenuItems(), getSettings()]);
  const slotState = getSlotState(settings);

  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <MenuSection
        items={menuItems}
        kitchenLocation={{
          latitude: settings.kitchenLatitude,
          longitude: settings.kitchenLongitude
        }}
      />
      <DeliveryRules />
      <TimingSection label={slotState.label} />
      <SupportSection />
      <Footer />
      <ChatWidgetLazy />
    </main>
  );
}

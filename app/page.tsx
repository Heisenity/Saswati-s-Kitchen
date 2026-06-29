import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { MenuSection } from "@/components/site/menu-section";
import { DeliveryRules, SupportSection, TimingSection } from "@/components/site/sections";
import { TrustBadges } from "@/components/site/trust-badges";
import { ChatWidget } from "@/components/chat/chat-widget";
import { getMenuItems } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { getSlotState } from "@/lib/slot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [menuItems, settings] = await Promise.all([getMenuItems(), getSettings()]);
  const slotState = getSlotState(settings);

  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <MenuSection items={menuItems} />
      <DeliveryRules />
      <TimingSection label={slotState.label} />
      <SupportSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}

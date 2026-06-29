import { BadgeCheck, ChefHat, Clock3, Leaf, ShieldCheck, Truck } from "lucide-react";

const items = [
  { label: "Freshly Cooked", icon: ChefHat },
  { label: "Hygienic Packing", icon: ShieldCheck },
  { label: "Daily Menu", icon: BadgeCheck },
  { label: "Limited Slots", icon: Clock3 },
  { label: "Free Delivery Rules", icon: Truck },
  { label: "Homely Taste", icon: Leaf }
];

export function TrustBadges() {
  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="surface flex items-center gap-3 px-4 py-4">
            <item.icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

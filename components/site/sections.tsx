import {
  Clock3,
  Gift,
  LocateFixed,
  MapPin,
  MessageCircleMore,
  Moon,
  Quote,
  ReceiptIndianRupee,
  Star,
  SunMedium,
  Upload,
  UtensilsCrossed
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const orderingSteps = [
  {
    number: "01",
    title: "Choose your thali",
    description: "Pick your preferred thali and confirm quantity.",
    Icon: UtensilsCrossed
  },
  {
    number: "02",
    title: "Tap Locate Me",
    description: "We check your delivery area and free delivery eligibility automatically.",
    Icon: LocateFixed
  },
  {
    number: "03",
    title: "Order smartly",
    description: "Add a little more to unlock better value where applicable.",
    Icon: Gift
  },
  {
    number: "04",
    title: "Pay 50% advance",
    description: "Secure your meal using the UPI QR code.",
    Icon: ReceiptIndianRupee
  },
  {
    number: "05",
    title: "Upload screenshot",
    description: "Share payment proof for quick manual verification.",
    Icon: Upload
  },
  {
    number: "06",
    title: "Get WhatsApp confirmation",
    description: "Receive confirmation and balance payment details on WhatsApp.",
    Icon: MessageCircleMore
  }
];

export function DeliveryRules() {
  return (
    <section id="delivery" className="section-padding bg-gradient-to-b from-[#f8f2ea] via-[#fbf7f2] to-[#f6efe6] pt-0">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card className="relative overflow-hidden rounded-[32px] border border-[#eadfd3] bg-white/90 p-6 shadow-[0_20px_60px_rgba(60,35,20,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#f1d7b8]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#b83b2f]/10 blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b83b2f]">Free Delivery Benefits</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">
              Unlock free delivery with your order value
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Order a little more and enjoy better value on every meal. Free delivery unlocks automatically based on your location and cart value.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Up to 1 km", headline: "Free delivery on orders ₹99+", description: "Perfect for quick nearby orders." },
                { title: "Up to 2 km", headline: "Free delivery on orders ₹139+", description: "Add a little more and unlock better value." },
                { title: "Above 2 km", headline: "Free delivery on orders ₹350+", description: "Best for family or group orders." }
              ].map((item) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-[28px] border border-[#eadfd3] bg-gradient-to-b from-white to-[#fffaf5] p-5 shadow-[0_20px_60px_rgba(60,35,20,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(184,59,47,0.12)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#b83b2f] via-[#d08b2f] to-[#f0c36b]" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                      <p className="mt-3 text-xl font-semibold leading-snug text-[#b83b2f]">{item.headline}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3e7] text-[#b83b2f] transition-transform duration-300 group-hover:scale-105">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-stone-700">
              Tip: A slightly bigger order can help you unlock free delivery and make every meal more worth it.
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-[32px] border border-[#eadfd3] bg-white/90 p-6 shadow-[0_20px_60px_rgba(60,35,20,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#f1d7b8]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#b83b2f]/10 blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b83b2f]">How Ordering Works</p>
            <h3 className="mt-4 max-w-3xl font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">
              A smooth and rewarding ordering flow
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
              From choosing your thali to confirmation, every step is designed to be simple, reliable, and value-focused.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {orderingSteps.map(({ number, title, description, Icon }) => (
                <article
                  key={number}
                  className="rounded-[24px] border border-[#eee4d8] bg-gradient-to-br from-[#fffdfb] to-[#faf4ed] p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(184,59,47,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3e7] text-[#b83b2f]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-[#edd8c3] bg-[#fff8f0] px-3 py-1 text-xs font-semibold tracking-[0.22em] text-[#b83b2f]">
                      {number}
                    </span>
                  </div>
                  <h4 className="mt-6 text-2xl font-semibold leading-tight text-stone-900">{title}</h4>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function TimingSection({ label }: { label: string }) {
  const timingCards = [
    {
      title: "Dinner Orders",
      time: "9:30 AM – 6:00 PM",
      description: "Dinner orders are accepted during this window.",
      Icon: Moon
    },
    {
      title: "Lunch Orders",
      time: "6:01 PM – 9:00 AM",
      description: "Lunch ordering stays open for the next day.",
      Icon: SunMedium
    }
  ];

  const testimonials = [
    {
      name: "Madhumita",
      location: "Barrackpore",
      initials: "M",
      quote: "Ekdom ghar-er moto ranna. Bhaat, daal aar mangsho sob fresh, tel-o beshi noy."
    },
    {
      name: "Anirban",
      location: "Cantonment area",
      initials: "A",
      quote: "Delivery time ta clear thake, aar macher jhol-e puro Bangali flavour ta thik moto pawa jay."
    },
    {
      name: "Sohini",
      location: "Chiriamore",
      initials: "S",
      quote: "Busy weekday-eo ekhane order korle mone hoy bari thekei gorom lunch eshe gelo."
    }
  ];

  return (
    <section id="timing" className="section-padding bg-gradient-to-b from-[#f8f2ea] via-[#fbf7f2] to-[#f6efe6] pt-0">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="relative overflow-hidden rounded-[32px] border border-[#eadfd3] bg-white/90 p-6 shadow-[0_20px_60px_rgba(60,35,20,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#f1d7b8]/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#b83b2f]/10 blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b83b2f]">Slot Timing</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">
              Order fresh meals within today&apos;s active slot
            </h3>
            <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
              Lunch and dinner ordering windows are managed daily to keep preparation fresh and limited.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {timingCards.map(({ title, time, description, Icon }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-[24px] border border-[#eee4d8] bg-gradient-to-b from-white to-[#fffaf5] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(184,59,47,0.10)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff3e7] text-[#b83b2f] transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{title}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#b83b2f]">
                        <Clock3 className="h-4 w-4" />
                        {time}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] border border-[#63c989] bg-[#f4fff7] p-4 text-[#146c3c] shadow-[0_0_0_1px_rgba(30,142,82,0.12),0_0_26px_rgba(30,142,82,0.18)] animate-[pulse_2.6s_ease-in-out_infinite]">
              <div className="flex items-center gap-3 font-semibold">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E8E52] opacity-50" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1E8E52]" />
                </span>
                Current status: {label}
              </div>
              <p className="mt-2 text-sm leading-7 text-[#146c3c]/80">
                Order before the slot closes to reserve today&apos;s fresh preparation.
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-[32px] border border-[#eadfd3] bg-white/90 p-6 shadow-[0_20px_60px_rgba(60,35,20,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#f7e7c9]/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#b83b2f]/10 blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b83b2f]">Customer Trust</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">
              Loved by daily Bengali meal customers
            </h3>
            <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
              Simple, hygienic, ghar-er moto ranna that customers can rely on for everyday meals.
            </p>
            <div className="mt-6 grid gap-4">
              {testimonials.map((item) => (
                <blockquote
                  key={item.name}
                  className="group rounded-[24px] border border-[#efe4d8] bg-gradient-to-br from-[#fffdfb] to-[#faf4ed] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e3c4a3] hover:shadow-[0_12px_32px_rgba(184,59,47,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3e7] text-[#b83b2f] transition-transform duration-300 group-hover:scale-105">
                      <Quote className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1 text-[#d08b2f]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-stone-700">“{item.quote}”</p>
                      <footer className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#b83b2f] to-[#d08b2f] text-sm font-semibold text-white">
                            {item.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{item.name}</p>
                            <span className="mt-1 inline-flex rounded-full bg-[#f7eadc] px-3 py-1 text-xs text-stone-600">
                              {item.location}
                            </span>
                          </div>
                        </div>
                      </footer>
                    </div>
                  </div>
                </blockquote>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function SupportSection() {
  return (
    <section id="support" className="section-padding pt-0">
      <div className="mx-auto max-w-7xl">
        <Card className="grid gap-8 bg-[#fbefe8] p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Need help?</p>
            <h3 className="mt-4 max-w-xl font-serif text-4xl">Need help? Chat with us instantly.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-700">
              Tap chat to message us instantly, or reach us directly by call or email for quick help with ordering.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-stone-700 sm:max-w-xl sm:grid-cols-2">
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Call us</p>
                <a href="tel:6289350762" className="mt-2 block font-semibold text-foreground">
                  6289350762
                </a>
              </div>
              <div className="rounded-3xl bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Mail us</p>
                <a href="mailto:saswatikitchen@gmail.com" className="mt-2 block break-all font-semibold text-foreground">
                  saswatikitchen@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <button
              type="button"
              data-open-chat="true"
              className={cn(buttonVariants(), "mx-auto w-full max-w-[340px] py-2.5")}
            >
              Chat with us now
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

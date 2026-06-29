"use client";

import { defaultTestimonials } from "@/lib/default-data";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DeliveryRules() {
  return (
    <section id="delivery" className="section-padding pt-0">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-[#fff4dc] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">FREE DELIVERY</p>
          <h3 className="mt-4 font-serif text-3xl">₹99+ up to 1 km | ₹139+ up to 2 km | ₹300+ above 2 km</h3>
          <div className="mt-6 grid gap-3 text-sm leading-7 text-stone-700">
            <div className="rounded-3xl bg-white px-4 py-4">Above 2 km, delivery is free from ₹300. Otherwise delivery charge is ₹29.</div>
            <div className="rounded-3xl bg-white px-4 py-4">
              More than 1 km and up to 2 km: free delivery starts from ₹139, otherwise delivery charge is ₹19.
            </div>
            <div className="rounded-3xl bg-white px-4 py-4">
              Up to 1 km: free delivery starts from ₹99, otherwise delivery charge is ₹12.
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">How Ordering Works</p>
          <ol className="mt-5 grid gap-4 text-sm leading-7 text-stone-700">
            <li className="rounded-3xl bg-muted px-4 py-4">Choose your thali and confirm quantity.</li>
            <li className="rounded-3xl bg-muted px-4 py-4">Pay 50% advance using the static UPI QR code.</li>
            <li className="rounded-3xl bg-muted px-4 py-4">Upload payment screenshot for manual verification.</li>
            <li className="rounded-3xl bg-muted px-4 py-4">Balance payable on delivery after confirmation.</li>
          </ol>
        </Card>
      </div>
    </section>
  );
}

export function TimingSection({ label }: { label: string }) {
  return (
    <section id="timing" className="section-padding pt-0">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Slot Timing</p>
          <h3 className="mt-4 font-serif text-3xl">Dinner 9:30 AM - 6:00 PM | Lunch 6:01 PM - 9:00 AM</h3>
          <div className="mt-5 space-y-3 text-sm text-stone-700">
            <p className="rounded-3xl bg-muted px-4 py-4">Dinner orders are accepted from 9:30 AM to 6:00 PM IST.</p>
            <p className="rounded-3xl bg-muted px-4 py-4">From 6:01 PM to 9:00 AM, lunch ordering stays open for the next day.</p>
            <p className="rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 font-semibold text-primary">
              Current status: {label}
            </p>
          </div>
        </Card>
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Customer Trust</p>
          <div className="mt-5 grid gap-4">
            {defaultTestimonials.map((item) => (
              <blockquote key={item.name} className="rounded-3xl bg-muted px-4 py-4 text-sm leading-7 text-stone-700">
                “{item.quote}”
                <footer className="mt-2 font-semibold text-foreground">{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export function SupportSection() {
  function openChat() {
    window.dispatchEvent(new Event("saswatis:open-chat"));
  }

  return (
    <section id="support" className="section-padding pt-0">
      <div className="mx-auto max-w-7xl">
        <Card className="grid gap-8 bg-[#fbefe8] p-8 lg:items-center lg:grid-cols-[1.1fr_0.9fr]">
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
                <a href="mailto:saswatikitchen@gmail.com" className="mt-2 block font-semibold text-foreground break-all">
                  saswatikitchen@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <button type="button" onClick={openChat} className={cn(buttonVariants(), "w-full")}>
              Chat with us now
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

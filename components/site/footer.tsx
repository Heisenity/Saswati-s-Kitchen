import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#f8efe1]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-serif text-2xl">Saswati’s Kitchen</p>
          <p className="mt-3 max-w-md text-sm text-stone-600">
            Fresh Bengali lunch cooked daily with care in Barrackpore. Limited daily preparation for freshness.
          </p>
          <p className="mt-4 text-xs text-stone-500">
            Powered and maintained by{" "}
            <a href="https://www.insightsnode.com" target="_blank" rel="noreferrer" className="font-semibold text-foreground">
              InsightsNode
            </a>
            .
          </p>
        </div>
        <div>
          <p className="font-semibold">Quick Links</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-stone-600">
            <Link href="#menu">Today’s Menu</Link>
            <Link href="#delivery">Delivery Rules</Link>
            <Link href="#timing">Slot Timing</Link>
            <Link href="#support">Support</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Ordering Note</p>
          <p className="mt-3 text-sm text-stone-600">
            50% advance to avoid food wastage. Balance payable on delivery.
          </p>
        </div>
      </div>
    </footer>
  );
}

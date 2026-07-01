import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16 lg:pt-8">
      <div className="absolute inset-x-0 top-10 mx-auto hidden max-w-6xl opacity-30 lg:block">
        <Image src="/brand/howrah-line.svg" alt="" width={1200} height={400} className="w-full" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="relative">
          <Badge>Cooked fresh daily</Badge>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-[0.95] text-foreground sm:text-5xl lg:text-[5.1rem]">
            Fresh Homemade Bengali Meals, Delivered Daily
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-700 sm:text-lg">
            Simple, hygienic, ghar-er moto ranna cooked fresh with care every day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#menu" className={cn(buttonVariants({ size: "lg" }))}>
              Order Today’s Menu
            </Link>
          </div>
        </div>

        <div className="surface bridge-grid relative overflow-hidden p-4 sm:p-5">
          <div className="absolute inset-x-4 top-4 z-10 flex justify-end sm:inset-x-5 sm:top-5">
            <Badge className="max-w-[16rem] whitespace-normal bg-mustard/25 px-4 py-2 text-right leading-tight text-foreground sm:max-w-[22rem]">
              Premium Bengali Lunch
            </Badge>
          </div>
          <Image
            src="/brand/mutton-thali.jpg"
            alt="Saswati's Kitchen signature lunch thali"
            width={640}
            height={640}
            className="aspect-[1.02/0.9] h-auto w-full rounded-[24px] border border-border bg-white object-cover"
            sizes="(min-width: 1024px) 42vw, 100vw"
            quality={84}
            priority
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white p-3.5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Freshness</p>
              <p className="mt-1.5 font-serif text-xl sm:text-2xl">Limited Slots</p>
            </div>
            <div className="rounded-3xl bg-white p-3.5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Packaging</p>
              <p className="mt-1.5 font-serif text-xl sm:text-2xl">Hygienic & Sealed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

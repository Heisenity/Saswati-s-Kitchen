import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-4 pt-5 sm:px-6 sm:pb-14 sm:pt-6 lg:px-8 lg:pb-16 lg:pt-8">
      <div className="absolute inset-x-0 top-10 mx-auto hidden max-w-6xl opacity-30 lg:block">
        <Image src="/brand/howrah-line.svg" alt="" width={1200} height={400} className="w-full" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="relative">
          <Badge className="px-2.5 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs">Cooked fresh daily</Badge>
          <h1 className="mt-3 max-w-2xl break-words font-serif text-3xl leading-[1.02] text-foreground sm:mt-5 sm:text-5xl lg:text-[5.1rem]">
            <span className="sm:hidden">Fresh Bengali meals, made today.</span>
            <span className="hidden sm:inline">Fresh Homemade Bengali Meals, Delivered Daily</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-700 sm:mt-5 sm:text-lg sm:leading-8">
            <span className="sm:hidden">Choose a dish and add it in one tap.</span>
            <span className="hidden sm:inline">Simple, hygienic, ghar-er moto ranna cooked fresh with care every day.</span>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Link href="#menu" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Order Today’s Menu
            </Link>
          </div>
        </div>

        <div className="surface bridge-grid relative hidden overflow-hidden p-4 sm:block sm:p-5">
          <div className="absolute inset-x-6 top-6 z-10 flex justify-end sm:inset-x-7 sm:top-7">
            <Badge className="max-w-[calc(100%-1rem)] whitespace-normal bg-mustard/90 px-3 py-1.5 text-right text-[10px] leading-tight text-foreground shadow-sm sm:max-w-[22rem] sm:px-4 sm:py-2 sm:text-xs">
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
          <div className="mt-4 grid gap-3 min-[380px]:grid-cols-2">
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

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function BotanicalSprig({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 150 170"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 160C39 128 48 91 50 24M31 132c26-8 44-26 55-51M47 91C31 78 22 62 18 43M53 69c21-5 39-17 54-37" />
        <path d="M47 48c-13-7-20-17-21-29 13 2 22 10 25 23M50 77c13-12 27-16 41-12-6 14-18 21-36 21M35 109c-16-3-27-11-33-24 15-3 28 2 38 16M65 106c13-13 28-18 43-15-5 15-18 24-37 25" />
        <path d="M96 49c8-15 20-24 35-26 0 15-9 27-26 35M78 125c16-10 32-12 47-6-8 14-22 20-41 16" />
        <circle cx="51" cy="22" r="4" />
      </g>
    </svg>
  );
}

function LotusDivider() {
  return (
    <div className="mx-auto flex w-[58%] max-w-[15rem] items-center gap-2.5 text-[#b77a2f]" aria-hidden="true">
      <span className="h-px flex-1 bg-current/65" />
      <svg viewBox="0 0 36 28" fill="none" className="h-7 w-9 shrink-0">
        <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 24c-5-5-6-11 0-19 6 8 5 14 0 19Z" />
          <path d="M16 23c-7-1-11-5-12-12 7 1 11 5 12 12ZM20 23c7-1 11-5 12-12-7 1-11 5-12 12Z" />
          <path d="M17 25c-8 0-13-2-17-7M19 25c8 0 13-2 17-7" />
        </g>
      </svg>
      <span className="h-px flex-1 bg-current/65" />
    </div>
  );
}

function PlaqueLeaf({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 44 34" fill="none" aria-hidden="true" focusable="false" className={className}>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 31C14 25 20 16 24 3" />
        <path d="M12 25C7 24 4 21 3 17c5 0 9 2 11 6M17 20c1-6 5-10 10-12 1 5-2 10-8 14M21 13c-4-2-6-5-6-9 5 1 8 3 9 7" />
        <circle cx="4" cy="31" r="1.6" />
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-4 pt-5 sm:px-6 sm:pb-14 sm:pt-6 lg:px-8 lg:pb-16 lg:pt-8">
      <div className="absolute inset-x-0 top-10 mx-auto hidden max-w-6xl opacity-30 lg:block">
        <Image src="/brand/howrah-line.svg" alt="" width={1200} height={400} className="w-full" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="sm:hidden">
          <div className="relative isolate overflow-hidden rounded-[34px] border border-[#be7d2d]/60 bg-[#fff6e7] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.58),0_8px_24px_rgba(105,64,20,0.06)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] z-[1] rounded-[30px] border border-white/45" />
            <BotanicalSprig className="pointer-events-none absolute -left-8 top-36 z-[1] h-36 w-32 text-[#bd8536]/20" />
            <BotanicalSprig className="pointer-events-none absolute -right-9 top-7 z-[1] h-40 w-36 -scale-x-100 rotate-6 text-[#bd8536]/18" />

            <div className="relative z-10 px-4 pb-2 pt-[3.35rem] text-center min-[390px]:px-5 min-[412px]:pt-[3.65rem]">
              <div className="flex items-center justify-center gap-1.5">
                <span aria-hidden="true" className="text-lg leading-none text-[#c58a35]/75">❧</span>
                <Badge
                  className="justify-center border-[#b86833]/50 bg-[#fff9ef]/85 px-4 py-2 text-[0.93rem] font-semibold normal-case tracking-[-0.01em] text-[#9f3828] shadow-[0_4px_12px_rgba(119,66,24,0.08)] min-[390px]:px-5 min-[390px]:text-base"
                >
                  <span lang="bn">আজই রান্না, আজই ডেলিভারি</span>
                </Badge>
                <span aria-hidden="true" className="-scale-x-100 text-lg leading-none text-[#c58a35]/75">❧</span>
              </div>

              <h1
                lang="bn"
                className="mx-auto mt-12 max-w-[21rem] text-[clamp(2.5rem,11vw,3.15rem)] font-medium leading-[1.02] tracking-[-0.035em] text-[#28180d]"
                style={{ fontFamily: '"Noto Serif Bengali", "Bangla MN", "Kohinoor Bangla", "Nirmala UI", serif' }}
              >
                <span className="block">ঘরের স্বাদ,</span>
                <span className="mt-1 block">আজই আপনার <span className="text-[#a93a22]">টেবিলে।</span></span>
              </h1>

              <div className="mt-7">
                <LotusDivider />
              </div>

              <p
                lang="bn"
                className="mx-auto mt-6 max-w-[20rem] text-[0.98rem] leading-[1.7] text-[#49382c]/85 min-[390px]:text-[1.04rem]"
              >
                আজকের রান্না আজই—পছন্দের স্বাদ ফুরিয়ে যাওয়ার আগেই অর্ডার করুন।
              </p>
            </div>

            <div className="relative mt-1 h-[clamp(21rem,92vw,25rem)] overflow-hidden">
              <Image
                src="/brand/howrah-bridge-sunrise.png"
                alt="Howrah Bridge over the Hooghly River at golden hour"
                fill
                className="object-cover object-[60%_58%] min-[412px]:object-[63%_58%]"
                sizes="(max-width: 639px) calc(100vw - 2rem), 0px"
                quality={84}
                priority
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[58%]"
                style={{ background: "linear-gradient(to bottom, #fff6e7 0%, rgba(255,246,231,.96) 18%, rgba(255,246,231,.72) 42%, rgba(255,246,231,.2) 70%, transparent 100%)" }}
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(232,157,65,0.03),rgba(125,68,20,0.09))]" />
              <BotanicalSprig className="pointer-events-none absolute -left-7 top-7 z-[2] h-24 w-24 rotate-[78deg] text-[#bd8536]/15" />

              <div className="absolute left-1/2 top-[29%] z-[3] w-max max-w-[calc(100%-6rem)] -translate-x-1/2 rounded-[24px] border border-[#be7d2d]/65 bg-[#fff6e7]/85 px-7 py-3.5 text-center shadow-[0_8px_22px_rgba(78,42,12,0.1)] backdrop-blur-[6px]">
                <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[58%] bg-[#fff6e7] px-2 text-sm text-[#bd8536]">✦</span>
                <PlaqueLeaf className="pointer-events-none absolute bottom-1 left-1 h-8 w-10 text-[#bd8536]/45" />
                <PlaqueLeaf className="pointer-events-none absolute bottom-1 right-1 h-8 w-10 -scale-x-100 text-[#bd8536]/45" />
                <p
                  lang="bn"
                  className="relative z-10 whitespace-nowrap text-[1.08rem] text-[#76502d] min-[390px]:text-[1.18rem]"
                  style={{ fontFamily: '"Noto Serif Bengali", "Bangla MN", "Kohinoor Bangla", "Nirmala UI", serif' }}
                >
                  ঘরের স্বাদ, মনের টানে
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden sm:block">
          <Badge className="px-3 py-1 text-xs">Cooked fresh daily</Badge>
          <h1 className="mt-5 max-w-2xl break-words font-serif text-5xl leading-[1.02] text-foreground lg:text-[5.1rem]">
            Fresh Homemade Bengali Meals, Delivered Daily
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700">
            Simple, hygienic, ghar-er moto ranna cooked fresh with care every day.
          </p>
          <div className="mt-8 flex flex-row gap-3">
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

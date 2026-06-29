"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-x-0 top-10 mx-auto hidden max-w-6xl opacity-30 lg:block">
        <Image src="/brand/howrah-line.svg" alt="" width={1200} height={400} className="w-full" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative"
        >
          <Badge>Cooked fresh daily</Badge>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
            Fresh Homemade Bengali Meals, Delivered Daily
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
            Simple, hygienic, ghar-er moto ranna cooked fresh with care in Barrackpore.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#menu" className={cn(buttonVariants({ size: "lg" }))}>
              Order Today’s Menu
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="surface bridge-grid relative overflow-hidden p-6"
        >
          <div className="absolute right-6 top-6">
            <Badge className="bg-mustard/25 text-foreground">Premium Bengali Lunch</Badge>
          </div>
          <Image
            src="/brand/mutton-thali.jpg"
            alt="Saswati's Kitchen signature lunch thali"
            width={640}
            height={640}
            className="aspect-square h-auto w-full rounded-[26px] border border-border bg-white object-cover"
            sizes="(min-width: 1024px) 42vw, 100vw"
            quality={84}
            priority
          />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Freshness</p>
              <p className="mt-2 font-serif text-2xl">Limited Slots</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Packaging</p>
              <p className="mt-2 font-serif text-2xl">Hygienic & Sealed</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

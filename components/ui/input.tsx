import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-primary/50",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

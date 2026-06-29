import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-primary/50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

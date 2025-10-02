import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-gradient-to-r from-[#dbeafe] via-[#ede9fe] to-[#ffe4e6] text-slate-800 shadow-[0_18px_40px_-18px_rgba(99,102,241,0.55)] hover:from-[#c7d2fe] hover:via-[#e9d5ff] hover:to-[#fecdd3]",
          variant === "ghost" &&
            "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

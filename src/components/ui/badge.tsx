import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "warning" | "danger" | "success";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600 border border-slate-200/70",
  warning: "bg-amber-50 text-amber-600 border border-amber-200/70",
  danger: "bg-rose-50 text-rose-600 border border-rose-200/70",
  success: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

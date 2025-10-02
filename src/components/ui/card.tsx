import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_30px_80px_-60px_rgba(148,163,184,0.55)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-2", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-slate-800", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p className={cn("text-sm text-slate-500", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />;
}

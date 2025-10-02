import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[184px] w-full resize-none rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-base text-slate-700 shadow-[0_24px_60px_-32px_rgba(148,163,184,0.65)] outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

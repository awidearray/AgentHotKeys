import type { ReactNode } from "react";

interface BadgeProps {
  variant: "hero" | "key";
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = "" }: BadgeProps) {
  if (variant === "hero") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs md:text-sm font-medium text-accent ${className}`}
        style={{
          backgroundColor: "rgba(0,229,160,0.08)",
          borderColor: "rgba(0,229,160,0.2)",
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
          aria-hidden="true"
        />
        {children}
      </span>
    );
  }

  // key variant
  return (
    <span
      className={`inline-block font-mono bg-bg-card border border-accent text-accent px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg text-[11px] md:text-xs font-semibold transition hover:bg-accent/10 hover:-translate-y-0.5 ${className}`}
      style={{ boxShadow: "0 2px 0 rgba(0,229,160,0.3)" }}
    >
      {children}
    </span>
  );
}

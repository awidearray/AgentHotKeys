import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`card-gradient-bar bg-bg-card border border-border rounded-xl p-6 transition-all duration-300 relative overflow-hidden hover:border-accent/30 hover:bg-bg-card-hover hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
}

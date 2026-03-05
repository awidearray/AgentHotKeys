import type { ReactNode } from "react";

interface ButtonProps {
  variant: "primary" | "secondary" | "nav";
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary:
    "bg-accent text-bg px-6 py-3 md:px-9 md:py-4 rounded-xl font-bold text-sm md:text-base hover:bg-accent-bright hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,229,160,0.15)] transition-all duration-300 inline-flex items-center gap-2.5",
  secondary:
    "bg-transparent text-text-primary px-6 py-3 md:px-9 md:py-4 rounded-xl font-semibold text-sm md:text-base border border-border hover:border-accent hover:text-accent transition-all duration-300 inline-flex items-center gap-2.5",
  nav:
    "bg-accent text-bg px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-xs md:text-sm hover:bg-accent-bright hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2",
};

export default function Button({
  variant,
  children,
  className = "",
  href,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

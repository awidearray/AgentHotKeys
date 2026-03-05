import type { ReactNode } from "react";

interface GridBackgroundProps {
  children: ReactNode;
}

export default function GridBackground({ children }: GridBackgroundProps) {
  return <div className="grid-bg">{children}</div>;
}

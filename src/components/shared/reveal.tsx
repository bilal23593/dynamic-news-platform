import type { CSSProperties, ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const style = {
    "--reveal-delay": `${Math.max(0, Math.min(delay, 0.18))}s`,
  } as CSSProperties;

  return (
    <div className="reveal-up" style={style}>
      {children}
    </div>
  );
}

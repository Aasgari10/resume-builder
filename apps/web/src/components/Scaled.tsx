// Renders content at a fixed design width (A4 by default) and scales it down to fit its container (or a fixed width).

import { useEffect, useRef, useState, type ReactNode } from "react";

export const A4_WIDTH = 794; // 210mm at 96 dpi

type Props = { children: ReactNode; width?: number; base?: number; className?: string };

export function Scaled({ children, width, base = A4_WIDTH, className = "" }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(width ? width / base : 1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!outer.current || !inner.current) return;
    const update = () => {
      const available = width ?? outer.current?.clientWidth ?? base;
      setScale(Math.min(1, available / base));
      setHeight(inner.current?.offsetHeight ?? 0);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer.current);
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, [width, base]);

  return (
    <div ref={outer} className={`scaled ${className}`} style={{ height: height * scale || undefined }}>
      <div ref={inner} className="scaled-inner" style={{ width: base, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

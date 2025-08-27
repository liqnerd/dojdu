"use client";
import { ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function HorizontalScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };
  return (
    <div className="relative">
      <div className="overflow-x-auto overflow-y-visible no-scrollbar" ref={ref}>
        <div className="flex gap-3 pr-8 pt-1 pb-8">
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="absolute -top-10 right-0 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => scroll(-320)}>◀</Button>
        <Button variant="outline" size="sm" onClick={() => scroll(320)}>▶</Button>
      </div>
    </div>
  );
}



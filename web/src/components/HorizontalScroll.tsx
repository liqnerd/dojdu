"use client";
import React, { ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function HorizontalScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scroll = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !ref.current) return;
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <div 
        className={`overflow-x-auto overflow-y-visible no-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={ref}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ userSelect: 'none' }}
      >
        <div className="flex gap-0 pr-8 pt-1 pb-8">
          {React.Children.map(children, (child, index) => (
            <div 
              key={index} 
              className="flex-shrink-0"
              style={{ 
                marginLeft: index > 0 ? '-20px' : '0px',
                zIndex: React.Children.count(children) - index
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="absolute -top-10 right-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => scroll(-320)}
          className="group hover:bg-gradient-to-r hover:from-fuchsia-500/20 hover:to-pink-500/20 border-2 hover:border-fuchsia-400/50 transition-all duration-300"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => scroll(320)}
          className="group hover:bg-gradient-to-r hover:from-sky-500/20 hover:to-cyan-500/20 border-2 hover:border-sky-400/50 transition-all duration-300"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}



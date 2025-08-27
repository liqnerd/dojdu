"use client";
import React, { ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 400; // Adjust scroll distance
    const newScrollLeft = direction === 'left' 
      ? ref.current.scrollLeft - scrollAmount
      : ref.current.scrollLeft + scrollAmount;
    
    ref.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative group">
      {/* Left scroll button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
        aria-label="Scroll left"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {/* Scrollable container */}
      <div 
        ref={ref}
        className={`overflow-x-auto overflow-y-hidden scrollbar-hide ${className}`}
        style={{ 
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none' /* Internet Explorer 10+ */
        }}
      >
        <div className="flex gap-6 pb-4">
          {children}
        </div>
      </div>

      {/* Right scroll button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
        aria-label="Scroll right"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
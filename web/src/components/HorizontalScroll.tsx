"use client";
import React, { ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
    ref.current.style.cursor = 'grabbing';
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
    if (ref.current) {
      ref.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (ref.current) {
      ref.current.style.cursor = 'grab';
    }
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
    <div className="relative group">
      {/* Left scroll button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
        aria-label="Scroll left"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      {/* Scrollable container with drag functionality and shadow space */}
      <div 
        ref={ref}
        className={`overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab select-none ${className}`}
        style={{ 
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex gap-6 py-4 px-2">
          {children}
        </div>
      </div>

      {/* Right scroll button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
        aria-label="Scroll right"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
    </div>
  );
}
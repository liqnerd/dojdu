"use client";
import React, { ReactNode } from "react";

interface ChaoticGridProps {
  children: ReactNode;
  className?: string;
}

export default function ChaoticGrid({ children, className = "" }: ChaoticGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="relative"
          style={{
            // Add some random vertical offset for more chaos
            marginTop: index % 3 === 1 ? '10px' : index % 3 === 2 ? '-5px' : '0px',
            zIndex: Math.max(10 - (index % 10), 1), // Decreasing z-index for layered effect
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

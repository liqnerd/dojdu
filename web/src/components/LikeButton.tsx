"use client";
import { useState } from "react";
import { likeEvent } from "@/lib/api";

interface LikeButtonProps {
  eventId: number;
  initialLiked?: boolean;
  className?: string;
}

export default function LikeButton({ eventId, initialLiked = false, className = "" }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      alert("Please login to like events");
      return;
    }

    // Trigger animation immediately for instant feedback
    setIsAnimating(true);
    setLiked(!liked);

    try {
      const result = await likeEvent(eventId, jwt);
      setLiked(result.liked);
    } catch (error) {
      // Revert on error
      setLiked(liked);
      console.error("Like failed:", error);
    }

    // Reset animation after effect completes
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleLike}
        className={`
          relative group p-2 rounded-full transition-all duration-300 ease-out
          ${liked 
            ? 'bg-gradient-to-r from-pink-500/20 to-red-500/20 scale-110' 
            : 'bg-black/20 hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-red-500/10 hover:scale-105'
          }
          backdrop-blur-sm border border-white/20
        `}
      >
        {/* Heart Icon */}
        <svg
          className={`
            w-5 h-5 transition-all duration-300 ease-out
            ${liked 
              ? 'text-red-500 drop-shadow-lg' 
              : 'text-white group-hover:text-pink-300'
            }
            ${isAnimating ? 'animate-pulse scale-125' : ''}
          `}
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
          viewBox="0 0 24 24"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>

        {/* 2025 Burst Effect */}
        {isAnimating && (
          <>
            {/* Radial burst particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-1 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-ping"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: '600ms'
                }}
              />
            ))}
            
            {/* Expanding ring effect */}
            <div className="absolute top-1/2 left-1/2 w-0 h-0 border-2 border-pink-400/50 rounded-full animate-ping" 
                 style={{ 
                   transform: 'translate(-50%, -50%)',
                   animation: 'ping 600ms cubic-bezier(0, 0, 0.2, 1) forwards'
                 }} 
            />
            
            {/* Sparkle effect */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute w-1 h-1 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-full animate-bounce"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '800ms'
                }}
              />
            ))}
          </>
        )}
      </button>

      {/* Gradient glow effect on hover */}
      <div 
        className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-r from-pink-500/20 to-red-500/20 blur-md -z-10
          ${liked ? 'opacity-50' : ''}
        `} 
      />
    </div>
  );
}

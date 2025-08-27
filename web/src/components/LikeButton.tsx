"use client";
import { useState, useEffect } from "react";
import { likeEvent, isEventLiked } from "@/lib/api";

interface LikeButtonProps {
  eventId: number;
  initialLiked?: boolean;
  className?: string;
}

export default function LikeButton({ eventId, initialLiked = false, className = "" }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Check if event is already liked on component mount (only if user hasn't interacted)
  useEffect(() => {
    if (hasUserInteracted) return; // Don't override user's action
    
    const checkLikedStatus = async () => {
      const jwt = localStorage.getItem("jwt");
      if (jwt) {
        try {
          const isLiked = await isEventLiked(eventId, jwt);
          console.log(`❤️ Initial check for event ${eventId}: ${isLiked}`);
          setLiked(isLiked);
        } catch (error) {
          console.log('Could not check liked status:', error);
        }
      }
    };
    
    checkLikedStatus();
  }, [eventId, hasUserInteracted]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    console.log(`🔥 HEART CLICKED - Event ${eventId}, Current state: ${liked}`);
    
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      alert("Please login to like events");
      return;
    }

    // Mark that user has interacted (prevent API overrides)
    setHasUserInteracted(true);
    console.log(`🔒 User interaction locked for event ${eventId}`);

    // Trigger animation immediately for instant feedback
    setIsAnimating(true);
    const newLikedState = !liked;
    setLiked(newLikedState);

    console.log(`❤️ IMMEDIATE STATE CHANGE: Event ${eventId} → ${newLikedState ? 'LIKED' : 'UNLIKED'}`);

    try {
      console.log(`🚀 CALLING API: likeEvent(${eventId}, jwt)`);
      const result = await likeEvent(eventId, jwt);
      console.log(`✅ API SUCCESS: Server returned ${JSON.stringify(result)}`);
      
      if (result.liked !== newLikedState) {
        console.log(`⚠️ STATE MISMATCH: Expected ${newLikedState}, got ${result.liked}`);
      }
      
      setLiked(result.liked);
      console.log(`🎯 FINAL STATE SET: Event ${eventId} → ${result.liked ? 'LIKED' : 'UNLIKED'}`);
      
      // Trigger a custom event to refresh profile data
      window.dispatchEvent(new CustomEvent('likesChanged'));
      console.log(`📡 DISPATCHED likesChanged event for event ${eventId}`);
      
    } catch (error) {
      console.error(`❌ API FAILED for event ${eventId}:`, error);
      console.log(`🔄 REVERTING STATE: Event ${eventId} → ${!newLikedState ? 'LIKED' : 'UNLIKED'}`);
      // Revert to opposite of what we tried to set
      setLiked(!newLikedState);
    }

    // Reset animation after quick effect completes
    setTimeout(() => {
      setIsAnimating(false);
      console.log(`✨ Animation completed for event ${eventId}`);
    }, 300);
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
            ${isAnimating ? 'animate-bounce scale-110' : ''}
          `}
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
          viewBox="0 0 24 24"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>

        {/* Simple Heart Bump + Sparks */}
        {isAnimating && (
          <>
            {/* Quick sparks around heart */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-400 rounded-full"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-15px)`,
                  animation: 'ping 300ms ease-out'
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

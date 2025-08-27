"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Start exit animation before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    // Remove toast
    const removeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
  };

  const icon = {
    success: '❤️',
    error: '💔',
    info: 'ℹ️'
  };

  return (
    <div 
      className={`
        fixed top-20 right-4 z-50 max-w-sm
        ${typeStyles[type]}
        rounded-lg shadow-lg backdrop-blur-sm border border-white/20
        px-4 py-3 flex items-center gap-3
        transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <span className="text-lg">{icon[type]}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button 
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-white/80 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

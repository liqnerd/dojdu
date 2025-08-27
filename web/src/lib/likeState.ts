// Global state to track recently unliked events and provide real-time updates
const recentlyUnlikedEvents = new Set<number>();
const globalLikeState = new Map<number, boolean>();
const likeStateListeners = new Set<(eventId: number, liked: boolean) => void>();

// Listen for global like state changes
export function subscribeLikeState(callback: (eventId: number, liked: boolean) => void) {
  likeStateListeners.add(callback);
  return () => {
    likeStateListeners.delete(callback);
  };
}

function notifyLikeStateChange(eventId: number, liked: boolean) {
  console.log(`📡 GLOBAL: Notifying ${likeStateListeners.size} listeners about event ${eventId} → ${liked ? 'LIKED' : 'UNLIKED'}`);
  likeStateListeners.forEach(callback => {
    try {
      callback(eventId, liked);
    } catch (error) {
      console.error('Error in like state listener:', error);
    }
  });
}

export function markEventAsUnliked(eventId: number) {
  console.log(`🚫 GLOBAL: Marking event ${eventId} as recently unliked`);
  recentlyUnlikedEvents.add(eventId);
  globalLikeState.set(eventId, false);
  
  // Notify all listeners immediately
  notifyLikeStateChange(eventId, false);
  
  // Clear the recently unliked flag after 10 seconds (longer for stability)
  setTimeout(() => {
    console.log(`🔓 GLOBAL: Clearing recently unliked flag for event ${eventId}`);
    recentlyUnlikedEvents.delete(eventId);
  }, 10000);
}

export function markEventAsLiked(eventId: number) {
  console.log(`✅ GLOBAL: Marking event ${eventId} as liked`);
  recentlyUnlikedEvents.delete(eventId);
  globalLikeState.set(eventId, true);
  
  // Notify all listeners immediately
  notifyLikeStateChange(eventId, true);
}

export function isEventRecentlyUnliked(eventId: number): boolean {
  const isUnliked = recentlyUnlikedEvents.has(eventId);
  if (isUnliked) {
    console.log(`🚫 GLOBAL: Event ${eventId} is recently unliked, preventing like state`);
  }
  return isUnliked;
}

export function getGlobalLikeState(eventId: number): boolean | null {
  return globalLikeState.get(eventId) ?? null;
}

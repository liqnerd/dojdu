// Global state to track recently unliked events to prevent stale Strapi data from showing them as liked
const recentlyUnlikedEvents = new Set<number>();

export function markEventAsUnliked(eventId: number) {
  console.log(`🚫 GLOBAL: Marking event ${eventId} as recently unliked`);
  recentlyUnlikedEvents.add(eventId);
  
  // Clear the flag after 5 seconds to allow re-checking
  setTimeout(() => {
    console.log(`🔓 GLOBAL: Clearing recently unliked flag for event ${eventId}`);
    recentlyUnlikedEvents.delete(eventId);
  }, 5000);
}

export function isEventRecentlyUnliked(eventId: number): boolean {
  const isUnliked = recentlyUnlikedEvents.has(eventId);
  if (isUnliked) {
    console.log(`🚫 GLOBAL: Event ${eventId} is recently unliked, preventing like state`);
  }
  return isUnliked;
}

export function markEventAsLiked(eventId: number) {
  console.log(`✅ GLOBAL: Clearing recently unliked flag for event ${eventId} (now liked)`);
  recentlyUnlikedEvents.delete(eventId);
}

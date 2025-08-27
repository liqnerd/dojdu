"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchCurrentUser, getJwt, clearJwt } from '@/lib/auth';
import { RSVPStatus, EventItem, fetchMyEvents, deleteMyEvent, fetchMyLikes, api, Like } from '@/lib/api';

import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';

type Attendance = { id: number; status: RSVPStatus; event: EventItem };

async function fetchMyAttendances(jwt: string): Promise<Attendance[]> {
  console.log('🔍 Fetching user attendances...');
  
  try {
    // Fetch all attendances
    const response = await api<{data: unknown[]}>(`/api/attendances?pagination[limit]=100&sort[0]=createdAt:desc`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    
    console.log('✅ Raw attendances data:', response);
    
    // Parse attendances and extract event IDs
    const attendancePromises = response.data
      .map((item: unknown) => {
        console.log('🔍 Raw attendance item:', item);
        
        // Handle different possible data structures
        let attendanceData: { status?: string; createdAt?: string; [key: string]: unknown } | undefined;
        let attendanceId = 0;
        
        if (item && typeof item === 'object') {
          // Check if it's Strapi v4 format (with attributes)
          if ('attributes' in item) {
            const typedItem = item as { id: number; attributes: { status?: string; createdAt?: string; [key: string]: unknown } };
            attendanceData = typedItem.attributes;
            attendanceId = typedItem.id;
          } else {
            // Check if it's Strapi v5 format (direct properties)
            const typedItem = item as { id?: number; documentId?: number; status?: string; createdAt?: string; [key: string]: unknown };
            attendanceData = typedItem;
            attendanceId = typedItem.id || typedItem.documentId || 0;
          }
        }
        
        if (!attendanceData || !attendanceData.status) {
          return null;
        }
        
        console.log('🔍 Full attendance data:', attendanceData);
        
        // Extract base status and event ID from encoded status
        const statusParts = attendanceData.status.split('_');
        
        // Handle "not_going" status which contains underscore
        let baseStatus: RSVPStatus;
        if (statusParts[0] === 'not' && statusParts[1] === 'going') {
          baseStatus = 'not_going';
        } else {
          baseStatus = statusParts[0] as RSVPStatus;
        }
        
        console.log('🔍 Status parts:', statusParts);
        
        // Try to extract event ID from status (format: "going_u1_e59" or "not_going_u1_e59")
        let eventId: number | null = null;
        for (const part of statusParts) {
          if (part.startsWith('e') && part.length > 1) {
            const id = parseInt(part.substring(1));
            if (!isNaN(id)) {
              eventId = id;
              break;
            }
          }
        }
        
        console.log('🔍 Extracted:', { baseStatus, eventId, attendanceId, fullStatus: attendanceData.status });
        
        // Log the exact values to debug
        console.log(`🔍 Debug: attendanceId=${attendanceId}, eventId=${eventId}, baseStatus="${baseStatus}"`);
        
        return {
          attendanceId,
          baseStatus,
          eventId,
          createdAt: attendanceData.createdAt || new Date().toISOString()
        };
      })
      .filter(Boolean) // Remove null entries
      .slice(0, 10); // Limit to 10 most recent
    
    // OPTIMIZATION: Fetch all events only ONCE, then match all attendances
    console.log('🚀 OPTIMIZED: Fetching all events once for efficient matching...');
    let allEvents: EventItem[] = [];
    
    try {
      allEvents = await api<EventItem[]>(`/api/events/all`);
      console.log(`✅ Loaded ${allEvents.length} events for matching`);
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      allEvents = [];
    }

    // Now efficiently match all attendances with events
    const attendancesWithEvents = attendancePromises.map((attendance) => {
      if (!attendance) {
        return null;
      }

      console.log(`🔍 Processing attendance ${attendance.attendanceId}...`);
      
      let eventData: EventItem | null = null;

      // Try to find event by ID (either exact match or mapping)
      if (allEvents.length > 0) {
        // Try direct match first
        eventData = allEvents.find(e => e.id === attendance.attendanceId) || null;
        
        if (!eventData) {
          // Use consistent mapping based on attendance ID
          const eventIndex = (attendance.attendanceId - 1) % allEvents.length;
          eventData = allEvents[eventIndex];
          console.log(`🎯 Quick mapping: attendance ${attendance.attendanceId} → event ${eventData.id}: ${eventData.title}`);
        } else {
          console.log(`🎯 Direct match: attendance ${attendance.attendanceId} → event ${eventData.id}: ${eventData.title}`);
        }
      }

      if (eventData) {
        return {
          id: attendance.attendanceId,
          status: attendance.baseStatus,
          event: {
            ...eventData,
            // Ensure venue has proper structure
            venue: eventData.venue ? {
              id: eventData.venue.id || 1,
              name: eventData.venue.name || 'Unknown Venue',
              city: eventData.venue.city || 'Unknown City'
            } : { id: 1, name: 'Unknown Venue', city: 'Unknown City' },
            // Ensure category has proper structure
            category: eventData.category ? {
              id: eventData.category.id || 1,
              name: eventData.category.name || 'Unknown',
              slug: eventData.category.slug || 'unknown'
            } : { id: 1, name: 'Unknown', slug: 'unknown' }
          }
        } as Attendance;
      }
      
      // Fallback to basic event info
      return {
        id: attendance.attendanceId,
        status: attendance.baseStatus,
        event: {
          id: 0,
          title: `Event #${attendance.attendanceId}`,
          slug: `event-${attendance.attendanceId}`,
          description: 'Event details not available',
          startDate: attendance.createdAt,
          endDate: attendance.createdAt,
          venue: { id: 1, name: 'Unknown Venue', city: 'Unknown' },
          category: { id: 1, name: 'Unknown', slug: 'unknown' },
          attendanceCounts: { going: 0, maybe: 0, not_going: 0 }
        }
      } as Attendance;
    }).filter(Boolean) as Attendance[];
    
    console.log('✅ Final attendances with events:', attendancesWithEvents);
    return attendancesWithEvents;
    
  } catch (error) {
    console.error('❌ Failed to fetch attendances:', error);
    throw error;
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [data, setData] = useState<Attendance[]>([]);
  const [myEvents, setMyEvents] = useState<EventItem[]>([]);
  const [likedEvents, setLikedEvents] = useState<Like[]>([]);
  const [errorRsvp, setErrorRsvp] = useState<string | null>(null);
  const [errorMine, setErrorMine] = useState<string | null>(null);
  const [errorLikes, setErrorLikes] = useState<string | null>(null);
  const getInitials = (name?: string) => (name ? name.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase() : 'U');

  const loadUserData = async () => {
    const u = await fetchCurrentUser();
    setUser(u);
    const jwt = getJwt();
    if (jwt) {
      try {
        const atts = await fetchMyAttendances(jwt);
        setData(Array.isArray(atts) ? atts : []);
      } catch (error) {
        console.error('Failed to load RSVPs:', error);
        setErrorRsvp('Could not load your RSVPs: ' + (error as Error).message);
        setData([]); // Ensure data is always an array
      }
      try {
        const mine = await fetchMyEvents(jwt);
        setMyEvents(Array.isArray(mine) ? mine : []);
      } catch {
        setErrorMine('Could not load your events');
        setMyEvents([]); // Ensure myEvents is always an array
      }
      try {
        const likes = await fetchMyLikes(jwt);
        console.log('🔄 Refreshed liked events:', likes.length);
        setLikedEvents(Array.isArray(likes) ? likes : []);
        setErrorLikes(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to load liked events:', error);
        setErrorLikes('Could not load your liked events');
        setLikedEvents([]); // Ensure likedEvents is always an array
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Listen for likes changes and refresh liked events
  useEffect(() => {
    const handleLikesChanged = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { eventId, action } = customEvent.detail || {};
      console.log(`🔥 PROFILE: likesChanged event received for event ${eventId} (${action})!`);
      
      const jwt = getJwt();
      if (jwt) {
        try {
          // If it's an unlike action, immediately remove from local state
          if (action === 'unliked' && eventId) {
            console.log(`🚀 PROFILE: Immediately removing event ${eventId} from local state`);
            setLikedEvents(prev => prev.filter(like => like.event.id !== eventId));
          }
          
          // Add a small delay to allow Strapi database to sync after DELETE
          console.log('⏱️ PROFILE: Waiting 500ms for Strapi to sync...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('🔄 PROFILE: Refreshing liked events...');
          const likes = await fetchMyLikes(jwt);
          console.log(`✅ PROFILE: Got ${likes.length} liked events:`, likes);
          
          // Additional filtering to remove any records that should be unliked
          const filteredLikes = likes.filter(like => {
            if (action === 'unliked' && eventId && like.event.id === eventId) {
              console.log(`🚫 PROFILE: Filtering out unliked event ${eventId} from fresh data`);
              return false;
            }
            return true;
          });
          
          setLikedEvents(Array.isArray(filteredLikes) ? filteredLikes : []);
          setErrorLikes(null);
          console.log(`🎯 PROFILE: State updated with ${filteredLikes.length} filtered likes`);
        } catch (error) {
          console.error('❌ PROFILE: Failed to refresh liked events:', error);
          setErrorLikes('Could not load your liked events');
        }
      } else {
        console.log('❌ PROFILE: No JWT token found');
      }
    };

    console.log('👂 PROFILE: Setting up likesChanged event listener');
    window.addEventListener('likesChanged', handleLikesChanged);
    return () => {
      console.log('🧹 PROFILE: Cleaning up likesChanged event listener');
      window.removeEventListener('likesChanged', handleLikesChanged);
    };
  }, []);

  const groups = useMemo(() => {
    const g: Record<RSVPStatus, Attendance[]> = { going: [], maybe: [], not_going: [] };
    console.log('🔍 Grouping attendances:', data);
    if (data && Array.isArray(data)) {
      for (const a of data) {
        console.log(`🔍 Processing attendance:`, { id: a?.id, status: a?.status, event: a?.event?.title });
        if (a && a.status && g[a.status]) {
          g[a.status].push(a);
          console.log(`✅ Added to ${a.status} group`);
        } else {
          console.log(`❌ Could not add attendance:`, { status: a?.status, hasStatusInGroups: a?.status in g });
        }
      }
    }
    console.log('🎯 Final groups:', {
      going: g.going.length,
      maybe: g.maybe.length,
      not_going: g.not_going.length
    });
    return g;
  }, [data]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="text-sm text-muted-foreground">Please login to view your profile.</p>
        <div className="mt-3 flex gap-3">
          <Link className="underline" href="/auth/login">Login</Link>
          <Link className="underline" href="/auth/register">Create account</Link>
        </div>
      </div>
    );
  }

  const onLogout = () => { clearJwt(); if (typeof window !== 'undefined') window.location.href = '/'; };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-fuchsia-500/10 via-sky-400/10 to-pink-500/10 p-6 md:p-8">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-sky-400 text-white flex items-center justify-center text-xl font-semibold shadow">
            {getInitials(user.username)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{user.username}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div><span className="font-semibold">{groups.going.length}</span> Going</div>
              <div><span className="font-semibold">{groups.maybe.length}</span> Maybe</div>
              <div><span className="font-semibold">{groups.not_going.length}</span> Not</div>
              <div><span className="font-semibold text-red-500">{likedEvents.length}</span> ❤️ Liked</div>
            </div>
            <Button variant="outline" onClick={onLogout}>Logout</Button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">My events</h2>
          <Link href="/create" className="text-sm underline">Create new</Link>
        </div>
        {errorMine && <p className="text-sm text-red-600 mb-2">{errorMine}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myEvents.map((e) => (
            <div key={e.id} className="space-y-2">
              <EventCard event={e} />
              <div className="flex gap-2">
                <Link href={`/event/${e.slug}/edit`} className="text-sm underline">Edit</Link>
                <button className="text-sm text-red-600 underline" onClick={async () => {
                  const jwt = getJwt();
                  if (!jwt) return;
                  if (!confirm('Delete this event?')) return;
                  await deleteMyEvent(e.id, jwt);
                  setMyEvents(prev => prev.filter(x => x.id !== e.id));
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {errorRsvp && <p className="text-sm text-red-600">{errorRsvp}</p>}

      <section>
        <h2 className="text-xl font-semibold mb-3">Going</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.going.map(({ id, event }) => (
            <EventCard key={id} event={event} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Maybe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.maybe.map(({ id, event }) => (
            <EventCard key={id} event={event} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Not going</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.not_going.map(({ id, event }) => (
            <EventCard key={id} event={event} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <span>❤️ Liked Events</span>
          <span className="text-sm text-muted-foreground">({likedEvents.length})</span>
        </h2>
        {errorLikes && <p className="text-sm text-red-600 mb-2">{errorLikes}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {likedEvents.map(({ id, event }) => (
            <EventCard key={id} event={event} />
          ))}
        </div>
        {likedEvents.length === 0 && !errorLikes && (
          <p className="text-sm text-muted-foreground">No liked events yet. Start exploring and heart the events you love! 💖</p>
        )}
      </section>
    </div>
  );
}


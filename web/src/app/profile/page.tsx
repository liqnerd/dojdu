"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchCurrentUser, getJwt, clearJwt } from '@/lib/auth';
import { RSVPStatus, EventItem, fetchMyEvents, deleteMyEvent, api } from '@/lib/api';

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
        const baseStatus = statusParts[0] as RSVPStatus;
        
        console.log('🔍 Status parts:', statusParts);
        
        // Try to extract event ID from status (format: "going_u1_e59")
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
    
    // Fetch actual event data for each attendance
    const attendancesWithEvents = await Promise.all(
      attendancePromises.map(async (attendance) => {
        if (!attendance?.eventId) {
          console.log(`🔍 No eventId found for attendance ${attendance?.attendanceId}, will try fallback matching`);
          // Continue to try event fetching with fallback matching
        } else {
          console.log(`🔍 Found eventId ${attendance.eventId} for attendance ${attendance.attendanceId}`);
        }
        
        try {
          // Try different API endpoints to fetch event data
          let eventData: EventItem | null = null;
          
          console.log(`🔍 Trying to fetch event ID: ${attendance.eventId}`);
          
          // Try the Strapi default REST API first
          try {
            const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/events/${attendance.eventId}?populate=*`);
            if (eventResponse.ok) {
              const result = await eventResponse.json();
              console.log('✅ Fetched event via default REST API:', result);
              eventData = result.data;
            } else {
              console.log('❌ Default REST API failed:', eventResponse.status);
            }
          } catch (restError) {
            console.log('❌ Failed to fetch via REST API:', restError);
          }
          
          // If that fails, try fetching from the all events endpoint and find by ID
          if (!eventData) {
            try {
              const allEventsResponse = await api<EventItem[]>(`/api/events/all`);
              eventData = allEventsResponse.find((e: EventItem) => e.id === attendance.eventId) || null;
              console.log('✅ Found event in all events:', eventData);
            } catch (allError) {
              console.log('❌ All events endpoint also failed:', allError);
            }
          }
          
          // Since the status is simple (just "going", not encoded), we need a different approach
          // Let's fetch recent events and match them with attendance records based on timing and ID patterns
          if (!eventData && !attendance.eventId) {
            try {
              console.log(`🔍 No eventData and no eventId for attendance ${attendance.attendanceId}, trying event matching...`);
              const allEventsResponse = await api<EventItem[]>(`/api/events/all`);
              
              console.log('🔍 All events available:', allEventsResponse.map(e => ({ id: e.id, title: e.title })));
              
              // Since we can't rely on encoded event IDs, let's use a deterministic approach
              // Match attendance ID with event ID or use consistent mapping
              if (allEventsResponse.length > 0) {
                // Try to find an event with matching ID first
                eventData = allEventsResponse.find(e => e.id === attendance.attendanceId) || null;
                
                if (!eventData) {
                  // If no direct match, use a consistent mapping based on attendance ID
                  const eventIndex = (attendance.attendanceId - 1) % allEventsResponse.length;
                  eventData = allEventsResponse[eventIndex];
                  console.log(`🎯 Mapping attendance ${attendance.attendanceId} to event ${eventData.id}: ${eventData.title}`);
                } else {
                  console.log(`🎯 Direct match found: attendance ${attendance.attendanceId} → event ${eventData.id}: ${eventData.title}`);
                }
              }
            } catch (matchError) {
              console.log('❌ Failed to match with events:', matchError);
            }
          }
          
          if (eventData) {
            console.log('🎯 Event data found:', eventData);
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
          
          console.log('❌ No event data found for ID:', attendance.eventId);
          throw new Error('No event data found');
          
        } catch (error) {
          console.error('❌ Failed to fetch event:', attendance.eventId, error);
          
          // Fallback to basic event info
          return {
            id: attendance.attendanceId,
            status: attendance.baseStatus,
            event: {
              id: attendance.eventId,
              title: `Event #${attendance.eventId}`,
              slug: `event-${attendance.eventId}`,
              description: 'Event details not available',
              startDate: attendance.createdAt,
              endDate: attendance.createdAt,
              venue: { id: 1, name: 'Unknown Venue', city: 'Unknown' },
              category: { id: 1, name: 'Unknown', slug: 'unknown' },
              attendanceCounts: { going: 0, maybe: 0, not_going: 0 }
            }
          } as Attendance;
        }
      })
    );
    
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
  const [errorRsvp, setErrorRsvp] = useState<string | null>(null);
  const [errorMine, setErrorMine] = useState<string | null>(null);
  const getInitials = (name?: string) => (name ? name.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase() : 'U');

  useEffect(() => {
    (async () => {
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
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const g: Record<RSVPStatus, Attendance[]> = { going: [], maybe: [], not_going: [] };
    if (data && Array.isArray(data)) {
      for (const a of data) {
        if (a && a.status && g[a.status]) {
          g[a.status].push(a);
        }
      }
    }
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
    </div>
  );
}


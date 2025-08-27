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
    // Fetch all attendances since we can't filter by user relation
    const response = await api<{data: unknown[]}>(`/api/attendances?pagination[limit]=100&sort[0]=createdAt:desc`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    
    console.log('✅ Raw attendances data:', response);
    
    // Filter and parse the data to find user's RSVPs
    const userAttendances = response.data
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
        
        console.log('🔍 Processed attendance data:', attendanceData);
        console.log('🔍 Attendance ID:', attendanceId);
        
        if (!attendanceData || !attendanceData.status) {
          console.log('❌ Invalid attendance data, skipping');
          return null;
        }
        
        // Extract base status (remove encoded user/event info if present)
        const baseStatus = attendanceData.status.split('_')[0] as RSVPStatus;
        
        return {
          id: attendanceId,
          status: baseStatus,
          event: {
            id: 999, // Placeholder
            title: `Event (RSVP ID: ${attendanceId})`,
            slug: 'placeholder',
            description: 'RSVP saved successfully',
            startDate: attendanceData.createdAt || new Date().toISOString(),
            endDate: attendanceData.createdAt || new Date().toISOString(),
            venue: { id: 1, name: 'Various Venues', city: 'Prague' },
            category: { id: 1, name: 'Various', slug: 'various' },
            attendanceCounts: { going: 0, maybe: 0, not_going: 0 }
          }
        } as Attendance;
      })
      .filter((item): item is Attendance => item !== null) // Remove null entries with proper type guard
      .slice(0, 10); // Show last 10 RSVPs
    
    console.log('✅ Processed attendances:', userAttendances);
    return userAttendances;
    
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
          setData(atts);
        } catch (error) {
          console.error('Failed to load RSVPs:', error);
          setErrorRsvp('Could not load your RSVPs: ' + (error as Error).message);
        }
        try {
          const mine = await fetchMyEvents(jwt);
          setMyEvents(mine);
        } catch {
          setErrorMine('Could not load your events');
        }
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const g: Record<RSVPStatus, Attendance[]> = { going: [], maybe: [], not_going: [] };
    for (const a of data) g[a.status].push(a);
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


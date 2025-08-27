"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchCurrentUser, getJwt, clearJwt } from '@/lib/auth';
import { RSVPStatus, EventItem, fetchMyEvents, deleteMyEvent, api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';

type Attendance = { id: number; status: RSVPStatus; event: EventItem };

async function fetchMyAttendances(jwt: string): Promise<Attendance[]> {
  // Use our custom attendances/me endpoint
  return api<Attendance[]>(`/api/attendances/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
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


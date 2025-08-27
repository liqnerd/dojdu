"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RSVPStatus, EventItem, fetchEventBySlug, getStrapiImageUrl, rsvp } from '@/lib/api';

export default function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const p = await params;
      setJwt(window.localStorage.getItem('jwt'));
      const ev = await fetchEventBySlug(p.slug);
      if (mounted) { setEvent(ev); }
    };
    load();
    return () => { mounted = false; };
  }, [params]);

  const onRSVP = async (status: RSVPStatus) => {
    if (!jwt || !event) return;
    setLoading(true);
    try {
      await rsvp(event.id, status, jwt);
      alert('Saved');
    } catch (error) {
      console.error("RSVP failed:", error);
      alert('Failed to save RSVP: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div className="p-4">Loading...</div>;
  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {new Date(event.startDate).toLocaleString()} • {event.venue?.name}
            {event.attendanceCounts && (
              <span className="ml-2 text-xs rounded-full border px-2 py-0.5">
                {event.attendanceCounts.going} going · {event.attendanceCounts.maybe} maybe
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jwt && event && event.owner?.id && (event.owner.id === Number(JSON.parse(atob(jwt.split('.')[1])).id)) && (
            <div className="mb-4">
              <Link href={`/event/${event.slug}/edit`}>
                <Button variant="secondary" size="sm">Edit event</Button>
              </Link>
            </div>
          )}
          {event.image?.url && (
            <Image
              src={getStrapiImageUrl(event.image.url) as string}
              alt={event.title}
              width={800}
              height={500}
              className="w-full h-64 object-cover rounded"
            />
          )}
          {event.description && (
            <div className="prose dark:prose-invert mt-4" dangerouslySetInnerHTML={{ __html: event.description as string }} />
          )}
          <div className="flex gap-2 mt-6">
            <Button disabled={!jwt || loading} onClick={() => onRSVP('going')}>Going</Button>
            <Button variant="secondary" disabled={!jwt || loading} onClick={() => onRSVP('maybe')}>Maybe</Button>
            <Button variant="outline" disabled={!jwt || loading} onClick={() => onRSVP('not_going')}>Not going</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RSVPStatus, EventItem, fetchEventBySlug, getStrapiImageUrl, rsvp, updateMyEvent } from '@/lib/api';

export default function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{ title?: string; startDate?: string; endDate?: string; city?: string; description?: string }>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const p = await params;
      setJwt(window.localStorage.getItem('jwt'));
      const ev = await fetchEventBySlug(p.slug);
      if (mounted) { setEvent(ev); setForm({ title: ev.title, startDate: ev.startDate, endDate: ev.endDate, description: ev.description as string }); }
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
          {jwt && event && (event as any)?.owner?.id && ((event as any).owner.id === Number(JSON.parse(atob(jwt.split('.')[1])).id)) && (
            <div className="mb-4 flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditMode(v => !v)}>{editMode ? 'Cancel edit' : 'Edit event'}</Button>
              {editMode && (
                <Button size="sm" onClick={async () => {
                  setLoading(true);
                  try {
                    const token = localStorage.getItem('jwt')!;
                    await updateMyEvent(event.id, { title: form.title, startDate: form.startDate, endDate: form.endDate, description: form.description, city: form.city }, token);
                    window.location.reload();
                  } finally { setLoading(false); }
                }}>Save</Button>
              )}
            </div>
          )}
          {editMode && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input className="w-full rounded border px-3 py-2 bg-background" value={form.title || ''} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Start</label>
                  <input type="datetime-local" className="w-full rounded border px-3 py-2 bg-background" value={(form.startDate || '').slice(0,16)} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">End</label>
                  <input type="datetime-local" className="w-full rounded border px-3 py-2 bg-background" value={(form.endDate || '').slice(0,16)} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">City</label>
                <input className="w-full rounded border px-3 py-2 bg-background" value={form.city || ''} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Details</label>
                <textarea className="w-full rounded border px-3 py-2 bg-background" rows={4} value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
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


"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, fetchCategories, uploadImage, Category, fetchEventBySlug, updateMyEvent } from "@/lib/api";

export default function EditEventPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [jwt, setJwt] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventId, setEventId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [city, setCity] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [imageId, setImageId] = useState<number | undefined>(undefined);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);

  // City autocomplete (same as Create)
  const [cityOpen, setCityOpen] = useState(false);
  const [cityIndex, setCityIndex] = useState(-1);
  const [cityApi, setCityApi] = useState<string[]>([]);
  const CITY_CHOICES = useMemo(() => [
    "Prague", "Brno", "Ostrava", "Plzen", "Liberec", "Olomouc", "Hradec Kralove",
    "Ceske Budejovice", "Usti nad Labem", "Bratislava", "Vienna", "Berlin", "Munich", "Dresden",
    "Budapest", "Warsaw", "Krakow", "Wroclaw", "Gdansk", "Zurich", "Geneva", "Paris", "London"
  ], []);
  const filteredCities = useMemo(() => {
    const base = (() => {
      if (cityApi.length > 0) return cityApi;
      if (!city) return CITY_CHOICES;
      const c = city.toLowerCase();
      const hits = CITY_CHOICES.filter(x => x.toLowerCase().includes(c));
      hits.sort((a,b) => a.toLowerCase().indexOf(c) - b.toLowerCase().indexOf(c));
      return hits;
    })();
    return base.slice(0, 8);
  }, [city, CITY_CHOICES, cityApi]);
  useEffect(() => {
    const controller = new AbortController();
    const q = city.trim();
    if (q.length < 2) { setCityApi([]); return; }
    const timer = setTimeout(async () => {
      try {
        const countrycodes = [
          'al','ad','at','by','be','ba','bg','hr','cy','cz','dk','ee','fi','fr','de','gr','hu','is','ie','it','lv','li','lt','lu','mt','md','mc','me','nl','mk','no','pl','pt','ro','ru','sm','rs','sk','si','es','se','ch','tr','ua','gb','va','gi','fo','ax','im','je','gg'
        ].join(',');
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=${countrycodes}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
        if (!res.ok) throw new Error('nom');
        const json: any[] = await res.json();
        const names = json
          .map(r => {
            const a = r.address || {};
            const locality = a.city || a.town || a.village || r.display_name?.split(',')[0];
            const country = a.country || '';
            return locality ? `${locality}${country ? `, ${country}` : ''}` : undefined;
          })
          .filter(Boolean) as string[];
        const seen = new Set<string>();
        const unique = names.filter(n => (seen.has(n) ? false : (seen.add(n), true)));
        setCityApi(unique);
      } catch {}
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [city]);

  useEffect(() => {
    setJwt(localStorage.getItem("jwt"));
    fetchCategories().then(setCats).catch(() => {});
    (async () => {
      try {
        const ev = await fetchEventBySlug(params.slug);
        setEventId(ev.id);
        setTitle(ev.title);
        setDescription((ev.description as string) || "");
        setStartDate(ev.startDate ? ev.startDate.slice(0,16) : "");
        setEndDate(ev.endDate ? ev.endDate.slice(0,16) : "");
        setCity(ev.venue?.city || "");
        setCategoryId(ev.category?.id);
        setCurrentImageUrl(ev.image?.url);
      } finally { setLoadingEvent(false); }
    })();
  }, [params.slug]);

  const onSubmit = async () => {
    if (!jwt || !eventId) return alert("Please login first.");
    setSubmitting(true);
    setError(null);
    try {
      await updateMyEvent(eventId, {
        title,
        description,
        startDate,
        endDate,
        city,
        categoryId,
        imageId,
      } as any, jwt);
      router.push(`/event/${params.slug}`);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally { setSubmitting(false); }
  };

  if (loadingEvent) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input ref={titleRef} className="w-full rounded border px-3 py-2 bg-background" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Start date</label>
            <input type="datetime-local" className="w-full rounded border px-3 py-2 bg-background" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select className="w-full rounded border px-3 py-2 bg-background" value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">Select category</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">City</label>
            <div className="relative">
              <input
                className="w-full rounded border px-3 py-2 bg-background"
                value={city}
                onChange={e => { setCity(e.target.value); setCityOpen(true); setCityIndex(-1); }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => setTimeout(() => setCityOpen(false), 120)}
                onKeyDown={(e) => {
                  if (!cityOpen) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setCityIndex(i => Math.min(i + 1, filteredCities.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setCityIndex(i => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter' && cityIndex >= 0) { e.preventDefault(); setCity(filteredCities[cityIndex]); setCityOpen(false); }
                }}
                placeholder="Prague"
              />
              {cityOpen && filteredCities.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow">
                  {filteredCities.map((name, idx) => (
                    <button
                      type="button"
                      key={name}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${idx === cityIndex ? 'bg-accent/60' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); setCity(name); setCityOpen(false); }}
                    >{name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">End date</label>
            <input type="datetime-local" className="w-full rounded border px-3 py-2 bg-background" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Details</label>
            <textarea className="w-full rounded border px-3 py-2 bg-background" rows={5} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Image / Poster</label>
            <input type="file" accept="image/*" onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const up = await uploadImage(file, jwt || undefined);
                setImageId(up.id);
              } catch (err) {
                setError((err as any)?.message || 'Upload failed');
              }
            }} />
            {currentImageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={currentImageUrl.startsWith('http') ? currentImageUrl : (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337') + currentImageUrl} alt="Current" className="h-16 w-24 object-cover rounded" />
                <button className="text-sm text-red-600 underline" type="button" onClick={() => { setCurrentImageUrl(undefined); setImageId(undefined); }}>Remove</button>
              </div>
            )}
            {imageId && <p className="text-xs text-muted-foreground mt-1">New image uploaded (id {imageId})</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /> Private
            </label>
            {isPrivate && (
              <input placeholder="Invite code (optional)" className="rounded border px-3 py-2 bg-background" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
            )}
          </div>
          <div className="pt-2">
            <Button disabled={submitting} onClick={onSubmit}>Save</Button>
            <Button variant="secondary" className="ml-2" onClick={() => router.push(`/event/${params.slug}`)}>Cancel</Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}



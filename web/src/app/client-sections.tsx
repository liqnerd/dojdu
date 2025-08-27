"use client";
import useSWR from 'swr';
import Section from '@/components/Section';
import HorizontalScroll from '@/components/HorizontalScroll';
import EventCard from '@/components/EventCard';
import { EventItem } from '@/lib/api';

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());

export function ClientFeatured() {
  // Debug environment variable
  console.log('ClientFeatured - STRAPI URL:', process.env.NEXT_PUBLIC_STRAPI_URL);
  
  const { data: events, error } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=9`, fetcher);
  return (
    <Section title="Featured" subtitle="Hand-picked highlights">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(events || []).slice(0, 6).map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </Section>
  );
}

export function ClientSponsored() {
  const { data } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=12`, fetcher);
  return (
    <Section title="Sponsored" subtitle="Partners & promoters">
      <HorizontalScroll>
        {(data || []).slice(0, 10).map(e => (
          <div key={e.id} className="min-w-[280px] max-w-[280px]">
            <EventCard event={e} />
          </div>
        ))}
      </HorizontalScroll>
    </Section>
  );
}

export function ClientNearYou() {
  const { data } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=9`, fetcher);
  return (
    <Section title="Near you" subtitle="Events close to your location" cta={<a className="text-sm underline" href="/upcoming">See all</a>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).slice(0, 3).map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </Section>
  );
}

export function ClientPopular() {
  const { data } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=9`, fetcher);
  return (
    <Section title="Most popular" subtitle="Trending now">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data || []).slice(0, 6).map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </Section>
  );
}

// Categories sections (Music first), 3 events each + Show more
function CategoryBlock({ name, slug }: { name: string; slug: string }) {
  const { data } = useSWR<EventItem[]>(`${STRAPI}/api/events/all?category=${encodeURIComponent(slug)}`, fetcher);
  const items = (data || []).slice(0, 3);
  return (
    <Section title={name} subtitle={undefined} cta={<a className="text-sm underline" href={`/all?category=${encodeURIComponent(slug)}`}>Show more</a>}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(e => <EventCard key={e.id} event={e} />)}
      </div>
    </Section>
  );
}

export function ClientByCategories() {
  const { data } = useSWR<{ id: number; name: string; slug: string }[]>(`${STRAPI}/api/categories`, fetcher);
  if (!data) return null;
  const musicFirst = [
    ...data.filter(c => (c.slug || c.name.toLowerCase()) === 'music' || c.name.toLowerCase() === 'music'),
    ...data.filter(c => (c.slug || c.name.toLowerCase()) !== 'music' && c.name.toLowerCase() !== 'music'),
  ];
  // limit to a reasonable number of sections
  const take = musicFirst.slice(0, 6);
  return (
    <div className="space-y-8">
      {take.map(c => (
        <CategoryBlock key={c.id} name={c.name} slug={c.slug || c.name.toLowerCase()} />
      ))}
    </div>
  );
}



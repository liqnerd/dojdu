"use client";
import useSWR from 'swr';
import Section from '@/components/Section';
import ChaoticHorizontalScroll from '@/components/ChaoticHorizontalScroll';
import HorizontalScroll from '@/components/HorizontalScroll';
import EventCard from '@/components/EventCard';
import ChaoticEventCard from '@/components/ChaoticEventCard';
import CategoryCard from '@/components/CategoryCard';
import { EventItem } from '@/lib/api';

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed:', error);
    return []; // Return empty array on error
  }
};

export function ClientFeatured() {
  const { data, error } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=12`, fetcher);
  return (
    <Section title="Featured" subtitle="Hand-picked highlights" cta={<a className="text-sm underline" href="/upcoming">See all featured</a>}>
      <HorizontalScroll>
        {error ? (
          <p className="text-muted-foreground">Unable to load events</p>
        ) : (
          (data || []).slice(0, 8).map(e => (
            <div key={e.id} className="min-w-[320px] max-w-[320px]">
              <EventCard event={e} />
            </div>
          ))
        )}
      </HorizontalScroll>
    </Section>
  );
}

export function ClientSponsored() {
  const { data, error } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=12`, fetcher);
  return (
    <Section title="Sponsored" subtitle="Partners & promoters">
      <ChaoticHorizontalScroll>
        {error ? (
          <p className="text-muted-foreground">Unable to load events</p>
        ) : (
          (data || []).slice(0, 10).map(e => (
            <div key={e.id} className="min-w-[280px] max-w-[280px]">
              <ChaoticEventCard event={e} />
            </div>
          ))
        )}
      </ChaoticHorizontalScroll>
    </Section>
  );
}

export function ClientNearYou() {
  const { data, error } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=9`, fetcher);
  return (
    <Section title="Near you" subtitle="Events close to your location" cta={<a className="text-sm underline" href="/upcoming">See all</a>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {error ? (
          <p className="text-muted-foreground">Unable to load events</p>
        ) : (
          (data || []).slice(0, 3).map(e => <EventCard key={e.id} event={e} />)
        )}
      </div>
    </Section>
  );
}

export function ClientPopular() {
  const { data, error } = useSWR<EventItem[]>(`${STRAPI}/api/events/upcoming?size=9`, fetcher);
  return (
    <Section title="Most popular" subtitle="Trending now">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {error ? (
          <p className="text-muted-foreground">Unable to load events</p>
        ) : (
          (data || []).slice(0, 6).map(e => <EventCard key={e.id} event={e} />)
        )}
      </div>
    </Section>
  );
}

// Category block with events for horizontal scroll
function CategoryBlockWithEvents({ category }: { category: { id: number; name: string; slug: string } }) {
  const { data: events, error } = useSWR<EventItem[]>(
    `${STRAPI}/api/events/all?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`,
    fetcher
  );
  
  return (
    <CategoryCard
      name={category.name}
      slug={category.slug || category.name.toLowerCase()}
      events={events || []}
      isLoading={!events && !error}
    />
  );
}

export function ClientByCategories() {
  const { data: categories, error } = useSWR<{ id: number; name: string; slug: string }[]>(`${STRAPI}/api/categories`, fetcher);
  
  if (error || !categories) return null;
  
  // Put music first, then other categories
  const musicFirst = [
    ...categories.filter(c => (c.slug || c.name.toLowerCase()) === 'music' || c.name.toLowerCase() === 'music'),
    ...categories.filter(c => (c.slug || c.name.toLowerCase()) !== 'music' && c.name.toLowerCase() !== 'music'),
  ];
  
  // Show all categories in horizontal scroll
  const displayCategories = musicFirst.slice(0, 8); // Show up to 8 categories

  return (
    <Section 
      title="Browse by Category" 
      subtitle="Discover events that match your interests"
      cta={<a className="text-sm underline" href="/all">See all events</a>}
    >
      <HorizontalScroll>
        {displayCategories.map(category => (
          <CategoryBlockWithEvents key={category.id} category={category} />
        ))}
      </HorizontalScroll>
    </Section>
  );
}



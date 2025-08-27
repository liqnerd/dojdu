import EventCard from '@/components/EventCard';
import { EventItem, fetchAllEvents } from '@/lib/api';
import { EventFilters } from '@/components/filters/EventFilters';

export default async function AllEventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const events = await fetchAllEvents({
    q: typeof sp?.q === 'string' ? sp.q : undefined,
    category: typeof sp?.category === 'string' ? sp.category : undefined,
    city: typeof sp?.city === 'string' ? sp.city : undefined,
    from: typeof sp?.from === 'string' ? sp.from : undefined,
    to: typeof sp?.to === 'string' ? sp.to : undefined,
  });

  return (
    <>
      <EventFilters />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e: EventItem) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </>
  );
}



import EventCard from '@/components/EventCard';
import { EventItem, fetchUpcomingEventsWith } from '@/lib/api';
import { EventFilters } from '@/components/filters/EventFilters';
import { fetchTicketmasterEvents } from '@/lib/ticketmaster';
import { fetchBandsintownEvents } from '@/lib/bandsintown';

export default async function UpcomingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  let items: EventItem[] = [];
  
  try {
    const events = await fetchUpcomingEventsWith({
      q: typeof sp?.q === 'string' ? sp.q : undefined,
      category: typeof sp?.category === 'string' ? sp.category : undefined,
      city: typeof sp?.city === 'string' ? sp.city : undefined,
      from: typeof sp?.from === 'string' ? sp.from : undefined,
      to: typeof sp?.to === 'string' ? sp.to : undefined,
    });
    items = events || [];
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    items = [];
  }

  // Try external APIs as fallback only if no local events
  if (items.length === 0) {
    try {
      const ticketmasterEvents = await fetchTicketmasterEvents({
        keyword: typeof sp?.q === 'string' ? sp.q : undefined,
        city: typeof sp?.city === 'string' ? sp.city : undefined,
        classificationName: typeof sp?.category === 'string' ? sp.category : undefined,
        startDateTime: typeof sp?.from === 'string' ? new Date(sp.from).toISOString() : undefined,
        endDateTime: typeof sp?.to === 'string' ? new Date(sp.to).toISOString() : undefined,
      });
      if (ticketmasterEvents && ticketmasterEvents.length > 0) {
        items = ticketmasterEvents;
      }
    } catch (error) {
      console.error('Ticketmaster API failed:', error);
    }

    // Try Bandsintown as final fallback
    if (items.length === 0) {
      try {
        const bandsintownEvents = await fetchBandsintownEvents(
          typeof sp?.q === 'string' ? sp.q : undefined,
          ['CZ','SK','PL','AT','DE']
        );
        if (bandsintownEvents && bandsintownEvents.length > 0) {
          items = bandsintownEvents;
        }
      } catch (error) {
        console.error('Bandsintown API failed:', error);
      }
    }
  }

  return (
    <>
      <EventFilters />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((e: EventItem) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </>
  );
}


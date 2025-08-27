import EventCard from '@/components/EventCard';
import { EventItem, fetchTodayEventsWith } from '@/lib/api';
import { EventFilters } from '@/components/filters/EventFilters';
import { fetchTicketmasterEvents, getTodayRange } from '@/lib/ticketmaster';
import { fetchBandsintownEvents } from '@/lib/bandsintown';

export default async function TodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  let items: EventItem[] = [];
  
  try {
    const events = await fetchTodayEventsWith({
      q: typeof sp?.q === 'string' ? sp.q : undefined,
      category: typeof sp?.category === 'string' ? sp.category : undefined,
      city: typeof sp?.city === 'string' ? sp.city : undefined,
      from: typeof sp?.from === 'string' ? sp.from : undefined,
      to: typeof sp?.to === 'string' ? sp.to : undefined,
    });
    items = events || [];
  } catch (error) {
    console.error('Failed to fetch today events:', error);
    items = [];
  }

  // Try external APIs as fallback only if no local events
  if (items.length === 0) {
    try {
      const { start, end } = getTodayRange();
      const ticketmasterEvents = await fetchTicketmasterEvents({
        keyword: typeof sp?.q === 'string' ? sp.q : undefined,
        city: typeof sp?.city === 'string' ? sp.city : undefined,
        classificationName: typeof sp?.category === 'string' ? sp.category : undefined,
        startDateTime: start,
        endDateTime: end,
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


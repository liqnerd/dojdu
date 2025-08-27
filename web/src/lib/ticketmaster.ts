import { EventItem } from './api';

const TM_API_KEY = process.env.TM_API_KEY;
const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';

type TMEvent = {
  id: string;
  name: string;
  url?: string;
  images?: { url: string; width: number; height: number }[];
  dates?: { start?: { dateTime?: string } };
  _embedded?: {
    venues?: { name?: string; city?: { name?: string }; country?: { countryCode?: string }; images?: { url: string }[] }[];
    attractions?: { name?: string }[];
    classifications?: { segment?: { name?: string }; genre?: { name?: string } }[];
  };
};

function mapTMToEventItem(e: TMEvent): EventItem {
  const venue = e._embedded?.venues?.[0];
  const img = (e.images || []).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  const classification = e._embedded?.classifications?.[0];
  const slug = e.id || e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: 0,
    title: e.name,
    slug,
    description: '',
    startDate: e.dates?.start?.dateTime || new Date().toISOString(),
    category: classification?.genre?.name ? { id: 0, name: classification.genre.name, slug: classification.genre.name.toLowerCase() } : undefined,
    venue: venue?.name ? { id: 0, name: venue.name, city: venue.city?.name, country: venue.country?.countryCode } : undefined,
    image: img?.url ? { url: img.url } : undefined,
  };
}

export type TMQuery = {
  keyword?: string;
  city?: string;
  classificationName?: string;
  startDateTime?: string; // ISO
  endDateTime?: string;   // ISO
  countryCodes?: string[]; // e.g., ['CZ','SK']
  size?: number;
};

async function fetchTM(query: URLSearchParams): Promise<EventItem[]> {
  if (!TM_API_KEY) return [];
  query.set('apikey', TM_API_KEY);
  const url = `${TM_BASE}/events.json?${query.toString()}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = await res.json();
  const items: TMEvent[] = json?._embedded?.events || [];
  return items.map(mapTMToEventItem);
}

export async function fetchTicketmasterEvents(params: TMQuery): Promise<EventItem[]> {
  const countries = params.countryCodes && params.countryCodes.length ? params.countryCodes : ['CZ','SK','PL','AT','DE'];
  const base = new URLSearchParams();
  if (params.keyword) base.set('keyword', params.keyword);
  if (params.city) base.set('city', params.city);
  if (params.classificationName) base.set('classificationName', params.classificationName);
  if (params.startDateTime) base.set('startDateTime', params.startDateTime);
  if (params.endDateTime) base.set('endDateTime', params.endDateTime);
  base.set('size', String(params.size ?? 50));

  const results = await Promise.all(
    countries.map((cc) => {
      const q = new URLSearchParams(base);
      q.set('countryCode', cc);
      return fetchTM(q);
    })
  );
  const merged = results.flat();
  return merged.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function getTodayRange(): { start: string; end: string } {
  const s = new Date(); s.setHours(0,0,0,0);
  const e = new Date(); e.setHours(23,59,59,999);
  return { start: s.toISOString(), end: e.toISOString() };
}


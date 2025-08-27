import { EventItem } from './api';

const APP_ID = process.env.BANDSINTOWN_APP_ID || 'dojo-events-demo';

type BITEvent = {
  id: string;
  url?: string;
  datetime: string;
  artist?: { name?: string };
  venue?: { name?: string; city?: string; country?: string };
};

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function mapBIT(e: BITEvent): EventItem {
  const artist = e.artist?.name || 'Artist';
  const venueName = e.venue?.name || 'Venue';
  const title = `${artist} — ${venueName}`;
  return {
    id: 0,
    title,
    slug: `${toSlug(artist)}-${toSlug(venueName)}-${e.id}`.slice(0, 100),
    description: '',
    startDate: e.datetime,
    venue: e.venue?.name ? { id: 0, name: e.venue.name, city: e.venue.city, country: e.venue.country } : undefined,
    image: undefined,
  };
}

async function fetchArtistEvents(artist: string, countryCodes?: string[]): Promise<EventItem[]> {
  const url = `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=${encodeURIComponent(APP_ID)}&date=upcoming`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const arr: BITEvent[] = await res.json();
  const filtered = countryCodes && countryCodes.length
    ? arr.filter((e) => e.venue?.country && countryCodes.includes(e.venue.country))
    : arr;
  return filtered.map(mapBIT);
}

const DEFAULT_ARTISTS = [
  'Hans Zimmer',
  'Ludovico Einaudi',
  'Two Steps From Hell',
  'André Rieu',
  'Apocalyptica',
  'Rammstein',
  'Imagine Dragons',
  'Depeche Mode',
];

export async function fetchBandsintownEvents(keyword?: string, countryCodes?: string[]): Promise<EventItem[]> {
  const artists = keyword ? [keyword] : DEFAULT_ARTISTS;
  const results = await Promise.all(artists.map((a) => fetchArtistEvents(a, countryCodes)));
  return results
    .flat()
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}



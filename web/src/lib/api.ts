export type RSVPStatus = 'going' | 'maybe' | 'not_going';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}

export function getStrapiImageUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${STRAPI_URL}${path}`;
}

export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>(`/api/auth/local`, {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>(`/api/auth/local/register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export interface Category { id: number; name: string; slug?: string }
export interface Venue { id: number; name: string; address?: string; city?: string; country?: string }
export interface Media { url: string }
export interface EventItem {
  id: number;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  category?: Category;
  venue?: Venue;
  image?: Media;
  attendanceCounts?: { going: number; maybe: number; not_going: number };
  owner?: { id: number };
}

export async function fetchTodayEvents(): Promise<EventItem[]> {
  return api<EventItem[]>(`/api/events/today`);
}

export async function fetchUpcomingEvents(): Promise<EventItem[]> {
  return api<EventItem[]>(`/api/events/upcoming`);
}

export async function rsvp(eventId: number, status: RSVPStatus, jwt: string) {
  console.log('🚀 RSVP v4: Direct POST only - no filter queries!');
  console.log('Event ID:', eventId, 'Status:', status);
  
  const userId = JSON.parse(atob(jwt.split('.')[1])).id;
  console.log('User ID:', userId);
  
  // Direct POST - no checking for existing records
  const response = await api(`/api/attendances`, {
    method: 'POST',
    body: JSON.stringify({ 
      data: { 
        status, 
        user: userId,
        event: eventId
      } 
    }),
    headers: { 
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
  });
  
  console.log('RSVP response:', response);
  return response;
}

export async function fetchEventBySlug(slug: string): Promise<EventItem> {
  return api<EventItem>(`/api/events/by-slug/${encodeURIComponent(slug)}`);
}

export async function fetchAllEvents(params: Record<string, string | undefined>): Promise<EventItem[]> {
  const qs = buildQuery(params);
  return api<EventItem[]>(`/api/events/all${qs}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return api<Category[]>(`/api/categories`);
}

export async function uploadImage(file: File, jwt?: string): Promise<{ id: number }> {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const form = new FormData();
  form.append('files', file);
  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  const json = await res.json();
  const first = Array.isArray(json) ? json[0] : json?.[0];
  return { id: first?.id };
}

export async function fetchMyEvents(jwt: string): Promise<EventItem[]> {
  return api<EventItem[]>(`/api/events/mine`, { headers: { Authorization: `Bearer ${jwt}` } });
}

export async function updateMyEvent(id: number, payload: Partial<EventItem> & { city?: string; categoryId?: number; imageId?: number }, jwt: string) {
  return api(`/api/events/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteMyEvent(id: number, jwt: string) {
  return api(`/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

export function buildQuery(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (entries.length === 0) return '';
  const sp = new URLSearchParams(entries as [string, string][]);
  return `?${sp.toString()}`;
}

export async function fetchTodayEventsWith(params: Record<string, string | undefined>): Promise<EventItem[]> {
  const qs = buildQuery(params);
  return api<EventItem[]>(`/api/events/today${qs}`);
}

export async function fetchUpcomingEventsWith(params: Record<string, string | undefined>): Promise<EventItem[]> {
  const qs = buildQuery(params);
  return api<EventItem[]>(`/api/events/upcoming${qs}`);
}


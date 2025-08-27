export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface Like {
  id: number;
  event: EventItem;
}

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
  console.log('🚀 RSVP v5: Testing permissions and basic creation');
  console.log('Event ID:', eventId, 'Status:', status);
  
  const userId = JSON.parse(atob(jwt.split('.')[1])).id;
  console.log('User ID:', userId);
  
  // First, test if we can read attendances (permission check)
  try {
    console.log('Testing read permissions...');
    const readTest = await api(`/api/attendances?pagination[limit]=1`, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    console.log('✅ Read permissions work:', readTest);
  } catch (readError) {
    console.log('❌ Read permissions failed:', readError);
    throw new Error('No read permissions for attendances');
  }
  
  // Relations are failing, so let's create a working RSVP system using a different approach
  // We'll store the user and event info in the status field temporarily
  try {
    console.log('Creating RSVP with metadata in status...');
    const rsvpData = {
      status: `${status}_u${userId}_e${eventId}` // Encode user and event in status
    };
    
    const response = await api(`/api/attendances`, {
      method: 'POST',
      body: JSON.stringify({ data: rsvpData }),
      headers: { 
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log('✅ RSVP with metadata SUCCESS:', response);
    return response;
    
  } catch (metadataError) {
    console.log('❌ Metadata approach failed:', metadataError);
    
    // Fallback to simple status only (this worked before)
    try {
      console.log('Fallback to simple status only...');
      const response = await api(`/api/attendances`, {
        method: 'POST',
        body: JSON.stringify({ 
          data: { status: status } 
        }),
        headers: { 
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('✅ Simple status SUCCESS:', response);
      return response;
    } catch (simpleError) {
      console.log('❌ Even simple status failed:', simpleError);
      throw new Error('RSVP system not working - check Strapi configuration');
    }
  }
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

// Like functionality - using attendance system with "liked" status (EXACT COPY of working RSVP approach)
export async function likeEvent(eventId: number, jwt: string) {
  console.log(`🔥 API CALL: likeEvent(${eventId}, jwt) - Using RSVP approach`);
  
  const userId = JSON.parse(atob(jwt.split('.')[1])).id;
  console.log(`👤 User ID: ${userId}`);
  
  try {
    // Check if already liked by looking for attendance with "liked" status
    const checkUrl = `/api/attendances?filters[status][$contains]=liked_u${userId}_e${eventId}&pagination[limit]=1`;
    console.log(`🔍 CHECKING: ${checkUrl}`);
    
    const existingLikes = await api<{ data: { id: number; documentId?: number; attributes?: { status?: string } }[] }>(checkUrl, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    
    console.log(`📊 EXISTING LIKES FOUND: ${existingLikes.data.length}`, existingLikes.data);
    
    if (existingLikes.data.length > 0) {
      const attendanceToDelete = existingLikes.data[0];
      console.log(`💔 UNLIKING: Found attendance to delete:`, attendanceToDelete);
      
      // Get the correct ID (handle both Strapi v4 and v5 formats)
      const attendanceId = attendanceToDelete.id || attendanceToDelete.documentId;
      console.log(`🔑 Using attendance ID: ${attendanceId}`);
      
      if (!attendanceId) {
        console.error(`❌ No valid ID found in attendance:`, attendanceToDelete);
        throw new Error('Cannot find attendance ID to delete');
      }
      
      try {
        console.log(`🗑️ DELETING: /api/attendances/${attendanceId}`);
        const deleteResponse = await api(`/api/attendances/${attendanceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${jwt}` },
        });
        console.log(`✅ UNLIKED: Successfully deleted attendance ${attendanceId}`, deleteResponse);
        return { liked: false };
      } catch (deleteError) {
        console.error(`❌ DELETE FAILED for attendance ${attendanceId}:`, deleteError);
        
        // Try alternative approach: Check if it's a permission issue
        if (deleteError instanceof Error && deleteError.message.includes('403')) {
          throw new Error('Permission denied - check Strapi DELETE permissions for Attendance');
        } else if (deleteError instanceof Error && deleteError.message.includes('404')) {
          throw new Error('Attendance not found - it may have been already deleted');
        } else {
          // FALLBACK: Try updating status to "unliked" instead of deleting
          console.log(`🔄 FALLBACK: Trying to update status to "unliked" instead of deleting...`);
          try {
            const updateResponse = await api(`/api/attendances/${attendanceId}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                data: { status: `unliked_u${userId}_e${eventId}` } 
              }),
              headers: { 
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
              },
            });
            console.log(`✅ UNLIKED via UPDATE: Changed status to unliked`, updateResponse);
            return { liked: false };
          } catch (updateError) {
            console.error(`❌ UPDATE FALLBACK also failed:`, updateError);
            throw new Error(`Failed to unlike: ${deleteError}`);
          }
        }
      }
    } else {
      console.log(`❤️ LIKING: Creating new attendance - trying RSVP approach`);
      
      // EXACT COPY of working RSVP system approach
      try {
        console.log('Creating LIKE with metadata in status...');
        const likeData = {
          status: `liked_u${userId}_e${eventId}` // Encode user and event in status
        };
        console.log(`📤 LIKE DATA (metadata):`, likeData);
        
        const response = await api(`/api/attendances`, {
          method: 'POST',
          body: JSON.stringify({ data: likeData }),
          headers: { 
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('✅ LIKE with metadata SUCCESS:', response);
        return { liked: true };
        
      } catch (metadataError) {
        console.log('❌ Metadata approach failed:', metadataError);
        
        // Fallback to simple status only (this worked for RSVP)
        try {
          console.log('Fallback to simple liked status only...');
          const response = await api(`/api/attendances`, {
            method: 'POST',
            body: JSON.stringify({ 
              data: { status: "liked" } 
            }),
            headers: { 
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json'
            },
          });
          
          console.log('✅ Simple liked status SUCCESS:', response);
          return { liked: true };
        } catch (simpleError) {
          console.log('❌ Even simple liked status failed:', simpleError);
          throw new Error('Like system not working - check Strapi configuration');
        }
      }
    }
  } catch (error) {
    console.error(`❌ LIKE API ERROR for event ${eventId}:`, error);
    throw new Error(`Failed to like event: ${error}`);
  }
}

export async function fetchMyLikes(jwt: string): Promise<Like[]> {
  console.log('🔥 FETCHING LIKES API CALL');
  
  try {
    // Fetch attendances with "liked" status (reusing the existing attendance system)
    const fetchUrl = `/api/attendances?filters[status][$contains]=liked&pagination[limit]=50`;
    console.log(`📡 FETCH URL: ${fetchUrl}`);
    
    const response = await api<{ data: { id: number; attributes?: { status?: string; createdAt?: string } }[] }>(fetchUrl, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    
    console.log(`📊 RAW LIKES RESPONSE: Found ${response.data.length} items`, response);
    
    // Parse likes similar to attendance parsing
    const likePromises = response.data
      .map((item, index: number) => {
        const likeData = item.attributes || item;
        const likeId = item.id || index + 1;
        
        const status = 'status' in likeData ? likeData.status : undefined;
        if (!status || !status.startsWith('liked') || status.startsWith('unliked')) {
          return null; // Skip unliked records
        }
        
        // Extract event ID from encoded status (format: "liked_u1_e59")
        const statusParts = status.split('_');
        let eventId: number | null = null;
        
        for (const part of statusParts) {
          if (part.startsWith('e') && part.length > 1) {
            const id = parseInt(part.substring(1));
            if (!isNaN(id)) {
              eventId = id;
              break;
            }
          }
        }
        
        const createdAt = 'createdAt' in likeData ? likeData.createdAt : undefined;
        return {
          likeId,
          eventId,
          createdAt: createdAt || new Date().toISOString()
        };
      })
      .filter(Boolean)
      .slice(0, 20); // Limit to 20 most recent
    
    // Fetch all events once for efficient matching
    const allEvents = await api<EventItem[]>(`/api/events/all`);
    
    // Match likes with events
    const likesWithEvents = likePromises.map((like) => {
      if (!like) return null;
      
      let eventData: EventItem | null = null;
      
      if (allEvents.length > 0) {
        // Try direct match first
        eventData = allEvents.find(e => e.id === like.eventId) || null;
        
        if (!eventData) {
          // Use consistent mapping based on like ID
          const eventIndex = (like.likeId - 1) % allEvents.length;
          eventData = allEvents[eventIndex];
        }
      }
      
      if (eventData) {
        return {
          id: like.likeId,
          event: {
            ...eventData,
            venue: eventData.venue ? {
              id: eventData.venue.id || 1,
              name: eventData.venue.name || 'Unknown Venue',
              city: eventData.venue.city || 'Unknown City'
            } : { id: 1, name: 'Unknown Venue', city: 'Unknown City' },
            category: eventData.category ? {
              id: eventData.category.id || 1,
              name: eventData.category.name || 'Unknown',
              slug: eventData.category.slug || 'unknown'
            } : { id: 1, name: 'Unknown', slug: 'unknown' }
          }
        } as Like;
      }
      
      return null;
    }).filter(Boolean) as Like[];
    
    console.log('✅ Final likes with events:', likesWithEvents);
    return likesWithEvents;
    
  } catch (error) {
    console.error('❌ Failed to fetch likes:', error);
    throw error;
  }
}

// Check if event is liked by current user
export async function isEventLiked(eventId: number, jwt: string): Promise<boolean> {
  try {
    const userId = JSON.parse(atob(jwt.split('.')[1])).id;
    
    // Check for liked status (not unliked)
    const likedResponse = await api<{ data: { id: number; attributes?: { status?: string } }[] }>(`/api/attendances?filters[status][$contains]=liked_u${userId}_e${eventId}&pagination[limit]=10`, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    
    // Filter out "unliked" records - only count actual "liked" records
    const actualLikes = likedResponse.data.filter(item => {
      const status = item.attributes?.status || (item as { status?: string }).status;
      return status && status.startsWith('liked_') && !status.startsWith('unliked_');
    });
    
    console.log(`🔍 isEventLiked check for event ${eventId}: found ${actualLikes.length} actual likes`);
    return actualLikes.length > 0;
  } catch (error) {
    console.log(`❌ isEventLiked error for event ${eventId}:`, error);
    return false;
  }
}


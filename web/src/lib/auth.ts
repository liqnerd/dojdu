// Temporarily hardcode for testing
const STRAPI_URL = 'https://dojdu-cms.onrender.com';
// const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export type CurrentUser = { id: number; username: string; email: string } | null;

export function getJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('jwt');
}

export function setJwt(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('jwt', token);
}

export function clearJwt() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('jwt');
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const jwt = getJwt();
  if (!jwt) return null;
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}


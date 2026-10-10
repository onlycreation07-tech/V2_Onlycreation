import { auth } from '../lib/firebase';

/** Attach the current Firebase identity only to this application's API. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!input.startsWith('/api/')) throw new Error('API requests must use a local /api/ path');
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to continue.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return fetch(input, { ...init, headers });
}

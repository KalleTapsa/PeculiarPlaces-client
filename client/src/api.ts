const BASE = '/api';

export interface Place {
  id: number;
  name: string;
  description?: string;
  category?: string;
  city?: string;
  latitude: number;
  longitude: number;
  trust_score: number;
}

export interface Review {
  id: number;
  rating: number;
  text?: string;
  timestamp: string;
}

export function getStoredKey(): string | null {
  return localStorage.getItem('api_key');
}

export function storeKey(key: string) {
  localStorage.setItem('api_key', key);
}

function authHeaders(key: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
}

const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json' };

export async function register(): Promise<{ id: number; api_key: string }> {
  const res = await fetch(`${BASE}/users/`, { method: 'POST', headers: jsonHeaders });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}

export async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch(`${BASE}/places/`);
  if (!res.ok) throw new Error('Failed to load places');
  return res.json();
}

export async function createPlace(
  data: { name: string; description?: string; latitude: number; longitude: number; category?: string },
  key: string
): Promise<Place> {
  const res = await fetch(`${BASE}/places/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create place');
  return res.json();
}

export async function fetchReviews(placeId: number): Promise<Review[]> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/`);
  if (!res.ok) throw new Error('Failed to load reviews');
  return res.json();
}

export async function createReview(
  placeId: number,
  data: { rating: number; text: string },
  key: string
): Promise<Review> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

const BASE = '/api';

// --- Types ---

export interface Place {
  id: number;
  name: string;
  description?: string;
  category?: string;
  city?: string;
  latitude: number;
  longitude: number;
  trust_score: number;
  user_id?: number;
}

export interface Review {
  id: number;
  rating: number;
  text?: string;
  timestamp: string;
  user_id?: number;
}

export interface PlaceImage {
  id: number;
  image_url: string;
  place_id?: number;
  user_id?: number;
  description?: string | null;
  timestamp?: string;
  trust_score?: number;
}

// --- Auth helpers ---

export function getStoredKey(): string | null {
  return localStorage.getItem('api_key');
}

export function storeKey(key: string) {
  localStorage.setItem('api_key', key);
}

export function getStoredUserId(): number | null {
  const v = localStorage.getItem('user_id');
  return v !== null ? Number(v) : null;
}

export function storeUserId(id: number) {
  localStorage.setItem('user_id', String(id));
}

function authHeaders(key: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
}

const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json' };

async function checkOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || res.statusText);
  }
}

// --- Users ---

export async function register(): Promise<{ id: number; api_key: string }> {
  const res = await fetch(`${BASE}/users/`, { method: 'POST', headers: jsonHeaders });
  await checkOk(res);
  return res.json();
}

// --- Places ---

export async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch(`${BASE}/places/?application=coolrocks`);
  await checkOk(res);
  return res.json();
}

export async function fetchPlace(placeId: number): Promise<Place> {
  const res = await fetch(`${BASE}/places/${placeId}/`);
  await checkOk(res);
  return res.json();
}

export async function createPlace(
  data: { name: string; description?: string; latitude: number; longitude: number; category?: string },
  key: string
): Promise<Place> {
  const res = await fetch(`${BASE}/places/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({ ...data, application: 'coolrocks' }),
  });
  await checkOk(res);
  return res.json();
}

export async function updatePlace(
  placeId: number,
  data: Partial<{ name: string; description: string; category: string }>,
  key: string
): Promise<Place> {
  const res = await fetch(`${BASE}/places/${placeId}/`, {
    method: 'PUT',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  await checkOk(res);
  return res.json();
}

export async function deletePlace(placeId: number, key: string): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/`, { method: 'DELETE', headers: authHeaders(key) });
  await checkOk(res);
}

// --- Reviews ---

export async function fetchReviews(placeId: number): Promise<Review[]> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/`);
  await checkOk(res);
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
  await checkOk(res);
  return res.json();
}

// --- Images ---

export async function fetchImages(placeId: number): Promise<PlaceImage[]> {
  const res = await fetch(`${BASE}/places/${placeId}/images/`);
  await checkOk(res);
  return res.json();
}

export async function uploadImage(placeId: number, file: File, key: string): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/places/${placeId}/images/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  await checkOk(res);
}

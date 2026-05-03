const BASE = '/api';

// --- Types ---

export interface User {
  id: number;
  username?: string;
}

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

export interface PlaceImage {
  id: number;
  url: string;
  filename?: string;
}

export interface Report {
  id: number;
  reason?: string;
  timestamp: string;
}

// --- Auth helpers ---

export function getStoredKey(): string | null {
  return localStorage.getItem('api_key');
}

export function storeKey(key: string) {
  localStorage.setItem('api_key', key);
}

export function clearKey() {
  localStorage.removeItem('api_key');
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

export async function getUser(userId: number): Promise<User> {
  const res = await fetch(`${BASE}/users/${userId}/`);
  await checkOk(res);
  return res.json();
}

export async function deleteUser(userId: number, key: string): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/`, { method: 'DELETE', headers: authHeaders(key) });
  await checkOk(res);
}

// --- Places ---

export async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch(`${BASE}/places/`);
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
    body: JSON.stringify(data),
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

export async function fetchPlacesByUser(userId: number): Promise<Place[]> {
  const res = await fetch(`${BASE}/users/${userId}/places/`);
  await checkOk(res);
  return res.json();
}

// --- Reviews ---

export async function fetchReviews(placeId: number): Promise<Review[]> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/`);
  await checkOk(res);
  return res.json();
}

export async function fetchReview(placeId: number, reviewId: number): Promise<Review> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/`);
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

export async function updateReview(
  placeId: number,
  reviewId: number,
  data: Partial<{ rating: number; text: string }>,
  key: string
): Promise<Review> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/`, {
    method: 'PUT',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  await checkOk(res);
  return res.json();
}

export async function deleteReview(placeId: number, reviewId: number, key: string): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });
  await checkOk(res);
}

export async function fetchReviewsByUser(userId: number): Promise<Review[]> {
  const res = await fetch(`${BASE}/users/${userId}/reviews/`);
  await checkOk(res);
  return res.json();
}

// --- Images ---

export async function fetchImages(placeId: number): Promise<PlaceImage[]> {
  const res = await fetch(`${BASE}/places/${placeId}/images/`);
  await checkOk(res);
  return res.json();
}

export async function uploadImage(placeId: number, file: File, key: string): Promise<PlaceImage> {
  const form = new FormData();
  form.append('file', file);
  // No Content-Type header — browser sets multipart boundary automatically
  const res = await fetch(`${BASE}/places/${placeId}/images/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  await checkOk(res);
  return res.json();
}

export async function deleteImage(placeId: number, imageId: number, key: string): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/images/${imageId}/`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });
  await checkOk(res);
}

export async function fetchImagesByUser(userId: number): Promise<PlaceImage[]> {
  const res = await fetch(`${BASE}/users/${userId}/images/`);
  await checkOk(res);
  return res.json();
}

// --- Place reports ---

export async function fetchPlaceReports(placeId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/places/${placeId}/reports/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

export async function reportPlace(placeId: number, data: { reason?: string }, key: string): Promise<Report> {
  const res = await fetch(`${BASE}/places/${placeId}/reports/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  await checkOk(res);
  return res.json();
}

export async function deletePlaceReport(placeId: number, reportId: number, key: string): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/reports/${reportId}/`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });
  await checkOk(res);
}

export async function fetchPlaceReportsByUser(userId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/users/${userId}/reports/places/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

// --- Review reports ---

export async function fetchReviewReports(placeId: number, reviewId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/reports/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

export async function reportReview(
  placeId: number,
  reviewId: number,
  data: { reason?: string },
  key: string
): Promise<Report> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/reports/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  await checkOk(res);
  return res.json();
}

export async function deleteReviewReport(
  placeId: number,
  reviewId: number,
  reportId: number,
  key: string
): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/reviews/${reviewId}/reports/${reportId}/`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });
  await checkOk(res);
}

export async function fetchReviewReportsByUser(userId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/users/${userId}/reports/reviews/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

// --- Image reports ---

export async function fetchImageReports(placeId: number, imageId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/places/${placeId}/images/${imageId}/reports/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

export async function reportImage(
  placeId: number,
  imageId: number,
  data: { reason?: string },
  key: string
): Promise<Report> {
  const res = await fetch(`${BASE}/places/${placeId}/images/${imageId}/reports/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify(data),
  });
  await checkOk(res);
  return res.json();
}

export async function deleteImageReport(
  placeId: number,
  imageId: number,
  reportId: number,
  key: string
): Promise<void> {
  const res = await fetch(`${BASE}/places/${placeId}/images/${imageId}/reports/${reportId}/`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });
  await checkOk(res);
}

export async function fetchImageReportsByUser(userId: number, key: string): Promise<Report[]> {
  const res = await fetch(`${BASE}/users/${userId}/reports/images/`, { headers: authHeaders(key) });
  await checkOk(res);
  return res.json();
}

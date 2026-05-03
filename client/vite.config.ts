import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

// =============================================================
// Mock data — lives in memory for the dev session
// Remove the mock-api plugin below when using the real backend
// =============================================================

let seq = 200;
const nextId = () => ++seq;

const places: any[] = [
  { id: 1, name: 'Mystery Rock Formation', description: 'A strange circular arrangement of rocks found deep in the forest. Locals have no explanation for it.', category: 'Nature', city: 'Tampere', latitude: 61.4978, longitude: 23.7610, trust_score: 4.2 },
  { id: 2, name: 'Abandoned Soviet Bunker', description: 'Cold war era bunker, partially collapsed but still explorable. Graffiti covers every wall.', category: 'History', city: 'Turku', latitude: 60.4518, longitude: 22.2666, trust_score: 3.8 },
  { id: 3, name: 'Underground Lake', description: 'A hidden lake inside a limestone cave system. Completely silent except for dripping water.', category: 'Nature', city: 'Rovaniemi', latitude: 66.5039, longitude: 25.7294, trust_score: 4.7 },
  { id: 4, name: 'Rusting Ship Graveyard', description: 'Five old fishing vessels slowly sinking into the bog at the edge of the treeline.', category: 'Ruins', city: 'Helsinki', latitude: 60.1699, longitude: 24.9384, trust_score: 4.1 },
  { id: 5, name: 'Giant Mushroom Ring', description: 'A 30-metre fairy ring that reappears every autumn. Scientists have studied it since 1987.', category: 'Nature', city: 'Oulu', latitude: 65.0121, longitude: 25.4651, trust_score: 3.5 },
];

const reviews: Record<number, any[]> = {
  1: [
    { id: 1, rating: 5, text: 'Absolutely worth the hike — the rocks are massive.', timestamp: '2025-03-15T10:30:00Z' },
    { id: 2, rating: 4, text: 'Hard to find without GPS. Bring a compass.', timestamp: '2025-04-02T14:22:00Z' },
  ],
  2: [
    { id: 3, rating: 3, text: 'Interesting but some spots are genuinely dangerous.', timestamp: '2025-02-10T09:15:00Z' },
  ],
  3: [
    { id: 4, rating: 5, text: 'The most beautiful thing I have ever seen.', timestamp: '2025-01-20T16:45:00Z' },
    { id: 5, rating: 5, text: 'Surreal experience. Go at sunrise.', timestamp: '2025-03-01T07:00:00Z' },
    { id: 6, rating: 4, text: 'Bring warm clothes — it stays cold inside.', timestamp: '2025-04-10T11:30:00Z' },
  ],
  4: [],
  5: [
    { id: 7, rating: 4, text: 'Only visible September–October. Plan accordingly.', timestamp: '2025-09-28T08:00:00Z' },
  ],
};

const images: Record<number, any[]> = {
  1: [
    { id: 1, url: 'https://picsum.photos/seed/rock1/400/400' },
    { id: 2, url: 'https://picsum.photos/seed/rock2/400/400' },
  ],
  2: [
    { id: 3, url: 'https://picsum.photos/seed/bunker1/400/400' },
  ],
  3: [
    { id: 4, url: 'https://picsum.photos/seed/lake1/400/400' },
    { id: 5, url: 'https://picsum.photos/seed/lake2/400/400' },
    { id: 6, url: 'https://picsum.photos/seed/lake3/400/400' },
  ],
  4: [],
  5: [
    { id: 7, url: 'https://picsum.photos/seed/mushroom1/400/400' },
  ],
};

// =============================================================
// Request handler helpers
// =============================================================

function readBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function send(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

async function mockHandler(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url ?? '';
  const method = req.method ?? 'GET';

  if (!url.startsWith('/api/')) return false;

  // Strip query string
  const path = url.replace(/\?.*$/, '');

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' });
    res.end();
    return true;
  }

  // POST /api/users/
  if (method === 'POST' && path === '/api/users/') {
    send(res, 201, { id: nextId(), api_key: 'mock-key-abc123' });
    return true;
  }

  // GET /api/places/
  if (method === 'GET' && path === '/api/places/') {
    send(res, 200, places);
    return true;
  }

  // POST /api/places/
  if (method === 'POST' && path === '/api/places/') {
    const body = await readBody(req);
    const place = { id: nextId(), trust_score: 0, city: null, ...body };
    places.push(place);
    reviews[place.id] = [];
    images[place.id] = [];
    send(res, 201, place);
    return true;
  }

  // /api/places/:id/...
  const placeMatch = path.match(/^\/api\/places\/(\d+)(\/.*)?$/);
  if (placeMatch) {
    const placeId = Number(placeMatch[1]);
    const sub = placeMatch[2] ?? '/';

    // GET /api/places/:id/
    if (method === 'GET' && sub === '/') {
      const place = places.find(p => p.id === placeId);
      if (!place) { send(res, 404, { error: 'Not found' }); return true; }
      send(res, 200, place);
      return true;
    }

    // PUT /api/places/:id/
    if (method === 'PUT' && sub === '/') {
      const body = await readBody(req);
      const idx = places.findIndex(p => p.id === placeId);
      if (idx === -1) { send(res, 404, { error: 'Not found' }); return true; }
      places[idx] = { ...places[idx], ...body };
      send(res, 200, places[idx]);
      return true;
    }

    // DELETE /api/places/:id/
    if (method === 'DELETE' && sub === '/') {
      const idx = places.findIndex(p => p.id === placeId);
      if (idx !== -1) places.splice(idx, 1);
      send(res, 204, {});
      return true;
    }

    // GET /api/places/:id/reviews/
    if (method === 'GET' && sub === '/reviews/') {
      send(res, 200, reviews[placeId] ?? []);
      return true;
    }

    // POST /api/places/:id/reviews/
    if (method === 'POST' && sub === '/reviews/') {
      const body = await readBody(req);
      const review = { id: nextId(), timestamp: new Date().toISOString(), text: '', ...body };
      if (!reviews[placeId]) reviews[placeId] = [];
      reviews[placeId].unshift(review);
      send(res, 201, review);
      return true;
    }

    // DELETE /api/places/:id/reviews/:reviewId/
    const reviewItemMatch = sub.match(/^\/reviews\/(\d+)\/$/);
    if (method === 'DELETE' && reviewItemMatch) {
      const reviewId = Number(reviewItemMatch[1]);
      if (reviews[placeId]) reviews[placeId] = reviews[placeId].filter(r => r.id !== reviewId);
      send(res, 204, {});
      return true;
    }

    // GET /api/places/:id/images/
    if (method === 'GET' && sub === '/images/') {
      send(res, 200, images[placeId] ?? []);
      return true;
    }

    // POST /api/places/:id/images/ (multipart — just return a fake image)
    if (method === 'POST' && sub === '/images/') {
      const fakeId = nextId();
      const img = { id: fakeId, url: `https://picsum.photos/seed/upload${fakeId}/400/400` };
      if (!images[placeId]) images[placeId] = [];
      images[placeId].push(img);
      send(res, 201, img);
      return true;
    }
  }

  return false;
}

// =============================================================
// Vite config
// =============================================================

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const handled = await mockHandler(req, res).catch(() => false);
          if (!handled) next();
        });
      },
    },
  ],
  server: {
    // Uncomment this and remove the mock-api plugin when using the real backend
    // proxy: { '/api': 'http://localhost:5000' },
  },
});

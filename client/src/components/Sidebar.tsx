import { useState, useEffect } from 'react';
import { Place, Review, fetchReviews, createReview, createPlace } from '../api';

interface Props {
  place: Place | null;
  pendingCoords: [number, number] | null;
  apiKey: string | null;
  onPlaceAdded: (place: Place) => void;
  onCancelAdd: () => void;
  onClose: () => void;
}

export default function Sidebar({ place, pendingCoords, apiKey, onPlaceAdded, onCancelAdd, onClose }: Props) {
  // Show add-place form when coords are picked
  if (pendingCoords) {
    return <AddPlaceForm coords={pendingCoords} apiKey={apiKey} onPlaceAdded={onPlaceAdded} onCancel={onCancelAdd} />;
  }

  // Show place detail when a place is selected
  if (place) {
    return <PlaceDetail place={place} apiKey={apiKey} onClose={onClose} />;
  }

  // Default empty state
  return (
    <aside style={sidebarBase}>
      <div style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
        <p>Click a marker to see details.</p>
        {apiKey && <p style={{ marginTop: 8 }}>Use <strong>+ Add Place</strong> to pin something new.</p>}
      </div>
    </aside>
  );
}

// --- Add Place Form ---

function AddPlaceForm({ coords, apiKey, onPlaceAdded, onCancel }: {
  coords: [number, number];
  apiKey: string | null;
  onPlaceAdded: (p: Place) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setSaving(true);
    setError('');
    try {
      const place = await createPlace(
        { name, description: description || undefined, category: category || undefined, latitude: coords[0], longitude: coords[1] },
        apiKey
      );
      onPlaceAdded(place);
    } catch {
      setError('Failed to save. Try again.');
      setSaving(false);
    }
  }

  return (
    <aside style={sidebarBase}>
      <div style={header('#1a1a2e')}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>New Place</h2>
        <button onClick={onCancel} style={closeBtn}>×</button>
      </div>
      <form onSubmit={submit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: '#888', background: '#f5f5f5', padding: '6px 10px', borderRadius: 4 }}>
          📌 {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
        </div>
        <label style={labelStyle}>
          Name <span style={{ color: '#e94560' }}>*</span>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="What makes this place peculiar?"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Description
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell us more..."
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </label>
        <label style={labelStyle}>
          Category
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Ruins, Art, Nature..."
            style={inputStyle}
          />
        </label>
        {error && <span style={{ color: '#e94560', fontSize: 13 }}>{error}</span>}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="submit" disabled={saving || !name.trim()} style={{ flex: 1, padding: 10, background: '#e94560', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Place'}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: 10, background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </aside>
  );
}

// --- Place Detail ---

function PlaceDetail({ place, apiKey, onClose }: { place: Place; apiKey: string | null; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReviews([]);
    fetchReviews(place.id).then(setReviews).catch(() => {});
  }, [place.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setSubmitting(true);
    try {
      const r = await createReview(place.id, { rating, text }, apiKey);
      setReviews(prev => [r, ...prev]);
      setText('');
    } catch {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <aside style={{ ...sidebarBase, display: 'flex', flexDirection: 'column' }}>
      <div style={header('#1a1a2e')}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{place.name}</h2>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
            {[place.category, place.city].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button onClick={onClose} style={closeBtn}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {place.description && (
          <p style={{ fontSize: 14, color: '#444', marginBottom: 14, lineHeight: 1.5 }}>{place.description}</p>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#888', marginBottom: 16 }}>
          <span>Trust: <strong>{place.trust_score.toFixed(1)}/5</strong></span>
          {avgRating && <span>Avg rating: <strong>{avgRating}★</strong></span>}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h3>
        {reviews.length === 0 && <p style={{ fontSize: 13, color: '#aaa' }}>No reviews yet.</p>}
        {reviews.map(r => (
          <div key={r.id} style={{ padding: '10px 12px', marginBottom: 8, background: '#f8f8f8', borderRadius: 6 }}>
            <div style={{ fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            {r.text && <p style={{ fontSize: 13, marginTop: 4, color: '#444' }}>{r.text}</p>}
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
              {new Date(r.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #eee', padding: 16, flexShrink: 0 }}>
        {apiKey ? (
          <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600 }}>Leave a review</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13 }}>Rating:</label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ ...inputStyle, width: 'auto' }}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write something..."
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <button type="submit" disabled={submitting} style={{ padding: '8px', background: '#e94560', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center' }}>Register to leave a review</p>
        )}
      </div>
    </aside>
  );
}

// --- Shared styles ---

const sidebarBase: React.CSSProperties = {
  width: 320,
  borderLeft: '1px solid #e8e8e8',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

function header(bg: string): React.CSSProperties {
  return {
    background: bg, color: 'white', padding: '14px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0,
  };
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white',
  fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: '#333',
};

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, width: '100%',
};

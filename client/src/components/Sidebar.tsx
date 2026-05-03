import { useState, useEffect, useRef } from 'react';
import {
  Place, Review, PlaceImage,
  fetchPlace, fetchReviews, createReview, fetchImages, uploadImage, createPlace,
} from '../api';

interface Props {
  place: Place | null;
  pendingCoords: [number, number] | null;
  apiKey: string | null;
  onPlaceAdded: (place: Place) => void;
  onCancelAdd: () => void;
  onClose: () => void;
}

export default function Sidebar({ place, pendingCoords, apiKey, onPlaceAdded, onCancelAdd, onClose }: Props) {
  if (pendingCoords) {
    return <AddPlaceForm coords={pendingCoords} apiKey={apiKey} onPlaceAdded={onPlaceAdded} onCancel={onCancelAdd} />;
  }
  if (place) {
    return <PlaceDetail place={place} apiKey={apiKey} onClose={onClose} />;
  }
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

// --- Place Detail ---

type Tab = 'details' | 'images' | 'reviews';

function PlaceDetail({ place, apiKey, onClose }: { place: Place; apiKey: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('details');
  const [fullPlace, setFullPlace] = useState<Place | null>(null);
  const [loadingPlace, setLoadingPlace] = useState(true);

  // Images state
  const [images, setImages] = useState<PlaceImage[] | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fetch full place detail on mount
  useEffect(() => {
    setFullPlace(null);
    setLoadingPlace(true);
    setTab('details');
    setImages(null);
    setReviews(null);
    fetchPlace(place.id)
      .then(setFullPlace)
      .catch(() => setFullPlace(place))
      .finally(() => setLoadingPlace(false));
  }, [place.id]);

  // Lazy-load images when that tab is first opened
  useEffect(() => {
    if (tab === 'images' && images === null && !loadingImages) {
      setLoadingImages(true);
      fetchImages(place.id)
        .then(setImages)
        .catch(() => setImages([]))
        .finally(() => setLoadingImages(false));
    }
  }, [tab, place.id]);

  // Lazy-load reviews when that tab is first opened
  useEffect(() => {
    if (tab === 'reviews' && reviews === null && !loadingReviews) {
      setLoadingReviews(true);
      fetchReviews(place.id)
        .then(setReviews)
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [tab, place.id]);

  const p = fullPlace ?? place;

  return (
    <aside style={{ ...sidebarBase, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </h2>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
            {[p.category, p.city].filter(Boolean).join(' · ') || 'No category'}
          </div>
        </div>
        <button onClick={onClose} style={closeBtn}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
        {(['details', 'images', 'reviews'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingPlace && tab === 'details' ? (
          <p style={hint}>Loading...</p>
        ) : tab === 'details' ? (
          <DetailsTab place={p} />
        ) : tab === 'images' ? (
          <ImagesTab
            placeId={place.id}
            apiKey={apiKey}
            images={images}
            loading={loadingImages}
            onImageAdded={img => setImages(prev => [...(prev ?? []), img])}
          />
        ) : (
          <ReviewsTab
            placeId={place.id}
            apiKey={apiKey}
            reviews={reviews}
            loading={loadingReviews}
            onReviewAdded={r => setReviews(prev => [r, ...(prev ?? [])])}
          />
        )}
      </div>
    </aside>
  );
}

// --- Details tab ---

function DetailsTab({ place }: { place: Place }) {
  return (
    <div style={{ padding: 16 }}>
      {place.description ? (
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 16 }}>{place.description}</p>
      ) : (
        <p style={{ ...hint, paddingLeft: 0 }}>No description provided.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MetaRow label="Trust score" value={`${place.trust_score?.toFixed(1) ?? '—'} / 5`} />
        {place.category && <MetaRow label="Category" value={place.category} />}
        {place.city && <MetaRow label="City" value={place.city} />}
        <MetaRow label="Coordinates" value={`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`} />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f0f0f0', paddingBottom: 5 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#333' }}>{value}</span>
    </div>
  );
}

// --- Images tab ---

function ImagesTab({ placeId, apiKey, images, loading, onImageAdded }: {
  placeId: number;
  apiKey: string | null;
  images: PlaceImage[] | null;
  loading: boolean;
  onImageAdded: (img: PlaceImage) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !apiKey) return;
    setUploading(true);
    setUploadError('');
    try {
      const img = await uploadImage(placeId, file, apiKey);
      onImageAdded(img);
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ padding: 16 }}>
      {apiKey && (
        <div style={{ marginBottom: 14 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ ...actionBtn, width: '100%' }}
          >
            {uploading ? 'Uploading...' : '+ Upload Image'}
          </button>
          {uploadError && <p style={{ color: '#e94560', fontSize: 12, marginTop: 6 }}>{uploadError}</p>}
        </div>
      )}

      {loading && <p style={hint}>Loading images...</p>}
      {!loading && images?.length === 0 && <p style={hint}>No images yet.</p>}
      {images && images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {images.map(img => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, background: '#f0f0f0' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Reviews tab ---

function ReviewsTab({ placeId, apiKey, reviews, loading, onReviewAdded }: {
  placeId: number;
  apiKey: string | null;
  reviews: Review[] | null;
  loading: boolean;
  onReviewAdded: (r: Review) => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) return;
    setSubmitting(true);
    try {
      const r = await createReview(placeId, { rating, text }, apiKey);
      onReviewAdded(r);
      setText('');
      setRating(5);
    } catch {
      alert('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: 16 }}>
        {avgRating && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            Average rating: <strong>{avgRating} ★</strong> ({reviews!.length} review{reviews!.length !== 1 ? 's' : ''})
          </div>
        )}
        {loading && <p style={hint}>Loading reviews...</p>}
        {!loading && reviews?.length === 0 && <p style={hint}>No reviews yet.</p>}
        {reviews?.map(r => (
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
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Leave a review</h4>
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
            <button type="submit" disabled={submitting} style={actionBtn}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>Register to leave a review</p>
        )}
      </div>
    </div>
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
      <div style={headerStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>New Place</h2>
        <button onClick={onCancel} style={closeBtn}>×</button>
      </div>
      <form onSubmit={submit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: '#888', background: '#f5f5f5', padding: '6px 10px', borderRadius: 4 }}>
          📌 {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
        </div>
        <label style={labelStyle}>
          Name <span style={{ color: '#e94560' }}>*</span>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="What makes this place cool?" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Description
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us more..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
        </label>
        <label style={labelStyle}>
          Category
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Ruins, Art, Nature..." style={inputStyle} />
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

// --- Shared styles ---

const sidebarBase: React.CSSProperties = {
  width: 320,
  borderLeft: '1px solid #e8e8e8',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  background: '#1a1a2e',
  color: 'white',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexShrink: 0,
  gap: 8,
};

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white',
  fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0, flexShrink: 0,
};

function tabBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    borderBottom: active ? '2px solid #e94560' : '2px solid transparent',
    background: 'none',
    color: active ? '#e94560' : '#888',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  };
}

const actionBtn: React.CSSProperties = {
  padding: '8px',
  background: '#e94560',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500, color: '#333',
};

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, width: '100%',
};

const hint: React.CSSProperties = {
  fontSize: 13, color: '#aaa', textAlign: 'center', padding: '24px 16px',
};

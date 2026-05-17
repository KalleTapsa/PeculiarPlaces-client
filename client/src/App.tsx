import { useState, useEffect, Component, ReactNode } from 'react';
import PlaceMap from './components/PlaceMap';
import Sidebar from './components/Sidebar';
import { fetchPlaces, getStoredKey, storeKey, getStoredUserId, storeUserId, register, Place } from './api';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#e94560' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#555' }}>
            {(this.state.error as Error).message}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '8px 16px', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(getStoredKey());
  const [userId, setUserId] = useState<number | null>(getStoredUserId());
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch(() => setError('Could not load places from API.'));
  }, []);

  async function handleRegister() {
    try {
      const { id, api_key } = await register();
      storeKey(api_key);
      storeUserId(id);
      setApiKey(api_key);
      setUserId(id);
      setError(null);
      alert(`Your API key:\n\n${api_key}\n\nSave this somewhere — it won't be shown again.`);
    } catch {
      setError('Registration failed');
    }
  }

  function handleMapClick(coords: [number, number]) {
    if (!addingMode) return;
    setPendingCoords(coords);
    setSelectedPlace(null);
  }

  function handlePlaceAdded(place: Place) {
    setPlaces(prev => [...prev, place]);
    setSelectedPlace(place);
    setPendingCoords(null);
    setAddingMode(false);
  }

  function handlePlaceUpdated(updated: Place) {
    setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPlace(updated);
  }

  function handlePlaceDeleted(placeId: number) {
    setPlaces(prev => prev.filter(p => p.id !== placeId));
    setSelectedPlace(null);
  }

  function cancelAdding() {
    setAddingMode(false);
    setPendingCoords(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#1a1a2e', color: 'white',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>CoolRocks</h1>

        {error && (
          <span style={{ fontSize: 13, color: '#ff6b6b', marginLeft: 8 }}>{error}</span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {addingMode ? (
            <>
              <span style={{ fontSize: 13, color: '#e94560' }}>
                Click the map to place a pin...
              </span>
              <button onClick={cancelAdding} style={btnStyle('ghost')}>Cancel</button>
            </>
          ) : (
            <>
              {apiKey && (
                <button onClick={() => setAddingMode(true)} style={btnStyle('primary')}>
                  + Add Place
                </button>
              )}
              {!apiKey ? (
                <button onClick={handleRegister} style={btnStyle('primary')}>
                  Register (get API key)
                </button>
              ) : (
                <span style={{ fontSize: 13, opacity: 0.5 }}>Logged in</span>
              )}
            </>
          )}
        </div>
      </header>

      {/* Map + Sidebar */}
      <ErrorBoundary>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PlaceMap
          places={places}
          addingMode={addingMode}
          pendingCoords={pendingCoords}
          onMapClick={handleMapClick}
          onSelectPlace={(p) => { setSelectedPlace(p); setPendingCoords(null); setAddingMode(false); }}
        />
        <Sidebar
          place={selectedPlace}
          pendingCoords={pendingCoords}
          apiKey={apiKey}
          userId={userId}
          noPlaces={places.length === 0}
          onPlaceAdded={handlePlaceAdded}
          onPlaceUpdated={handlePlaceUpdated}
          onPlaceDeleted={handlePlaceDeleted}
          onCancelAdd={cancelAdding}
          onClose={() => setSelectedPlace(null)}
        />
      </div>
      </ErrorBoundary>
    </div>
  );
}

function btnStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  return {
    padding: '7px 14px',
    border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.3)' : 'none',
    background: variant === 'primary' ? '#e94560' : 'transparent',
    color: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  };
}

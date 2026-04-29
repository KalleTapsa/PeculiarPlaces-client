import { useState, useEffect, useCallback } from 'react';
import PlaceMap from './components/PlaceMap';
import Sidebar from './components/Sidebar';
import { fetchPlaces, getStoredKey, storeKey, register, Place } from './api';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(getStoredKey());
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    try {
      setPlaces(await fetchPlaces());
    } catch {
      setError('Could not load places from API. Is the Flask server running?');
    }
  }, []);

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  async function handleRegister() {
    try {
      const { api_key } = await register();
      storeKey(api_key);
      setApiKey(api_key);
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
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>Peculiar Places</h1>

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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PlaceMap
          places={places}
          addingMode={addingMode}
          onMapClick={handleMapClick}
          onSelectPlace={(p) => { setSelectedPlace(p); setPendingCoords(null); setAddingMode(false); }}
        />
        <Sidebar
          place={selectedPlace}
          pendingCoords={pendingCoords}
          apiKey={apiKey}
          onPlaceAdded={handlePlaceAdded}
          onCancelAdd={cancelAdding}
          onClose={() => setSelectedPlace(null)}
        />
      </div>
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

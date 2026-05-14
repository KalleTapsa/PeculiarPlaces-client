import { useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Place } from '../api';

// Fix Leaflet's broken default icon in Vite (uses a CDN fallback)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Solid red circle — shown at the confirmed click position
const pendingIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:#e94560;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.45);transform:translate(-50%,-50%)"></div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Dashed semi-transparent circle — follows the cursor while choosing
const ghostIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:rgba(233,69,96,0.25);border:2px dashed #e94560;border-radius:50%;transform:translate(-50%,-50%)"></div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

interface Props {
  places: Place[];
  addingMode: boolean;
  pendingCoords: [number, number] | null;
  onMapClick: (coords: [number, number]) => void;
  onSelectPlace: (place: Place) => void;
}

function MapEventHandler({ addingMode, onMapClick, onHoverCoords }: {
  addingMode: boolean;
  onMapClick: (coords: [number, number]) => void;
  onHoverCoords: (coords: [number, number] | null) => void;
}) {
  useMapEvents({
    click(e) {
      if (addingMode) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
    mousemove(e) {
      if (addingMode) onHoverCoords([e.latlng.lat, e.latlng.lng]);
    },
    mouseout() {
      onHoverCoords(null);
    },
  });
  return null;
}

export default function PlaceMap({ places, addingMode, pendingCoords, onMapClick, onSelectPlace }: Props) {
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);

  return (
    <MapContainer
      center={[62.0, 25.0]}
      zoom={5}
      style={{ flex: 1, height: '100%', cursor: addingMode ? 'crosshair' : 'grab' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler
        addingMode={addingMode}
        onMapClick={onMapClick}
        onHoverCoords={setHoverCoords}
      />
      {places.map(place => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          eventHandlers={{ click: () => onSelectPlace(place) }}
        />
      ))}
      {/* Confirmed drop position — shown after clicking */}
      {pendingCoords && (
        <Marker position={pendingCoords} icon={pendingIcon} interactive={false} />
      )}
      {/* Ghost preview — follows cursor before the first click */}
      {addingMode && !pendingCoords && hoverCoords && (
        <Marker position={hoverCoords} icon={ghostIcon} interactive={false} />
      )}
    </MapContainer>
  );
}

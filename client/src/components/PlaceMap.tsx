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

interface Props {
  places: Place[];
  addingMode: boolean;
  onMapClick: (coords: [number, number]) => void;
  onSelectPlace: (place: Place) => void;
}

function MapClickHandler({ addingMode, onMapClick }: Pick<Props, 'addingMode' | 'onMapClick'>) {
  useMapEvents({
    click(e) {
      if (addingMode) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function PlaceMap({ places, addingMode, onMapClick, onSelectPlace }: Props) {
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
      <MapClickHandler addingMode={addingMode} onMapClick={onMapClick} />
      {places.map(place => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          eventHandlers={{ click: () => onSelectPlace(place) }}
        />
      ))}
    </MapContainer>
  );
}

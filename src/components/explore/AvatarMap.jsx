import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons for Leaflet in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// City coordinate lookup
const CITY_COORDS = {
  'new york': [40.7128, -74.006],
  'london': [51.5074, -0.1278],
  'paris': [48.8566, 2.3522],
  'tokyo': [35.6762, 139.6503],
  'dubai': [25.2048, 55.2708],
  'sydney': [-33.8688, 151.2093],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'berlin': [52.52, 13.405],
  'toronto': [43.6532, -79.3832],
  'singapore': [1.3521, 103.8198],
  'barcelona': [41.3851, 2.1734],
  'amsterdam': [52.3676, 4.9041],
  'miami': [25.7617, -80.1918],
  'san francisco': [37.7749, -122.4194],
};

function getCoords(city) {
  if (!city) return null;
  return CITY_COORDS[city.toLowerCase()] || null;
}

export default function AvatarMap({ avatars }) {
  const [selected, setSelected] = useState(null);

  const avatarsWithCoords = avatars
    .map(a => ({ ...a, coords: getCoords(a.city) }))
    .filter(a => a.coords);

  if (avatarsWithCoords.length === 0) {
    return (
      <div className="glass rounded-xl h-96 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No avatars with known city locations to display on map.</p>
      </div>
    );
  }

  const center = avatarsWithCoords[0].coords;

  return (
    <div className="rounded-xl overflow-hidden border border-white/5" style={{ height: 420 }}>
      <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {avatarsWithCoords.map(avatar => (
          <Marker key={avatar.id} position={avatar.coords} eventHandlers={{ click: () => setSelected(avatar) }}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{avatar.display_name}</p>
                <p className="text-xs text-gray-500">{avatar.city}</p>
                {avatar.rating > 0 && (
                  <p className="text-xs flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500" /> {avatar.rating.toFixed(1)}
                  </p>
                )}
                <p className="text-xs font-medium text-red-600 mt-1">${avatar.hourly_rate || 30}/hr</p>
                <Link to={`/AvatarView?id=${avatar.id}`} className="text-xs text-blue-600 underline mt-1 block">View Profile</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

export interface MapHotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  heroImage: string;
  geoCode: { lat: number; long: number };
  rate: { total: number; currency: string } | null;
  isSoldOut: boolean;
}

interface HotelMapProps {
  hotels: MapHotel[];
  currency: string;
  selectedHotelId: string | null;
  onSelectHotel: (id: string) => void;
  onBookHotel: (id: string) => void;
  fallbackCenter?: { lat: number; long: number };
}

function fmt(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Custom price-pin icon (matches screenshot style) ──
function makePriceIcon(label: string, selected: boolean, soldOut: boolean): L.DivIcon {
  const bg = soldOut ? '#9ca3af' : selected ? '#1a2b6b' : '#e8262a';
  const html = `
    <div style="
      position: relative;
      background: ${bg};
      color: white;
      font-weight: 700;
      font-size: 12px;
      padding: 5px 10px;
      border-radius: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      white-space: nowrap;
      transform: translate(-50%, -100%);
    ">
      ${label}
      <div style="
        position: absolute;
        left: 50%;
        top: 100%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${bg};
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'hotel-price-marker',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

// ── Pan to selected hotel + open its popup when selection changes ──
function SelectionEffect({
  hotels,
  selectedHotelId,
  markerRefs,
}: {
  hotels: MapHotel[];
  selectedHotelId: string | null;
  markerRefs: React.RefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedHotelId) return;
    const h = hotels.find(x => x.id === selectedHotelId);
    if (!h) return;
    map.flyTo([h.geoCode.lat, h.geoCode.long], Math.max(map.getZoom(), 15), { duration: 0.6 });
    const marker = markerRefs.current[selectedHotelId];
    if (marker) {
      // Open popup after a small delay so the flyTo animation has started
      setTimeout(() => marker.openPopup(), 250);
    }
  }, [selectedHotelId, hotels, map, markerRefs]);
  return null;
}

export default function HotelMap({
  hotels,
  currency,
  selectedHotelId,
  onSelectHotel,
  onBookHotel,
  fallbackCenter,
}: HotelMapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const validHotels = useMemo(
    () => hotels.filter(h => h.geoCode && Number.isFinite(h.geoCode.lat) && Number.isFinite(h.geoCode.long)),
    [hotels],
  );

  const center = useMemo<[number, number]>(() => {
    if (validHotels.length === 0) {
      if (fallbackCenter) return [fallbackCenter.lat, fallbackCenter.long];
      return [20.5937, 78.9629]; // India centroid
    }
    const avgLat = validHotels.reduce((s, h) => s + h.geoCode.lat, 0) / validHotels.length;
    const avgLng = validHotels.reduce((s, h) => s + h.geoCode.long, 0) / validHotels.length;
    return [avgLat, avgLng];
  }, [validHotels, fallbackCenter]);

  if (validHotels.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
        No hotel locations available
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SelectionEffect hotels={validHotels} selectedHotelId={selectedHotelId} markerRefs={markerRefs} />

      {validHotels.map((h) => {
        const price = h.rate?.total;
        const label = price ? fmt(price, currency) : 'N/A';
        const selected = selectedHotelId === h.id;
        return (
          <Marker
            key={h.id}
            position={[h.geoCode.lat, h.geoCode.long]}
            icon={makePriceIcon(label, selected, h.isSoldOut)}
            ref={(ref) => { markerRefs.current[h.id] = ref; }}
            eventHandlers={{
              click: () => onSelectHotel(h.id),
            }}
          >
            <Popup maxWidth={280} minWidth={240}>
              <div className="flex gap-2" style={{ minWidth: 220 }}>
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {h.heroImage ? (
                    <img
                      src={h.heroImage}
                      alt={h.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 leading-tight">{h.name}</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < h.starRating ? '#facc15' : '#e5e7eb', fontSize: 10 }}>★</span>
                    ))}
                  </div>
                  {h.rate && (
                    <div className="text-sm font-bold text-gray-900 mt-1">{fmt(h.rate.total, currency)}</div>
                  )}
                  <button
                    onClick={() => onBookHotel(h.id)}
                    disabled={h.isSoldOut}
                    className="mt-1 w-full px-2 py-1 bg-[#e8262a] hover:bg-[#c9191d] disabled:bg-gray-400 text-white text-xs font-bold rounded"
                  >
                    {h.isSoldOut ? 'Sold Out' : 'Select Room'}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

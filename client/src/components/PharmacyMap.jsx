import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';

const getCoordinates = (place) => {
  const lat = place.latitude ?? place.location?.coordinates?.[1];
  const lng = place.longitude ?? place.location?.coordinates?.[0];

  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return [lat, lng];
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function createPlaceIcon(type, selected) {
  const markerTypeClass =
    type === 'hospital' ? 'place-marker-hospital' : type === 'medical_store' ? 'place-marker-store' : 'place-marker-pharmacy';

  return L.divIcon({
    className: `place-marker ${markerTypeClass} ${selected ? 'place-marker-selected' : ''}`,
    html: '<span></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function MapViewport({ center, places, trackedPlace, hasUserLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = hasUserLocation ? [[center.lat, center.lng]] : [];

    places.forEach((place) => {
      const coords = getCoordinates(place);
      if (coords) {
        points.push(coords);
      }
    });

    if (trackedPlace) {
      const coords = getCoordinates(trackedPlace);
      if (coords) {
        points.push(coords);
      }
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [36, 36] });
      return;
    }

    map.setView([center.lat, center.lng], 13);
  }, [center.lat, center.lng, hasUserLocation, map, places, trackedPlace]);

  return null;
}

function PharmacyMap({ center, pharmacies, selectedPharmacyId, trackedPharmacyId, hasUserLocation, onSelectPharmacy }) {
  const trackedPlace = pharmacies.find((place) => place._id === trackedPharmacyId) ?? null;
  const trackedCoords = trackedPlace ? getCoordinates(trackedPlace) : null;
  const routePoints = hasUserLocation && trackedPlace
    ? [
        [center.lat, center.lng],
        trackedCoords
      ]
    : [];

  return (
    <section className="map-panel" id="map">
      <div className="section-heading-row">
        <div>
          <p className="section-label">Map</p>
          <h2>Nearby hospitals, pharmacies, and medical shops</h2>
        </div>
      </div>

      <div className="map-legend">
        <span><i className="legend-dot legend-dot-hospital" />Red = Hospital</span>
        <span><i className="legend-dot legend-dot-pharmacy" />Blue = Pharmacy</span>
        <span><i className="legend-dot legend-dot-store" />Green = Medical Shop</span>
      </div>

      <div className="map-note">
        {hasUserLocation
          ? 'Your location is active. The map now shows all nearby medical places with color-coded markers.'
          : 'Search by location or use live mode to plot all nearby medical places on the map.'}
      </div>

      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom className="map-frame">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport center={center} places={pharmacies} trackedPlace={trackedPlace} hasUserLocation={hasUserLocation} />

        {hasUserLocation ? (
          <Marker position={[center.lat, center.lng]} icon={userLocationIcon}>
            <Popup>Your current search point</Popup>
          </Marker>
        ) : null}

        {pharmacies.map((place) => {
          const coords = getCoordinates(place);
          if (!coords) return null;
          const [lat, lng] = coords;
          const selected = place._id === selectedPharmacyId || place._id === trackedPharmacyId;

          return (
            <Marker
              key={place._id}
              position={[lat, lng]}
              icon={createPlaceIcon(place.type, selected)}
              eventHandlers={{
                click: () => onSelectPharmacy(place._id)
              }}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                {place.typeLabel}
                <br />
                {place.address}
                <br />
                {place.distanceKm ? `${place.distanceKm?.toFixed(1)} km away` : 'Distance unavailable'}
              </Popup>
            </Marker>
          );
        })}

        {routePoints.length ? <Polyline positions={routePoints} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }} /> : null}
      </MapContainer>
    </section>
  );
}

export default PharmacyMap;

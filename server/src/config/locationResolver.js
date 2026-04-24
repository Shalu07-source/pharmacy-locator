const knownLocations = new Map([
  ['new delhi', { lat: 28.6139, lng: 77.209 }],
  ['delhi', { lat: 28.6139, lng: 77.209 }],
  ['connaught place', { lat: 28.6328, lng: 77.2197 }],
  ['karol bagh', { lat: 28.6512, lng: 77.1904 }],
  ['lajpat nagar', { lat: 28.5694, lng: 77.2436 }],
  ['dwarka', { lat: 28.5924, lng: 77.0466 }],
  ['saket', { lat: 28.5288, lng: 77.2199 }],
  ['noida', { lat: 28.5709, lng: 77.3255 }],
  ['noida sector 18', { lat: 28.5709, lng: 77.3255 }],
  ['gurgaon', { lat: 28.4595, lng: 77.0266 }],
  ['gurugram', { lat: 28.4595, lng: 77.0266 }],
  ['cyber city', { lat: 28.4959, lng: 77.0877 }],
  ['mumbai', { lat: 19.076, lng: 72.8777 }],
  ['bengaluru', { lat: 12.9716, lng: 77.5946 }],
  ['bangalore', { lat: 12.9716, lng: 77.5946 }],
  ['chennai', { lat: 13.0827, lng: 80.2707 }],
  ['hyderabad', { lat: 17.385, lng: 78.4867 }],
  ['kolkata', { lat: 22.5726, lng: 88.3639 }],
  ['pune', { lat: 18.5204, lng: 73.8567 }]
]);

function normalizeLocation(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveLocationToCoordinates(input) {
  if (!input || !input.trim()) {
    return null;
  }

  const normalized = normalizeLocation(input);

  if (knownLocations.has(normalized)) {
    return knownLocations.get(normalized);
  }

  for (const [key, coordinates] of knownLocations.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coordinates;
    }
  }

  const coordinateMatch = normalized.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (!coordinateMatch) {
    return null;
  }

  const lat = Number(coordinateMatch[1]);
  const lng = Number(coordinateMatch[2]);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
}

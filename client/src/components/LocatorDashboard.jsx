import { useMemo, useState } from 'react';
import PharmacyMap from './PharmacyMap';
import PharmacyList from './PharmacyList';
import SearchPanel from './SearchPanel';
import { fetchAlternativeMedicines, fetchNearbyPharmacies, searchPharmacies } from '../services/api';

const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707
};

function LocatorDashboard() {
  const [location, setLocation] = useState('');
  const [medicine, setMedicine] = useState('');
  const [radius, setRadius] = useState(10);
  const [selectedType, setSelectedType] = useState('all');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [trackedPharmacyId, setTrackedPharmacyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Search for a place in Chennai or use live location to find nearby hospitals, pharmacies, and medical shops.');
  const [searchMeta, setSearchMeta] = useState({
    searchedMedicineFound: false,
    predictionMode: false,
    suggestions: [],
    fallbackApplied: false,
    fallbackMessage: '',
    infoMessage: '',
    radiusKm: 10,
    selectedType: 'all'
  });
  const [alternativeState, setAlternativeState] = useState({
    loading: false,
    source: null,
    items: []
  });

  const trackedPlace = useMemo(
    () => pharmacies.find((place) => place._id === trackedPharmacyId) ?? null,
    [pharmacies, trackedPharmacyId]
  );

  const nearestOpenPharmacies = useMemo(
    () =>
      [...pharmacies]
        .filter((place) => place.isOpenNow)
        .sort((left, right) => {
          const leftDistance = left.distanceKm ?? (left.distanceMeters ? left.distanceMeters / 1000 : Number.MAX_SAFE_INTEGER);
          const rightDistance = right.distanceKm ?? (right.distanceMeters ? right.distanceMeters / 1000 : Number.MAX_SAFE_INTEGER);
          return leftDistance - rightDistance;
        })
        .slice(0, 3),
    [pharmacies]
  );

  const normalizePlacesResponse = (payload, searchedMedicine) => {
    if (Array.isArray(payload)) {
      const medicineRegex = searchedMedicine ? new RegExp(searchedMedicine, 'i') : null;
      const searchedMedicineFound = medicineRegex
        ? payload.some(
            (place) =>
              (place.matchedAvailability?.length ?? 0) > 0 ||
              (place.medicines ?? []).some((item) => medicineRegex.test(item))
          )
        : false;

      return {
        pharmacies: payload,
        searchedMedicineFound,
        predictionMode: false,
        suggestions: [],
        fallbackApplied: false,
        fallbackMessage: '',
        infoMessage: searchedMedicine && !searchedMedicineFound ? 'Medicine not available nearby' : '',
        radiusKm: undefined,
        selectedType: undefined
      };
    }

    return {
      pharmacies: Array.isArray(payload?.pharmacies) ? payload.pharmacies : [],
      searchedMedicineFound: payload?.searchedMedicineFound ?? false,
      predictionMode: payload?.predictionMode ?? false,
      suggestions: payload?.suggestions ?? [],
      fallbackApplied: payload?.fallbackApplied ?? false,
      fallbackMessage: payload?.fallbackMessage ?? '',
      infoMessage: payload?.infoMessage ?? '',
      radiusKm: payload?.radiusKm,
      selectedType: payload?.selectedType
    };
  };

  const runSearch = async (options = {}) => {
    const liveMode = options.forceLiveLocation ?? useLiveLocation;
    const nextLocation = options.location ?? location;
    const nextMedicine = options.medicine ?? medicine;
    const nextRadius = options.radius ?? radius;
    const nextEmergencyMode = options.emergency ?? emergencyMode;
    const nextType = options.type ?? selectedType;
    const safeRadius = Number.isFinite(nextRadius) ? Math.min(50, Math.max(1, nextRadius)) : 10;

    if (liveMode && !hasUserLocation && !options.coords) {
      setError('Turn on location access first, then try the nearby search again.');
      return;
    }

    if (!liveMode && !String(nextLocation || '').trim()) {
      setError('Enter a city or area, or use live location mode.');
      return;
    }

    const coords = options.coords ?? userLocation;
    if (safeRadius !== radius) {
      setRadius(safeRadius);
    }

    setLoading(true);
    setHasSearched(true);
    setError('');
    setAlternativeState({ loading: false, source: null, items: [] });

    try {
      const commonParams = {
        medicine: nextMedicine,
        emergency: nextEmergencyMode,
        type: nextType
      };

      const data = liveMode
        ? await fetchNearbyPharmacies({
            lat: coords.lat,
            lng: coords.lng,
            radius: safeRadius,
            ...commonParams
          })
        : await searchPharmacies({
            location: nextLocation,
            radius: safeRadius,
            ...commonParams
          });

      const normalizedData = normalizePlacesResponse(data, nextMedicine);
      const nextPlaces = normalizedData.pharmacies;

      setPharmacies(nextPlaces);
      setSelectedPharmacyId(nextPlaces[0]?._id ?? null);
      setTrackedPharmacyId(nextPlaces[0]?._id ?? null);
      setSearchMeta({
        searchedMedicineFound: normalizedData.searchedMedicineFound,
        predictionMode: normalizedData.predictionMode,
        suggestions: normalizedData.suggestions,
        fallbackApplied: normalizedData.fallbackApplied,
        fallbackMessage: normalizedData.fallbackMessage,
        infoMessage: normalizedData.infoMessage,
        radiusKm: normalizedData.radiusKm ?? safeRadius,
        selectedType: normalizedData.selectedType ?? nextType
      });

      if (!nextPlaces.length) {
        setStatusMessage('No matching medical places were found for this search.');
      } else if (normalizedData.infoMessage) {
        setStatusMessage(normalizedData.infoMessage);
      } else if (normalizedData.fallbackApplied && normalizedData.fallbackMessage) {
        setStatusMessage(`${normalizedData.fallbackMessage}. Showing ${nextPlaces.length} nearby medical places.`);
      } else if (nextMedicine && normalizedData.searchedMedicineFound) {
        setStatusMessage(`Found ${nextMedicine} in nearby medical places.`);
      } else if (liveMode) {
        setStatusMessage(`Showing ${nextPlaces.length} nearby medical places around your live location.`);
      } else {
        setStatusMessage(`Showing ${nextPlaces.length} medical places matching ${nextLocation}.`);
      }
    } catch (requestError) {
      setPharmacies([]);
      setSelectedPharmacyId(null);
      setTrackedPharmacyId(null);
      setSearchMeta({
        searchedMedicineFound: false,
        predictionMode: false,
        suggestions: [],
        fallbackApplied: false,
        fallbackMessage: '',
        infoMessage: '',
        radiusKm: safeRadius,
        selectedType: nextType
      });
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load nearby medical places.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextCoords = {
          lat: coords.latitude,
          lng: coords.longitude
        };

        setUserLocation(nextCoords);
        setHasUserLocation(true);
        setUseLiveLocation(true);
        setLocation('');
        setIsLocating(false);
        setStatusMessage('Live location enabled. Fetching nearby hospitals, pharmacies, and medical shops now.');
        runSearch({
          forceLiveLocation: true,
          coords: nextCoords
        });
      },
      () => {
        setIsLocating(false);
        setUseLiveLocation(false);
        setError('Location access was denied or unavailable. You can still search manually by city or area.');
        setStatusMessage('Manual location search is available when geolocation permission is denied.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  const handleFindAlternatives = async (medicineName = medicine, useAsSearch = false) => {
    if (!medicineName) {
      return;
    }

    setAlternativeState((current) => ({
      ...current,
      loading: true
    }));

    try {
      const data = await fetchAlternativeMedicines(medicineName);
      setAlternativeState({
        loading: false,
        source: data.medicine,
        items: data.alternatives ?? []
      });

      if (useAsSearch) {
        setMedicine(medicineName);
        runSearch({
          medicine: medicineName
        });
      }
    } catch (requestError) {
      setAlternativeState({
        loading: false,
        source: null,
        items: []
      });
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load alternatives.');
    }
  };

  return (
    <main className="page-content">
      <section className="hero-panel">
        <div>
          <p className="section-label">Quick Access</p>
          <h2>Find the right medical place nearby, whether it is a hospital, pharmacy, or medical shop.</h2>
          <p className="section-text">{statusMessage}</p>
        </div>
        <div className="hero-stats">
          <div className="stat-tile">
            <strong>{pharmacies.length}</strong>
            <span>Places found</span>
          </div>
          <div className="stat-tile">
            <strong>{radius} km</strong>
            <span>Search radius</span>
          </div>
          <div className="stat-tile">
            <strong>{trackedPlace ? trackedPlace.typeLabel : 'All types'}</strong>
            <span>Tracked selection</span>
          </div>
        </div>
      </section>

      {nearestOpenPharmacies.length ? (
        <section className="open-now-panel">
          <div className="section-heading-row">
            <div>
              <p className="section-label">Open Now</p>
              <h2>Nearest open medical places</h2>
            </div>
          </div>
          <div className="open-now-list">
            {nearestOpenPharmacies.map((place) => (
              <button
                key={place._id}
                type="button"
                className="open-now-card"
                onClick={() => {
                  setSelectedPharmacyId(place._id);
                  if (hasUserLocation) {
                    setTrackedPharmacyId(place._id);
                  }
                }}
              >
                <strong>{place.name}</strong>
                <span>{place.distanceKm?.toFixed(1)} km</span>
                <small>
                  {place.typeLabel} • {place.area}, {place.city}
                </small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <SearchPanel
        location={location}
        medicine={medicine}
        radius={radius}
        selectedType={selectedType}
        emergencyMode={emergencyMode}
        useLiveLocation={useLiveLocation}
        isLocating={isLocating}
        onLocationChange={(value) => {
          setLocation(value);
          setUseLiveLocation(false);
        }}
        onMedicineChange={setMedicine}
        onRadiusChange={setRadius}
        onTypeChange={(nextType) => {
          setSelectedType(nextType);
          if (hasSearched) {
            runSearch({ type: nextType });
          }
        }}
        onSearch={() => runSearch()}
        onUseMyLocation={handleUseMyLocation}
        onEmergencyToggle={() => {
          const nextValue = !emergencyMode;
          setEmergencyMode(nextValue);
          if (hasSearched) {
            runSearch({ emergency: nextValue });
          }
        }}
      />

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="content-layout">
        <PharmacyMap
          center={userLocation}
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
          trackedPharmacyId={trackedPharmacyId}
          hasUserLocation={hasUserLocation}
          onSelectPharmacy={setSelectedPharmacyId}
        />

        <PharmacyList
          loading={loading}
          hasSearched={hasSearched}
          pharmacies={pharmacies}
          medicine={medicine}
          hasUserLocation={hasUserLocation}
          selectedPharmacyId={selectedPharmacyId}
          trackedPharmacyId={trackedPharmacyId}
          alternativeState={alternativeState}
          predictionMode={searchMeta.predictionMode}
          searchedMedicineFound={searchMeta.searchedMedicineFound}
          suggestions={searchMeta.suggestions}
          fallbackMessage={searchMeta.fallbackMessage}
          nearestOpenPharmacies={nearestOpenPharmacies}
          onSelectPharmacy={setSelectedPharmacyId}
          onTrackPharmacy={setTrackedPharmacyId}
          onFindAlternatives={handleFindAlternatives}
        />
      </div>
    </main>
  );
}

export default LocatorDashboard;

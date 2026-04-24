function formatDistance(place) {
  if (typeof place.distanceKm === 'number') {
    return `${place.distanceKm.toFixed(1)} km`;
  }

  if (typeof place.distanceMeters === 'number') {
    return `${(place.distanceMeters / 1000).toFixed(1)} km`;
  }

  return 'Distance unavailable';
}

function PharmacyList({
  loading,
  hasSearched,
  pharmacies,
  medicine,
  hasUserLocation,
  selectedPharmacyId,
  trackedPharmacyId,
  alternativeState,
  predictionMode,
  searchedMedicineFound,
  suggestions,
  fallbackMessage,
  nearestOpenPharmacies,
  onSelectPharmacy,
  onTrackPharmacy,
  onFindAlternatives
}) {
  const showAlternativePrompt = hasSearched && medicine && !searchedMedicineFound;
  const displayedSuggestions = alternativeState.items.length ? alternativeState.items : suggestions;

  return (
    <section className="results-panel" id="results">
      <div className="section-heading-row">
        <div>
          <p className="section-label">Nearby Results</p>
          <h2>Hospitals, pharmacies, and medical shops</h2>
        </div>
      </div>

      {loading ? (
        <div className="state-card">
          <strong>Loading nearby places...</strong>
          <p>We are checking medical places, distances, and medicine availability.</p>
        </div>
      ) : null}

      {!loading && !hasSearched ? (
        <div className="state-card">
          <strong>Start with a location search</strong>
          <p>Enter a place in Chennai or use your live location to load all nearby medical-related places.</p>
        </div>
      ) : null}
      {medicine && pharmacies.length > 0 && (
        <div className="info-card">
        <p>Showing all nearby places. Medicine availability is checked per location.</p>
        </div>
      )}
      
      {!loading && hasSearched && !pharmacies.length === 0 ? (
        <div className="state-card">
          <strong>No data returned from server</strong>
          <p>Check backend API or database if this persists.</p>
          <p>The app will widen the search radius automatically or fall back to Chennai-wide results when available.</p>
        </div>
      ) : null}

      {!loading && fallbackMessage ? (
        <div className="info-card">
          <strong>No nearby results, showing wider area</strong>
          <p>{fallbackMessage}</p>
        </div>
      ) : null}

      {showAlternativePrompt ? (
        <div className="info-card">
          <div>
            <strong>{predictionMode ? 'No confirmed stock nearby' : 'Medicine not found nearby'}</strong>
            <p>
              {predictionMode
                ? 'Some places show predicted availability. You can also review suggested alternatives from the same category.'
                : 'Medicine not available nearby. Showing nearby pharmacies.'}
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={onFindAlternatives} disabled={alternativeState.loading}>
            {alternativeState.loading ? 'Finding...' : 'Alternative Medicines'}
          </button>
        </div>
      ) : null}

      {displayedSuggestions.length ? (
        <div className="alternative-panel">
          <div className="alternative-header">
            <strong>Suggested Alternatives</strong>
            <p>
              Based on {alternativeState.source?.name || medicine} in{' '}
              {alternativeState.source?.category || displayedSuggestions[0]?.sourceCategory || 'a similar category'}.
            </p>
          </div>
          <div className="alternative-chips">
            {displayedSuggestions.map((item) => (
              <button
                key={item._id}
                type="button"
                className="alternative-chip"
                onClick={() => onFindAlternatives(item.name, true)}
              >
                <span>{item.name}</span>
                <small>{item.category}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && nearestOpenPharmacies.length ? (
        <div className="info-card info-card-open">
          <strong>Nearest open places</strong>
          <p>{nearestOpenPharmacies.map((place) => `${place.name} (${formatDistance(place)})`).join(' | ')}</p>
        </div>
      ) : null}

      <div className="pharmacy-grid">
        {pharmacies.map((place) => {
          const matchedMedicine = medicine ? place.matchedAvailability?.[0] : null;
          const normalize = (str) => str?.toLowerCase().trim();
          const listedMedicineMatch = medicine ? (place.medicines ?? []).some((item) =>normalize(item).includes(normalize(medicine)) ) : false;
          const isMedicineAvailable = Boolean(matchedMedicine) || listedMedicineMatch ;

          return (
            <article
              key={place._id}
              className={`pharmacy-card ${selectedPharmacyId === place._id ? 'selected' : ''}`}
              onClick={() => onSelectPharmacy(place._id)}
            >
              <div className="card-head">
                <div>
                  <h3>{place.name}</h3>
                  <p className="card-subtitle">{place.typeLabel}</p>
                </div>
                <span className="distance-pill">{formatDistance(place)}</span>
              </div>

              <p className="card-address">{place.address}</p>

              <div className="card-tags">
                <span className={`tag ${place.type === 'hospital' ? 'tag-hospital' : place.type === 'medical_store' ? 'tag-store' : 'tag-pharmacy'}`}>
                  {place.typeLabel}
                </span>
                <span className="tag">{place.isOpenNow ? 'Open now' : 'Closed now'}</span>
              </div>

              <div className="medicine-box">
                <strong>{medicine ? 'Medicine availability' : 'Place details'}</strong>
                {medicine ? (
                  <>
                    <p className={`availability-status ${isMedicineAvailable ? 'availability-status-ok' : 'availability-status-no'}`}>
                      {isMedicineAvailable ? 'Available' : 'Not Available'}
                    </p>
                    <p>
                      {isMedicineAvailable
                        ? `Matched for ${matchedMedicine?.medicine.name ?? medicine}.`
                        : `${medicine} was not found in this nearby place.`}
                    </p>
                  </>
                ) : (
                  <p>{place.open24Hours ? 'Open all day' : place.workingHours}</p>
                )}
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={!hasUserLocation}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectPharmacy(place._id);
                    onTrackPharmacy(place._id);
                  }}
                >
                  {!hasUserLocation ? 'Use My Location to Track' : trackedPharmacyId === place._id ? 'Tracking' : 'Track Route'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectPharmacy(place._id);
                  }}
                >
                  View on Map
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PharmacyList;

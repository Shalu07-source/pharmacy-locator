const typeOptions = [
  { value: 'all', label: 'All' },
  { value: 'hospital', label: 'Hospitals' },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'medical_store', label: 'Medical Shops' }
];

function SearchPanel({
  location,
  medicine,
  radius,
  selectedType,
  emergencyMode,
  useLiveLocation,
  isLocating,
  onLocationChange,
  onMedicineChange,
  onRadiusChange,
  onTypeChange,
  onSearch,
  onUseMyLocation,
  onEmergencyToggle
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if(!useLiveLocation && !location.trim()){
      alert("Please enter a location or use live location");
      return;
    }
    onSearch();
  };

  return (
    <section className="search-panel" id="search">
      <div className="section-copy">
        <p className="section-label">Find Medical Places</p>
        <h2>Search hospitals, pharmacies, and medical shops in Chennai with live nearby results.</h2>
        <p className="section-text">
          Use manual search or live location mode, then narrow the results with place-type filters.
        </p>
      </div>

      <div className="type-filter-row" role="tablist" aria-label="Place type filters">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`type-filter-chip ${selectedType === option.value ? 'type-filter-chip-active' : ''}`}
            onClick={() => onTypeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="location-input">
          <span>Location</span>
          <input
            id="location-input"
            type="text"
            placeholder="Chennai, Ambattur, Velachery"
            value={location}
            onChange={(event) => {const value = event.target.value; onLocationChange(value);}}
            disabled={useLiveLocation}
            onBlur={() => {
                if (location && location.length < 3) {
                alert("Enter a valid location");
                }
            }}
          />
        </label>

        <label className="field-group" htmlFor="medicine-input">
          <span>Medicine</span>
          <input
            id="medicine-input"
            type="text"
            placeholder="Paracetamol, Dolo 650, Cetirizine"
            value={medicine}
            onChange={(event) => onMedicineChange(event.target.value)}
          />
        </label>

        <label className="field-group" htmlFor="radius-input">
          <span>Radius (km)</span>
          <input
            id="radius-input"
            type="number"
            min="1"
            max="50"
            step="1"
            value={radius}
            onChange={(event) => {const value = Number(event.target.value); onRadiusChange(value || 5);}}
          />
        </label>

        <div className="search-actions">
          <button type="submit" className="primary-button" disabled = {! useLiveLocation && !location.trim()}>
            Search Nearby
          </button>
          <button type="button" className="secondary-button" onClick={onUseMyLocation} disabled={isLocating}>
            {isLocating ? 'Detecting location...' : 'Use My Location'}
          </button>
          <button
            type="button"
            className={`secondary-button ${emergencyMode ? 'secondary-button-active' : ''}`}
            onClick={onEmergencyToggle}
          >
            {emergencyMode ? 'Emergency On' : 'Emergency Mode'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SearchPanel;

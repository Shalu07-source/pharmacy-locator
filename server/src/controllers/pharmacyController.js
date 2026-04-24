import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import Pharmacy from '../models/Pharmacy.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const APP_TIME_ZONE = 'Asia/Kolkata';
const DEFAULT_RADIUS_KM = 10;
const WIDER_RADIUS_KM = 25;
const ALLOWED_TYPES = new Set(['hospital', 'pharmacy', 'medical_store']);

function normalizeTypeFilter(typeValue) {
  const normalized = String(typeValue || '')
    .trim()
    .toLowerCase();

  if (!normalized || normalized === 'all') {
    return null;
  }

  return ALLOWED_TYPES.has(normalized) ? normalized : null;
}

function formatTypeLabel(type) {
  if (type === 'medical_store') {
    return 'Medical Shop';
  }

  if (type === 'hospital') {
    return 'Hospital';
  }

  return 'Pharmacy';
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(from, to) {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function parseTimeToMinutes(value) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2] ?? '0');
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM') {
    hours += 12;
  }

  return hours * 60 + minutes;
}

function isPharmacyOpenNow(pharmacy) {
  if (pharmacy.open24Hours || pharmacy.workingHours === 'Open all day') {
    return true;
  }

  if (!pharmacy.workingHours?.includes('-')) {
    return false;
  }

  const [start, end] = pharmacy.workingHours.split('-').map((value) => value.trim());
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: APP_TIME_ZONE
  }).formatToParts(new Date());

  const currentHour = Number(timeParts.find((part) => part.type === 'hour')?.value ?? '0');
  const currentMinute = Number(timeParts.find((part) => part.type === 'minute')?.value ?? '0');
  const currentMinutes = currentHour * 60 + currentMinute;

  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function normalizeLocationText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[,\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getLocationMatchScore(locationQuery, pharmacy) {
  const normalizedQuery = normalizeLocationText(locationQuery);
  const candidates = [pharmacy.area, pharmacy.city, pharmacy.address].map(normalizeLocationText).filter(Boolean);

  let bestScore = 0;

  for (const candidate of candidates) {
    if (candidate === normalizedQuery) {
      bestScore = Math.max(bestScore, 1);
      continue;
    }

    if (candidate.startsWith(normalizedQuery) || normalizedQuery.startsWith(candidate)) {
      bestScore = Math.max(bestScore, 0.88);
      continue;
    }

    if (candidate.includes(normalizedQuery) || normalizedQuery.includes(candidate)) {
      bestScore = Math.max(bestScore, 0.76);
      continue;
    }

    const queryTokens = normalizedQuery.split(' ').filter(Boolean);
    const overlap = queryTokens.filter((token) => candidate.includes(token)).length;

    if (overlap) {
      bestScore = Math.max(bestScore, 0.42 + overlap / queryTokens.length / 2);
    }
  }

  return Number(bestScore.toFixed(2));
}

function getHoursSince(dateValue) {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return 999;
  }
  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
}

function buildAvailabilityPrediction(entry, pharmacy) {
  const hoursSinceUpdate = getHoursSince(entry.lastUpdated);
  let score = 0.2;

  if (entry.quantity >= 20) {
    score += 0.34;
  } else if (entry.quantity >= 8) {
    score += 0.23;
  } else if (entry.quantity > 0) {
    score += 0.12;
  } else {
    score -= 0.1;
  }

  if (entry.inStock) {
    score += 0.16;
  }

  if (hoursSinceUpdate <= 24) {
    score += 0.12;
  } else if (hoursSinceUpdate <= 72) {
    score += 0.06;
  }

  if (pharmacy.isOpenNow) {
    score += 0.06;
  }

  const normalizedScore = Math.min(0.97, Math.max(0.05, Number(score.toFixed(2))));

  return {
    score: normalizedScore,
    confidenceLabel:
      normalizedScore >= 0.75 ? 'High confidence' : normalizedScore >= 0.5 ? 'Moderate confidence' : 'Low confidence',
    predictionText:
      normalizedScore >= 0.75
        ? 'Likely available right now.'
        : normalizedScore >= 0.5
          ? 'Possibly available. Confirm before visiting.'
          : 'Low chance of immediate availability.',
    updatedHoursAgo: Math.round(hoursSinceUpdate)
  };
}

function buildStockLookupStage() {
  return {
    $lookup: {
      from: 'pharmacystocks',
      let: { pharmacyId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$pharmacy', '$$pharmacyId']
            }
          }
        },
        {
          $lookup: {
            from: 'medicines',
            localField: 'medicine',
            foreignField: '_id',
            as: 'medicine'
          }
        },
        {
          $unwind: '$medicine'
        },
        {
          $project: {
            _id: 1,
            quantity: 1,
            price: 1,
            inStock: 1,
            lastUpdated: 1,
            medicine: {
              _id: '$medicine._id',
              name: '$medicine.name',
              category: '$medicine.category',
              composition: '$medicine.composition',
              alternatives: '$medicine.alternatives',
              dosageForm: '$medicine.dosageForm',
              strength: '$medicine.strength'
            }
          }
        }
      ],
      as: 'stock'
    }
  };
}

function buildCommonAddFieldsStage(medicineQuery) {
  const escapedMedicine = medicineQuery ? escapeRegex(medicineQuery) : '';

  return {
    $addFields: {
      availableMedicines: {
        $map: {
          input: {
            $slice: [
              {
                $filter: {
                  input: '$stock',
                  as: 'entry',
                  cond: {
                    $and: [{ $eq: ['$$entry.inStock', true] }, { $gt: ['$$entry.quantity', 0] }]
                  }
                }
              },
              4
            ]
          },
          as: 'item',
          in: '$$item.medicine.name'
        }
      },
      matchedAvailability: medicineQuery
        ? {
            $filter: {
              input: '$stock',
              as: 'entry',
              cond: {
                $and: [
                  {
                    $or: [
                      {
                        $regexMatch: {
                          input: '$$entry.medicine.name',
                          regex: escapedMedicine,
                          options: 'i'
                        }
                      },
                      {
                        $regexMatch: {
                          input: '$$entry.medicine.category',
                          regex: escapedMedicine,
                          options: 'i'
                        }
                      }
                    ]
                  },
                  { $eq: ['$$entry.inStock', true] },
                  { $gt: ['$$entry.quantity', 0] }
                ]
              }
            }
          }
        : [],
      exactMedicineEntries: medicineQuery
        ? {
            $filter: {
              input: '$stock',
              as: 'entry',
              cond: {
                $or: [
                  {
                    $regexMatch: {
                      input: '$$entry.medicine.name',
                      regex: escapedMedicine,
                      options: 'i'
                    }
                  },
                  {
                    $regexMatch: {
                      input: '$$entry.medicine.category',
                      regex: escapedMedicine,
                      options: 'i'
                    }
                  },
                  {
                    $regexMatch: {
                      input: '$$entry.medicine.composition',
                      regex: escapedMedicine,
                      options: 'i'
                    }
                  }
                ]
              }
            }
          }
        : []
    }
  };
}

async function loadPharmaciesByLocation({ locationQuery, medicineQuery, pharmacyQuery, placeType }) {
  const locationRegex = new RegExp(escapeRegex(locationQuery), 'i');
  const match = {
    $or: [{ city: locationRegex }, { area: locationRegex }, { address: locationRegex }]
  };

  if (pharmacyQuery) {
    match.name = new RegExp(escapeRegex(pharmacyQuery), 'i');
  }

  if (placeType) {
    match.type = placeType;
  }

  return Pharmacy.aggregate([
    { $match: match },
    buildStockLookupStage(),
    buildCommonAddFieldsStage(medicineQuery),
    { $sort: { city: 1, area: 1, name: 1 } }
  ]);
}

async function loadAllChennaiPlaces({ medicineQuery, placeType }) {
  const match = {
    city: /chennai/i
  };

  if (placeType) {
    match.type = placeType;
  }

  return Pharmacy.aggregate([
    { $match: match },
    buildStockLookupStage(),
    buildCommonAddFieldsStage(medicineQuery),
    { $sort: { area: 1, name: 1 } }
  ]);
}

async function loadNearbyPharmacies({ latitude, longitude, radiusKm, medicineQuery, placeType }) {
  const match = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000
      }
    }
  };

  if (placeType) {
    match.type = placeType;
  }

  let nearbyDocs = [];

  try {
    nearbyDocs = await Pharmacy.find(match).lean();
  } catch (err) {
    console.log("Geo query failed, fallback to normal find");

    nearbyDocs = await Pharmacy.find({})
      .limit(50)
      .lean();
  }

  if (!nearbyDocs.length) return [];

  const pharmacyIds = nearbyDocs.map(p => p._id);

  const enriched = await Pharmacy.aggregate([
    {
      $match: { _id: { $in: pharmacyIds } }
    },
    buildStockLookupStage(),
    buildCommonAddFieldsStage(medicineQuery)
  ]);

  const enrichedMap = new Map(enriched.map(p => [String(p._id), p]));

  return nearbyDocs.map(pharmacy => {
    const detailed = enrichedMap.get(String(pharmacy._id));

    if (!detailed) return null;

    const distanceMeters = calculateDistanceMeters(
      { latitude, longitude },
      {
        latitude: pharmacy.latitude ?? pharmacy.location?.coordinates?.[1],
        longitude: pharmacy.longitude ?? pharmacy.location?.coordinates?.[0]
      }
    );

    return {
      ...detailed,
      distanceMeters,
      distanceKm: Number((distanceMeters / 1000).toFixed(2))
    };
  }).filter(Boolean);
}

function enrichPharmacies(pharmacies, searchCenter = null) {
  return pharmacies.map((pharmacy) => {
    const latitude = pharmacy.latitude ?? pharmacy.location?.coordinates?.[1];
    const longitude = pharmacy.longitude ?? pharmacy.location?.coordinates?.[0];
    const computedDistanceMeters =
      searchCenter && typeof pharmacy.distanceMeters !== 'number'
        ? calculateDistanceMeters(searchCenter, {
            latitude,
            longitude
          })
        : pharmacy.distanceMeters;

    const normalizedPharmacy = {
      ...pharmacy,
      type: pharmacy.type || 'pharmacy',
      latitude,
      longitude,
      distanceMeters: computedDistanceMeters,
      distanceKm:
        typeof pharmacy.distanceKm === 'number'
          ? pharmacy.distanceKm
          : typeof computedDistanceMeters === 'number'
            ? Number((computedDistanceMeters / 1000).toFixed(2))
            : undefined,
      isOpenNow: isPharmacyOpenNow(pharmacy),
      typeLabel: formatTypeLabel(pharmacy.type || 'pharmacy')
    };
    
    console.log("TYPE CHECK:", pharmacy.name, pharmacy.type);

    return {
      ...normalizedPharmacy,
      matchedAvailability: (pharmacy.matchedAvailability ?? []).map((entry) => ({
        ...entry,
        prediction: buildAvailabilityPrediction(entry, normalizedPharmacy)
      })),
      predictedAvailability: (pharmacy.exactMedicineEntries ?? [])
        .map((entry) => ({
          ...entry,
          prediction: buildAvailabilityPrediction(entry, normalizedPharmacy)
        }))
        .sort((left, right) => right.prediction.score - left.prediction.score)
    };
  });
}

function applyEmergencyMode(pharmacies, emergencyMode) {
  const sorted = [...pharmacies].sort((left, right) => {
    if (emergencyMode) {
      if (left.isOpenNow !== right.isOpenNow) {
        return left.isOpenNow ? -1 : 1;
      }

      if (left.open24Hours !== right.open24Hours) {
        return left.open24Hours ? -1 : 1;
      }

      if (left.emergencyService !== right.emergencyService) {
        return left.emergencyService ? -1 : 1;
      }
    }

    return (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (right.distanceMeters ?? Number.MAX_SAFE_INTEGER);
  });

  return emergencyMode ? sorted.filter((pharmacy) => pharmacy.isOpenNow) : sorted;
}

async function buildAlternativeSuggestions(medicineQuery) {
  if (!medicineQuery) {
    return [];
  }

  const regex = new RegExp(escapeRegex(medicineQuery), 'i');
  const sourceMedicine = await Medicine.findOne({
    $or: [{ name: regex }, { category: regex }, { composition: regex }, { alternatives: regex }]
  }).lean();

  if (!sourceMedicine) {
    return [];
  }

  const suggestions = await Medicine.find({
    _id: { $ne: sourceMedicine._id },
    $or: [
      { name: { $in: sourceMedicine.alternatives } },
      { category: sourceMedicine.category },
      { composition: sourceMedicine.composition }
    ]
  })
    .limit(6)
    .lean();

  return suggestions.map((suggestion) => ({
    ...suggestion,
    sourceCategory: sourceMedicine.category
  }));
}

async function buildPharmacyResponse(pharmacies, medicineQuery, meta = {}) {
  const suggestions = await buildAlternativeSuggestions(medicineQuery);

  if (!medicineQuery) {
    return {
      pharmacies,
      searchedMedicineFound: false,
      predictionMode: false,
      suggestions: [],
      ...meta
    };
  }

  const annotatedPharmacies = pharmacies.map((pharmacy) => ({
    ...pharmacy,
    predictionTopPick: pharmacy.predictedAvailability?.[0] ?? null
  }));
  const searchedMedicineFound = annotatedPharmacies.some((pharmacy) => pharmacy.matchedAvailability?.length);
  const predictionMode = !searchedMedicineFound && annotatedPharmacies.some((pharmacy) => pharmacy.predictionTopPick);

  return {
    pharmacies: annotatedPharmacies,
    searchedMedicineFound,
    predictionMode,
    suggestions: searchedMedicineFound ? [] : suggestions,
    infoMessage: !searchedMedicineFound && annotatedPharmacies.length ? 'Medicine not available nearby, showing nearby pharmacies' : '',
    ...meta
  };
}

export async function searchPharmacies(req, res) {
  try {
    const locationQuery = String(req.query.location || '').trim();
    const medicineQuery = String(req.query.medicine || '').trim();
    const pharmacyQuery = String(req.query.query || '').trim();
    const emergencyMode = req.query.emergency === 'true';
    const placeType = normalizeTypeFilter(req.query.type);

    if (!locationQuery) {
      return res.status(400).json({ message: 'Location query is required' });
    }

    let fallbackMessage = '';

    let pharmacies = enrichPharmacies(
      await loadPharmaciesByLocation({
        locationQuery,
        medicineQuery,
        pharmacyQuery,
        placeType
      })
    );

    pharmacies = pharmacies
      .map((pharmacy) => ({
        ...pharmacy,
        locationMatchScore: getLocationMatchScore(locationQuery, pharmacy)
      }))
      .filter((pharmacy) => pharmacy.locationMatchScore >= 0.3)
      .sort((left, right) => {
        if (right.locationMatchScore !== left.locationMatchScore) {
          return right.locationMatchScore - left.locationMatchScore;
        }
        return left.name.localeCompare(right.name);
      });

    if (!pharmacies.length) {
      const broadMatch = enrichPharmacies(
        await Pharmacy.aggregate([
          ...(placeType ? [{ $match: { type: placeType } }] : []),
          buildStockLookupStage(),
          buildCommonAddFieldsStage(medicineQuery)
        ])
      )
        .map((pharmacy) => ({
          ...pharmacy,
          locationMatchScore: getLocationMatchScore(locationQuery, pharmacy)
        }))
        .filter((pharmacy) => pharmacy.locationMatchScore >= 0.42)
        .sort((left, right) => {
          if (right.locationMatchScore !== left.locationMatchScore) {
            return right.locationMatchScore - left.locationMatchScore;
          }
          return left.name.localeCompare(right.name);
        });

      pharmacies = broadMatch;
    }
     if (!pharmacies.length) {
       pharmacies = await loadAllChennaiPlaces({
        medicineQuery,
        placeType
        });
     }
    if (!pharmacies.length) {
      pharmacies = enrichPharmacies(
        await loadAllChennaiPlaces({
          medicineQuery,
          placeType
        })
      );

      if (pharmacies.length) {
        fallbackMessage = 'No nearby results, showing wider area';
      }
    }

    const visiblePharmacies = applyEmergencyMode(pharmacies, emergencyMode);
    console.log("Pharmacies found:", visiblePharmacies.length);
    return res.json(
      await buildPharmacyResponse(visiblePharmacies, medicineQuery, {
        selectedType: placeType ?? 'all',
        fallbackApplied: Boolean(fallbackMessage),
        fallbackMessage
      })
    );
  } catch (error) {
    console.error('Failed to search pharmacies by location', error);
    return res.status(500).json({ message: 'Server error while searching pharmacies' });
  }
}

export async function getNearbyPharmacies(req, res) {
  try {
    const lat = Number(String(req.query.lat || '').trim());
    const lng = Number(String(req.query.lng || '').trim());
    const radiusKm = Number(String(req.query.radius || String(DEFAULT_RADIUS_KM)).trim());
    const medicineQuery = String(req.query.medicine || '').trim();
    const emergencyMode = req.query.emergency === 'true';
    const placeType = normalizeTypeFilter(req.query.type);

    if ([lat, lng, radiusKm].some((value) => Number.isNaN(value))) {
      return res.status(400).json({ message: 'lat, lng and radius are required numbers' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Latitude or longitude out of range' });
    }

    if (radiusKm <= 0 || radiusKm > 50) {
      return res.status(400).json({ message: 'Radius must be between 1 and 50 kilometers' });
    }

    const searchCenter = {
      latitude: lat,
      longitude: lng
    };

    let usedRadiusKm = radiusKm;
    let fallbackMessage = '';

    let pharmacies = enrichPharmacies(
      await loadNearbyPharmacies({
        latitude: lat,
        longitude: lng,
        radiusKm: usedRadiusKm,
        medicineQuery,
        placeType
      }),
      searchCenter
    );

    if (!pharmacies.length) {
      usedRadiusKm = Math.min(Math.max(radiusKm * 2, WIDER_RADIUS_KM), 50);
      pharmacies = enrichPharmacies(
        await loadNearbyPharmacies({
          latitude: lat,
          longitude: lng,
          radiusKm: usedRadiusKm,
          medicineQuery,
          placeType
        }),
        searchCenter
      );

      if (pharmacies.length) {
        fallbackMessage = 'No nearby results, showing wider area';
      }
    }

    if (!pharmacies.length) {
      const nearestCityPharmacy = await Pharmacy.findOne({
        ...(placeType ? { type: placeType } : {}),
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }
        }
      }).lean();

      if (nearestCityPharmacy?.city) {
        pharmacies = enrichPharmacies(
          await loadPharmaciesByLocation({
            locationQuery: nearestCityPharmacy.city,
            medicineQuery,
            pharmacyQuery: '',
            placeType
          }),
          searchCenter
        );
        fallbackMessage = 'No nearby results, showing wider area';
      }
    }

    if (!pharmacies.length) {
      pharmacies = enrichPharmacies(
        await loadAllChennaiPlaces({
          medicineQuery,
          placeType
        }),
        searchCenter
      );

      if (pharmacies.length) {
        fallbackMessage = 'No nearby results, showing wider area';
      }
    }

    const visiblePharmacies = applyEmergencyMode(pharmacies, emergencyMode);
    console.log("Nearby pharmacies found:", visiblePharmacies.length);
    return res.json(
      await buildPharmacyResponse(visiblePharmacies, medicineQuery, {
        radiusKm: usedRadiusKm,
        fallbackApplied: Boolean(fallbackMessage),
        fallbackMessage,
        selectedType: placeType ?? 'all'
      })
    );
  } catch (error) {
    console.error('Failed to fetch nearby pharmacies', error);
    return res.status(500).json({ message: 'Server error while fetching nearby pharmacies' });
  }
}

export async function getAlternativeMedicines(req, res) {
  try {
    const medicineQuery = String(req.query.medicine || '').trim();

    if (!medicineQuery) {
      return res.status(400).json({ message: 'medicine query is required' });
    }

    const regex = new RegExp(escapeRegex(medicineQuery), 'i');
    const medicine = await Medicine.findOne({
      $or: [{ name: regex }, { category: regex }, { composition: regex }]
    }).lean();

    if (!medicine) {
      return res.json({ medicine: null, alternatives: [] });
    }

    const alternatives = await Medicine.find({
      _id: { $ne: medicine._id },
      $or: [
        { name: { $in: medicine.alternatives } },
        { category: medicine.category },
        { composition: medicine.composition }
      ]
    })
      .limit(6)
      .lean();

    return res.json({
      medicine: {
        name: medicine.name,
        category: medicine.category,
        composition: medicine.composition
      },
      alternatives
    });
  } catch (error) {
    console.error('Failed to fetch medicine alternatives', error);
    return res.status(500).json({ message: 'Server error while fetching alternatives' });
  }
}

export async function getPharmacyById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid pharmacy id' });
    }

    const pharmacy = await Pharmacy.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id)
        }
      },
      buildStockLookupStage()
    ]);

    if (!pharmacy.length) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    return res.json(pharmacy[0]);
  } catch (error) {
    console.error('Failed to fetch pharmacy', error);
    return res.status(500).json({ message: 'Server error while fetching pharmacy' });
  }
}



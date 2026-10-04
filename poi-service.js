/**
 * TripCraft — Real POI Service (OpenStreetMap Overpass API)
 * Fetches real attractions, malls, heritage sites, parks, and museums
 * for any destination, then builds a day-by-day itinerary skeleton.
 *
 * Also provides swap-alternative helpers used by app.js for the
 * "Swap Activity" feature in the Customize tab.
 *
 * No API key required. Data © OpenStreetMap contributors (ODbL).
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================
  const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
  const CACHE_TTL = 60 * 60 * 1000;   // 1 hour
  const cache = new Map();            // key → { data, timestamp }

  // =========================================================================
  // Category rules — map OSM categories to TripCraft slots & metadata
  // =========================================================================
  const CATEGORY_RULES = {
    museum:        { slot: 'afternoon', icon: '🏛️', cost: 15, indoor: true,  family: true  },
    attraction:    { slot: 'morning',   icon: '🎡', cost: 25, indoor: false, family: true  },
    theme_park:    { slot: 'afternoon', icon: '🎢', cost: 80, indoor: false, family: true  },
    heritage:      { slot: 'morning',   icon: '🏰', cost: 8,  indoor: false, family: true  },
    castle:        { slot: 'morning',   icon: '🏯', cost: 12, indoor: false, family: true  },
    fort:          { slot: 'morning',   icon: '🏰', cost: 8,  indoor: false, family: true  },
    monument:      { slot: 'morning',   icon: '🗿', cost: 5,  indoor: false, family: true  },
    ruins:         { slot: 'morning',   icon: '🏛️', cost: 6,  indoor: false, family: false },
    religious:     { slot: 'morning',   icon: '🕌', cost: 0,  indoor: false, family: true  },
    shopping_mall: { slot: 'afternoon', icon: '🛍️', cost: 0,  indoor: true,  family: true  },
    park:          { slot: 'evening',   icon: '🌳', cost: 0,  indoor: false, family: true  },
    water_park:    { slot: 'afternoon', icon: '💦', cost: 30, indoor: false, family: true  },
    cinema:        { slot: 'evening',   icon: '🎬', cost: 12, indoor: true,  family: true  },
    theatre:       { slot: 'evening',   icon: '🎭', cost: 20, indoor: true,  family: false },
    viewpoint:     { slot: 'evening',   icon: '🌇', cost: 5,  indoor: false, family: true  },
    zoo:           { slot: 'morning',   icon: '🦁', cost: 15, indoor: false, family: true  },
    aquarium:      { slot: 'afternoon', icon: '🐠', cost: 20, indoor: true,  family: true  },
    art_gallery:   { slot: 'afternoon', icon: '🖼️', cost: 12, indoor: true,  family: false },
    market:        { slot: 'lunch',     icon: '🥘', cost: 10, indoor: false, family: true  },
    restaurant:    { slot: 'lunch',     icon: '🍽️', cost: 15, indoor: true,  family: true  }
  };

  // =========================================================================
  // 1. Fetch POIs from Overpass API
  // =========================================================================
  async function fetchPOIs(lat, lng, radiusMeters = 20000) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return [];

    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"museum|attraction|theme_park|viewpoint|zoo|aquarium|art_gallery"](around:${radiusMeters},${lat},${lng});
        node["historic"~"castle|fort|monument|ruins|archaeological_site"](around:${radiusMeters},${lat},${lng});
        node["shop"="mall"](around:${radiusMeters},${lat},${lng});
        node["leisure"~"park|water_park"](around:${radiusMeters},${lat},${lng});
        node["amenity"~"cinema|theatre|marketplace|place_of_worship"](around:${radiusMeters},${lat},${lng});
      );
      out body 150;
    `;

    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const pois = (data.elements || [])
        .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
        .map(el => normalizePOI(el))
        .filter(Boolean);

      // Deduplicate by name (case-insensitive)
      const seen = new Set();
      const unique = pois.filter(p => {
        const k = p.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      cache.set(key, { data: unique, timestamp: Date.now() });
      return unique;

    } catch (err) {
      console.warn('[poi-service] Overpass API failed:', err.message);
      return [];
    }
  }

  // =========================================================================
  // 2. Normalize raw OSM node → TripCraft POI object
  // =========================================================================
  function normalizePOI(el) {
    const tags = el.tags || {};
    const category = classifyCategory(tags);
    if (!category) return null;

    const rules = CATEGORY_RULES[category];
    const name = tags.name || tags['name:en'];

    return {
      id: `osm-${el.id}`,
      name,
      category,
      icon: rules.icon,
      slot: rules.slot,
      cost: rules.cost,
      indoor: rules.indoor,
      familyFriendly: rules.family,
      lat: el.lat,
      lng: el.lon,
      address: buildAddress(tags),
      openingHours: tags.opening_hours || null,
      website: tags.website || null
    };
  }

  function classifyCategory(tags) {
    if (tags.tourism === 'museum')       return 'museum';
    if (tags.tourism === 'theme_park')   return 'theme_park';
    if (tags.tourism === 'attraction')   return 'attraction';
    if (tags.tourism === 'zoo')          return 'zoo';
    if (tags.tourism === 'aquarium')     return 'aquarium';
    if (tags.tourism === 'art_gallery')  return 'art_gallery';
    if (tags.tourism === 'viewpoint')    return 'viewpoint';
    if (tags.historic === 'castle')      return 'castle';
    if (tags.historic === 'fort')        return 'fort';
    if (tags.historic === 'monument')    return 'monument';
    if (tags.historic === 'ruins')       return 'ruins';
    if (tags.historic)                   return 'heritage';
    if (tags.shop === 'mall')            return 'shopping_mall';
    if (tags.leisure === 'park')         return 'park';
    if (tags.leisure === 'water_park')   return 'water_park';
    if (tags.amenity === 'cinema')       return 'cinema';
    if (tags.amenity === 'theatre')      return 'theatre';
    if (tags.amenity === 'marketplace')  return 'market';
    if (tags.amenity === 'place_of_worship') return 'religious';
    return null;
  }

  function buildAddress(tags) {
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city']
    ].filter(Boolean);
    return parts.join(' ') || '';
  }

  // =========================================================================
  // 3. Haversine distance (km)
  // =========================================================================
  function distanceKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // =========================================================================
  // 4. Cluster POIs greedily by proximity — one cluster per day
  // =========================================================================
  function clusterPOIs(pois, days) {
    const clusters = Array.from({ length: days }, () => []);
    const used = new Set();

    // Prioritize by cost (paid attractions tend to be more "notable")
    const sorted = [...pois].sort((a, b) => b.cost - a.cost);

    for (let d = 0; d < days; d++) {
      const seed = sorted.find(p => !used.has(p.id));
      if (!seed) break;

      clusters[d].push(seed);
      used.add(seed.id);

      // Attach up to 3 nearest neighbors to fill the day
      const neighbors = sorted
        .filter(p => !used.has(p.id))
        .map(p => ({ poi: p, dist: distanceKm(seed, p) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      for (const n of neighbors) {
        clusters[d].push(n.poi);
        used.add(n.poi.id);
      }
    }

    return clusters;
  }

  // =========================================================================
  // 5. Build trip.days[] structure from clustered POIs + weather
  // =========================================================================
  function buildDaysFromClusters(clusters, weather, pace = 'balanced') {
    const slotOrder = { morning: 0, lunch: 1, afternoon: 2, evening: 3 };
    const limits = { relaxed: 2, balanced: 3, packed: 4 };
    const maxSlots = limits[pace] || 3;

    return clusters.map((cluster, i) => {
      const dayWeather = weather[i] || weather[0] || {};

      // Sort cluster into morning → lunch → afternoon → evening
      const sorted = [...cluster].sort(
        (a, b) => slotOrder[a.slot] - slotOrder[b.slot]
      );

      // Trim to pace limit
      const trimmed = sorted.slice(0, maxSlots);

      const pick = (slot, fallbackIdx = 0) =>
        trimmed.find(p => p.slot === slot) || trimmed[fallbackIdx] || null;

      const toSlot = (poi, defaultTime) => {
        if (!poi) return null;
        return {
          dualName: poi.name,
          category: formatCategory(poi.category),
          time: defaultTime,
          desc:
            `${poi.name} — a notable ${formatCategory(poi.category).toLowerCase()}` +
            `${poi.address ? ' located at ' + poi.address : ''}.`,
          weatherBadge: poi.indoor ? '🏛️ Indoor' : '🌤️ Outdoor',
          accessibility: poi.familyFriendly
            ? ['👨‍👩‍👧 Family-Friendly']
            : ['♿ Accessible'],
          cost: poi.cost,
          completed: false,
          _poiId: poi.id,
          _lat: poi.lat,
          _lng: poi.lng
        };
      };

      return {
        dayNumber: i + 1,
        dateLabel: `Day ${i + 1}`,
        neighborhood: cluster[0] ? `Near ${cluster[0].name}` : 'City Center',
        weatherPlan: buildWeatherNote(dayWeather),
        morning:   toSlot(pick('morning'),   '09:30 - 11:30'),
        lunch:     toSlot(pick('lunch'),     '12:30 - 14:00'),
        afternoon: toSlot(pick('afternoon'), '14:30 - 17:00'),
        evening:   toSlot(pick('evening'),   '18:00 - 20:30')
      };
    });
  }

  function formatCategory(cat) {
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function buildWeatherNote(w) {
    if (!w || typeof w.tempMax !== 'number') {
      return '🌤️ Itinerary optimized for comfortable walking and indoor breaks.';
    }
    if (w.tempMax > 40) {
      return `🔥 Hot day (${w.tempMax}°C): outdoor visits kept to cooler morning/evening; air-conditioned venues scheduled midday.`;
    }
    if (w.isRainy) {
      return '🌧️ Rain expected: indoor attractions prioritized; outdoor walks rescheduled.';
    }
    return `☀️ Pleasant day (${w.tempMax}°C): balanced mix of outdoor and indoor visits.`;
  }

  // =========================================================================
  // 6. Swap helpers — find real alternatives from the cached POI list
  // =========================================================================

  /**
   * Find alternatives for a given activity slot.
   * Same time-of-day slot, not already used elsewhere in the itinerary.
   * Prefers same category and same indoor/outdoor flag.
   *
   * @param {Object} currentPOI  - { id, category, slot, indoor }
   * @param {Array}  allPOIs     - Full POI list from cache
   * @param {Array}  usedPOIIds  - POI ids already used in the itinerary
   * @returns {Array}            - Up to 4 alternative POIs
   */
  function findAlternatives(currentPOI, allPOIs, usedPOIIds = []) {
    if (!currentPOI || !Array.isArray(allPOIs)) return [];

    const used = new Set(usedPOIIds);

    return allPOIs
      .filter(p => {
        if (p.id === currentPOI.id) return false;      // not itself
        if (used.has(p.id)) return false;              // not already in plan
        if (currentPOI.slot && p.slot !== currentPOI.slot) return false; // same time slot
        return true;
      })
      .sort((a, b) => {
        const aScore =
          (a.category === currentPOI.category ? 2 : 0) +
          (a.indoor === currentPOI.indoor ? 1 : 0);
        const bScore =
          (b.category === currentPOI.category ? 2 : 0) +
          (b.indoor === currentPOI.indoor ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 4);
  }

  /**
   * Collect every POI id currently referenced by a trip's itinerary.
   * Used to avoid suggesting POIs already present.
   */
  function collectUsedPOIIds(trip) {
    const ids = [];
    (trip.days || []).forEach(d => {
      ['morning', 'lunch', 'afternoon', 'evening'].forEach(slot => {
        const activity = d[slot];
        if (activity && activity._poiId) ids.push(activity._poiId);
      });
    });
    return ids;
  }

  // =========================================================================
  // 7. Public API
  // =========================================================================
  window.POIService = {
    fetchPOIs,
    clusterPOIs,
    buildDaysFromClusters,
    distanceKm,
    findAlternatives,
    collectUsedPOIIds
  };
})();
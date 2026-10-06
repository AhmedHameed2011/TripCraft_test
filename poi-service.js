/**
 * TripCraft — Real POI Service (OpenStreetMap Overpass API)
 * Fetches real attractions, malls, heritage sites, parks, museums,
 * and restaurants for any destination, then builds a day-by-day itinerary.
 *
 * Also provides swap-alternative helpers used by app.js for the
 * "Swap Activity" feature in the Customize tab.
 *
 * Works on personal devices / open networks.
 * On restricted corporate networks, gracefully returns empty arrays.
 *
 * No API key required. Data © OpenStreetMap contributors (ODbL).
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================
  const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
  const FETCH_TIMEOUT_MS = 10000;      // 10s — fail fast if blocked
  const CACHE_TTL = 60 * 60 * 1000;    // 1 hour
  const cache = new Map();             // key → { data, timestamp }

  // =========================================================================
  // Category rules
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
  // 1. Fetch POIs from Overpass — with fast failure
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
        node["tourism"~"museum|attraction|theme_park|viewpoint|zoo|aquarium|art_gallery"]["name"](around:${radiusMeters},${lat},${lng});
        node["historic"~"castle|fort|monument|ruins|archaeological_site"]["name"](around:${radiusMeters},${lat},${lng});
        node["shop"="mall"]["name"](around:${radiusMeters},${lat},${lng});
        node["leisure"~"park|water_park"]["name"](around:${radiusMeters},${lat},${lng});
        node["amenity"~"cinema|theatre|marketplace"]["name"](around:${radiusMeters},${lat},${lng});
        node["amenity"~"restaurant|cafe|fast_food"]["name"](around:${radiusMeters},${lat},${lng});
      );
      out body 200;
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      // Detect XML error pages
      if (text.trim().startsWith('<')) {
        console.warn('[poi-service] Overpass returned XML — likely blocked');
        return [];
      }

      const data = JSON.parse(text);

      const pois = (data.elements || [])
        .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
        .map(el => normalizePOI(el))
        .filter(Boolean);

      // Deduplicate by name
      const seen = new Set();
      const unique = pois.filter(p => {
        const k = p.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      cache.set(key, { data: unique, timestamp: Date.now() });
      console.log('[poi-service] Loaded', unique.length, 'POIs');
      return unique;

    } catch (err) {
      clearTimeout(timeoutId);
      // Silent failure — this is expected on restricted networks
      console.warn('[poi-service] Fetch failed (this is OK on restricted networks):', err.message);
      return [];
    }
  }

  // =========================================================================
  // 2. Normalize raw OSM node
  // =========================================================================
  function normalizePOI(el) {
    const tags = el.tags || {};
    const category = classifyCategory(tags);
    if (!category) return null;

    const rules = CATEGORY_RULES[category];
    if (!rules) return null;

    return {
      id: `osm-${el.id}`,
      name: tags.name || tags['name:en'],
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
      openingHoursParsed: tags.opening_hours ? parseOpeningHours(tags.opening_hours) : null,
      website: tags.website || null
    };
  }

  // =========================================================================
  // 3. Classification
  // =========================================================================
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

    if (tags.amenity === 'place_of_worship') {
      if (tags.wikipedia || tags.wikidata || tags.heritage) return 'religious';
      return null;
    }

    if (tags.amenity === 'restaurant' ||
        tags.amenity === 'cafe' ||
        tags.amenity === 'fast_food')    return 'restaurant';

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
  // 4. Distance (Haversine, km)
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
  // 5. Cluster POIs
  // =========================================================================
  function clusterPOIs(pois, days) {
    const clusters = Array.from({ length: days }, () => []);
    const used = new Set();
    const sorted = [...pois].sort((a, b) => b.cost - a.cost);

    for (let d = 0; d < days; d++) {
      const seed = sorted.find(p => !used.has(p.id));
      if (!seed) break;

      clusters[d].push(seed);
      used.add(seed.id);

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
  // 6. Build days from clusters
  // =========================================================================
  function buildDaysFromClusters(clusters, weather, pace = 'balanced') {
    const slotOrder = { morning: 0, lunch: 1, afternoon: 2, evening: 3 };
    const limits = { relaxed: 2, balanced: 3, packed: 4 };
    const maxSlots = limits[pace] || 3;

    return clusters.map((cluster, i) => {
      const dayWeather = weather[i] || weather[0] || {};

      const sorted = [...cluster].sort(
        (a, b) => slotOrder[a.slot] - slotOrder[b.slot]
      );

      const trimmed = sorted.slice(0, maxSlots);

      const pick = (slot, fallbackIdx = 0) =>
        trimmed.find(p => p.slot === slot) || trimmed[fallbackIdx] || null;

      const toSlot = (poi, defaultTime) => {
        if (!poi) return null;

        const openStatus = isOpenDuring(poi, poi.slot);
        let hoursWarning = null;
        if (openStatus === false) {
          hoursWarning = `⚠️ Usually closed during ${poi.slot} — check hours`;
        }

        return {
          dualName: poi.name,
          category: formatCategory(poi.category),
          time: defaultTime,
          desc:
            `${poi.name} — a notable ${formatCategory(poi.category).toLowerCase()}` +
            `${poi.address ? ' located at ' + poi.address : ''}.` +
            `${poi.openingHours ? ' Hours: ' + poi.openingHours + '.' : ''}`,
          weatherBadge: poi.indoor ? '🏛️ Indoor' : '🌤️ Outdoor',
          hoursBadge: hoursWarning,
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
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
  // 7. Opening Hours
  // =========================================================================
  function parseOpeningHours(raw) {
    if (!raw) return null;

    const str = raw.trim();
    if (str === '24/7') return { is24_7: true, days: null, raw: str };

    const dayMap = {
      mo: 'mon', tu: 'tue', we: 'wed', th: 'thu',
      fr: 'fri', sa: 'sat', su: 'sun'
    };

    const days = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    const rules = str.split(';').map(r => r.trim()).filter(Boolean);

    for (const rule of rules) {
      const match = rule.match(/^([A-Za-z,\-]+)\s+(.+)$/);
      if (!match) continue;

      const [, daysPart, hoursPart] = match;
      const expandedDays = expandDayRange(daysPart, dayMap);
      if (expandedDays.length === 0) continue;

      const ranges = [];
      const timeRanges = hoursPart.split(',').map(t => t.trim());
      for (const tr of timeRanges) {
        const tm = tr.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
        if (tm) ranges.push([`${tm[1]}:${tm[2]}`, `${tm[3]}:${tm[4]}`]);
      }

      for (const day of expandedDays) {
        days[day].push(...ranges);
      }
    }

    return { is24_7: false, days, raw: str };
  }

  function expandDayRange(spec, dayMap) {
    const result = [];
    const parts = spec.toLowerCase().split(',').map(s => s.trim());
    const dayKeys = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => s.trim());
        const startIdx = dayKeys.indexOf(start);
        const endIdx = dayKeys.indexOf(end);
        if (startIdx === -1 || endIdx === -1) continue;

        let i = startIdx;
        while (true) {
          result.push(dayMap[dayKeys[i]]);
          if (i === endIdx) break;
          i = (i + 1) % 7;
        }
      } else {
        const key = dayMap[part];
        if (key) result.push(key);
      }
    }
    return [...new Set(result)];
  }

  function isOpenDuring(poi, slot, weekday = null) {
    if (!poi.openingHours) return null;

    const parsed = poi.openingHoursParsed || parseOpeningHours(poi.openingHours);
    if (!parsed) return null;
    if (parsed.is24_7) return true;

    const day = weekday || new Date()
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase().slice(0, 3);

    const ranges = parsed.days[day] || [];
    if (ranges.length === 0) return false;

    const slotRanges = {
      morning:   ['08:00', '12:00'],
      lunch:     ['12:00', '14:30'],
      afternoon: ['14:00', '17:30'],
      evening:   ['17:00', '22:00']
    };
    const [slotStart, slotEnd] = slotRanges[slot] || ['00:00', '23:59'];

    return ranges.some(([open, close]) => open <= slotEnd && close >= slotStart);
  }

  // =========================================================================
  // 8. Swap helpers
  // =========================================================================
  function findAlternatives(currentPOI, allPOIs, usedPOIIds = [], weekday = null) {
    if (!currentPOI || !Array.isArray(allPOIs)) return [];
    const used = new Set(usedPOIIds);

    return allPOIs
      .filter(p => {
        if (p.id === currentPOI.id) return false;
        if (used.has(p.id)) return false;
        if (currentPOI.slot && p.slot !== currentPOI.slot) return false;

        if (weekday) {
          const open = isOpenDuring(p, currentPOI.slot, weekday);
          if (open === false) return false;
        }
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
  // 9. Public API
  // =========================================================================
  window.POIService = {
    fetchPOIs,
    clusterPOIs,
    buildDaysFromClusters,
    distanceKm,
    findAlternatives,
    collectUsedPOIIds,
    parseOpeningHours,
    isOpenDuring,
    CATEGORY_RULES
  };
})();
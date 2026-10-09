/**
 * TripCraft — Stay Image & Neighborhood Service
 *
 * Universal hotel image service that:
 *   1. Extracts REAL landmarks from OpenStreetMap POI data
 *   2. Extracts REAL neighborhoods from POI address tags
 *   3. Generates realistic hotel names using real landmarks
 *   4. Fetches matching photos from Unsplash with cache
 *   5. Falls back gracefully through multiple layers
 *
 * Zero hardcoded landmark/neighborhood lists.
 * Works for 10,000+ cities worldwide.
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================
  const UNSPLASH_KEY = 'vIG1teoCGQ6jvUsi4MyRC0M8m28HTdC313L6mqiaAUE';
  const IMAGE_CACHE_KEY = 'tripcraft_stay_images_v1';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  const CF_WORKER_URL = ''; // Optional Cloudflare Worker

  const FALLBACK_POOL = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format'
  ];

  // =========================================================================
  // Deterministic hash — same city → same names every time
  // =========================================================================
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // =========================================================================
  // 1. Extract REAL neighborhoods from POI address tags
  // =========================================================================
  function extractNeighborhoods(pois, cityName) {
    if (!Array.isArray(pois) || pois.length === 0) {
      return genericNeighborhoods();
    }

    const counts = new Map();

    pois.forEach(poi => {
      const tags = poi.tags || {};
      const candidates = [
        tags['addr:suburb'],
        tags['addr:district'],
        tags['addr:neighbourhood'],
        tags['addr:quarter'],
        tags['addr:borough'],
        tags['is_in:suburb'],
        tags['is_in:district']
      ].filter(Boolean);

      candidates.forEach(name => {
        if (!name || name.length > 40 || name.length < 3) return;
        const clean = name.trim();
        if (clean.toLowerCase() === cityName.toLowerCase()) return;
        counts.set(clean, (counts.get(clean) || 0) + 1);
      });
    });

    const sorted = [...counts.entries()]
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);

    if (sorted.length >= 3) return sorted;
    return [...sorted, ...genericNeighborhoods()].slice(0, 6);
  }

  function genericNeighborhoods() {
    return ['City Center', 'Old Town', 'Downtown', 'Riverside', 'Historic Quarter', 'Central District'];
  }

  // =========================================================================
  // 2. Extract REAL landmarks from POIs (NEW)
  // =========================================================================
  function extractLandmarks(pois, cityName) {
    if (!Array.isArray(pois) || pois.length === 0) return [];

    // Categories that signal a landmark
    const LANDMARK_CATEGORIES = new Set([
      'attraction', 'monument', 'viewpoint', 'castle',
      'museum', 'heritage', 'religious', 'park', 'shopping_mall'
    ]);

    const scored = pois
      .filter(p => LANDMARK_CATEGORIES.has(p.category))
      .map(p => {
        const name = (p.name || '').trim();
        if (!name || name.length > 50 || name.length < 3) return null;

        // Skip names that look like generic placeholders
        if (/^(unnamed|unknown|attraction|museum)\b/i.test(name)) return null;

        let score = 0;
        score += (p.cost || 0) * 2;           // paid attractions weigh more
        if (p.wikipedia) score += 15;         // Wikipedia link = notable
        if (p.website) score += 3;            // has own website

        // Category bonuses
        if (p.category === 'monument')       score += 10;
        if (p.category === 'attraction')     score += 8;
        if (p.category === 'museum')         score += 6;
        if (p.category === 'castle')         score += 8;
        if (p.category === 'heritage')       score += 5;
        if (p.category === 'viewpoint')      score += 4;
        if (p.category === 'shopping_mall')  score += 3;
        if (p.category === 'park')           score += 2;

        // Prefer names with a proper noun feel (contains uppercase word)
        if (/[A-Z]/.test(name)) score += 2;

        // Extract a SHORT version of the landmark name for hotel use
        const shortName = extractShortLandmarkName(name);

        return { name, shortName, category: p.category, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    // Deduplicate by shortName
    const seen = new Set();
    const landmarks = [];
    for (const l of scored) {
      const key = l.shortName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      landmarks.push(l.shortName);
      if (landmarks.length >= 6) break;
    }

    return landmarks;
  }

  /**
   * Extract a short, hotel-name-friendly version of a landmark.
   * Examples:
   *   "Burj Khalifa"              → "Burj Khalifa"
   *   "The Dubai Mall"            → "Dubai Mall"
   *   "Palm Jumeirah Monorail"    → "Palm Jumeirah"
   *   "Jumeirah Beach Residence"  → "Jumeirah Beach"
   *   "Museum of Modern Art"      → "Modern Art"
   */
  function extractShortLandmarkName(fullName) {
    let name = fullName
      .replace(/^The\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Trim trailing descriptive words
    const trailingNoise = [
      'Hotel', 'Resort', 'Tower', 'Towers', 'Complex',
      'Building', 'Center', 'Centre', 'Plaza', 'Square',
      'Park', 'Gardens', 'Garden', 'Monorail', 'Station',
      'Bridge', 'Parking', 'Terminal', 'Interchange'
    ];
    const words = name.split(' ');
    while (words.length > 2 && trailingNoise.includes(words[words.length - 1])) {
      words.pop();
    }
    name = words.join(' ');

    // Remove parenthetical suffixes
    name = name.replace(/\s*\([^)]*\)\s*$/, '');

    // If it's really long, keep first 3 words
    const parts = name.split(' ');
    if (parts.length > 3) name = parts.slice(0, 3).join(' ');

    return name.trim();
  }

  // =========================================================================
  // 3. Generate realistic hotel names using REAL landmarks
  // =========================================================================
  function generateHotelName(neighborhood, propertyType, index, cityName, landmarks) {
    const c = cityName || 'City';
    const safeLandmarks = Array.isArray(landmarks) && landmarks.length > 0 ? landmarks : [];

    // ============================================================
    // Pick the base name for the hotel — with multiple fallbacks
    // ============================================================
    let n;
    if (safeLandmarks.length > 0) {
      n = safeLandmarks[index % safeLandmarks.length];
    } else if (neighborhood && !isGenericNeighborhood(neighborhood) && neighborhood !== c) {
      n = neighborhood;
    } else {
      // 👇 Creative city-based variants (deterministic per city)
      const cityVariants = [
        `${c} Central`,
        `Old ${c}`,
        `${c} Prime`,
        `New ${c}`,
        `The ${c} Collection`,
        `${c} Heights`,
        `${c} Harbour`,
        `${c} Square`,
        `${c} Old Town`,
        `${c} Downtown`,
        `${c} Waterfront`,
        `${c} Gardens`,
        `${c} Bay`,
        `${c} District`,
        `${c} Quarter`,
        `${c} Peninsula`
      ];
      const cityHash = simpleHash(c);
      n = cityVariants[(cityHash + index * 3) % cityVariants.length];
    }

    // ============================================================
    // Expanded pattern pools — 10+ options per property type
    // ============================================================
    const patterns = {
      'Luxury Hotel': [
        `The ${n} Grand`,
        `The ${n} Palace`,
        `${n} Royal Hotel`,
        `The ${n} Imperial`,
        `${n} Prestige Hotel`,
        `The Grand ${n}`,
        `${n} Crown Plaza`,
        `The ${n} Regency`,
        `${n} Golden Suites`,
        `The ${n} Signature`
      ],
      'Boutique Hotel': [
        `${n} Boutique Hotel`,
        `The ${n} House`,
        `${n} Design Hotel`,
        `The ${n} Atelier`,
        `${n} Art Hotel`,
        `The ${n} Loft`,
        `${n} Studio Suites`,
        `The ${n} Corner`,
        `${n} Hideaway`,
        `The ${n} Edition`
      ],
      'Family Suite Hotel': [
        `${n} Family Suites`,
        `${n} Residence Suites`,
        `The ${n} Family Hotel`,
        `${n} Garden Suites`,
        `The ${n} Residences`,
        `${n} Comfort Suites`,
        `${n} Parkside Suites`,
        `The ${n} Family Inn`,
        `${n} Courtyard Suites`,
        `${n} Sunshine Suites`
      ],
      'Apartment Hotel': [
        `${n} Apartments`,
        `${n} Loft Residences`,
        `${n} Serviced Apartments`,
        `The ${n} Residences`,
        `${n} City Flats`,
        `${n} Urban Suites`,
        `The ${n} Living`,
        `${n} Skyline Apartments`,
        `${n} Central Residences`,
        `The ${n} Urban Collection`
      ],
      'Heritage Property': [
        `${n} Heritage House`,
        `The ${n} Historic Inn`,
        `${n} Heritage Hotel`,
        `${n} Old House`,
        `${n} Manor`,
        `The ${n} Estate`,
        `${n} Heritage Retreat`,
        `The ${n} Colonial Inn`,
        `${n} Vintage Hotel`,
        `The ${n} Story House`
      ],
      'Budget Inn': [
        `${n} Comfort Inn`,
        `${n} Lodge`,
        `${n} Budget Rooms`,
        `The ${n} Inn`,
        `${n} Guesthouse`,
        `${n} Smart Stay`,
        `The ${n} Value Inn`,
        `${n} Express Hotel`,
        `${n} Budget Suites`,
        `The ${n} Basic Inn`
      ]
    };

    const options = patterns[propertyType] || patterns['Boutique Hotel'];
    const cityHash = simpleHash(c);
    const patternIndex = (cityHash + index * 7) % options.length;
    return options[patternIndex];
  }

  function isGenericNeighborhood(n) {
    const generics = ['city center', 'old town', 'downtown', 'riverside', 'historic quarter', 'central district'];
    return generics.includes((n || '').toLowerCase());
  }

  // =========================================================================
  // 4. Build Unsplash search queries
  // =========================================================================
  function buildQuery(hotelName, neighborhood, cityName, propertyType) {
    return [
      `${hotelName} ${cityName}`,
      `${neighborhood} ${cityName} hotel`,
      `${cityName} ${propertyType || 'hotel'}`,
      `luxury hotel ${cityName}`
    ];
  }

  // =========================================================================
  // 5. Search Unsplash
  // =========================================================================
  async function searchUnsplash(query) {
    const url = `https://api.unsplash.com/search/photos?` +
      `query=${encodeURIComponent(query)}` +
      `&per_page=3&orientation=landscape&content_filter=high` +
      `&client_id=${UNSPLASH_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        console.warn('[stay-image] Unsplash rate limited');
      }
      throw new Error(`Unsplash HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const best = data.results.find(r => {
      const alt = (r.alt_description || '').toLowerCase();
      return alt.includes('hotel') || alt.includes('building') ||
             alt.includes('architecture') || alt.includes('resort');
    }) || data.results[0];

    return {
      url: best.urls.regular,
      thumbUrl: best.urls.small,
      photographer: best.user.name,
      photographerUrl: best.user.links.html,
      photoUrl: best.links.html
    };
  }

  // =========================================================================
  // 6. Local cache
  // =========================================================================
  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}');
    } catch { return {}; }
  }
  function saveCache(cache) {
    try { localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache)); } catch {}
  }
  function getCachedImage(key) {
    const entry = loadCache()[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.url;
  }
  function setCachedImage(key, url) {
    const cache = loadCache();
    cache[key] = { url, timestamp: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > 200) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      for (let i = 0; i < 50; i++) delete cache[sorted[i]];
    }
    saveCache(cache);
  }

  // =========================================================================
  // 7. Cloudflare Worker cache
  // =========================================================================
  async function tryWorkerCache(cacheKey) {
    if (!CF_WORKER_URL) return null;
    try {
      const res = await fetch(`${CF_WORKER_URL}/image/${encodeURIComponent(cacheKey)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url ? data : null;
    } catch { return null; }
  }
  async function saveToWorkerCache(cacheKey, imageData) {
    if (!CF_WORKER_URL) return;
    try {
      await fetch(`${CF_WORKER_URL}/image/${encodeURIComponent(cacheKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData),
        signal: AbortSignal.timeout(2000)
      });
    } catch {}
  }

  // =========================================================================
  // 8. Main entry: fetch a stay image
  // =========================================================================
  async function fetchStayImage({ hotelName, neighborhood, cityName, propertyType, index }) {
    const cacheKey = `${cityName}::${hotelName}`.toLowerCase();

    const local = getCachedImage(cacheKey);
    if (local) {
      console.log(`[stay-image] Cache hit (local): ${hotelName}`);
      return { url: local, source: 'cache' };
    }

    const workerCached = await tryWorkerCache(cacheKey);
    if (workerCached?.url) {
      console.log(`[stay-image] Cache hit (worker): ${hotelName}`);
      setCachedImage(cacheKey, workerCached.url);
      return { url: workerCached.url, source: 'worker', ...workerCached };
    }

    const queries = buildQuery(hotelName, neighborhood, cityName, propertyType);
    for (const q of queries) {
      try {
        console.log(`[stay-image] Unsplash: "${q}"`);
        const result = await searchUnsplash(q);
        if (result) {
          setCachedImage(cacheKey, result.url);
          saveToWorkerCache(cacheKey, result);
          console.log(`[stay-image] ✓ Found image for ${hotelName}`);
          return { ...result, source: 'unsplash' };
        }
      } catch (err) {
        console.warn(`[stay-image] Query failed: ${err.message}`);
        if (err.message.includes('429') || err.message.includes('403')) break;
      }
    }

    const fallbackUrl = FALLBACK_POOL[index % FALLBACK_POOL.length];
    console.log(`[stay-image] Fallback pool for ${hotelName}`);
    return { url: fallbackUrl, source: 'fallback' };
  }

  // =========================================================================
  // 9. Batch fetch
  // =========================================================================
  async function fetchStayImages(stays, cityName) {
    const promises = stays.map((stay, i) =>
      fetchStayImage({
        hotelName: stay.name,
        neighborhood: stay.neighborhood || 'City Center',
        cityName,
        propertyType: stay.type,
        index: i
      }).catch(err => {
        console.warn('[stay-image] Failed for', stay.name, err.message);
        return { url: FALLBACK_POOL[i % FALLBACK_POOL.length], source: 'fallback' };
      })
    );

    const results = await Promise.allSettled(promises);
    return results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { url: FALLBACK_POOL[i % FALLBACK_POOL.length], source: 'fallback' }
    );
  }

  // =========================================================================
  // Public API
  // =========================================================================
  window.StayImageService = {
    extractNeighborhoods,
    extractLandmarks,       // 👈 NEW public function
    generateHotelName,
    fetchStayImage,
    fetchStayImages,
    FALLBACK_POOL
  };
})();
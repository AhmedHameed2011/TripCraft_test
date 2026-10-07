/**
 * TripCraft — Stay Image & Neighborhood Service
 *
 * Universal, scalable hotel image service that:
 *   1. Extracts real neighborhoods from POI data (works for ANY city)
 *   2. Generates realistic hotel names
 *   3. Fetches matching photos from Unsplash with Cloudflare cache
 *   4. Falls back gracefully through multiple layers
 *
 * No hardcoded city lists. Works for 10,000+ destinations.
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================
  const UNSPLASH_KEY = 'vIG1teoCGQ6jvUsi4MyRC0M8m28HTdC313L6mqiaAUE';
  const IMAGE_CACHE_KEY = 'tripcraft_stay_images_v1';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Optional: your Cloudflare Worker URL for shared caching
  // Leave empty to skip server-side caching
  const CF_WORKER_URL = ''; // e.g. 'https://tripcraft-images.your-name.workers.dev'

  // Fallback images (rotating pool) — used when all else fails
  const FALLBACK_POOL = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format'
  ];

  // =========================================================================
  // Local cache
  // =========================================================================
  function loadCache() {
    try {
      const raw = localStorage.getItem(IMAGE_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveCache(cache) {
    try {
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  function getCachedImage(key) {
    const cache = loadCache();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.url;
  }

  function setCachedImage(key, url) {
    const cache = loadCache();
    cache[key] = { url, timestamp: Date.now() };

    // Keep cache under 200 entries (drop oldest)
    const keys = Object.keys(cache);
    if (keys.length > 200) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      for (let i = 0; i < 50; i++) delete cache[sorted[i]];
    }

    saveCache(cache);
  }

  // =========================================================================
  // 1. Extract REAL neighborhoods from POI data (universal, no hardcoded lists)
  // =========================================================================
  function extractNeighborhoods(pois, cityName) {
    if (!Array.isArray(pois) || pois.length === 0) {
      return genericNeighborhoods(cityName);
    }

    const counts = new Map();

    // Scan every POI for neighborhood-related tags
    pois.forEach(poi => {
      const tags = poi.tags || {};

      // OSM neighborhood tags (in priority order)
      const candidates = [
        tags['addr:suburb'],
        tags['addr:district'],
        tags['addr:neighbourhood'],
        tags['addr:quarter'],
        tags['addr:borough'],
        tags['is_in:suburb'],
        tags['is_in:district'],
        tags['is_in']
      ].filter(Boolean);

      candidates.forEach(name => {
        if (!name || name.length > 40) return;
        const clean = name.trim();
        if (clean.toLowerCase() === cityName.toLowerCase()) return;
        counts.set(clean, (counts.get(clean) || 0) + 1);
      });

      // Also: parse neighborhood from POI names like "SoHo Grand Hotel"
      // Look for patterns like "X Grand", "X Residence", "X Hotel"
      const poiName = poi.name || '';
      const patterns = [
        /^([A-Z][a-zA-Z\s]+?)\s+(?:Grand|Royal|Hotel|Residence|Suites|Plaza|Park|Square)/,
        /^(?:Hotel|The)\s+([A-Z][a-zA-Z\s]+?)\s+(?:Hotel|Grand|Suites)/
      ];
      patterns.forEach(p => {
        const match = poiName.match(p);
        if (match && match[1] && match[1].length < 30) {
          const n = match[1].trim();
          if (n.toLowerCase() !== cityName.toLowerCase()) {
            counts.set(n, (counts.get(n) || 0) + 0.5); // lower weight
          }
        }
      });
    });

    // Sort by frequency
    const sorted = [...counts.entries()]
      .filter(([_, count]) => count >= 2) // require at least 2 mentions
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);

    if (sorted.length >= 3) return sorted;

    // Not enough data — blend real names with generics
    const generic = genericNeighborhoods(cityName);
    return [...sorted, ...generic].slice(0, 6);
  }

  function genericNeighborhoods(cityName) {
    // Universally applicable neighborhood names
    return [
      'City Center',
      'Old Town',
      'Downtown',
      'Riverside',
      'Historic Quarter',
      'Central District'
    ];
  }

  // =========================================================================
  // 2. Generate realistic hotel names
  // =========================================================================
  function generateHotelName(neighborhood, propertyType, index) {
    const n = neighborhood || 'City Center';

    const patterns = {
      'Luxury Hotel': [
        `The ${n} Grand`,
        `The ${n} Palace Hotel`,
        `${n} Royal Hotel`
      ],
      'Boutique Hotel': [
        `${n} Boutique Hotel`,
        `The ${n} House`,
        `${n} Design Hotel`
      ],
      'Family Suite Hotel': [
        `${n} Family Suites`,
        `${n} Residence Suites`,
        `The ${n} Family Hotel`
      ],
      'Apartment Hotel': [
        `${n} Apartments`,
        `${n} Loft Residences`,
        `${n} Serviced Apartments`
      ],
      'Heritage Property': [
        `${n} Heritage House`,
        `The ${n} Historic Inn`,
        `${n} Heritage Hotel`
      ],
      'Budget Inn': [
        `${n} Comfort Inn`,
        `${n} Lodge`,
        `${n} Budget Rooms`
      ]
    };

    const options = patterns[propertyType] || patterns['Boutique Hotel'];
    return options[index % options.length];
  }

  // =========================================================================
  // 3. Build smart Unsplash search query
  // =========================================================================
  function buildQuery(hotelName, neighborhood, cityName, propertyType) {
    // Tier 1: most specific — real hotel name + city
    // Tier 2: neighborhood + city + hotel
    // Tier 3: city + hotel type
    // Tier 4: generic hotel
    return [
      `${hotelName} ${cityName}`,
      `${neighborhood} ${cityName} hotel`,
      `${cityName} ${propertyType || 'hotel'}`,
      `luxury hotel ${cityName}`
    ];
  }

  // =========================================================================
  // 4. Fetch a single Unsplash image
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

    // Prefer landscape images that look like buildings
    const best = data.results.find(r => {
      const alt = (r.alt_description || '').toLowerCase();
      return alt.includes('hotel') ||
             alt.includes('building') ||
             alt.includes('architecture') ||
             alt.includes('resort');
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
  // 5. Cloudflare Worker cache lookup (optional)
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
    } catch {
      return null;
    }
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
  // 6. Main entry: fetch a stay image with all fallbacks
  // =========================================================================
  async function fetchStayImage({ hotelName, neighborhood, cityName, propertyType, index }) {
    const cacheKey = `${cityName}::${hotelName}`.toLowerCase();

    // Layer 1: localStorage cache
    const local = getCachedImage(cacheKey);
    if (local) {
      console.log(`[stay-image] Cache hit (local): ${hotelName}`);
      return { url: local, source: 'cache' };
    }

    // Layer 2: Cloudflare Worker cache (shared across users)
    const workerCached = await tryWorkerCache(cacheKey);
    if (workerCached?.url) {
      console.log(`[stay-image] Cache hit (worker): ${hotelName}`);
      setCachedImage(cacheKey, workerCached.url);
      return { url: workerCached.url, source: 'worker', ...workerCached };
    }

    // Layer 3: Unsplash live search (try queries in order)
    const queries = buildQuery(hotelName, neighborhood, cityName, propertyType);
    for (const q of queries) {
      try {
        console.log(`[stay-image] Unsplash: "${q}"`);
        const result = await searchUnsplash(q);
        if (result) {
          setCachedImage(cacheKey, result.url);
          saveToWorkerCache(cacheKey, result); // fire and forget
          console.log(`[stay-image] ✓ Found image for ${hotelName}`);
          return { ...result, source: 'unsplash' };
        }
      } catch (err) {
        console.warn(`[stay-image] Query failed: ${err.message}`);
        if (err.message.includes('429') || err.message.includes('403')) {
          break; // rate limited — skip remaining queries
        }
      }
    }

    // Layer 4: Fallback pool (rotating)
    const fallbackUrl = FALLBACK_POOL[index % FALLBACK_POOL.length];
    console.log(`[stay-image] Fallback pool for ${hotelName}`);
    return { url: fallbackUrl, source: 'fallback' };
  }

  // =========================================================================
  // 7. Batch fetch (parallel, for a trip's 3 stays)
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
    generateHotelName,
    fetchStayImage,
    fetchStayImages,
    FALLBACK_POOL
  };
})();
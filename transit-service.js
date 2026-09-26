/**
 * TripCraft — Local Transit Service (OpenStreetMap Overpass API)
 * Fetches nearby public transport stops with NO API key required.
 * Data © OpenStreetMap contributors (ODbL license).
 */
(function () {
  'use strict';

  const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

  // Cache to avoid repeated calls
  const cache = new Map();
  const CACHE_TTL = 30 * 60 * 1000;   // 30 minutes

  // =========================================================================
  // Find nearby transport stops
  // =========================================================================
  async function findNearbyStops(lat, lng, radiusMeters = 800) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return [];

    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    // Overpass QL query — finds all public transport nodes within radius
    const query = `
      [out:json][timeout:15];
      (
        node["public_transport"~"platform|station"](around:${radiusMeters},${lat},${lng});
        node["railway"~"station|halt|tram_stop"](around:${radiusMeters},${lat},${lng});
        node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
        node["amenity"="ferry_terminal"](around:${radiusMeters},${lat},${lng});
      );
      out body 20;
    `;

    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const stops = (data.elements || [])
        .filter(el => el.lat && el.lon)
        .slice(0, 8)
        .map(el => {
          const tags = el.tags || {};
          const typeInfo = detectTransportType(tags);

          return {
            id:        el.id,
            name:      tags.name || tags['name:en'] || tags.ref || 'Transit Stop',
            lat:       el.lat,
            lng:       el.lon,
            type:      typeInfo.type,
            icon:      typeInfo.icon,
            routes:    extractRoutes(tags),
            wheelchair: tags.wheelchair === 'yes'
          };
        });

      // Deduplicate by name
      const seen = new Set();
      const unique = stops.filter(s => {
        const k = s.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      cache.set(key, { data: unique, timestamp: Date.now() });
      return unique;

    } catch (err) {
      console.warn('[transit] Overpass API failed:', err.message);
      return [];
    }
  }

  // =========================================================================
  // Detect transport type from OSM tags
  // =========================================================================
  function detectTransportType(tags) {
    if (tags.railway === 'station' || tags.station === 'subway' || tags.subway === 'yes') {
      return { type: 'metro', icon: '🚇' };
    }
    if (tags.railway === 'tram_stop' || tags.tram === 'yes') {
      return { type: 'tram', icon: '🚊' };
    }
    if (tags.railway === 'halt' || tags.railway === 'station') {
      return { type: 'rail', icon: '🚆' };
    }
    if (tags.highway === 'bus_stop' || tags.bus === 'yes') {
      return { type: 'bus', icon: '🚌' };
    }
    if (tags.amenity === 'ferry_terminal') {
      return { type: 'ferry', icon: '⛴️' };
    }
    if (tags.aerialway) {
      return { type: 'cable', icon: '🚡' };
    }
    return { type: 'stop', icon: '🚏' };
  }

  // =========================================================================
  // Extract route names (if present in OSM)
  // =========================================================================
  function extractRoutes(tags) {
    const routes = [];
    if (tags.route_ref)       routes.push(tags.route_ref);
    if (tags.ref)             routes.push(tags.ref);
    if (tags.local_ref)       routes.push(tags.local_ref);
    if (tags['ref:line'])     routes.push(tags['ref:line']);
    if (tags.line)            routes.push(tags.line);

    // Some stops have "route_ref" as comma-separated
    if (tags.route_ref && tags.route_ref.includes(';')) {
      return tags.route_ref.split(';').map(s => s.trim()).slice(0, 3);
    }
    return [...new Set(routes)].slice(0, 3);
  }

  // =========================================================================
  // Public API
  // =========================================================================
  window.TransitService = {
    findNearbyStops,
    hasApiKey: () => true   // No key needed — always "ready"
  };
})();
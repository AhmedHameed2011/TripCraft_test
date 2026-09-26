/**
 * TripCraft — Transitland Integration
 * Fetches nearby public transport stops and routes for a given location.
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration — replace with your Transitland API key
  // =========================================================================
  const API_KEY = 'YOUR_TRANSITLAND_API_KEY';
  const API_BASE = 'https://transit.land/api/v2/rest';

  // Cache to avoid repeated API calls (30 min TTL)
  const cache = new Map();
  const CACHE_TTL = 30 * 60 * 1000;

  // =========================================================================
  // Nearby Stops
  // =========================================================================
  async function findNearbyStops(lat, lng, radiusMeters = 800) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return [];

    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    const url =
      `${API_BASE}/stops?` +
      `lat=${lat}&lon=${lng}&radius=${radiusMeters}` +
      `&limit=8` +
      `&apikey=${encodeURIComponent(API_KEY)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const stops = (data.stops || []).map(s => ({
        onestopId:  s.onestop_id,
        name:       s.name || 'Transit Stop',
        lat:        s.geometry?.coordinates?.[1],
        lng:        s.geometry?.coordinates?.[0],
        types:      s.served_by_vehicle_types || [],
        routes:     (s.routes_serving_stop || []).slice(0, 3).map(r => r.route_name),
        wheelchair: s.wheelchair_boarding === true
      }));

      cache.set(key, { data: stops, timestamp: Date.now() });
      return stops;

    } catch (err) {
      console.warn('[transit-service] Stop search failed:', err.message);
      return [];
    }
  }

  // =========================================================================
  // Departures from a stop (real-time where available)
  // =========================================================================
  async function getDepartures(onestopId, limit = 5) {
    const key = `dep-${onestopId}-${limit}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    const url =
      `${API_BASE}/stops/${encodeURIComponent(onestopId)}/departures?` +
      `limit=${limit}` +
      `&apikey=${encodeURIComponent(API_KEY)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const departures = (data.stops || []).flatMap(stop =>
        (stop.departures || []).map(d => ({
          routeName: d.route?.route_short_name || d.route?.route_long_name || 'Route',
          headsign:  d.trip?.trip_headsign || '—',
          time:      d.departure_time || '—',
          isRealtime: !!d.realtime
        }))
      ).slice(0, limit);

      cache.set(key, { data: departures, timestamp: Date.now() });
      return departures;

    } catch (err) {
      console.warn('[transit-service] Departures failed:', err.message);
      return [];
    }
  }

  // =========================================================================
  // Vehicle type formatter
  // =========================================================================
  function formatVehicleType(type) {
    const map = {
      0: { icon: '🚊', key: 'transitTram' },
      1: { icon: '🚇', key: 'transitMetro' },
      2: { icon: '🚆', key: 'transitRail' },
      3: { icon: '🚌', key: 'transitBus' },
      4: { icon: '⛴️', key: 'transitFerry' },
      5: { icon: '🚡', key: 'transitCableCar' },
      6: { icon: '🚠', key: 'transitGondola' },
      7: { icon: '🚃', key: 'transitFunicular' }
    };
    return map[type] || { icon: '🚏', key: 'transitStop' };
  }

  // =========================================================================
  // Public API
  // =========================================================================
  window.TransitService = {
    findNearbyStops,
    getDepartures,
    formatVehicleType,
    hasApiKey: () => API_KEY && API_KEY !== 'YOUR_TRANSITLAND_API_KEY'
  };
})();
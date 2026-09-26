/**
 * TripCraft — Destination Service
 * Unified service for city search (GeoNames), destination imagery (Unsplash),
 * and weather (Open-Meteo), keyed on a single destination object.
 *
 * ⚠️ PRODUCTION NOTE:
 * The Unsplash Access Key must be moved to a server-side proxy before public
 * deployment. See: https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
 */
(function () {
  'use strict';

  // =========================================================================
  // Configuration — credentials applied
  // =========================================================================
  const CONFIG = {
    // GeoNames — account: ahmedhameed
    geonamesUsername: 'ahmedhameed',

    // Unsplash — Access Key configured
    unsplashAccessKey: 'vIG1teoCGQ6jvUsi4MyRC0M8m28HTdC313L6mqiaAUE',

    // Open-Meteo requires no key

    // Tunables
    cityCacheTTL:   5 * 60 * 1000,   // 5 minutes
    imageCacheTTL: 30 * 60 * 1000,   // 30 minutes
    weatherCacheTTL: 10 * 60 * 1000, // 10 minutes
    imageCacheMax: 50,
    weatherCacheMax: 50,
    debounceDelay: 300,
    minSearchLength: 2,
    maxCityResults: 10,
    requestTimeout: 8000             // ms
  };

  // =========================================================================
  // Generic caches
  // =========================================================================
  function makeCache(ttl, max) {
    const store = new Map();
    return {
      get(key) {
        const e = store.get(key);
        if (!e) return null;
        if (Date.now() - e.t > ttl) { store.delete(key); return null; }
        return e.v;
      },
      set(key, value) {
        if (store.size >= max) {
          const first = store.keys().next().value;
          store.delete(first);
        }
        store.set(key, { v: value, t: Date.now() });
      },
      clear() { store.clear(); }
    };
  }

  const cityCache    = new Map(); // query -> { data, t }
  const imageCache   = makeCache(CONFIG.imageCacheTTL,   CONFIG.imageCacheMax);
  const weatherCache = makeCache(CONFIG.weatherCacheTTL, CONFIG.weatherCacheMax);

  // =========================================================================
  // fetch with timeout + AbortController support
  // =========================================================================
  async function fetchJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // =========================================================================
  // 1. City / Country search (GeoNames)
  // =========================================================================
  async function searchCities(query) {
    if (!query || query.trim().length < CONFIG.minSearchLength) return [];
    const key = query.trim().toLowerCase();

    const cached = cityCache.get(key);
    if (cached && Date.now() - cached.t < CONFIG.cityCacheTTL) return cached.data;

    const url =
      `https://secure.geonames.org/searchJSON?` +
      `q=${encodeURIComponent(query.trim())}` +
      `&featureClass=P` +
      `&maxRows=${CONFIG.maxCityResults}` +
      `&style=MEDIUM` +
      `&username=${encodeURIComponent(CONFIG.geonamesUsername)}`;

    const data = await fetchJSON(url);

    // GeoNames returns errors as { status: { message, value } }
    if (data.status) {
      console.warn('[destination-service] GeoNames error:', data.status.message);
      throw new Error(data.status.message || 'GeoNames error');
    }

    if (!data.geonames || !Array.isArray(data.geonames)) return [];

    // Map + deduplicate by geonameId
    const seen = new Set();
    const results = data.geonames
      .map(g => ({
        id:          `geo-${g.geonameId}`,
        geonameId:   g.geonameId,
        city:        g.name,
        country:     g.countryName,
        countryCode: g.countryCode,
        adminName:   g.adminName1 || '',
        lat:         parseFloat(g.lat),
        lng:         parseFloat(g.lng),
        population:  g.population || 0,
        displayName: `${g.name}, ${g.countryName}`
      }))
      .filter(r => {
        if (!r.geonameId || seen.has(r.geonameId)) return false;
        seen.add(r.geonameId);
        return true;
      })
      .sort((a, b) => b.population - a.population);

    cityCache.set(key, { data: results, t: Date.now() });
    return results;
  }

   // =========================================================================
  // 2. Destination image (Unsplash)
  // =========================================================================
  async function fetchDestinationImage(destination) {
    const q = `${destination.city} ${destination.country}`.trim();
    const key = q.toLowerCase();

    const cached = imageCache.get(key);
    if (cached) return cached;

    const url =
      `https://api.unsplash.com/search/photos?` +
      `query=${encodeURIComponent(q)}` +
      `&per_page=5` +
      `&orientation=landscape` +
      `&content_filter=high` +
      `&client_id=${encodeURIComponent(CONFIG.unsplashAccessKey)}`;

    const data = await fetchJSON(url);
    if (!data.results || data.results.length === 0) {
      throw new Error('NO_IMAGE');
    }

    const photo = data.results[0];

    // Use higher-resolution image on larger screens for a crisper hero background
    const isLargeScreen = window.innerWidth >= 1024;
    const imageUrl = isLargeScreen ? photo.urls.full : photo.urls.regular;

    const imageData = {
      url:                imageUrl,
      fullUrl:            photo.urls.full,
      thumbUrl:           photo.urls.small,
      altDescription:     photo.alt_description || `${destination.city}, ${destination.country}`,
      photographerName:   photo.user.name,
      photographerUrl:    photo.user.links.html,
      photoUrl:           photo.links.html,
      downloadLocation:   photo.links.download_location,
      color:              photo.color || '#0a0a14'
    };

    imageCache.set(key, imageData);

    // Fire download tracking (required by Unsplash guidelines)
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${CONFIG.unsplashAccessKey}` }
    }).catch(() => {});

    return imageData;
  }

  // =========================================================================
  // 3. Weather (Open-Meteo)
  // =========================================================================
  async function fetchWeather(destination) {
    if (typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      throw new Error('NO_COORDS');
    }

    const key = `${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;
    const cached = weatherCache.get(key);
    if (cached) return cached;

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${destination.lat}` +
      `&longitude=${destination.lng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
        `is_day,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    const data = await fetchJSON(url);
    if (!data.current) throw new Error('NO_WEATHER');

    const c = data.current;
    const weather = {
      temperature:  Math.round(c.temperature_2m),
      feelsLike:    Math.round(c.apparent_temperature),
      humidity:     Math.round(c.relative_humidity_2m),
      windSpeed:    Math.round(c.wind_speed_10m),
      isDay:        c.is_day === 1,
      weatherCode:  c.weather_code,
      unit:         data.current_units?.temperature_2m?.replace('°', '') || 'C',
      windUnit:     data.current_units?.wind_speed_10m || 'km/h',
      timezone:     data.timezone,
      updatedAt:    c.time,
      icon:         mapWeatherIcon(c.weather_code, c.is_day === 1)
    };

    weatherCache.set(key, weather);
    return weather;
  }

  // WMO weather codes -> { icon, i18nKey }
  function mapWeatherIcon(code, isDay) {
    const map = {
      0:  { icon: isDay ? '☀️' : '🌙', key: 'weatherClear' },
      1:  { icon: isDay ? '🌤️' : '🌙', key: 'weatherMainlyClear' },
      2:  { icon: '⛅',                 key: 'weatherPartlyCloudy' },
      3:  { icon: '☁️',                 key: 'weatherOvercast' },
      45: { icon: '🌫️',                 key: 'weatherFog' },
      48: { icon: '🌫️',                 key: 'weatherFog' },
      51: { icon: '🌦️',                 key: 'weatherDrizzle' },
      53: { icon: '🌦️',                 key: 'weatherDrizzle' },
      55: { icon: '🌦️',                 key: 'weatherDrizzle' },
      61: { icon: '🌧️',                 key: 'weatherRain' },
      63: { icon: '🌧️',                 key: 'weatherRain' },
      65: { icon: '🌧️',                 key: 'weatherHeavyRain' },
      71: { icon: '🌨️',                 key: 'weatherSnow' },
      73: { icon: '🌨️',                 key: 'weatherSnow' },
      75: { icon: '❄️',                  key: 'weatherHeavySnow' },
      77: { icon: '🌨️',                 key: 'weatherSnow' },
      80: { icon: '🌦️',                 key: 'weatherShowers' },
      81: { icon: '🌧️',                 key: 'weatherShowers' },
      82: { icon: '⛈️',                 key: 'weatherHeavyShowers' },
      85: { icon: '🌨️',                 key: 'weatherSnowShowers' },
      86: { icon: '❄️',                  key: 'weatherSnowShowers' },
      95: { icon: '⛈️',                 key: 'weatherThunderstorm' },
      96: { icon: '⛈️',                 key: 'weatherThunderstorm' },
      99: { icon: '⛈️',                 key: 'weatherThunderstorm' }
    };
    return map[code] || { icon: isDay ? '🌤️' : '🌙', key: 'weatherUnknown' };
  }

  // =========================================================================
  // Public API
  // =========================================================================
  window.DestinationService = {
    searchCities,
    fetchDestinationImage,
    fetchWeather,
    CONFIG
  };
})();
/**
 * TripCraft — Stay Recommendation Service
 * Generates realistic, city-specific accommodation recommendations.
 *
 * Uses 6 layers of city-tier detection to work for ANY destination:
 *   0. localStorage cache        → instant repeat visits
 *   1. Exact city match          → top 30 cities = precise
 *   2. Country tier match        → works for any city in a known country
 *   3. Keyword hints             → catches "Luxury Resort" etc.
 *   4. Default fallback          → always works
 *   5. Feature-pool fallback     → if property types run out
 *
 * No API key required. Works completely offline.
 */
(function () {
  'use strict';

  // =========================================================================
  // 1. City tier definitions
  // =========================================================================

  // Exact city → tier map (top destinations)
  const CITY_TIERS = {
    // Premium destinations
    'new york': 'premium', 'london': 'premium', 'paris': 'premium',
    'tokyo': 'premium', 'zurich': 'premium', 'singapore': 'premium',
    'san francisco': 'premium', 'dubai': 'premium', 'hong kong': 'premium',
    'sydney': 'premium', 'los angeles': 'premium', 'amsterdam': 'premium',
    'oslo': 'premium', 'stockholm': 'premium', 'copenhagen': 'premium',
    'reykjavik': 'premium', 'geneva': 'premium', 'monaco': 'premium',

    // Mid-tier destinations
    'barcelona': 'mid', 'rome': 'mid', 'madrid': 'mid', 'berlin': 'mid',
    'vienna': 'mid', 'prague': 'mid', 'lisbon': 'mid', 'seoul': 'mid',
    'toronto': 'mid', 'chicago': 'mid', 'milan': 'mid', 'munich': 'mid',
    'abu dhabi': 'mid', 'beijing': 'mid', 'shanghai': 'mid', 'athens': 'mid',
    'dublin': 'mid', 'edinburgh': 'mid', 'brussels': 'mid', 'warsaw': 'mid',
    'budapest': 'mid', 'krakow': 'mid', 'croatia': 'mid', 'cannes': 'mid',

    // Value destinations
    'istanbul': 'value', 'bangkok': 'value', 'cairo': 'value',
    'marrakech': 'value', 'mumbai': 'value', 'delhi': 'value',
    'mexico city': 'value', 'oran': 'value', 'algiers': 'value',
    'kathmandu': 'value', 'hanoi': 'value', 'manila': 'value',
    'tbilisi': 'value', 'yerevan': 'value', 'baku': 'value',
    'casablanca': 'value', 'tunis': 'value',
    'jaipur': 'value', 'goa': 'value', 'bali': 'value', 'phuket': 'value'
  };

  // Country → tier map (broad categories)
  const COUNTRY_TIERS = {
    // Premium countries
    'switzerland': 'premium', 'norway': 'premium', 'denmark': 'premium',
    'sweden': 'premium', 'iceland': 'premium', 'luxembourg': 'premium',
    'singapore': 'premium', 'japan': 'premium', 'united states': 'premium',
    'usa': 'premium', 'uk': 'premium', 'united kingdom': 'premium',
    'canada': 'premium', 'australia': 'premium', 'new zealand': 'premium',
    'netherlands': 'premium', 'ireland': 'premium', 'finland': 'premium',
    'germany': 'premium', 'france': 'premium', 'belgium': 'premium',
    'austria': 'premium', 'south korea': 'premium', 'uae': 'premium',
    'united arab emirates': 'premium', 'qatar': 'premium', 'kuwait': 'premium',
    'saudi arabia': 'premium', 'israel': 'premium', 'monaco': 'premium',

    // Mid-tier countries
    'spain': 'mid', 'italy': 'mid', 'portugal': 'mid', 'greece': 'mid',
    'poland': 'mid', 'czech republic': 'mid', 'hungary': 'mid',
    'croatia': 'mid', 'slovenia': 'mid', 'estonia': 'mid', 'latvia': 'mid',
    'lithuania': 'mid', 'slovakia': 'mid', 'russia': 'mid', 'malaysia': 'mid',
    'china': 'mid', 'taiwan': 'mid', 'chile': 'mid', 'uruguay': 'mid',
    'argentina': 'mid', 'brazil': 'mid', 'mexico': 'mid',
    'south africa': 'mid', 'bahrain': 'mid', 'oman': 'mid',
    'jordan': 'mid', 'turkey': 'mid', 'thailand': 'mid',

    // Value countries
    'india': 'value', 'pakistan': 'value', 'bangladesh': 'value',
    'sri lanka': 'value', 'nepal': 'value', 'vietnam': 'value',
    'indonesia': 'value', 'philippines': 'value', 'cambodia': 'value',
    'laos': 'value', 'myanmar': 'value', 'egypt': 'value', 'morocco': 'value',
    'tunisia': 'value', 'algeria': 'value', 'libya': 'value',
    'ethiopia': 'value', 'kenya': 'value', 'tanzania': 'value',
    'ghana': 'value', 'nigeria': 'value', 'peru': 'value',
    'bolivia': 'value', 'ecuador': 'value', 'colombia': 'value',
    'venezuela': 'value', 'cuba': 'value', 'ukraine': 'value',
    'romania': 'value', 'bulgaria': 'value', 'serbia': 'value',
    'georgia': 'value', 'armenia': 'value', 'azerbaijan': 'value'
  };

  // =========================================================================
  // 2. Rate ranges (USD/night) — base for "moderate" budget
  // =========================================================================
  const RATE_RANGES = {
    premium: { low: 180, mid: 280, high: 450 },
    mid:     { low: 90,  mid: 140, high: 240 },
    value:   { low: 40,  mid: 70,  high: 130 },
    default: { low: 70,  mid: 120, high: 200 }
  };

  // =========================================================================
  // 3. Budget tier multipliers
  // =========================================================================
  const BUDGET_MULTIPLIERS = {
    budget:   { low: 0.6, mid: 0.55, high: 0.5  },
    moderate: { low: 1.0, mid: 1.0,  high: 1.0  },
    luxury:   { low: 1.8, mid: 2.2,  high: 2.8  }
  };

  // =========================================================================
  // 4. Property type templates
  // =========================================================================
  const PROPERTY_TYPES = [
    {
      type: 'Boutique Hotel',
      namePattern: (city, area) => `${area} Boutique Hotel`,
      descPattern: (city, area) =>
        `Stylish boutique stay in the heart of ${area}, blending local character with modern comfort. Walkable to major attractions and dining.`,
      tier: 'mid',
      featurePool: [
        '🎨 Design-led Interiors', '🍷 Rooftop Bar',
        '📍 Central Location', '🛎️ 24-hour Concierge',
        '👨‍👩‍👧 Family Rooms Available', '🌿 Courtyard Garden'
      ]
    },
    {
      type: 'Family Suite Hotel',
      namePattern: (city, area) => `${area} Family Suites`,
      descPattern: (city, area) =>
        `Spacious interconnected suites in ${area}, purpose-built for families with kitchenettes, laundry facilities, and kids' amenities.`,
      tier: 'mid',
      featurePool: [
        '👨‍👩‍👧 Interconnected Rooms', '🍳 In-room Kitchenette',
        '🧺 Self-service Laundry', '👶 Cribs & High Chairs',
        '📺 Kids TV Channels', '🎮 Family Game Room'
      ]
    },
    {
      type: 'Apartment Hotel',
      namePattern: (city, area) => `${area} Residence Apartments`,
      descPattern: (city, area) =>
        `Modern serviced apartments in ${area} with full kitchens, separate living areas, and weekly housekeeping — ideal for longer family stays.`,
      tier: 'mid',
      featurePool: [
        '🏠 Full Kitchen', '🛋️ Separate Living Area',
        '🧺 Washer/Dryer', '🚇 Near Metro',
        '🅿️ Parking Available', '📶 High-Speed Wi-Fi'
      ]
    },
    {
      type: 'Luxury Hotel',
      namePattern: (city, area) => `The ${area} Grand Hotel`,
      descPattern: (city, area) =>
        `Five-star luxury in ${area}, featuring a spa, multiple restaurants, and panoramic city views. Attentive service and elegant rooms.`,
      tier: 'high',
      featurePool: [
        '💆 Full-service Spa', '🍽️ Multiple Restaurants',
        '🏊 Indoor Pool', '🛎️ Butler Service',
        '🚗 Airport Transfer', '🥂 Evening Turndown'
      ]
    },
    {
      type: 'Heritage Property',
      namePattern: (city, area) => `${area} Heritage House`,
      descPattern: (city, area) =>
        `Restored historic property in ${area} combining original architecture with modern amenities. A character-filled stay with authentic local flavor.`,
      tier: 'mid',
      featurePool: [
        '🏛️ Historic Building', '🌿 Garden Courtyard',
        '☕ Traditional Breakfast', '📍 Old Town Location',
        '📚 Library Lounge', '🕯️ Evening Ambiance'
      ]
    },
    {
      type: 'Budget Inn',
      namePattern: (city, area) => `${area} Comfort Inn`,
      descPattern: (city, area) =>
        `Clean, practical lodging in ${area} with all essentials covered. Great value for travelers prioritizing location over luxury.`,
      tier: 'low',
      featurePool: [
        '💵 Excellent Value', '🚇 Near Public Transit',
        '🧳 Luggage Storage', '📶 Free Wi-Fi',
        '🛌 Clean Basic Rooms', '☕ 24h Coffee Station'
      ]
    }
  ];

  // =========================================================================
  // 5. Tier cache (persists across sessions)
  // =========================================================================
  const TIER_CACHE_KEY = 'tripcraft_tier_cache';

  function loadTierCache() {
    try {
      return JSON.parse(localStorage.getItem(TIER_CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveTierCache(cache) {
    try {
      localStorage.setItem(TIER_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  function getCachedTier(cityName) {
    const cache = loadTierCache();
    return cache[cityName.toLowerCase()] || null;
  }

  function setCachedTier(cityName, tier) {
    const cache = loadTierCache();
    cache[cityName.toLowerCase()] = tier;
    saveTierCache(cache);
  }

  // =========================================================================
  // 6. Multi-layer city tier detection
  // =========================================================================
  function detectCityTier(destination, country) {
    if (!destination) return 'default';

    const destLower = destination.toLowerCase();
    const countryLower = (country || '').toLowerCase();

    // Layer 0: Check localStorage cache
    const cached = getCachedTier(destLower);
    if (cached) {
      console.log(`[stay-service] Tier detected (cache): ${cached}`);
      return cached;
    }

    // Layer 1: Exact city match
    for (const city of Object.keys(CITY_TIERS)) {
      if (destLower.includes(city)) {
        const tier = CITY_TIERS[city];
        setCachedTier(destLower, tier);
        console.log(`[stay-service] Tier detected (exact): ${tier}`);
        return tier;
      }
    }

    // Layer 2: Country-based default
    const countryTier = detectCountryTier(countryLower);
    if (countryTier) {
      setCachedTier(destLower, countryTier);
      console.log(`[stay-service] Tier detected (country: ${country}): ${countryTier}`);
      return countryTier;
    }

    // Layer 3: Keyword hints in city name
    const keywordTier = detectKeywordTier(destLower);
    if (keywordTier) {
      setCachedTier(destLower, keywordTier);
      console.log(`[stay-service] Tier detected (keyword): ${keywordTier}`);
      return keywordTier;
    }

    // Layer 4: Default
    console.log(`[stay-service] Tier detected (default): default`);
    return 'default';
  }

  function detectCountryTier(countryLower) {
    if (!countryLower) return null;
    for (const country of Object.keys(COUNTRY_TIERS)) {
      if (countryLower.includes(country)) return COUNTRY_TIERS[country];
    }
    return null;
  }

  function detectKeywordTier(cityLower) {
    const premiumKeywords = ['luxury', 'premium', 'grand', 'royal', 'palace'];
    if (premiumKeywords.some(k => cityLower.includes(k))) return 'premium';

    const valueKeywords = ['budget', 'cheap', 'backpacker', 'hostel'];
    if (valueKeywords.some(k => cityLower.includes(k))) return 'value';

    return null;
  }

  // =========================================================================
  // 7. Extract primary neighborhood from trip
  // =========================================================================
   function extractPrimaryNeighborhood(trip) {
    const cityName = (trip.destination || '').split(',')[0].trim() || 'City Center';

    const neighborhoods = (trip.days || [])
      .map(d => d.neighborhood || '')
      .filter(Boolean);

    if (neighborhoods.length === 0) {
      return cityName;
    }

    // Check if the neighborhood looks generic (fallback placeholder)
    const GENERIC_PLACEHOLDERS = [
      'Historic Old Town',
      'Central Square',
      'Cultural Hilltop',
      'Garden District',
      'Atmospheric Market'
    ];

    const first = neighborhoods[0];

    // If it contains generic placeholders, use the city name instead
    if (GENERIC_PLACEHOLDERS.some(p => first.includes(p))) {
      return cityName;
    }

    let primary = first
      .replace(/^Near\s+/i, '')
      .replace(/,.*$/, '')
      .trim();

    if (primary.length > 40) primary = primary.slice(0, 40) + '…';
    return primary || cityName;
  }

  // =========================================================================
  // 8. Generate stay recommendations
  // =========================================================================
    function generateStays(trip, travelers = { total: 4, adults: 2, children: 2, seniors: 0 }) {
    const destination = trip.destination || 'Destination';
    const cityName = destination.split(',')[0].trim();
    const country = (destination.split(',')[1] || '').trim();
    const tier = detectCityTier(cityName, country);
    const budget = trip.budgetTier || 'moderate';
    const neighborhood = extractPrimaryNeighborhood(trip);

    const rateRange = RATE_RANGES[tier] || RATE_RANGES.default;
    const budgetMult = BUDGET_MULTIPLIERS[budget] || BUDGET_MULTIPLIERS.moderate;

    let propertyPool;
    if (budget === 'luxury') {
      propertyPool = ['Luxury Hotel', 'Boutique Hotel', 'Heritage Property'];
    } else if (budget === 'budget') {
      propertyPool = ['Budget Inn', 'Apartment Hotel', 'Boutique Hotel'];
    } else {
      propertyPool = ['Boutique Hotel', 'Family Suite Hotel', 'Apartment Hotel', 'Heritage Property'];
    }

    // 👇 Extract real neighborhoods from POIs if available
    let realNeighborhoods = [];
    if (trip.pois && trip.pois.length > 0 && window.StayImageService) {
      realNeighborhoods = window.StayImageService.extractNeighborhoods(trip.pois, cityName);
      console.log('[stay-service] Extracted neighborhoods:', realNeighborhoods);
    }

    const stays = [];
    const usedTypes = new Set();

    for (let i = 0; i < 3 && i < propertyPool.length; i++) {
      let propType = propertyPool.find(p => !usedTypes.has(p));
      if (!propType) propType = propertyPool[i];
      usedTypes.add(propType);

      const spec = PROPERTY_TYPES.find(p => p.type === propType);
      if (!spec) continue;

      let baseRate;
      if (spec.tier === 'high') baseRate = rateRange.high;
      else if (spec.tier === 'low') baseRate = rateRange.low;
      else {
        const midTiers = [rateRange.low, rateRange.mid, rateRange.high];
        baseRate = midTiers[i % midTiers.length];
      }

      const jitter = 0.92 + Math.random() * 0.16;
      const nightlyRate = Math.round(baseRate * budgetMult.mid * jitter);

      // Pick a neighborhood (real one preferred)
      const usedNeighborhood =
        realNeighborhoods[i] ||
        realNeighborhoods[i % realNeighborhoods.length] ||
        neighborhood;

      stays.push(buildStay({
        index: i,
        spec,
        cityName,
        country,
        neighborhood: usedNeighborhood,  // 👈 use real neighborhood
        nightlyRate,
        travelers,
        trip,
        detectedTier: tier
      }));
    }

    console.log(`[stay-service] Generated ${stays.length} stays for ${cityName} (tier: ${tier}, budget: ${budget})`);
    return stays;
  }

  // =========================================================================
  // 9. Stay image pool
  // =========================================================================
   const STAY_IMAGE_POOL = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format'
  ];

    function buildStay({ index, spec, cityName, country, neighborhood, nightlyRate, travelers, trip, detectedTier }) {
    const id = `stay-${cityName.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.now()}`;

    // Generate a realistic hotel name using the neighborhood
    let name;
    if (window.StayImageService?.generateHotelName) {
      name = window.StayImageService.generateHotelName(neighborhood, spec.type, index);
    } else {
      name = spec.namePattern(cityName, neighborhood);
    }

    // Rating
    const baseRating = 4.4 + Math.random() * 0.5;
    const rating = baseRating.toFixed(2);

    // Features
    const features = shuffle(spec.featurePool).slice(0, 4);

    const accessibilityFeatures = [];
    if (travelers.children > 0) accessibilityFeatures.push('👶 Stroller-Friendly');
    if (travelers.seniors > 0) accessibilityFeatures.push('♿ Accessible Rooms');
    if (features.some(f => f.includes('Location')) || features.some(f => f.includes('Metro'))) {
      accessibilityFeatures.push('📍 Central Walkable Location');
    }

    const allFeatures = [...new Set([...accessibilityFeatures, ...features])].slice(0, 5);

    // Image — use the rotating pool as a temporary placeholder.
    // The image service will replace it after fetching.
    const image = (window.StayImageService?.FALLBACK_POOL?.[index % 6]) ||
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format';

    return {
      id,
      name,
      type: spec.type,
      neighborhood: `${neighborhood}${country ? ', ' + country : ''}`,
      image,
      imageSource: 'pending', // will become 'unsplash' | 'cache' | 'fallback'
      rating,
      pricePerNight: nightlyRate,
      detectedTier,
      fitBanner: buildFitBanner(travelers, spec.type),
      features: allFeatures,
      bookingUrl: buildBookingSearchUrl(cityName, spec.type),
      description: spec.descPattern(cityName, neighborhood)
    };
  }

  // =========================================================================
  // 10. Fit banner
  // =========================================================================
  function buildFitBanner(travelers, propType) {
    const { total, children, seniors } = travelers;
    const parts = [];

    if (propType === 'Family Suite Hotel') {
      parts.push(`✓ Interconnected Family Suites for ${total} Guests`);
    } else if (propType === 'Apartment Hotel') {
      parts.push(`✓ Full Apartment for ${total} Guests`);
    } else if (propType === 'Luxury Hotel') {
      parts.push(`✓ Premium Rooms for ${total} Guests`);
    } else {
      parts.push(`✓ Accommodates ${total} Guests`);
    }

    if (children > 0) parts.push(`👶 Crib & High Chair`);
    if (seniors > 0) parts.push(`♿ Accessible Access`);

    return parts.join(' • ');
  }

  // =========================================================================
  // 11. Booking search URL (deep-links to Booking.com)
  // =========================================================================
  function buildBookingSearchUrl(cityName, type) {
    const query = encodeURIComponent(`${cityName} ${type}`);
    return `https://www.booking.com/searchresults.html?ss=${query}`;
  }

  // =========================================================================
  // 12. Shuffle helper
  // =========================================================================
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // =========================================================================
  // 13. Debug helpers
  // =========================================================================
  function inspectTier(destination) {
    const cityName = (destination || '').split(',')[0].trim();
    const country = (destination || '').split(',')[1]?.trim() || '';
    const tier = detectCityTier(cityName, country);
    const rate = RATE_RANGES[tier] || RATE_RANGES.default;
    return { cityName, country, tier, rate };
  }

  function clearTierCache() {
    try {
      localStorage.removeItem(TIER_CACHE_KEY);
      console.log('[stay-service] Tier cache cleared');
    } catch {}
  }
    
  // =========================================================================
  // Public API
  // =========================================================================
  window.StayService = {
    generateStays,
    detectCityTier,
    extractPrimaryNeighborhood,
    inspectTier,
    clearTierCache,
    CITY_TIERS,
    COUNTRY_TIERS,
    RATE_RANGES
  };
})();
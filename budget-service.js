/**
 * TripCraft — Real Budget Reference Service (World Bank API)
 * Fetches live country-level economic data to compute realistic budget ranges.
 * No API key required. Data: CC BY 4.0 (The World Bank).
 */
(function () {
  'use strict';

  const WB_BASE = 'https://api.worldbank.org/v2';

  // ==========================================================================
  // Country name → ISO2 code mapping (subset; fallback to text search)
  // ==========================================================================
  const COUNTRY_ISO2 = {
    'united arab emirates': 'AE',
    'uae': 'AE',
    'saudi arabia': 'SA',
    'qatar': 'QA',
    'kuwait': 'KW',
    'bahrain': 'BH',
    'oman': 'OM',
    'jordan': 'JO',
    'lebanon': 'LB',
    'egypt': 'EG',
    'france': 'FR',
    'united kingdom': 'GB',
    'uk': 'GB',
    'italy': 'IT',
    'spain': 'ES',
    'portugal': 'PT',
    'netherlands': 'NL',
    'germany': 'DE',
    'austria': 'AT',
    'switzerland': 'CH',
    'czech republic': 'CZ',
    'hungary': 'HU',
    'greece': 'GR',
    'turkey': 'TR',
    'russia': 'RU',
    'sweden': 'SE',
    'denmark': 'DK',
    'norway': 'NO',
    'finland': 'FI',
    'ireland': 'IE',
    'united states': 'US',
    'usa': 'US',
    'canada': 'CA',
    'mexico': 'MX',
    'japan': 'JP',
    'south korea': 'KR',
    'korea': 'KR',
    'china': 'CN',
    'hong kong': 'HK',
    'singapore': 'SG',
    'thailand': 'TH',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'philippines': 'PH',
    'vietnam': 'VN',
    'india': 'IN',
    'nepal': 'NP',
    'sri lanka': 'LK',
    'south africa': 'ZA',
    'morocco': 'MA',
    'kenya': 'KE',
    'ethiopia': 'ET',
    'ghana': 'GH',
    'nigeria': 'NG',
    'brazil': 'BR',
    'argentina': 'AR',
    'peru': 'PE',
    'colombia': 'CO',
    'chile': 'CL',
    'australia': 'AU',
    'new zealand': 'NZ'
  };

  // ==========================================================================
  // Baseline country for index computation (US = 1.0)
  // ==========================================================================
  const BASELINE = { gdpPerCapita: 80000 }; // USD, approximate US value

  // ==========================================================================
  // Tier multipliers
  // ==========================================================================
  const TIER_MULTIPLIERS = {
    budget:   { food: 0.65, lodging: 0.5,  transit: 0.75, activities: 0.65 },
    moderate: { food: 1.0,  lodging: 1.0,  transit: 1.0,  activities: 1.0 },
    luxury:   { food: 2.2,  lodging: 2.8,  transit: 2.0,  activities: 1.8 }
  };

  // ==========================================================================
  // Base daily cost ranges for "moderate tier in US" (USD, per person)
  // World Bank data will scale these up or down per country.
  // ==========================================================================
  const US_BASE = {
    foodLow: 30, foodHigh: 85,
    lodgingLow: 75, lodgingHigh: 280,
    transitLow: 8, transitHigh: 22,
    actLow: 20, actHigh: 60
  };

  // ==========================================================================
  // Cache layer (in-memory + localStorage, 24h TTL)
  // ==========================================================================
  const CACHE_KEY = 'tripcraft_wb_cache';
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const now = Date.now();
      const fresh = {};
      Object.keys(parsed).forEach(k => {
        if (now - parsed[k].timestamp < CACHE_TTL) fresh[k] = parsed[k];
      });
      return fresh;
    } catch { return {}; }
  }

  function saveCache(cache) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
  }

  let cache = loadCache();

  // ==========================================================================
  // Fetch World Bank indicator for a country
  // ==========================================================================
  async function fetchIndicator(iso2, indicatorCode) {
    const cacheKey = `${iso2}:${indicatorCode}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].value;
    }

    const url = `${WB_BASE}/country/${iso2}/indicator/${indicatorCode}?format=json&per_page=5&mrnev=1`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json?.[1]?.[0];
      if (!data || data.value == null) throw new Error('No data');

      const value = parseFloat(data.value);
      cache[cacheKey] = { value, timestamp: Date.now() };
      saveCache(cache);
      return value;
    } catch (err) {
      console.warn(`[budget-service] WB fetch failed for ${iso2}/${indicatorCode}:`, err.message);
      return null;
    }
  }

  // ==========================================================================
  // Resolve country name → ISO2 code
  // ==========================================================================
  function resolveISO2(country) {
    if (!country) return null;
    const key = country.toLowerCase().trim();
    return COUNTRY_ISO2[key] || null;
  }

  // ==========================================================================
  // Compute budget ranges using World Bank data
  // ==========================================================================
  async function getRange(destination, tier = 'moderate') {
    const parts = (destination || '').split(',').map(s => s.trim());
    const country = parts[1] || parts[0];
    const iso2 = resolveISO2(country);

    // Default multiplier if no country data available
    let costIndex = 1.0;
    let dataSource = 'global_default';

    if (iso2) {
      // Fetch GDP per capita + CPI in parallel
      const [gdpPerCapita, cpi] = await Promise.all([
        fetchIndicator(iso2, 'NY.GDP.PCAP.CD'),
        fetchIndicator(iso2, 'FP.CPI.TOTL')
      ]);

      if (gdpPerCapita != null) {
        // Cost index = sqrt(GDP ratio) to soften extremes
        // Example: country with 40k GDP → index = sqrt(40/80) = 0.707
        // Country with 100k GDP → index = sqrt(100/80) = 1.118
        costIndex = Math.sqrt(gdpPerCapita / BASELINE.gdpPerCapita);
        dataSource = 'world_bank_gdp';

        // Clamp to avoid absurd values
        costIndex = Math.max(0.25, Math.min(3.0, costIndex));
      }
    }

    // Apply country cost index to US baseline
    const indexed = {
      foodLow:  Math.round(US_BASE.foodLow * costIndex),
      foodHigh: Math.round(US_BASE.foodHigh * costIndex),
      lodgingLow:  Math.round(US_BASE.lodgingLow * costIndex),
      lodgingHigh: Math.round(US_BASE.lodgingHigh * costIndex),
      transitLow:  Math.round(US_BASE.transitLow * costIndex),
      transitHigh: Math.round(US_BASE.transitHigh * costIndex),
      actLow:  Math.round(US_BASE.actLow * costIndex),
      actHigh: Math.round(US_BASE.actHigh * costIndex)
    };

    // Apply tier multiplier
    const mult = TIER_MULTIPLIERS[tier] || TIER_MULTIPLIERS.moderate;

    return {
      foodLow:  Math.round(indexed.foodLow * mult.food),
      foodHigh: Math.round(indexed.foodHigh * mult.food),
      lodgingLow:  Math.round(indexed.lodgingLow * mult.lodging),
      lodgingHigh: Math.round(indexed.lodgingHigh * mult.lodging),
      transitLow:  Math.round(indexed.transitLow * mult.transit),
      transitHigh: Math.round(indexed.transitHigh * mult.transit),
      actLow:  Math.round(indexed.actLow * mult.activities),
      actHigh: Math.round(indexed.actHigh * mult.activities),
      country,
      iso2,
      costIndex,
      source: dataSource
    };
  }

  // ==========================================================================
  // Compute full trip ranges
  // ==========================================================================
  function computeTripRanges(range, totalTravelers, durationDays, transportLow, transportHigh) {
    const nights = durationDays;

    const diningLow  = range.foodLow  * totalTravelers * durationDays;
    const diningHigh = range.foodHigh * totalTravelers * durationDays;
    const ticketsLow  = range.actLow  * totalTravelers * durationDays;
    const ticketsHigh = range.actHigh * totalTravelers * durationDays;
    const transitLow  = range.transitLow  * totalTravelers * durationDays;
    const transitHigh = range.transitHigh * totalTravelers * durationDays;
    const lodgingLow  = range.lodgingLow  * nights;
    const lodgingHigh = range.lodgingHigh * nights;

    const totalLow  = diningLow + ticketsLow + transitLow + lodgingLow + (transportLow || 0);
    const totalHigh = diningHigh + ticketsHigh + transitHigh + lodgingHigh + (transportHigh || 0);

    return {
      totalLow: Math.round(totalLow),
      totalHigh: Math.round(totalHigh),
      dailyLow: Math.round(totalLow / durationDays),
      dailyHigh: Math.round(totalHigh / durationDays),
      perPersonLow: Math.round(totalLow / totalTravelers),
      perPersonHigh: Math.round(totalHigh / totalTravelers),
      lodgingLow: Math.round(lodgingLow),
      lodgingHigh: Math.round(lodgingHigh),
      diningLow: Math.round(diningLow),
      diningHigh: Math.round(diningHigh),
      ticketsLow: Math.round(ticketsLow),
      ticketsHigh: Math.round(ticketsHigh),
      transitLow: Math.round(transitLow),
      transitHigh: Math.round(transitHigh),
      source: range.source,
      costIndex: range.costIndex
    };
  }

  window.BudgetService = {
    getRange,
    computeTripRanges,
    resolveISO2
  };
})();
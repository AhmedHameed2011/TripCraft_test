/**
 * TripCraft — Live Currency Service
 * Fetches daily exchange rates from a free, keyless API.
 */
(function () {
  'use strict';

  const API_BASE = 'https://cdn.jsdelivr.net/gh/irfanokr/currency-api@main/v1/currencies/';

  const CurrencyService = {
    rates: null,
    lastUpdated: null,

    async loadRates(baseCurrency = 'usd') {
      try {
        const response = await fetch(`${API_BASE}${baseCurrency}.min.json`);
        if (!response.ok) throw new Error('Failed to fetch currency rates');
        const data = await response.json();
        this.rates = data[baseCurrency]; // The API returns rates inside a nested object
        this.lastUpdated = data.date;
        console.log('[currency] Rates loaded for', data.date);
        return this.rates;
      } catch (err) {
        console.warn('[currency] Could not load live rates, using fallback:', err.message);
        return null;
      }
    },

    getRate(currencyCode) {
      if (!this.rates) return null;
      return this.rates[currencyCode.toLowerCase()];
    }
  };

  window.CurrencyService = CurrencyService;
})();
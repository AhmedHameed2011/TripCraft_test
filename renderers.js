// renderers.js - UI Rendering Engine

import { CURRENCIES, TRANSLATIONS } from './constants.js';
import { state, PRESET_TRIPS, getCurrentTrip } from './state.js';
import { showToast } from './toast.js';

export function t(key) {
  const dict = TRANSLATIONS[state.currentLang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function formatMoney(amountInUSD) {
  const curr = CURRENCIES[state.currentCurrency] || CURRENCIES.USD;
  const converted = Math.round(amountInUSD * curr.rate);
  if (state.currentCurrency === 'JPY') {
    return `${curr.symbol}${converted.toLocaleString()}`;
  }
  if (state.currentCurrency === 'SAR') {
    return `${converted.toLocaleString()} ${curr.symbol}`;
  }
  return `${curr.symbol}${converted.toLocaleString()}`;
}

export function populateTripDropdown() {
  const tripSelect = document.getElementById('tripSelect');
  if (!tripSelect) return;
  tripSelect.innerHTML = PRESET_TRIPS.map((trip, idx) => 
    `<option value="${idx}">${trip.destination} (${trip.durationDays} Days)</option>`
  ).join('');
  tripSelect.value = state.currentTripIndex;
}

export function renderTripHero() {
  const trip = getCurrentTrip();
  const backdrop = document.getElementById('heroBackdrop');
  if (backdrop && trip.heroImage) {
    backdrop.style.backgroundImage = `url('${trip.heroImage}')`;
  }

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = trip.title;

  const heroSubtitle = document.getElementById('heroSubtitle');
  if (heroSubtitle) heroSubtitle.textContent = trip.subtitle;

  const heroTripType = document.getElementById('heroTripType');
  if (heroTripType) heroTripType.textContent = trip.tripType;

  const heroDuration = document.getElementById('heroDuration');
  if (heroDuration) heroDuration.textContent = `${trip.durationDays} Days`;

  const heroWeatherText = document.getElementById('heroWeatherText');
  if (heroWeatherText) heroWeatherText.textContent = `${trip.weather.temp} • Weather Optimized`;

  const metricTravelers = document.getElementById('metricTravelers');
  if (metricTravelers) metricTravelers.textContent = trip.travelers.summary;

  const metricStay = document.getElementById('metricStay');
  if (metricStay && trip.stays.length) metricStay.textContent = trip.stays[0].name;

  const metricDailySpend = document.getElementById('metricDailySpend');
  if (metricDailySpend) metricDailySpend.textContent = `${formatMoney(trip.budgetBreakdown.dailyAverage)} / day`;

  const metricNeighborhood = document.getElementById('metricNeighborhood');
  if (metricNeighborhood && trip.days.length) metricNeighborhood.textContent = trip.days[0].neighborhood;
}

export function renderItinerary() {
  const container = document.getElementById('itinerary');
  if (!container) return;

  const trip = getCurrentTrip();
  const day = trip.days[state.activeDayIndex] || trip.days[0];

  let dayPillsHtml = trip.days.map((d, idx) => `
    <button class="day-pill-btn ${idx === state.activeDayIndex ? 'active' : ''}" data-day-index="${idx}" type="button">
      <span class="pill-day-label">Day ${d.dayNumber}</span>
      <span class="pill-day-title">${d.neighborhood.split(',')[0]}</span>
    </button>
  `).join('');

  const phases = [
    { key: 'morning', label: 'Morning', badgeClass: 'phase-morning' },
    { key: 'lunch', label: 'Lunch Spot', badgeClass: 'phase-lunch' },
    { key: 'afternoon', label: 'Afternoon', badgeClass: 'phase-afternoon' },
    { key: 'evening', label: 'Evening', badgeClass: 'phase-evening' }
  ];

  let slotsHtml = phases.map(phase => {
    const slot = day[phase.key];
    if (!slot) return '';
    return `
      <div class="timeline-slot-card ${slot.completed ? 'completed' : ''}">
        <div class="slot-time-column">
          <span class="slot-phase-pill ${phase.badgeClass}">${phase.label}</span>
          <span class="slot-time-range">${slot.time}</span>
        </div>
        <div class="slot-content-column">
          <div class="slot-top-row">
            <div class="slot-name-group">
              <h3 class="dual-name-title">${slot.dualName}</h3>
            </div>
            <span class="slot-category-badge">${slot.category}</span>
          </div>
          <p class="slot-description">${slot.desc}</p>
          <div class="slot-flags-row">
            <span class="flag-chip weather-chip">${slot.weatherBadge}</span>
            ${slot.accessibility ? slot.accessibility.map(a => `<span class="flag-chip access-chip">${a}</span>`).join('') : ''}
            <span class="flag-chip cost-chip">${slot.cost === 0 ? 'Free Entry' : formatMoney(slot.cost)}</span>
          </div>
          <div class="slot-actions-bar">
            <label class="completion-check-label">
              <input type="checkbox" class="completion-checkbox" data-slot="${phase.key}" ${slot.completed ? 'checked' : ''}>
              <span>${slot.completed ? t('completed') : t('markCompleted')}</span>
            </label>
            <div class="slot-btn-group">
              <button class="btn btn-sm btn-secondary" type="button" onclick="window.showToast('${t('btnSwap')} triggered')">${t('btnSwap')}</button>
              <button class="btn btn-sm btn-secondary" type="button" onclick="window.showToast('${t('btnBook')} triggered')">${t('btnBook')}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="itinerary-header-bar">
      <div class="day-pills-scroller">${dayPillsHtml}</div>
    </div>

    <div class="day-context-banner">
      <div class="context-group">
        <div class="context-icon-wrap geo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div>
          <div class="context-title">${t('labelNeighborhoodCluster')}</div>
          <div class="context-value">${day.neighborhood}</div>
          <div class="context-subtext">${t('transitOptimizedSubtext')}</div>
        </div>
      </div>
      <div class="context-group">
        <div class="context-icon-wrap weather">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
        </div>
        <div>
          <div class="context-title">${t('labelWeatherAdaptation')}</div>
          <div class="context-value">${day.weatherPlan}</div>
        </div>
      </div>
    </div>

    <div class="timeline-blocks-wrapper">${slotsHtml}</div>
  `;

  // Listening Events
  container.querySelectorAll('.day-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.activeDayIndex = parseInt(e.currentTarget.getAttribute('data-day-index'), 10);
      renderItinerary();
    });
  });

  container.querySelectorAll('.completion-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const slotKey = e.target.getAttribute('data-slot');
      if (day[slotKey]) {
        day[slotKey].completed = e.target.checked;
        renderItinerary();
        showToast(e.target.checked ? 'Marked as completed' : 'Marked as pending');
      }
    });
  });
}

export function renderStays() {
  const container = document.getElementById('stays');
  if (!container) return;

  const trip = getCurrentTrip();

  let staysCardsHtml = trip.stays.map(stay => `
    <div class="stay-card">
      <div class="stay-image-wrap">
        <div class="stay-rating-overlay">★ ${stay.rating}</div>
      </div>
      <div class="stay-body">
        <div class="stay-header-row">
          <h3 class="stay-title">${stay.name}</h3>
          <div>
            <span class="stay-rate">${formatMoney(stay.pricePerNight)}</span>
            <span class="stay-rate-sub"> ${t('perNight')}</span>
          </div>
        </div>
        <div class="stay-fit-banner">${stay.fitBanner}</div>
        <p class="stay-desc">${stay.description}</p>
        <div class="stay-features-list">
          ${stay.features.map(f => `<span class="flag-chip family-chip">${f}</span>`).join('')}
        </div>
        <a href="${stay.bookingUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-block">${t('btnBook')}</a>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="panel-header">
      <div>
        <h2 class="panel-title">${t('staysHeaderTitle')}</h2>
        <p class="panel-subtitle">${t('staysHeaderSubtitle')}</p>
      </div>
      <div class="stays-filter-pill-bar">
        <span class="filter-label">${t('filterBy')}</span>
        <button class="pill-btn active" type="button">${t('filterAll')}</button>
        <button class="pill-btn" type="button">${t('filterFamilySuites')}</button>
        <button class="pill-btn" type="button">${t('filterAccessible')}</button>
        <button class="pill-btn" type="button">${t('filterCentral')}</button>
      </div>
    </div>
    <div class="stays-grid">${staysCardsHtml}</div>
  `;
}

export function renderBudget() {
  const container = document.getElementById('budget');
  if (!container) return;

  const trip = getCurrentTrip();
  const b = trip.budgetBreakdown;

  container.innerHTML = `
    <div class="panel-header">
      <div>
        <h2 class="panel-title">${t('budgetHeaderTitle')}</h2>
        <p class="panel-subtitle">${t('budgetHeaderSubtitle')}</p>
      </div>
    </div>

    <div class="budget-kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">${t('totalEstTripCost')}</span>
        <div class="kpi-number">${formatMoney(b.totalTripCost)}</div>
        <span class="kpi-caption">${t('includesAllExpenses')}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t('dailySpendAverage')}</span>
        <div class="kpi-number">${formatMoney(b.dailyAverage)}</div>
        <span class="kpi-caption">Per day across group</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t('perPersonEstimate')}</span>
        <div class="kpi-number">${formatMoney(b.perPersonTotal)}</div>
        <span class="kpi-caption">${t('perTravelerTotal')}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">${t('budgetStatus')}</span>
        <div class="kpi-number text-success">${t('onTrack')}</div>
        <span class="kpi-caption">${t('alignedWithTier')}</span>
      </div>
    </div>

    <div class="expense-breakdown-card">
      <h3 class="card-title">${t('categoryBreakdownTitle')}</h3>
      <div class="progress-bar-segmented">
        <div class="seg-lodging" style="width: ${b.lodgingPct}%"></div>
        <div class="seg-dining" style="width: ${b.diningPct}%"></div>
        <div class="seg-tickets" style="width: ${b.ticketsPct}%"></div>
        <div class="seg-transit" style="width: ${b.transitPct}%"></div>
      </div>
      <div class="expense-legend-row">
        <div class="legend-item"><span class="dot lodging"></span> ${t('catLodging')} (${b.lodgingPct}%) - ${formatMoney(b.lodgingTotal)}</div>
        <div class="legend-item"><span class="dot dining"></span> ${t('catDining')} (${b.diningPct}%) - ${formatMoney(b.diningTotal)}</div>
        <div class="legend-item"><span class="dot tickets"></span> ${t('catTickets')} (${b.ticketsPct}%) - ${formatMoney(b.ticketsTotal)}</div>
        <div class="legend-item"><span class="dot transit"></span> ${t('catTransit')} (${b.transitPct}%) - ${formatMoney(b.transitTotal)}</div>
      </div>
    </div>

    <div class="table-card">
      <h3 class="card-title">${t('dailyCostBreakdownTitle')}</h3>
      <div class="table-responsive">
        <table class="cost-table">
          <thead>
            <tr>
              <th>${t('thDay')}</th>
              <th>${t('thNeighborhood')}</th>
              <th>${t('thMeals')}</th>
              <th>${t('thTickets')}</th>
              <th>${t('thTransit')}</th>
              <th>${t('thDailyTotal')}</th>
            </tr>
          </thead>
          <tbody>
            ${trip.days.map(d => `
              <tr>
                <td><strong>${d.dateLabel}</strong></td>
                <td>${d.neighborhood}</td>
                <td>${formatMoney(120)}</td>
                <td>${formatMoney(75)}</td>
                <td>${formatMoney(35)}</td>
                <td><strong>${formatMoney(230)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function applyLanguage(lang) {
  state.currentLang = lang;
  localStorage.setItem('tripcraft_lang', lang);

  const htmlEl = document.documentElement;
  htmlEl.lang = lang;
  htmlEl.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && t(key)) {
      el.textContent = t(key);
    }
  });

  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = lang;

  renderAllViews();
}

export function renderAllViews() {
  renderTripHero();
  renderItinerary();
  renderStays();
  renderBudget();
}
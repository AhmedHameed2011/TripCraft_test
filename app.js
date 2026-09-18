// app.js - Main Application Orchestrator & Entry Point
// في بداية ملف app.js
import { CURRENCIES, TRANSLATIONS } from './constants.js';

// بقية كود التطبيق...

import { CURRENCIES } from './constants.js';
import { state, PRESET_TRIPS } from './state.js';
import { showToast } from './toast.js';
import { initAuth } from './auth.js';
import { 
  renderAllViews, 
  populateTripDropdown, 
  applyLanguage 
} from './renderers.js';

// Modal Controls
function openModal(modalEl) {
  if (modalEl) modalEl.classList.add('active');
}

function closeModal(modalEl) {
  if (modalEl) modalEl.classList.remove('active');
}

function initEventListeners() {
  // Tabs Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      const panel = document.getElementById(targetTab);
      if (panel) panel.classList.add('active');
    });
  });

  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('tripcraft_theme', newTheme);
    });
  }

  // Language Selector
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });
  }

  // Currency Selector
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.value = state.currentCurrency;
    const badge = document.getElementById('currencySymbolBadge');
    if (badge && CURRENCIES[state.currentCurrency]) {
      badge.textContent = CURRENCIES[state.currentCurrency].symbol;
    }

    currencySelect.addEventListener('change', (e) => {
      state.currentCurrency = e.target.value;
      localStorage.setItem('tripcraft_currency', state.currentCurrency);
      if (badge && CURRENCIES[state.currentCurrency]) {
        badge.textContent = CURRENCIES[state.currentCurrency].symbol;
      }
      renderAllViews();
    });
  }

  // Trip Selector
  const tripSelect = document.getElementById('tripSelect');
  if (tripSelect) {
    tripSelect.addEventListener('change', (e) => {
      state.currentTripIndex = parseInt(e.target.value, 10) || 0;
      state.activeDayIndex = 0;
      renderAllViews();
    });
  }

  // Modal Triggers
  const btnNewTrip = document.getElementById('btnNewTrip');
  if (btnNewTrip) {
    btnNewTrip.addEventListener('click', () => openModal(document.getElementById('newTripModal')));
  }

  const btnLoginModal = document.getElementById('btnLoginModal');
  if (btnLoginModal) {
    btnLoginModal.addEventListener('click', () => openModal(document.getElementById('loginModal')));
  }

  const btnRegisterModal = document.getElementById('btnRegisterModal');
  if (btnRegisterModal) {
    btnRegisterModal.addEventListener('click', () => openModal(document.getElementById('registerModal')));
  }

  // Modal Close Handlers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      closeModal(modal);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Forms Actions
  const newTripForm = document.getElementById('newTripForm');
  if (newTripForm) {
    newTripForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dest = document.getElementById('inputDestination').value || 'Custom Voyage';
      const duration = parseInt(document.getElementById('inputDuration').value, 10) || 3;
      const adults = parseInt(document.getElementById('inputAdults').value, 10) || 2;
      const children = parseInt(document.getElementById('inputChildren').value, 10) || 0;
      const type = document.getElementById('selectTripType').value;

      const newTripObj = {
        id: `trip-custom-${Date.now()}`,
        destination: dest,
        country: 'Global',
        heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
        title: `${dest} Expedition`,
        subtitle: `Custom tailored ${duration}-day journey focusing on ${type.toLowerCase()}.`,
        tripType: type,
        durationDays: duration,
        travelers: {
          total: adults + children,
          adults: adults,
          children: children,
          summary: `${adults + children} Travelers (${adults} Adults, ${children} Kids)`
        },
        budgetTier: 'moderate',
        weather: { temp: '22°C', condition: 'Pleasant', icon: '☀️', notes: 'Optimized schedule.' },
        stays: [
          {
            id: `stay-${Date.now()}`,
            name: `Central Suite ${dest.split(',')[0]}`,
            type: 'Boutique Stay',
            neighborhood: 'City Center',
            rating: '4.88',
            pricePerNight: 180,
            fitBanner: '✓ Recommended match for your group',
            features: ['📍 Central Access', '👨‍👩‍👧 Family Preferred'],
            bookingUrl: '#',
            description: 'Comfortable accommodation close to public transit and major city sights.'
          }
        ],
        days: Array.from({ length: duration }, (_, i) => ({
          dayNumber: i + 1,
          dateLabel: `Day ${i + 1}`,
          neighborhood: `${dest.split(',')[0]} Highlight District`,
          weatherPlan: '☀️ Weather-optimized for walking and exploration.',
          morning: {
            dualName: 'City Center Exploration',
            category: 'Sightseeing',
            time: '09:30 - 11:30',
            desc: `Discover the top cultural landmark in ${dest}.`,
            weatherBadge: '☀️ Morning Tour',
            accessibility: ['♿ Accessible Access'],
            cost: 15,
            completed: false
          },
          lunch: {
            dualName: 'Local Culinary Market',
            category: 'Dining',
            time: '12:00 - 13:30',
            desc: 'Authentic local cuisine and regional specialties.',
            weatherBadge: '❄️ Indoor Dining',
            accessibility: ['👨‍👩‍👧 Family Seating'],
            cost: 30,
            completed: false
          },
          afternoon: {
            dualName: 'Regional Museum & Gardens',
            category: 'Culture & Nature',
            time: '14:00 - 16:30',
            desc: 'Relaxing afternoon walk through local heritage exhibits.',
            weatherBadge: '🏛️ Indoor/Outdoor',
            accessibility: ['👶 Stroller-Friendly'],
            cost: 20,
            completed: false
          },
          evening: {
            dualName: 'Sunset Promenade & Dinner',
            category: 'Nightlife',
            time: '18:00 - 20:00',
            desc: 'Evening dining experience with local atmosphere.',
            weatherBadge: '🌆 Evening Breeze',
            accessibility: ['👶 Smooth Walkway'],
            cost: 40,
            completed: false
          }
        })),
        budgetBreakdown: {
          totalTripCost: duration * 220,
          dailyAverage: 220,
          perPersonTotal: Math.round((duration * 220) / (adults + children)),
          lodgingTotal: Math.round(duration * 110),
          diningTotal: Math.round(duration * 60),
          ticketsTotal: Math.round(duration * 30),
          transitTotal: Math.round(duration * 20),
          lodgingPct: 50,
          diningPct: 27,
          ticketsPct: 14,
          transitPct: 9
        }
      };

      PRESET_TRIPS.push(newTripObj);
      state.currentTripIndex = PRESET_TRIPS.length - 1;
      populateTripDropdown();
      renderAllViews();

      closeModal(document.getElementById('newTripModal'));
      showToast(`Trip to ${dest} generated successfully!`);
      newTripForm.reset();
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal(document.getElementById('loginModal'));
      showToast('Logged in successfully!');
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal(document.getElementById('registerModal'));
      showToast('Account created successfully!');
    });
  }
}

// System Boot
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('tripcraft_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  populateTripDropdown();
  applyLanguage(state.currentLang);
  initEventListeners();
  initAuth(() => {
    populateTripDropdown();
    renderAllViews();
  });
});
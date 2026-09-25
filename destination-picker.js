/**
 * TripCraft — Destination Picker UI
 * Searchable city/country dropdown. On selection, updates the hero background
 * and a weather widget, keeping everything synchronized via a request token.
 */
(function () {
  'use strict';

  function initDestinationPicker() {
    const input = document.getElementById('inputDestination');
    if (!input) return;

    // ----------------------------------------------------------------
    // Build UI wrapper — hides original input, adds our components
    // ----------------------------------------------------------------
    const wrapper = document.createElement('div');
    wrapper.className = 'destination-picker-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const dropdown = document.createElement('div');
    dropdown.className = 'destination-dropdown';
    dropdown.style.display = 'none';
    wrapper.appendChild(dropdown);

    const loading = document.createElement('div');
    loading.className = 'destination-loading';
    loading.style.display = 'none';
    wrapper.appendChild(loading);

    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = 'destination-selected';
    selectedDisplay.style.display = 'none';
    wrapper.appendChild(selectedDisplay);

    // Weather widget — placed after the form group, not inside the wrapper
    const formGroup = input.closest('.form-group');
    let weatherWidget = null;
    if (formGroup) {
      weatherWidget = document.createElement('div');
      weatherWidget.className = 'destination-weather-widget';
      weatherWidget.style.display = 'none';
      formGroup.appendChild(weatherWidget);
    }

    // ----------------------------------------------------------------
    // State
    // ----------------------------------------------------------------
    let selectedDestination = null;
    let requestToken = 0;
    let debounceTimer = null;
    let lastQuery = '';

    // ----------------------------------------------------------------
    // Input handling
    // ----------------------------------------------------------------
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q === lastQuery) return;
      lastQuery = q;

      clearTimeout(debounceTimer);

      if (q.length < 2) { hideDropdown(); return; }

      debounceTimer = setTimeout(async () => {
        await performSearch(q);
      }, 300);
    });

    input.addEventListener('focus', () => {
      if (dropdown.children.length > 0) dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) hideDropdown();
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.destination-item');
      const active = dropdown.querySelector('.destination-item.active');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = active ? active.nextElementSibling : items[0];
        if (next) {
          active?.classList.remove('active');
          next.classList.add('active');
          next.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = active ? active.previousElementSibling : items[items.length - 1];
        if (prev) {
          active?.classList.remove('active');
          prev.classList.add('active');
          prev.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        if (active) { e.preventDefault(); active.click(); }
      } else if (e.key === 'Escape') {
        hideDropdown();
      }
    });

    // ----------------------------------------------------------------
    // Search
    // ----------------------------------------------------------------
    async function performSearch(query) {
      showLoading();
      try {
        const results = await window.DestinationService.searchCities(query);
        hideLoading();
        renderResults(results);
      } catch (err) {
        hideLoading();
        renderError();
      }
    }

    function renderResults(results) {
      dropdown.innerHTML = '';
      if (!results || results.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'destination-empty';
        empty.textContent = tt('destNoResults', 'No destinations found');
        dropdown.appendChild(empty);
        return showDropdown();
      }
      results.forEach(dest => {
        const item = document.createElement('div');
        item.className = 'destination-item';
        item.setAttribute('role', 'option');

        const flag = document.createElement('span');
        flag.className = 'destination-flag';
        flag.textContent = countryFlag(dest.countryCode);

        const name = document.createElement('span');
        name.className = 'destination-name';
        name.textContent = dest.displayName;

        item.appendChild(flag);
        item.appendChild(name);
        item.addEventListener('click', () => selectDestination(dest));
        dropdown.appendChild(item);
      });
      showDropdown();
    }

    function renderError() {
      dropdown.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'destination-error';
      el.textContent = tt('destError', 'Unable to load destinations');
      dropdown.appendChild(el);
      showDropdown();
    }

    function showDropdown() { dropdown.style.display = 'block'; }
    function hideDropdown() { dropdown.style.display = 'none'; }
    function showLoading() {
      loading.innerHTML = `<span class="spinner"></span><span>${tt('destLoading', 'Searching destinations…')}</span>`;
      loading.style.display = 'flex';
      dropdown.style.display = 'none';
    }
    function hideLoading() { loading.style.display = 'none'; }

    // ----------------------------------------------------------------
    // Selection — the CRITICAL synchronization block
    // ----------------------------------------------------------------
    async function selectDestination(dest) {
      selectedDestination = dest;
      hideDropdown();

      input.value = '';
      input.style.display = 'none';

      // Selected pill
      selectedDisplay.style.display = 'flex';
      selectedDisplay.innerHTML = '';
      const flag = document.createElement('span');
      flag.className = 'destination-flag';
      flag.textContent = countryFlag(dest.countryCode);

      const label = document.createElement('span');
      label.className = 'destination-selected-name';
      label.textContent = dest.displayName;

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'destination-clear';
      clearBtn.setAttribute('aria-label', 'Clear');
      clearBtn.textContent = '×';
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelection();
      });

      selectedDisplay.appendChild(flag);
      selectedDisplay.appendChild(label);
      selectedDisplay.appendChild(clearBtn);

      // Notify parent form
      input.dispatchEvent(new CustomEvent('destination:selected', {
        bubbles: true,
        detail: { destination: dest }
      }));

      // -------- Synchronized async work --------
      const token = ++requestToken;

      // Show placeholder weather loading state
      if (weatherWidget) {
        weatherWidget.style.display = 'block';
        weatherWidget.innerHTML =
          `<span class="spinner"></span><span>${tt('weatherLoading', 'Loading weather…')}</span>`;
      }

      const [imageResult, weatherResult] = await Promise.allSettled([
        window.DestinationService.fetchDestinationImage(dest),
        window.DestinationService.fetchWeather(dest)
      ]);

      // Stale request guard — a newer selection supersedes this one
      if (token !== requestToken) return;

      // Apply image
      if (imageResult.status === 'fulfilled') {
        applyImage(dest, imageResult.value);
      } else {
        applyImageFallback(dest);
      }

      // Apply weather
      if (weatherResult.status === 'fulfilled') {
        applyWeather(dest, weatherResult.value);
      } else {
        applyWeatherError(dest);
      }
    }

    function clearSelection() {
      selectedDestination = null;
      requestToken++;             // invalidate any in-flight requests
      input.value = '';
      input.style.display = '';
      selectedDisplay.style.display = 'none';
      selectedDisplay.innerHTML = '';
      if (weatherWidget) {
        weatherWidget.style.display = 'none';
        weatherWidget.innerHTML = '';
      }
      window.__selectedDestination = null;
      window.__selectedDestinationImage = null;
      input.focus();

      input.dispatchEvent(new CustomEvent('destination:cleared', { bubbles: true }));
    }

    // ----------------------------------------------------------------
    // Image application
    // ----------------------------------------------------------------
    function applyImage(dest, image) {
      const backdrop = document.getElementById('heroBackdrop');
      if (backdrop) {
        // Preload then swap for a smooth transition
        const pre = new Image();
        pre.onload = () => {
          backdrop.style.transition = 'opacity 0.35s ease';
          backdrop.style.backgroundImage = `url('${image.url}')`;
          backdrop.style.opacity = '1';
        };
        pre.src = image.url;
      }

      const attrib = document.getElementById('heroAttribution');
      if (attrib) {
        attrib.style.display = 'block';
        attrib.innerHTML =
          `📷 <a href="${image.photoUrl}?utm_source=tripcraft&utm_medium=referral" ` +
          `target="_blank" rel="noopener noreferrer">${image.photographerName}</a> ` +
          `on <a href="https://unsplash.com/?utm_source=tripcraft&utm_medium=referral" ` +
          `target="_blank" rel="noopener noreferrer">Unsplash</a>`;
      }

      window.__selectedDestination = dest;
      window.__selectedDestinationImage = image;

      window.dispatchEvent(new CustomEvent('destination:imageLoaded', {
        detail: { destination: dest, image }
      }));
    }

    function applyImageFallback(dest) {
      const backdrop = document.getElementById('heroBackdrop');
      if (backdrop) {
        backdrop.style.backgroundImage =
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
      }
      const attrib = document.getElementById('heroAttribution');
      if (attrib) attrib.style.display = 'none';

      window.__selectedDestination = dest;
      window.__selectedDestinationImage = null;
    }

    // ----------------------------------------------------------------
    // Weather application
    // ----------------------------------------------------------------
    function applyWeather(dest, w) {
      if (!weatherWidget) return;
      const cond = tt(w.icon.key, w.icon.key.replace('weather', ''));
      weatherWidget.style.display = 'block';
      weatherWidget.innerHTML = `
        <span class="weather-icon" aria-hidden="true">${w.icon.icon}</span>
        <span class="weather-temp">${w.temperature}°${w.unit}</span>
        <span class="weather-divider">•</span>
        <span class="weather-cond">${cond}</span>
        <span class="weather-divider">•</span>
        <span class="weather-detail">${tt('weatherFeels', 'Feels')} ${w.feelsLike}°</span>
        <span class="weather-divider">•</span>
        <span class="weather-detail">💧 ${w.humidity}%</span>
        <span class="weather-divider">•</span>
        <span class="weather-detail">💨 ${w.windSpeed} ${w.windUnit}</span>
      `;
    }

    function applyWeatherError() {
      if (!weatherWidget) return;
      weatherWidget.style.display = 'block';
      weatherWidget.innerHTML =
        `<span class="weather-detail">${tt('weatherError', 'Weather unavailable')}</span>`;
    }

    // ----------------------------------------------------------------
    // Utilities
    // ----------------------------------------------------------------
    function tt(key, fallback) {
      if (typeof window.tripcraftT === 'function') {
        const v = window.tripcraftT(key);
        if (v && v !== key) return v;
      }
      return fallback;
    }

    function countryFlag(code) {
      if (!code || code.length !== 2) return '🌍';
      try {
        return String.fromCodePoint(
          ...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
        );
      } catch { return '🌍'; }
    }

    // ----------------------------------------------------------------
    // Public hooks
    // ----------------------------------------------------------------
    window.DestinationPicker = {
      reset: clearSelection,
      getSelected: () => selectedDestination
    };
  }

  document.addEventListener('DOMContentLoaded', initDestinationPicker);
})();
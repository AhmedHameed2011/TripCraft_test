/**
 * TripCraft — Auth UI wiring
 * Connects the auth modal, mode toggle, form submission, and logout button.
 * Includes a self-contained toast fallback so login/logout always give feedback.
 */
(function () {
  'use strict';

  // ==========================================================================
  // Toast helper — prefers window.tripcraftToast, falls back to DOM
  // ==========================================================================
  function toast(message) {
    // 1) Prefer the main app's toast function
    if (typeof window.tripcraftToast === 'function') {
      try {
        window.tripcraftToast(message);
        return;
      } catch (e) {
        console.warn('[auth-ui] tripcraftToast threw, using fallback:', e);
      }
    }

    // 2) Fallback: build a self-contained toast using the same CSS classes
    const stack = document.getElementById('toastStack');
    if (!stack) {
      console.warn('[auth-ui] No #toastStack found — message was:', message);
      return;
    }

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    stack.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // DOM wiring
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    const modal        = document.getElementById('modalAuth');
    const openBtn      = document.getElementById('authModalTrigger');
    const closeBtn     = document.getElementById('btnCloseAuthModal');
    const form         = document.getElementById('formAuth');
    const emailInput   = document.getElementById('inputAuthEmail');
    const passInput    = document.getElementById('inputAuthPassword');
    const nameInput    = document.getElementById('inputAuthName');
    const nameGroup    = document.getElementById('authNameGroup');
    const modeLogin    = document.getElementById('btnModeLogin');
    const modeRegister = document.getElementById('btnModeRegister');
    const submitBtn    = document.getElementById('btnAuthSubmit');
    const submitText   = document.getElementById('btnAuthSubmitText');
    const errorBox     = document.getElementById('authErrorMessage');
    const logoutBtn    = document.getElementById('logoutBtn');

    if (!modal || !openBtn) {
      console.warn('[auth-ui] Auth modal elements not found — skipping wiring.');
      return;
    }

    let mode = 'login';

    // ----------------------------------------------------------------------
    // i18n helper
    // ----------------------------------------------------------------------
    function t(key, fallback) {
      if (typeof window.tripcraftT === 'function') {
        const v = window.tripcraftT(key);
        if (v && v !== key) return v;
      }
      return fallback;
    }

    // ----------------------------------------------------------------------
    // Error display
    // ----------------------------------------------------------------------
    function clearError() {
      if (!errorBox) return;
      errorBox.textContent = '';
      errorBox.classList.remove('visible');
    }

    function showError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.classList.add('visible');
    }

    // ----------------------------------------------------------------------
    // Modal open / close
    // ----------------------------------------------------------------------
    function openModal() {
      modal.classList.add('active');
      clearError();
    }

    function closeModal() {
      modal.classList.remove('active');
      if (form) form.reset();
      clearError();
    }

    // ----------------------------------------------------------------------
    // Mode toggle: login ↔ register
    // ----------------------------------------------------------------------
    function setMode(next) {
      mode = next;
      const isLogin = next === 'login';

      if (modeLogin)    modeLogin.classList.toggle('active', isLogin);
      if (modeRegister) modeRegister.classList.toggle('active', !isLogin);

      if (nameGroup) nameGroup.style.display = isLogin ? 'none' : 'block';
      if (nameInput) nameInput.required = !isLogin;

      if (submitText) {
        submitText.textContent = isLogin
          ? t('authLogin', 'Login')
          : t('authRegister', 'Register');
      }
      clearError();
    }

    // ----------------------------------------------------------------------
    // Event wiring
    // ----------------------------------------------------------------------
    openBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modeLogin?.addEventListener('click', () => setMode('login'));
    modeRegister?.addEventListener('click', () => setMode('register'));

    // ----------------------------------------------------------------------
    // Form submit — login or register
    // ----------------------------------------------------------------------
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      if (!window.TripCraftAuth) {
        showError('Auth module not loaded. Please refresh.');
        return;
      }
      if (!window.supabaseClient) {
        showError('Authentication service unavailable. Check your connection.');
        return;
      }

      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        showError('Email and password are required.');
        return;
      }
      if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitText?.textContent;
      if (submitText) submitText.textContent = 'Please wait…';

      try {
        if (mode === 'login') {
          await window.TripCraftAuth.login(email, password);
          toast('✓ Signed in successfully');
        } else {
          const fullName = nameInput?.value.trim() || '';
          await window.TripCraftAuth.register(email, password, { full_name: fullName });
          showError('Check your inbox to confirm your email address.');
          toast('✓ Account created — check your email');
        }
        closeModal();
      } catch (err) {
        console.error('[auth-ui] Auth failed:', err);
        showError(err.message || 'Authentication failed.');
      } finally {
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = originalText;
      }
    });

    // ----------------------------------------------------------------------
    // Logout
    // ----------------------------------------------------------------------
    logoutBtn?.addEventListener('click', async () => {
      try {
        await window.TripCraftAuth.logout();
        toast('Signed out');
      } catch (err) {
        console.error('[auth-ui] Logout failed:', err);
        toast('⚠ Could not sign out');
      }
    });

    // ----------------------------------------------------------------------
    // React to language changes
    // ----------------------------------------------------------------------
    window.addEventListener('tripcraft:langChanged', () => setMode(mode));

    // ----------------------------------------------------------------------
    // Log auth state changes for debugging
    // ----------------------------------------------------------------------
    window.addEventListener('tripcraft:authChanged', (e) => {
      const user = e.detail?.user;
      if (user?.email) console.info('[auth-ui] Signed in as', user.email);
    });
  });
})();
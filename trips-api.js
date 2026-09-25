/**
 * TripCraft — Auth UI wiring
 * Connects the auth modal, mode toggle, form submission, and logout button.
 */
(function () {
  'use strict';

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

    function t(key, fallback) {
      if (typeof window.tripcraftT === 'function') {
        const v = window.tripcraftT(key);
        if (v && v !== key) return v;
      }
      return fallback;
    }

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

    function openModal() {
      modal.classList.add('active');
      clearError();
    }

    function closeModal() {
      modal.classList.remove('active');
      if (form) form.reset();
      clearError();
    }

    function setMode(next) {
      mode = next;
      const isLogin = next === 'login';

      modeLogin?.classList.toggle('active', isLogin);
      modeRegister?.classList.toggle('active', !isLogin);

      if (nameGroup) nameGroup.style.display = isLogin ? 'none' : 'block';
      if (nameInput) nameInput.required = !isLogin;

      if (submitText) {
        submitText.textContent = isLogin
          ? t('authLogin', 'Login')
          : t('authRegister', 'Register');
      }
      clearError();
    }

    openBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modeLogin?.addEventListener('click', () => setMode('login'));
    modeRegister?.addEventListener('click', () => setMode('register'));

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
          if (typeof window.tripcraftToast === 'function') {
            window.tripcraftToast('✓ Signed in successfully');
          }
        } else {
          const fullName = nameInput?.value.trim() || '';
          await window.TripCraftAuth.register(email, password, { full_name: fullName });
          showError('Check your inbox to confirm your email address.');
          if (typeof window.tripcraftToast === 'function') {
            window.tripcraftToast('✓ Account created — check your email');
          }
        }
        closeModal();
      } catch (err) {
        showError(err.message || 'Authentication failed.');
      } finally {
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = originalText;
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      try {
        await window.TripCraftAuth.logout();
        if (typeof window.tripcraftToast === 'function') {
          window.tripcraftToast('Signed out');
        }
      } catch (err) {
        console.error('[auth-ui] logout failed:', err);
      }
    });

    window.addEventListener('tripcraft:langChanged', () => setMode(mode));

    window.addEventListener('tripcraft:authChanged', (e) => {
      const user = e.detail?.user;
      if (user?.email) console.info('[auth-ui] Signed in as', user.email);
    });
  });
})();
/**
 * TripCraft — Auth UI wiring (modal open/close, form submit, mode toggle)
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

    if (!modal || !openBtn) return;

    let mode = 'login'; // or 'register'

    function openModal()  { modal.classList.add('active'); clearError(); }
    function closeModal() { modal.classList.remove('active'); form.reset(); clearError(); }

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

    function setMode(next) {
      mode = next;
      const isLogin = next === 'login';
      modeLogin?.classList.toggle('active', isLogin);
      modeRegister?.classList.toggle('active', !isLogin);
      if (nameGroup) nameGroup.style.display = isLogin ? 'none' : 'block';
      if (nameInput) nameInput.required = !isLogin;
      if (submitText) {
        const dict = (window.TRANSLATIONS || {})[document.documentElement.lang] || {};
        submitText.textContent = isLogin
          ? (dict.authLogin || 'Login')
          : (dict.authRegister || 'Register');
      }
      clearError();
    }

    openBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modeLogin?.addEventListener('click', () => setMode('login'));
    modeRegister?.addEventListener('click', () => setMode('register'));

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      if (!window.TripCraftAuth) {
        showError('Auth module not loaded. Refresh and try again.');
        return;
      }
      if (!window.supabaseClient) {
        showError('Authentication service unavailable. Check your connection or ad-blocker.');
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitText?.textContent;
      if (submitText) submitText.textContent = 'Please wait…';

      try {
        const email = emailInput.value.trim();
        const password = passInput.value;

        if (mode === 'login') {
          await window.TripCraftAuth.login(email, password);
        } else {
          const fullName = nameInput?.value.trim() || '';
          await window.TripCraftAuth.register(email, password, { full_name: fullName });
          showError('Check your inbox to confirm your email (if confirmation is enabled).');
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
      } catch (err) {
        console.error('Logout failed:', err);
      }
    });
  });
})();
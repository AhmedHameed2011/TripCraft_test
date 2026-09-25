/**
 * TripCraft — Authentication Module (Supabase Auth)
 * Handles registration, login, logout, session persistence, and UI state.
 */
(function () {
  'use strict';

  const Auth = {
    currentUser: null,

    async init() {
      if (!window.supabaseClient) {
        console.warn('[auth] Supabase client unavailable — auth disabled.');
        this.updateUI();
        return;
      }

      try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) console.warn('[auth] getSession error:', error.message);
        this.currentUser = session?.user || null;
      } catch (err) {
        console.error('[auth] init failed:', err);
        this.currentUser = null;
      }
      this.updateUI();

      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
        this.updateUI();
        window.dispatchEvent(new CustomEvent('tripcraft:authChanged', {
          detail: { user: this.currentUser, event }
        }));
      });
    },

    async register(email, password, metadata = {}) {
      if (!window.supabaseClient) throw new Error('Authentication service unavailable');
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return data;
    },

    async login(email, password) {
      if (!window.supabaseClient) throw new Error('Authentication service unavailable');
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email, password
      });
      if (error) throw error;
      return data;
    },

    async logout() {
      if (!window.supabaseClient) throw new Error('Authentication service unavailable');
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
    },

    isSignedIn() {
      return !!this.currentUser;
    },

    updateUI() {
      const triggerBtn = document.getElementById('authModalTrigger');
      const userDisplay = document.getElementById('userDisplay');
      const userEmailSpan = document.getElementById('userEmailSpan');

      const signedIn = !!this.currentUser;

      if (triggerBtn) triggerBtn.style.display = signedIn ? 'none' : 'inline-flex';
      if (userDisplay) userDisplay.style.display = signedIn ? 'inline-flex' : 'none';
      if (userEmailSpan) userEmailSpan.textContent = signedIn ? this.currentUser.email : '';

      document.body.classList.toggle('is-authenticated', signedIn);
    }
  };

  window.TripCraftAuth = Auth;
  document.addEventListener('DOMContentLoaded', () => Auth.init());
})();
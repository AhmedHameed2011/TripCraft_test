/**
 * TripCraft — Independent Modal Authentication Engine
 */

(function() {
  'use strict';

  const supabase = window.supabaseClient || null;
  let currentUser = null;

  // ==========================================================================
  // 1. Modal Toggle Handlers
  // ==========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    
    // Close any active modal first to keep popups distinct
    document.querySelectorAll('.modal-backdrop.active').forEach(m => closeModal(m));

    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    
    const autofocusInput = modalEl.querySelector('input:not([type="hidden"])');
    if (autofocusInput) autofocusInput.focus();
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    const form = modalEl.querySelector('form');
    if (form) form.reset();
  }

  // ==========================================================================
  // 2. Auth State Sync & UI Updates
  // ==========================================================================
  async function initAuth() {
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      updateAuthUI(session ? session.user : null);

      supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session ? session.user : null);
      });
    } catch (err) {
      console.error('Supabase Auth error:', err);
    }
  }

  function updateAuthUI(user) {
    currentUser = user;
    const authNavGroup = document.getElementById('authNavGroup');
    const userNavGroup = document.getElementById('userNavGroup');
    const userNameSpan = document.getElementById('userDisplayName');

    if (user) {
      if (authNavGroup) authNavGroup.style.display = 'none';
      if (userNavGroup) userNavGroup.style.display = 'flex';
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
      if (userNameSpan) userNameSpan.textContent = `Welcome, ${name}`;
    } else {
      if (authNavGroup) authNavGroup.style.display = 'flex';
      if (userNavGroup) userNavGroup.style.display = 'none';
      if (userNameSpan) userNameSpan.textContent = '';
    }
  }

  // ==========================================================================
  // 3. Form Submission Handling
  // ==========================================================================
  function initEventListeners() {
    // Open Independent Modals
    const btnLoginModal = document.getElementById('btnLoginModal');
    if (btnLoginModal) {
      btnLoginModal.addEventListener('click', () => openModal(document.getElementById('loginModal')));
    }

    const btnRegisterModal = document.getElementById('btnRegisterModal');
    if (btnRegisterModal) {
      btnRegisterModal.addEventListener('click', () => openModal(document.getElementById('registerModal')));
    }

    // Modal Close Controls
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal-backdrop')));
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-backdrop.active');
        if (activeModal) closeModal(activeModal);
      }
    });

    // Independent Login Action
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!supabase) return showToast('Authentication service offline.');

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showToast(`Login failed: ${error.message}`);
        } else {
          showToast('Successfully logged in!');
          closeModal(document.getElementById('loginModal'));
        }
      });
    }

    // Independent Register Action
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('registerName')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;

        if (!supabase) return showToast('Authentication service offline.');

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) {
          showToast(`Registration error: ${error.message}`);
        } else {
          showToast('Account created successfully!');
          closeModal(document.getElementById('registerModal'));
        }
      });
    }

    // Logout Trigger
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        if (supabase) {
          await supabase.auth.signOut();
          showToast('Logged out.');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initAuth();
  });
})();
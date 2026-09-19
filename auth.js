/**
 * auth.js - Manages Supabase Authentication, Session State, and Header UI integration.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const sbClient = window.supabaseClient || window.supabase;
  if (typeof sbClient === 'undefined' || !sbClient) {
    console.error('❌ Supabase client is not initialized. Make sure supabase-config.js is loaded before auth.js.');
    return;
  }

  // DOM Elements
  const authNavGroup = document.getElementById('authNavGroup');
  const userNavGroup = document.getElementById('userNavGroup');
  
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const newTripModal = document.getElementById('newTripModal');

  const btnLoginModal = document.getElementById('btnLoginModal');
  const btnRegisterModal = document.getElementById('btnRegisterModal');
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // --- Bulletproof Modal Utilities ---
  function openModal(modal) {
    if (modal) {
      modal.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;';
      modal.classList.add('active', 'show', 'open');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active', 'show', 'open', 'visible', 'is-open');
      modal.style.cssText = 'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;';
    }
  }

  if (btnLoginModal) btnLoginModal.addEventListener('click', () => openModal(loginModal));
  if (btnRegisterModal) btnRegisterModal.addEventListener('click', () => openModal(registerModal));

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(loginModal);
      closeModal(registerModal);
      closeModal(newTripModal);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal(loginModal);
    if (e.target === registerModal) closeModal(registerModal);
    if (e.target === newTripModal) closeModal(newTripModal);
  });

  // --- UI State Management for Authentication ---
  function updateAuthUI(session) {
    if (!authNavGroup || !userNavGroup) return;

    if (session && session.user) {
      console.log('✅ User is authenticated:', session.user.email);
      
      authNavGroup.style.display = 'none';
      userNavGroup.style.display = 'flex';

      const userEmail = session.user.email;
      const displayName = session.user.user_metadata?.full_name || userEmail.split('@')[0];

      window.currentUser = {
        id: session.user.id,
        email: userEmail,
        name: displayName,
        user_metadata: session.user.user_metadata
      };

      userNavGroup.innerHTML = `
        <span class="user-greeting" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
          👋 Hi, <strong style="color: var(--text-primary);">${displayName}</strong>
        </span>
        <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
      `;

      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          const { error } = await sbClient.auth.signOut();
          if (error) {
            console.error('❌ Error signing out:', error.message);
          } else {
            localStorage.removeItem('tripcraft_user');
            window.currentUser = null;
            if (typeof window.showToast === 'function') {
              window.showToast('Logged out successfully');
            }
            setTimeout(() => window.location.reload(), 600);
          }
        });
      }

      if (typeof window.loadUserTrips === 'function') {
        window.loadUserTrips(session.user.id);
      }
    } else {
      authNavGroup.style.display = 'flex';
      userNavGroup.style.display = 'none';
      userNavGroup.innerHTML = '';
      window.currentUser = null;
    }
  }

  // --- Check Initial Session ---
  try {
    const { data: { session }, error } = await sbClient.auth.getSession();
    if (error) throw error;
    updateAuthUI(session);
  } catch (err) {
    console.error('❌ Error fetching initial session:', err.message);
  }

  // --- Auth State Listener ---
  sbClient.auth.onAuthStateChange((event, session) => {
    console.log('🔔 Auth state changed event:', event);
    updateAuthUI(session);
  });

  // --- Handle Login Form Submission ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        console.log('🔄 Attempting login for:', email);
        const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        console.log('🔑 Login successful!');
        if (typeof window.showToast === 'function') {
          window.showToast('Login successful!');
        }
        
        closeModal(loginModal);
        loginForm.reset();
      } catch (err) {
        console.error('❌ Login error:', err.message);
        if (typeof window.showToast === 'function') {
          window.showToast('Login failed: ' + err.message);
        } else {
          alert('Login failed: ' + err.message);
        }
      }
    });
  }

  // --- Handle Register Form Submission ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;

      try {
        const { data, error } = await sbClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) throw error;

        const msg = data?.session ? 'Registration successful! Welcome.' : 'Registration successful! Please check your email to confirm your account.';
        if (typeof window.showToast === 'function') {
          window.showToast(msg);
        } else {
          alert(msg);
        }

        closeModal(registerModal);
        registerForm.reset();
      } catch (err) {
        console.error('❌ Registration error:', err.message);
        if (typeof window.showToast === 'function') {
          window.showToast('Registration failed: ' + err.message);
        } else {
          alert('Registration failed: ' + err.message);
        }
      }
    });
  }
});
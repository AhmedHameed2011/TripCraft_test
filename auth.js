/**
 * auth.js - Manages Supabase Authentication, Session State, and Header UI integration.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure supabase client is available globally from supabase-config.js
  if (typeof supabase === 'undefined') {
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

  // --- Modal Utilities ---
  function openModal(modal) {
    if (modal) modal.style.display = 'flex';
  }

  function closeModal(modal) {
    if (modal) modal.style.display = 'none';
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
    if (!authNavGroup || !userNavGroup) {
      console.warn('⚠️ Auth UI containers (#authNavGroup or #userNavGroup) not found in DOM.');
      return;
    }

    if (session && session.user) {
      console.log('✅ User is authenticated:', session.user.email);
      
      // Hide login/register buttons, show user greeting and Logout button
      authNavGroup.style.display = 'none';
      userNavGroup.style.display = 'flex';

      const userEmail = session.user.email;
      const displayName = session.user.user_metadata?.full_name || userEmail.split('@')[0];

      userNavGroup.innerHTML = `
        <span class="user-greeting" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
          👋 Hi, <strong style="color: var(--text-primary);">${displayName}</strong>
        </span>
        <button id="btnLogout" class="btn btn-secondary btn-sm">Logout</button>
      `;

      // Attach Logout event listener dynamically
      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          console.log('🔄 Signing out...');
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('❌ Error signing out:', error.message);
          } else {
            window.location.reload();
          }
        });
      }

      // Load user trips if defined in app.js
      if (typeof window.loadUserTrips === 'function') {
        window.loadUserTrips(session.user.id);
      }
    } else {
      console.log('ℹ️ No active session. User is logged out.');
      // Show login/register buttons, hide user profile group
      authNavGroup.style.display = 'flex';
      userNavGroup.style.display = 'none';
      userNavGroup.innerHTML = '';
    }
  }

  // --- Check Initial Session on Page Load ---
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    updateAuthUI(session);
  } catch (err) {
    console.error('❌ Error fetching initial session:', err.message);
  }

  // --- Listen to Real-time Auth State Changes ---
  supabase.auth.onAuthStateChange((event, session) => {
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        console.log('🔑 Login successful!');
        
        // Forcefully hide the login modal using important override
        if (loginModal) {
          loginModal.style.setProperty('display', 'none', 'important');
          loginModal.classList.remove('active');
        }
        
        loginForm.reset();
      } catch (err) {
        console.error('❌ Login error:', err.message);
        alert('Login failed: ' + err.message);
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) throw error;

        if (data?.session) {
          alert('Registration successful! Welcome.');
        } else {
          alert('Registration successful! Please check your email to confirm your account.');
        }

        closeModal(registerModal);
        registerForm.reset();
      } catch (err) {
        alert('Registration failed: ' + err.message);
        console.error('❌ Registration error:', err.message);
      }
    });
  }
});
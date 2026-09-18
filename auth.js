document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Helper function to safely render feedback messages in forms
  function showAuthFeedback(formType, message, type = 'error') {
    const feedbackEl = document.getElementById(`${formType}-feedback`);
    if (!feedbackEl) return;

    feedbackEl.textContent = message;
    feedbackEl.className = `feedback-message feedback-${type}`;
    feedbackEl.style.display = 'block';
    feedbackEl.style.padding = '0.5rem 0.75rem';
    feedbackEl.style.marginBottom = '1rem';
    feedbackEl.style.borderRadius = '6px';
    feedbackEl.style.fontSize = '0.875rem';

    if (type === 'error') {
      feedbackEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      feedbackEl.style.color = '#f87171';
      feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else {
      feedbackEl.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
      feedbackEl.style.color = '#4ade80';
      feedbackEl.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    }
  }

  // Get initialized Supabase client instance safely
  function getSupabaseClient() {
    return window.supabaseClient || window.supabase;
  }

  // Registration Handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const supabase = getSupabaseClient();
      if (!supabase || !supabase.auth) {
        showAuthFeedback('signup', 'Supabase client is not initialized. Check supabase-config.js', 'error');
        console.error('Supabase client missing from window scope.');
        return;
      }

      const nameInput = document.getElementById('signup-name');
      const emailInput = document.getElementById('signup-email');
      const passwordInput = document.getElementById('signup-password');

      if (!emailInput || !passwordInput) {
        showAuthFeedback('signup', 'Required input fields missing in HTML.', 'error');
        return;
      }

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });

        if (error) {
          showAuthFeedback('signup', error.message, 'error');
          return;
        }

        showAuthFeedback('signup', 'Account created! Check your email to confirm.', 'success');
        signupForm.reset();

        // Auto-close modal after 2.5 seconds on successful registration
        setTimeout(() => {
          const registerModal = document.getElementById('registerModal');
          if (registerModal) registerModal.classList.remove('active');
        }, 2500);

      } catch (err) {
        console.error('Unexpected Auth Exception:', err);
        showAuthFeedback('signup', 'An unexpected error occurred. Check browser console.', 'error');
      }
    });
  }

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const supabase = getSupabaseClient();
      if (!supabase || !supabase.auth) {
        showAuthFeedback('login', 'Supabase client is not initialized.', 'error');
        return;
      }

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');

      if (!emailInput || !passwordInput) {
        showAuthFeedback('login', 'Required input fields missing.', 'error');
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          showAuthFeedback('login', error.message, 'error');
          return;
        }

        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.remove('active');
        loginForm.reset();

      } catch (err) {
        console.error('Unexpected Auth Exception:', err);
        showAuthFeedback('login', 'An unexpected error occurred during login.', 'error');
      }
    });
  }
});
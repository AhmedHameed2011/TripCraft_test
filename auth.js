document.addEventListener('DOMContentLoaded', () => {
  // 1. Safely retrieve Supabase client instance
  const supabase = window.supabaseClient || window.supabase;

  // 2. Target form elements (supporting both hyphenated and camelCase IDs)
  const loginForm = document.getElementById('login-form') || document.getElementById('loginForm');
  const signupForm = document.getElementById('signup-form') || document.getElementById('registerForm');

  // Helper function to render feedback messages in forms
  function showAuthFeedback(formType, message, type = 'error') {
    const feedbackEl = document.getElementById(`${formType}-feedback`) || document.getElementById(`${formType}Feedback`);
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

  // Early guard check if Supabase failed to initialize
  if (!supabase || !supabase.auth) {
    console.warn('Auth functionality limited: Supabase client is not available.');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showAuthFeedback('login', 'Authentication unavailable. Check Supabase connection.', 'error');
      });
    }
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showAuthFeedback('signup', 'Authentication unavailable. Check Supabase connection.', 'error');
      });
    }
    return;
  }

  // Registration Handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('signup-name') || document.getElementById('registerName');
      const emailInput = document.getElementById('signup-email') || document.getElementById('registerEmail');
      const passwordInput = document.getElementById('signup-password') || document.getElementById('registerPassword');

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
          options: { data: { full_name: name } }
        });

        if (error) {
          showAuthFeedback('signup', error.message, 'error');
          return;
        }

        showAuthFeedback('signup', 'Account created! Check your email to confirm.', 'success');
        signupForm.reset();

        setTimeout(() => {
          const registerModal = document.getElementById('registerModal');
          if (registerModal) registerModal.classList.remove('active');
        }, 2000);

      } catch (err) {
        console.error('Unexpected Auth Exception:', err);
        showAuthFeedback('signup', 'An unexpected error occurred.', 'error');
      }
    });
  }

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('login-email') || document.getElementById('loginEmail');
      const passwordInput = document.getElementById('login-password') || document.getElementById('loginPassword');

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

        if (window.showToast) window.showToast('Logged in successfully!');
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
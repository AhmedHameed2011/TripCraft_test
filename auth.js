// Auth State Observer & Dynamic UI Updates
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    updateUIForUser(session.user);
  } else {
    updateUIForGuest();
  }
});

// Event Listeners for Authentication Forms
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Registration Handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        showAuthFeedback('signup', error.message, 'error');
        return;
      }

      showAuthFeedback('signup', 'Account created! Check your email to confirm.', 'success');
    });
  }

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        showAuthFeedback('login', error.message, 'error');
        return;
      }

      closeModal('login-modal');
      loginForm.reset();
    });
  }
});

// UI Feedback Helper
function showAuthFeedback(formType, message, type) {
  const feedbackEl = document.getElementById(`${formType}-feedback`);
  if (feedbackEl) {
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback-message ${type}`;
  }
}
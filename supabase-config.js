/**
 * TripCraft — Supabase Client Bootstrap
 * Loads the SDK (already included via CDN) and exposes window.supabaseClient.
 * Credentials are UNCHANGED from the original configuration.
 */
(function () {
  'use strict';

  if (typeof supabase === 'undefined') {
    console.error('[supabase-config] Supabase SDK failed to load. ' +
      'Check network access, ad-blockers, or tracking-prevention settings.');
    window.supabaseClient = null;
    return;
  }

  const SUPABASE_URL      = 'https://oowrmsisgogscqgnnahp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU';

  try {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'tripcraft_auth'
      }
    });
    console.info('[supabase-config] Client initialised.');
  } catch (err) {
    console.error('[supabase-config] createClient failed:', err);
    window.supabaseClient = null;
  }
})();
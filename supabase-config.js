// Supabase Configuration & Initialization
const SUPABASE_URL = 'https://oowrmsisgogscqgnnahp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU';

// Verification check for Supabase SDK
if (typeof supabase === 'undefined' || !supabase.createClient) {
  console.error('Supabase SDK not loaded. Ensure CDN script tag is placed before supabase-config.js.');
}

// Initialize and export global client instance
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Assign to global scope for auth.js and app.js access
window.supabase = supabaseClient;
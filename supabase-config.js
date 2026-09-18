const SUPABASE_URL = 'https://oowrmsisgogscqgnnahp.supabase.co';
// Your new Supabase Publishable Key
const SUPABASE_ANON_KEY = 'sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU';

if (typeof supabase === 'undefined' || !supabase.createClient) {
  console.error('Supabase SDK not loaded. Make sure the Supabase JS script tag is included in HTML.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Assigning both globals fixes the mismatch between app_5.js and auth_4.js
window.supabase = supabaseClient;
window.supabaseClient = supabaseClient;
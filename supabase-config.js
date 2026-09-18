// supabase-config.js
if (typeof supabase === 'undefined') {
  console.error('Supabase SDK failed to load. Check network or tracking prevention settings.');
} else {
  const SUPABASE_URL = 'https://oowrmsisgogscqgnnahp.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU';
  
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
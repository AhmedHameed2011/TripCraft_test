// supabase-config.js
// Replace these with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = "https://oowrmsisgogscqgnnahp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU";

let supabaseClient = null;

// Initialize Supabase client if SDK is loaded and keys are provided
if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://oowrmsisgogscqgnnahp.supabase.co") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase Client initialized successfully.");
} else {
  console.warn("Supabase credentials not set or SDK not loaded. App will fall back to localStorage/mock mode.");
}
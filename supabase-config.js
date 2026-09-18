// supabase-config.js
const SUPABASE_URL = "https://oowrmsisgogscqgnnahp.supabase.co";
// تأكد من نسخ المفتاح كاملاً من لوحة تحكم Supabase (Project Settings -> API -> anon public)
const SUPABASE_ANON_KEY = "sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU"; 

let supabaseClient = null;

// التحقق من تحميل المكتبة وجودة المفاتيح
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    // إتاحة الكائن عالمياً ليتمكن auth.js من الوصول إليه
    window.supabaseClient = supabaseClient; 
    console.log("Supabase Client initialized successfully.");
  } catch (err) {
    console.error("Error creating Supabase client:", err);
  }
} else {
  console.warn("Supabase credentials not set or SDK not loaded. App will fall back to localStorage/mock mode.");
}
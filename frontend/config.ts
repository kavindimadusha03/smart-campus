const config = {
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080",
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '1063458009288-4apc5oijcl59l6dhn03hgns2v68p04h2.apps.googleusercontent.com',
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://epweixfalilgjtohsrdb.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwd2VpeGZhbGlsZ2p0b2hzcmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTg4MTEsImV4cCI6MjA5MjE3NDgxMX0.ss9imStAvPTUNiVSsCJM_wpQOnikfH7C-7eBCCnmQ-w'
};

export default config;

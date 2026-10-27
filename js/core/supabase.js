// CONEXÃO COM SUPABASE

const SUPABASE_URL = "https://luujxgjjkbppjbefllsg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eziJVLtciOqcihK-lLCfnw_ZGK72sFh";

let sbClient = null;
try {
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
} catch (err) {
  console.error("Falha ao iniciar o Supabase:", err);
}

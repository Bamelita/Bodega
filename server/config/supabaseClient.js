const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || null;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

const hasSupabase = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const supabase = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

module.exports = { supabase, hasSupabase };

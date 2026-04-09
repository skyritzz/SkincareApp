import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Switch back to process.env after babel-plugin-transform-define is fixed
const SUPABASE_URL = 'https://rshyseehwlyoquhqyjth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaHlzZWVod2x5b3F1aHF5anRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjEzNDQsImV4cCI6MjA5MDg5NzM0NH0.rCwS7fgFpUVrRk1s_tpvsxNSeSMSK9AeJnQfObKwLys';

if (__DEV__) {
  console.log('[Supabase Init] URL:', SUPABASE_URL ? '✓ set' : '✗ missing');
  console.log('[Supabase Init] ANON_KEY:', SUPABASE_ANON_KEY ? '✓ set' : '✗ missing');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] ⚠️ Credentials missing from .env - some features may not work');
}

let supabase: any;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.error('[Supabase] Failed to initialize:', error);
  // Fallback to dummy client to prevent import errors
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
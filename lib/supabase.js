import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// goTamb production/test backend.
// Supabase publishable keys are safe to embed in client applications;
// access control remains enforced by RLS policies in Supabase.
export const SUPABASE_PROJECT_REF = 'zgxhgjtzzqzpycrrdptm';
const supabaseUrl = 'https://zgxhgjtzzqzpycrrdptm.supabase.co';
const supabasePublishableKey = 'sb_publishable_-0TQiuFeAb4-FCS2h6NWsA_RsF9KH1W';

export const hasSupabaseConfig = true;

const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

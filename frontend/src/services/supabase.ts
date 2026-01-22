import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if credentials are configured
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
} else {
    console.warn('⚠️ Supabase credentials not configured - using mock client');
    // Create a mock client that won't crash but won't work either
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export { supabase };

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom storage adapter - use localStorage directly on web for better persistence
const ExpoStorage = Platform.OS === 'web'
    ? {
        getItem: async (key: string) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    return window.localStorage.getItem(key);
                }
                return null;
            } catch (error) {
                console.warn('Error getting item from localStorage:', error);
                return null;
            }
        },
        setItem: async (key: string, value: string) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, value);
                }
            } catch (error) {
                console.warn('Error setting item in localStorage:', error);
            }
        },
        removeItem: async (key: string) => {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(key);
                }
            } catch (error) {
                console.warn('Error removing item from localStorage:', error);
            }
        },
    }
    : AsyncStorage; // Use AsyncStorage for native platforms

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isConfigured = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!isConfigured) {
    console.warn('⚠️ Supabase credentials not configured - using placeholder values for UI preview');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export { supabase };

export const isSupabaseConfigured = () => {
    return isConfigured;
};

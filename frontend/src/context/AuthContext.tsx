import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { authState } from '../utils/authState';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = 'user_profile_cache';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Module-level flag removed - using authState.isInitialized instead (survives module reloads)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const isInitializing = useRef(false);
    const pendingFetchPromise = useRef<Promise<any | null> | null>(null);

    // Refs to track state inside callbacks without re-subscribing
    const userRef = useRef<User | null>(null);
    const profileRef = useRef<any | null>(null);

    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { profileRef.current = profile; }, [profile]);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.log('⚠️ Supabase not configured');
            setLoading(false);
            return;
        }

        // Prevent re-initialization on component remount (critical for expo-router)
        // Using authState.isInitialized which persists across module reloads
        if (authState.getState().isInitialized) {
            console.log('⚠️ Already initialized once, skipping (authState check)');
            return;
        }
        authState.setInitialized(true);

        // Also set the ref for within-render safety
        if (isInitializing.current) {
            console.log('⚠️ Already initializing, skipping duplicate call');
            return;
        }
        isInitializing.current = true;

        // Get initial session
        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔍 Auth state change:', event, newSession?.user?.email);

                // INITIAL_SESSION is handled by initializeAuth() - skip to avoid duplicated work
                if (event === 'INITIAL_SESSION') {
                    console.log('⏭️ Skipping INITIAL_SESSION (handled by initializeAuth)');
                    return;
                }

                // Check if auth-callback is processing - don't interfere
                const isProcessing = authState.getState().isProcessing;
                if (isProcessing && event === 'SIGNED_IN') {
                    console.log('⏳ Auth callback is processing, skipping profile check');
                    setSession(newSession);
                    // Don't set user yet - let auth-callback handle it
                    return;
                }

                if (event === 'SIGNED_IN' && newSession?.user) {
                    setSession(newSession);

                    // 1. Primero verificar memoria
                    if (profileRef.current && profileRef.current.id === newSession.user.id) {
                        console.log('🚀 Using memory profile for SIGNED_IN');
                        setUser(newSession.user);
                        setLoading(false);
                        return;
                    }

                    // 2. Verificar AsyncStorage cache ANTES de fetch
                    const cachedStr = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                    if (cachedStr) {
                        try {
                            const cached = JSON.parse(cachedStr);
                            if (cached.id === newSession.user.id) {
                                console.log('📦 Using cached profile for SIGNED_IN');
                                setUser(newSession.user);
                                setProfile(cached);
                                setLoading(false);
                                return; // NO hacer fetch
                            }
                        } catch (e) { /* continue to fetch */ }
                    }

                    // 3. Solo si no hay cache, hacer fetch
                    const profileData = await fetchProfile(newSession.user.id);
                    if (profileData) {
                        console.log('✅ Profile found in onAuthStateChange');
                        setUser(newSession.user);
                        setProfile(profileData);
                        // Reset authState now that user is fully authenticated
                        authState.reset();
                    } else {
                        // Si no hay datos en ningún lado
                        console.log('❌ No profile in onAuthStateChange (and no cache), user not set');
                        setUser(null);
                        setProfile(null);
                        authState.reset();
                    }

                    setLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    console.log('🚪 SIGNED_OUT event received');
                    authState.reset();
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
                    // Token refresh - always re-fetch profile to ensure consistency
                    console.log('🔄 Token refreshed, re-validating profile');
                    setSession(newSession);
                    const profileData = await fetchProfile(newSession.user.id);
                    if (profileData) {
                        setUser(newSession.user);
                        setProfile(profileData);
                    } else {
                        // FIX: On token refresh, if profile fetch fails (timeout), 
                        // ABSOLUTELY DO NOT SIGN OUT if we already have data.
                        if (userRef.current && profileRef.current && userRef.current.id === newSession.user.id) {
                            console.warn('⚠️ Profile fetch failed on refresh, keeping existing session');
                        } else {
                            console.warn('⚠️ Profile lost after token refresh, signing out');
                            signOut();
                        }
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Auto-recovery: Re-validate session when user returns to the page (web only)
    useEffect(() => {
        // Only run on web platform
        if (Platform.OS !== 'web') return;
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && session) {
                console.log('👁️ Page visible, checking session validity');
                try {
                    const { error } = await supabase.auth.getSession();
                    if (error) {
                        console.warn('⚠️ Session invalid, signing out');
                        signOut();
                    }
                    // NO re-fetch profile - usar datos existentes en memoria
                } catch (error) {
                    console.error('Error checking session:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [session]);

    const initializeAuth = async () => {
        try {
            // Step 1: Try to load from cache first for instant UI
            const cachedProfileStr = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            let cachedProfile = null;
            if (cachedProfileStr) {
                try {
                    cachedProfile = JSON.parse(cachedProfileStr);
                    console.log('📦 Loaded cached profile:', cachedProfile.email);
                } catch (e) {
                    console.error('Failed to parse cached profile', e);
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔍 Initial session:', session?.user?.email);

            if (session?.user) {
                setSession(session);

                // If we have a cached profile and it matches the current user, use it immediately
                // and DO NOT fetch - the cache is sufficient for loading the app
                if (cachedProfile && cachedProfile.id === session.user.id) {
                    console.log('🚀 Using cached profile for instant load');
                    setUser(session.user);
                    setProfile(cachedProfile);
                    authState.reset(); // Clean state after successful load
                    setLoading(false);
                    return; // NO fetch - cache is sufficient
                }

                // Solo fetch si NO hay cache válido
                const profileData = await fetchProfile(session.user.id);
                if (profileData) {
                    setUser(session.user);
                    setProfile(profileData);
                    authState.reset(); // Clean state after successful load
                } else {
                    // No cache AND fetch failed - treat as no profile
                    console.log('❌ No profile on init (and no cache)');
                    setUser(null);
                    authState.reset();
                }
            }
        } catch (error: any) {
            // Ignore abort errors which happen on hot reload or fast navigation
            if (error.name !== 'AbortError' && !error?.message?.includes('aborted')) {
                console.error('Init auth error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch profile with Promise-based deduplication
    const fetchProfile = async (userId: string, options?: { skipIfCached?: boolean }): Promise<any | null> => {
        // Si ya hay un fetch en progreso, esperar ese resultado
        if (pendingFetchPromise.current) {
            console.log('⏳ Waiting for existing fetch to complete');
            return pendingFetchPromise.current;
        }

        // Opción para skip si hay cache válido
        if (options?.skipIfCached) {
            const cachedStr = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedStr) {
                try {
                    const cached = JSON.parse(cachedStr);
                    if (cached.id === userId) {
                        console.log('📦 Using cached profile, skipping fetch');
                        return cached;
                    }
                } catch (e) { /* ignore */ }
            }
        }

        // Crear la promesa y guardarla
        const fetchPromise = (async () => {
            try {
                console.log(`🔍 Fetching profile for: ${userId}`);

                // Timeout de 10s (tenemos cache como fallback)
                const timeoutPromise = new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
                );

                const { data, error } = await Promise.race([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    timeoutPromise
                ]) as any;

                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log('❌ No profile found (user not registered)');
                        return null;
                    }
                    console.warn('⚠️ Profile fetch error:', error.message);
                    return null;
                }

                if (data) {
                    console.log('✅ Profile found:', data.email);
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
                    return data;
                }
                return null;
            } catch (error: any) {
                console.error('❌ Profile fetch exception:', error.message);
                return null;
            } finally {
                pendingFetchPromise.current = null;
            }
        })();

        pendingFetchPromise.current = fetchPromise;
        return fetchPromise;
    };

    const refreshProfile = async () => {
        if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            if (profileData) {
                setProfile(profileData);
                setUser(session.user);
            }
        }
    };

    const signOut = async () => {
        try {
            setSession(null);
            setUser(null);
            setProfile(null);
            await AsyncStorage.removeItem(PROFILE_CACHE_KEY); // Clear cache on logout
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

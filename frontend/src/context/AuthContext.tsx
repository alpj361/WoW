import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const isInitializing = useRef(false);

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

        // Prevent race condition with double initialization
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
                    // Check profile
                    const profileData = await fetchProfile(newSession.user.id);
                    if (profileData) {
                        console.log('✅ Profile found in onAuthStateChange');
                        setUser(newSession.user);
                        setProfile(profileData);
                    } else {

                        // FIX: If profile fetch fails (timeout), check detailed fallbacks
                        // 1. Check in-memory refs
                        if (userRef.current && profileRef.current && userRef.current.id === newSession.user.id) {
                            console.warn('⚠️ Profile fetch failed (timeout), but using in-memory state');
                            // Do nothing, keep existing state
                        }
                        // 2. Check AsyncStorage (async check inside sync callback is tricky, but we can try)
                        else {
                            // We can't await here easily without making the callback async, which it is.
                            // But let's check one last time if we really need to logout.
                            // If we are here, it means we have a session but no profile data from DB.

                            // Let's try to load from cache 'just in case' before giving up
                            const cachedProfileStr = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
                            if (cachedProfileStr) {
                                try {
                                    const cachedProfile = JSON.parse(cachedProfileStr);
                                    if (cachedProfile.id === newSession.user.id) {
                                        console.log('📦 cache rescue: using cached profile after fetch failure');
                                        setUser(newSession.user);
                                        setProfile(cachedProfile);
                                        setLoading(false);
                                        return;
                                    }
                                } catch (e) {
                                    console.error('Failed to parse cached profile in rescue', e);
                                }
                            }

                            // If truly nothing...
                            console.log('❌ No profile in onAuthStateChange (and no cache), user not set');
                            setUser(null);
                            setProfile(null);
                        }
                    }

                    setLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    console.log('🚪 SIGNED_OUT event received');
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

    // Auto-recovery: Re-validate session when user returns to the page
    useEffect(() => {
        if (typeof window === 'undefined') return; // Only on web

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && session) {
                console.log('👁️ Page visible, re-validating session');
                try {
                    const { data: { session: currentSession }, error } = await supabase.auth.getSession();

                    if (error || !currentSession) {
                        console.warn('⚠️ Session expired while away, signing out');
                        signOut();
                    } else if (currentSession.user.id !== session.user.id) {
                        // Session changed (different user) - reload
                        console.log('🔄 Session changed, reloading');
                        window.location.reload();
                    }
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
                if (cachedProfile && cachedProfile.id === session.user.id) {
                    console.log('🚀 Using cached profile for instant load');
                    setUser(session.user);
                    setProfile(cachedProfile);
                    setLoading(false); // Stop loading immediately
                }

                // Fetch fresh data in background (or foreground if no cache)
                const profileData = await fetchProfile(session.user.id);
                if (profileData) {
                    setUser(session.user);
                    setProfile(profileData);
                } else if (!cachedProfile) {
                    // Only if we don't have a cache AND fetch failed do we treat as no profile
                    console.log('❌ No profile on init (and no cache)');
                    setUser(null);
                }
            }
        } catch (error: any) {
            // Ignore abort errors which happen on hot reload or fast navigation
            if (error.name === 'AbortError' || error?.message?.includes('aborted')) {
                console.log('⚠️ Auth init aborted (safe to ignore)');
            } else {
                console.error('Init auth error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch profile, returns profile data or null
    const fetchProfile = async (userId: string): Promise<any | null> => {
        // Retry logic with faster timeout for profile fetch
        for (let i = 0; i < 2; i++) {
            try {
                console.log(`🔍 Fetching profile for: ${userId} (attempt ${i + 1})`);

                // Set a 20 second timeout for background updates (UI is already interactive via cache)
                const timeoutPromise = new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
                );

                const fetchPromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                const { data, error } = await Promise.race([
                    fetchPromise,
                    timeoutPromise
                ]) as any;

                if (error) {
                    // If it's a "not found" error, return null immediately (no retry)
                    if (error.code === 'PGRST116') {
                        console.log('❌ No profile found (user not registered)');
                        return null;
                    }

                    // For other errors, retry
                    console.warn(`⚠️ Profile fetch error (attempt ${i + 1}):`, error.message);
                    if (i === 1) return null; // Give up after 2 tries
                    await new Promise(r => setTimeout(r, 500)); // Wait 500ms
                    continue;
                }

                if (data) {
                    console.log('✅ Profile found:', data.email);
                    // Update cache on success
                    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
                    return data;
                } else {
                    console.log('❌ No profile found (data is null)');
                    return null;
                }
            } catch (error: any) {
                console.error(`❌ Profile fetch exception (attempt ${i + 1}):`, error.message);
                if (i === 1) return null;
                await new Promise(r => setTimeout(r, 500));
            }
        }
        return null;
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

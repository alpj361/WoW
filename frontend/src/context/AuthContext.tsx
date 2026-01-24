import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { authState } from '../utils/authState';

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
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.log('⚠️ Supabase not configured');
            setLoading(false);
            return;
        }

        // Prevent double initialization
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

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
                        // No profile = not fully registered
                        console.log('❌ No profile in onAuthStateChange, user not set');
                        setUser(null);
                        setProfile(null);
                    }
                    setLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    console.log('🚪 SIGNED_OUT event received');
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
                    // Token refresh - keep existing user if we have profile
                    setSession(newSession);
                    if (profile) {
                        setUser(newSession.user);
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const initializeAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔍 Initial session:', session?.user?.email);

            if (session?.user) {
                setSession(session);
                const profileData = await fetchProfile(session.user.id);
                if (profileData) {
                    setUser(session.user);
                    setProfile(profileData);
                } else {
                    console.log('❌ No profile on init');
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
        // Retry logic for profile fetch (handle network blips)
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`🔍 Fetching profile for: ${userId} (attempt ${i + 1})`);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    // unexpected error (network, etc)
                    console.warn(`⚠️ Profile fetch error (attempt ${i + 1}):`, error.message);
                    if (i === 2) return null; // Give up after 3 tries
                    await new Promise(r => setTimeout(r, 1000)); // Wait 1s
                    continue;
                }

                if (data) {
                    console.log('✅ Profile found:', data.email);
                    return data;
                } else {
                    console.log('❌ No profile found (data is null)');
                    return null;
                }
            } catch (error: any) {
                console.error(`❌ Profile fetch exception (attempt ${i + 1}):`, error);
                if (i === 2) return null;
                await new Promise(r => setTimeout(r, 1000));
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

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { authState } from '../src/utils/authState';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AuthCallbackScreen() {
    const params = useLocalSearchParams();
    const [status, setStatus] = useState('Procesando...');
    const [error, setError] = useState<string | null>(null);
    const processingRef = useRef(false);

    useEffect(() => {
        // Prevent double processing
        if (processingRef.current) return;
        processingRef.current = true;

        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            // Mark as processing to prevent race conditions
            authState.setProcessing(true);

            const urlParam = params.url as string;
            const code = params.code as string;
            const isRegistration = !!code;

            console.log('🔍 AuthCallback - INICIO:', {
                hasCode: isRegistration,
                code: code || 'none',
                url: urlParam ? 'present' : 'none'
            });

            // Extract tokens from OAuth URL
            if (urlParam) {
                console.log('📝 Processing OAuth URL');
                const url = new URL(decodeURIComponent(urlParam));
                const hashParams = new URLSearchParams(url.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken) {
                    console.log('📝 Setting session with access token');
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (sessionError) {
                        console.error('❌ Session error:', sessionError);
                        throw sessionError;
                    }
                    console.log('✅ Session set');
                }
            }

            // Get session with retries
            setStatus('Verificando sesión...');
            let session = null;
            for (let i = 0; i < 5; i++) {
                console.log(`🔍 Getting session attempt ${i + 1}`);
                const { data, error: sessError } = await supabase.auth.getSession();
                if (sessError) {
                    console.error('Session fetch error:', sessError);
                }
                if (data.session?.user) {
                    session = data.session;
                    console.log('✅ Session found:', session.user.email);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (!session) {
                console.error('❌ No session after retries');
                throw new Error('No se pudo obtener la sesión');
            }

            // REGISTRATION FLOW: Has code → Create profile
            if (isRegistration) {
                setStatus('Creando cuenta...');
                console.log('📝 Registration with code:', code);

                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                        avatar_url: session.user.user_metadata?.avatar_url,
                        code: code,
                    }),
                });

                const data = await response.json();
                console.log('📝 Register response:', data);

                if (data.success) {
                    console.log('✅ Profile created, marking as verified');
                    setStatus('¡Cuenta creada!');

                    // Mark user as verified BEFORE navigating
                    authState.setVerified(true);
                    authState.setProcessing(false);

                    // Small delay to ensure state propagates
                    await new Promise(resolve => setTimeout(resolve, 500));
                    router.replace('/');
                } else {
                    throw new Error(data.error || 'Error creando cuenta');
                }
                return;
            }

            // LOGIN FLOW: No code → Check if user has profile via API
            setStatus('Verificando cuenta...');
            console.log('🔍 Login attempt, checking profile via API for user:', session.user.id);

            try {
                const response = await fetch(`${API_URL}/auth/me?user_id=${session.user.id}`);
                const data = await response.json();

                console.log('🔍 Profile check result:', data);

                if (data.success && data.profile) {
                    console.log('✅ User has profile, proceeding to home');
                    setStatus('¡Bienvenido!');

                    // Mark user as verified
                    authState.setVerified(true);
                    authState.setProcessing(false);

                    await new Promise(resolve => setTimeout(resolve, 500));
                    router.replace('/');
                } else {
                    // User NOT registered - MUST sign out first before redirect
                    console.log('❌ No profile found - Usuario no registrado');
                    setStatus('Cuenta no encontrada...');

                    // Clear any verified state
                    authState.reset();

                    // Sign out FIRST and wait for it to complete
                    console.log('🚪 Cerrando sesión...');
                    await supabase.auth.signOut();

                    // Wait for signOut to propagate
                    console.log('⏳ Esperando propagación de signOut...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Now redirect to auth with error
                    console.log('🔄 Redirigiendo a /auth con error');
                    router.replace('/auth?error=not_registered');
                }
            } catch (apiError) {
                console.error('❌ API error checking profile:', apiError);

                // Clear states and sign out
                authState.reset();
                await supabase.auth.signOut();
                await new Promise(resolve => setTimeout(resolve, 1000));

                router.replace('/auth?error=not_registered');
            }

        } catch (err: any) {
            console.error('❌ AuthCallback error:', err);
            setError(err.message || 'Error de autenticación');

            // Clear states
            authState.reset();

            // Sign out and redirect
            try {
                await supabase.auth.signOut();
            } catch { }

            setTimeout(() => router.replace('/auth'), 2000);
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.status}>{status}</Text>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    status: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        textAlign: 'center',
    },
    error: {
        color: '#EF4444',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
});

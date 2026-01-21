import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/services/supabase';

export default function AuthVerifyScreen() {
    const [status, setStatus] = useState('Verificando cuenta...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        verifyUser();
    }, []);

    // Check if user exists in profiles table
    const checkUserExists = async (userEmail: string): Promise<boolean> => {
        try {
            console.log('🔍 Checking if user exists:', userEmail);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', userEmail)
                .single();

            console.log('🔍 Check result:', { data, error: error?.message });
            return !error && !!data;
        } catch (err) {
            console.error('❌ Check user error:', err);
            return false;
        }
    };

    const verifyUser = async () => {
        try {
            console.log('🔍 AuthVerify - Starting verification');

            // Wait a moment for session to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get session with retries
            let session = null;
            for (let i = 0; i < 3; i++) {
                console.log(`🔍 Attempt ${i + 1}/3 getting session...`);
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ Session error:', error);
                }

                if (data.session?.user) {
                    session = data.session;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            if (!session) {
                console.log('❌ No session, redirecting to auth');
                router.replace('/auth');
                return;
            }

            const userEmail = session.user.email;
            console.log('✅ Session found:', userEmail);

            if (!userEmail) {
                setError('Error obteniendo email del usuario');
                setTimeout(() => router.replace('/auth'), 2000);
                return;
            }

            // Check if user exists in profiles
            setStatus('Verificando tu cuenta...');
            const userExists = await checkUserExists(userEmail);

            console.log('🔍 User exists:', userExists);

            if (userExists) {
                // User registered - go to home
                console.log('✅ User verified, going to home');
                setStatus('¡Bienvenido de vuelta!');
                setTimeout(() => router.replace('/'), 1000);
            } else {
                // User NOT registered - sign out and redirect to register
                console.log('❌ User not registered, signing out');
                setStatus('Cuenta no registrada...');
                await supabase.auth.signOut();
                router.replace('/auth?error=not_registered');
            }

        } catch (err: any) {
            console.error('❌ Verify error:', err);
            setError('Error verificando cuenta');
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

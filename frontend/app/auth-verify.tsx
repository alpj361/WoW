import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthVerifyScreen() {
    const [status, setStatus] = useState('Verificando cuenta...');
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        verifyUser();
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync();
            }
        };
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
            {/* Video Background - Adapted to phone size */}
            <Video
                ref={videoRef}
                source={require('../assets/splash-video.mp4')}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
                colors={['rgba(10, 10, 10, 0.3)', 'rgba(10, 10, 10, 0.7)', 'rgba(10, 10, 10, 0.9)']}
                locations={[0, 0.5, 1]}
                style={styles.overlay}
            />
            
            {/* Content */}
            <View style={styles.content}>
                {/* Animated loading indicator */}
                <View style={styles.loaderContainer}>
                    <View style={styles.pulseOuter}>
                        <View style={styles.pulseInner}>
                            <View style={styles.pulseCore} />
                        </View>
                    </View>
                </View>
                
                <Text style={styles.status} data-testid="verify-status">{status}</Text>
                {error && <Text style={styles.error} data-testid="verify-error">{error}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loaderContainer: {
        marginBottom: 32,
    },
    pulseOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseCore: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#8B5CF6',
    },
    status: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    error: {
        color: '#F87171',
        fontSize: 15,
        marginTop: 16,
        textAlign: 'center',
    },
});

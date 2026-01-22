import React, { useState, useEffect, useRef, useId } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions,
    Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WowLogo } from '../src/components/WowLogo';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { authState } from '../src/utils/authState';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, FeDisplacementMap, Rect } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Interactive Background Component with animated gradient orbs
// Using deep blue/teal tones to contrast with the purple-to-orange logo
function InteractiveBackground() {
    const orb1Anim = useRef(new RNAnimated.Value(0)).current;
    const orb2Anim = useRef(new RNAnimated.Value(0)).current;
    const orb3Anim = useRef(new RNAnimated.Value(0)).current;
    const pulseAnim = useRef(new RNAnimated.Value(1)).current;

    useEffect(() => {
        // Floating animation for orbs
        const animateOrb = (anim: RNAnimated.Value, duration: number) => {
            RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(anim, {
                        toValue: 1,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(anim, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Pulse animation
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        animateOrb(orb1Anim, 5000);
        animateOrb(orb2Anim, 6000);
        animateOrb(orb3Anim, 7000);
    }, []);

    const orb1Style = {
        transform: [
            {
                translateY: orb1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                }),
            },
            {
                translateX: orb1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                }),
            },
            { scale: pulseAnim },
        ],
    };

    const orb2Style = {
        transform: [
            {
                translateY: orb2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30],
                }),
            },
            {
                translateX: orb2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                }),
            },
        ],
    };

    const orb3Style = {
        transform: [
            {
                translateY: orb3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                }),
            },
            {
                translateX: orb3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 25],
                }),
            },
        ],
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base dark gradient - deep blue/black for contrast with warm logo */}
            <LinearGradient
                colors={['#050508', '#08101a', '#0a1520', '#050508']}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Animated gradient orbs - cool teal/cyan tones for contrast */}
            <RNAnimated.View style={[styles.orb, styles.orb1, orb1Style]}>
                <LinearGradient
                    colors={['rgba(20, 80, 100, 0.4)', 'rgba(30, 120, 140, 0.2)', 'transparent']}
                    style={styles.orbGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </RNAnimated.View>

            <RNAnimated.View style={[styles.orb, styles.orb2, orb2Style]}>
                <LinearGradient
                    colors={['rgba(15, 60, 90, 0.35)', 'rgba(25, 100, 130, 0.15)', 'transparent']}
                    style={styles.orbGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </RNAnimated.View>

            <RNAnimated.View style={[styles.orb, styles.orb3, orb3Style]}>
                <LinearGradient
                    colors={['rgba(10, 50, 70, 0.3)', 'rgba(20, 80, 100, 0.15)', 'transparent']}
                    style={styles.orbGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                />
            </RNAnimated.View>

            {/* Subtle noise overlay for texture */}
            <View style={styles.noiseOverlay} />

            {/* Soft vignette effect */}
            <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
}

export default function AuthScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const [step, setStep] = useState<1 | 2>(1);
    const [invitationCode, setInvitationCode] = useState('');
    const [validatedCode, setValidatedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animation refs
    const fadeAnim = useRef(new RNAnimated.Value(0)).current;
    const slideAnim = useRef(new RNAnimated.Value(50)).current;
    const formFadeAnim = useRef(new RNAnimated.Value(0)).current;
    const formSlideAnim = useRef(new RNAnimated.Value(30)).current;

    useEffect(() => {
        // Entrance animations
        RNAnimated.parallel([
            RNAnimated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            RNAnimated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => {
            RNAnimated.parallel([
                RNAnimated.timing(formFadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(formSlideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, []);

    // Set error from URL params on mount
    useEffect(() => {
        if (params.error === 'not_registered') {
            setError('No tienes cuenta. Regístrate con un código de invitación.');
        }
        // Clear any stale auth states
        authState.reset();
    }, [params.error]);

    // Validate invitation code
    const handleValidateCode = async () => {
        if (!invitationCode.trim()) {
            setError('Ingresa tu código de invitación');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/auth/validate-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: invitationCode.toUpperCase() }),
            });

            const data = await response.json();

            if (data.success) {
                setValidatedCode(invitationCode.toUpperCase());
                setStep(2);
            } else {
                setError(data.error || 'Código inválido');
            }
        } catch (err) {
            setError('Error de conexión. Intenta de nuevo.');
            console.error('Validate code error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Sign In for REGISTRATION (with code)
    const handleGoogleRegister = async () => {
        setLoading(true);
        setError(null);

        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'wow',
                path: 'auth-callback',
            });

            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${redirectUrl}?code=${validatedCode}`,
                    skipBrowserRedirect: true,
                },
            });

            if (authError) throw authError;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success') {
                    router.replace(`/auth-callback?url=${encodeURIComponent(result.url)}&code=${validatedCode}`);
                } else {
                    setError('Registro cancelado');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Sign In for LOGIN (existing users only)
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'wow',
                path: 'auth-callback',
            });

            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (authError) throw authError;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success') {
                    // No code = login attempt
                    router.replace(`/auth-callback?url=${encodeURIComponent(result.url)}`);
                } else {
                    setError('Inicio de sesión cancelado');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Enter invitation code
    if (step === 1) {
        return (
            <View style={styles.container}>
                <InteractiveBackground />
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                        {/* Logo Section */}
                        <RNAnimated.View 
                            style={[
                                styles.logoContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            <View style={styles.logoGlow}>
                                <WowLogo width={200} height={70} />
                            </View>
                            <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                        </RNAnimated.View>

                        {/* Form Section */}
                        <RNAnimated.View 
                            style={[
                                styles.formWrapper,
                                {
                                    opacity: formFadeAnim,
                                    transform: [{ translateY: formSlideAnim }],
                                }
                            ]}
                        >
                            <BlurView intensity={20} tint="dark" style={styles.formBlur}>
                                <LinearGradient
                                    colors={['rgba(30, 20, 40, 0.8)', 'rgba(20, 15, 30, 0.9)']}
                                    style={styles.formGradient}
                                >
                                    <View style={styles.formContainer}>
                                        <Text style={styles.title}>Acceso por Invitación</Text>
                                        <Text style={styles.subtitle}>
                                            Ingresa tu código único para registrarte
                                        </Text>

                                        {error && (
                                            <View style={styles.errorContainer}>
                                                <Ionicons name="alert-circle" size={18} color="#F87171" />
                                                <Text style={styles.errorText}>{error}</Text>
                                            </View>
                                        )}

                                        <View style={styles.inputWrapper}>
                                            <LinearGradient
                                                colors={['rgba(139, 92, 246, 0.2)', 'rgba(178, 45, 86, 0.1)']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.inputGradientBorder}
                                            >
                                                <View style={styles.inputContainer}>
                                                    <Ionicons name="key" size={20} color="#A78BFA" style={styles.inputIcon} />
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Código de invitación"
                                                        placeholderTextColor="rgba(156, 163, 175, 0.6)"
                                                        value={invitationCode}
                                                        onChangeText={(text) => setInvitationCode(text.toUpperCase())}
                                                        autoCapitalize="characters"
                                                        autoCorrect={false}
                                                        data-testid="invitation-code-input"
                                                    />
                                                </View>
                                            </LinearGradient>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                            onPress={handleValidateCode}
                                            disabled={loading}
                                            activeOpacity={0.8}
                                            data-testid="validate-code-button"
                                        >
                                            <LinearGradient
                                                colors={['#8B5CF6', '#A855F7', '#C026D3']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.buttonGradient}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.primaryButtonText}>Continuar</Text>
                                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <View style={styles.dividerContainer}>
                                            <View style={styles.divider} />
                                            <Text style={styles.dividerText}>o</Text>
                                            <View style={styles.divider} />
                                        </View>

                                        <TouchableOpacity
                                            style={styles.loginLink}
                                            onPress={handleGoogleLogin}
                                            disabled={loading}
                                            data-testid="login-link-button"
                                        >
                                            <Text style={styles.linkText}>
                                                ¿Ya tienes cuenta?{' '}
                                                <Text style={styles.linkHighlight}>Inicia sesión</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </BlurView>
                        </RNAnimated.View>

                        {/* Footer */}
                        <RNAnimated.Text 
                            style={[
                                styles.footerText,
                                { opacity: formFadeAnim }
                            ]}
                        >
                            Solicita tu código de invitación al administrador
                        </RNAnimated.Text>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    }

    // Step 2: Google sign in after code validation
    return (
        <View style={styles.container}>
            <InteractiveBackground />
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                {/* Logo Section */}
                <RNAnimated.View 
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <View style={styles.logoGlow}>
                        <WowLogo width={200} height={70} />
                    </View>
                    <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                </RNAnimated.View>

                {/* Form Section */}
                <RNAnimated.View 
                    style={[
                        styles.formWrapper,
                        {
                            opacity: formFadeAnim,
                            transform: [{ translateY: formSlideAnim }],
                        }
                    ]}
                >
                    <BlurView intensity={20} tint="dark" style={styles.formBlur}>
                        <LinearGradient
                            colors={['rgba(30, 20, 40, 0.8)', 'rgba(20, 15, 30, 0.9)']}
                            style={styles.formGradient}
                        >
                            <View style={styles.formContainer}>
                                <View style={styles.successBadge}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    <Text style={styles.successBadgeText}>Código verificado</Text>
                                </View>

                                <Text style={styles.title}>¡Bienvenido!</Text>
                                <Text style={styles.subtitle}>
                                    Continúa con tu cuenta de Google
                                </Text>

                                {error && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={18} color="#F87171" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                                    onPress={handleGoogleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    data-testid="google-register-button"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#333" />
                                    ) : (
                                        <>
                                            <Image
                                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                                style={styles.googleIcon}
                                            />
                                            <Text style={styles.googleButtonText}>Continuar con Google</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => {
                                        setStep(1);
                                        setError(null);
                                    }}
                                    data-testid="back-button"
                                >
                                    <Ionicons name="arrow-back" size={18} color="#A78BFA" />
                                    <Text style={styles.backButtonText}>Cambiar código</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </RNAnimated.View>

                {/* Footer */}
                <Text style={styles.footerText}>
                    Al continuar, aceptas nuestros términos y condiciones
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingBottom: 30,
    },
    // Animated background orbs
    orb: {
        position: 'absolute',
        borderRadius: 999,
        overflow: 'hidden',
    },
    orb1: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        top: -SCREEN_WIDTH * 0.2,
        left: -SCREEN_WIDTH * 0.2,
    },
    orb2: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        bottom: SCREEN_HEIGHT * 0.15,
        right: -SCREEN_WIDTH * 0.15,
    },
    orb3: {
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        top: SCREEN_HEIGHT * 0.35,
        left: -SCREEN_WIDTH * 0.1,
    },
    orbGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
    noiseOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
        backgroundColor: 'transparent',
    },
    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoGlow: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(167, 139, 250, 0.8)',
        marginTop: 12,
        letterSpacing: 0.5,
    },
    // Form
    formWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    formBlur: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    formGradient: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    formContainer: {
        padding: 28,
        gap: 18,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'center',
    },
    successBadgeText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(156, 163, 175, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: 14,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: '#F87171',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    inputWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    inputGradientBorder: {
        padding: 1.5,
        borderRadius: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 10, 25, 0.8)',
        borderRadius: 12,
    },
    inputIcon: {
        marginLeft: 18,
    },
    input: {
        flex: 1,
        padding: 18,
        fontSize: 17,
        color: '#fff',
        letterSpacing: 2,
        fontWeight: '600',
    },
    primaryButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(75, 85, 99, 0.4)',
    },
    dividerText: {
        color: 'rgba(156, 163, 175, 0.6)',
        marginHorizontal: 16,
        fontSize: 13,
    },
    loginLink: {
        paddingVertical: 6,
    },
    linkText: {
        color: 'rgba(156, 163, 175, 0.9)',
        fontSize: 15,
        textAlign: 'center',
    },
    linkHighlight: {
        color: '#A78BFA',
        fontWeight: '600',
    },
    googleButton: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    googleIcon: {
        width: 22,
        height: 22,
    },
    googleButtonText: {
        color: '#1F2937',
        fontSize: 17,
        fontWeight: '600',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    backButtonText: {
        color: '#A78BFA',
        fontSize: 15,
        fontWeight: '500',
    },
    footerText: {
        textAlign: 'center',
        color: 'rgba(107, 114, 128, 0.8)',
        fontSize: 13,
        marginTop: 16,
    },
});

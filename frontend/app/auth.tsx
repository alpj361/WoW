import React, { useState, useEffect, useId } from 'react';
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
    Linking,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { submitEventFlyer } from '../src/services/api';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    withSpring,
    interpolate,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
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

// Production URL for web OAuth redirect
const PRODUCTION_WEB_URL = 'https://wo-w-nu.vercel.app';

// Helper to get the correct redirect URL based on platform and environment
const getRedirectUrl = () => {
    if (Platform.OS === 'web') {
        // In production web, use the production URL
        if (!__DEV__) {
            return `${PRODUCTION_WEB_URL}/auth-callback`;
        }
        // In development, use the current origin to ensure it matches what Supabase expects (e.g., http://localhost:8081)
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/auth-callback`;
        }
        return makeRedirectUri({ path: 'auth-callback' });
    }
    // For native apps, use the scheme from app.json
    return makeRedirectUri({
        scheme: 'wow-events',
        path: 'auth-callback',
    });
};

const INVITE_CODE_STORAGE_KEY = 'wow_pending_invite_code';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Elegant Shape Component - Floating geometric pill shapes
function ElegantShape({
    width,
    height,
    rotate,
    gradient,
    style,
    delay = 0,
}: {
    width: number;
    height: number;
    rotate: number;
    gradient: readonly [string, string, ...string[]];
    style: any;
    delay?: number;
}) {
    const entryProgress = useSharedValue(0);
    const floatProgress = useSharedValue(0);

    useEffect(() => {
        // Entry animation with delay
        const timeout = setTimeout(() => {
            entryProgress.value = withTiming(1, { duration: 2400 });
        }, delay);

        // Floating animation - continuous loop
        floatProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // infinite
            false
        );

        return () => clearTimeout(timeout);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const entryTranslateY = interpolate(entryProgress.value, [0, 1], [-150, 0]);
        const floatTranslateY = interpolate(floatProgress.value, [0, 1], [0, 15]);
        const rotateValue = interpolate(entryProgress.value, [0, 1], [rotate - 15, rotate]);

        return {
            opacity: entryProgress.value,
            transform: [
                { translateY: entryTranslateY + floatTranslateY },
                { rotate: `${rotateValue}deg` },
            ],
        };
    });

    return (
        <Animated.View style={[style, animatedStyle]}>
            <View
                style={{
                    width,
                    height,
                    borderRadius: height / 2,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
            >
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        flex: 1,
                        borderRadius: height / 2,
                    }}
                />
                {/* Inner glow */}
                <View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        borderRadius: height / 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                />
            </View>
        </Animated.View>
    );
}

// Interactive Background Component with elegant geometric shapes
// Using deep blue/teal tones inspired by HeroGeometric
function InteractiveBackground() {
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base dark gradient */}
            <LinearGradient
                colors={['#030303', '#05080f', '#030303']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Subtle color wash */}
            <LinearGradient
                colors={['rgba(99, 102, 241, 0.03)', 'transparent', 'rgba(244, 63, 94, 0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Elegant floating shapes */}
            <ElegantShape
                delay={300}
                width={SCREEN_WIDTH * 1.4}
                height={120}
                rotate={12}
                gradient={['rgba(99, 102, 241, 0.12)', 'rgba(99, 102, 241, 0.04)', 'transparent'] as const}
                style={styles.shape1}
            />

            <ElegantShape
                delay={500}
                width={SCREEN_WIDTH * 1.2}
                height={100}
                rotate={-15}
                gradient={['rgba(244, 63, 94, 0.12)', 'rgba(244, 63, 94, 0.04)', 'transparent'] as const}
                style={styles.shape2}
            />

            <ElegantShape
                delay={400}
                width={SCREEN_WIDTH * 0.7}
                height={70}
                rotate={-8}
                gradient={['rgba(139, 92, 246, 0.12)', 'rgba(139, 92, 246, 0.04)', 'transparent'] as const}
                style={styles.shape3}
            />

            <ElegantShape
                delay={600}
                width={SCREEN_WIDTH * 0.5}
                height={50}
                rotate={20}
                gradient={['rgba(6, 182, 212, 0.12)', 'rgba(6, 182, 212, 0.04)', 'transparent'] as const}
                style={styles.shape4}
            />

            <ElegantShape
                delay={700}
                width={SCREEN_WIDTH * 0.35}
                height={35}
                rotate={-25}
                gradient={['rgba(34, 211, 238, 0.10)', 'rgba(34, 211, 238, 0.03)', 'transparent'] as const}
                style={styles.shape5}
            />

            {/* Top and bottom vignette */}
            <LinearGradient
                colors={['rgba(3, 3, 3, 0.8)', 'transparent', 'rgba(3, 3, 3, 1)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
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

    // Submit flyer modal state
    const [showFlyerModal, setShowFlyerModal] = useState(false);
    const [flyerImage, setFlyerImage] = useState<string | null>(null);
    const [flyerDescription, setFlyerDescription] = useState('');
    const [flyerSenderName, setFlyerSenderName] = useState('');
    const [flyerSubmitting, setFlyerSubmitting] = useState(false);
    const [flyerSuccess, setFlyerSuccess] = useState(false);

    // Animation shared values
    const fadeAnim = useSharedValue(0);
    const slideAnim = useSharedValue(50);
    const formFadeAnim = useSharedValue(0);
    const formSlideAnim = useSharedValue(30);
    const logoScale = useSharedValue(0.3);
    const logoRotate = useSharedValue(-10);
    const glowPulse = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    // Haptic feedback helper
    const triggerHaptic = async (type: 'light' | 'medium' | 'success' | 'warning') => {
        if (Platform.OS === 'web') return;
        try {
            switch (type) {
                case 'light':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'success':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'warning':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
            }
        } catch (e) { }
    };

    useEffect(() => {
        console.log('✅ AuthScreen mounted');
        return () => console.log('👋 AuthScreen unmounted');
    }, []);

    useEffect(() => {
        // Impactful entrance animation sequence
        // 1. Logo scale + rotate entrance with spring
        logoScale.value = withDelay(200, withSpring(1, { 
            damping: 12, 
            stiffness: 100,
            mass: 1,
        }));
        logoRotate.value = withDelay(200, withSpring(0, { 
            damping: 15, 
            stiffness: 80 
        }));
        
        // 2. Fade in
        fadeAnim.value = withDelay(100, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
        slideAnim.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 90 }));

        // 3. Glow pulse animation - continuous
        glowPulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );

        // 4. Form animations after logo settles
        const timeout = setTimeout(() => {
            formFadeAnim.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
            formSlideAnim.value = withSpring(0, { damping: 20, stiffness: 100 });
            // Trigger haptic on form appear
            triggerHaptic('light');
        }, 700);

        return () => clearTimeout(timeout);
    }, []);

    // Enhanced animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [
            { translateY: slideAnim.value },
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
        transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.95, 1.05]) }],
    }));

    const formAnimatedStyle = useAnimatedStyle(() => ({
        opacity: formFadeAnim.value,
        transform: [{ translateY: formSlideAnim.value }],
    }));

    const footerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: formFadeAnim.value,
    }));

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    // Button press animation helper
    const animateButtonPress = () => {
        buttonScale.value = withSequence(
            withTiming(0.95, { duration: 100 }),
            withSpring(1, { damping: 15, stiffness: 400 })
        );
        triggerHaptic('medium');
    };

    // Set error from URL params on mount
    useEffect(() => {
        if (params.error === 'not_registered') {
            setError('No tienes cuenta. Regístrate con un código de invitación.');
        }
        // Clear any stale auth states
        authState.reset();
    }, [params.error]);

    const openFlyerModal = () => {
        setFlyerImage(null);
        setFlyerDescription('');
        setFlyerSenderName('');
        setFlyerSuccess(false);
        setShowFlyerModal(true);
    };

    const handlePickFlyerImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar el flyer.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setFlyerImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
        }
    };

    const handleSubmitFlyer = async () => {
        if (!flyerImage) {
            Alert.alert('Imagen requerida', 'Por favor selecciona el flyer de tu evento.');
            return;
        }
        setFlyerSubmitting(true);
        try {
            await submitEventFlyer(
                flyerImage,
                flyerSenderName.trim() || undefined,
                flyerDescription.trim() || undefined
            );
            setFlyerSuccess(true);
        } catch {
            Alert.alert('Error', 'No pudimos enviar tu evento. Intenta de nuevo más tarde.');
        } finally {
            setFlyerSubmitting(false);
        }
    };

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
            const redirectUrl = getRedirectUrl();

            // On web, avoid popup windows; let Supabase redirect the same tab.
            // Store the invitation code so the callback can finish registration.
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    window.sessionStorage?.setItem(INVITE_CODE_STORAGE_KEY, validatedCode);
                }

                const { error: authError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                    },
                });
                if (authError) throw authError;
                return;
            }

            const { data, error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Supabase validates redirectTo against allowlisted URLs.
                    // Keep it "clean" (no query params) to avoid "requested path is invalid".
                    // The invitation code is passed internally after OAuth completes.
                    redirectTo: redirectUrl,
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
            const redirectUrl = getRedirectUrl();

            // On web, avoid popup windows; let Supabase redirect the same tab.
            if (Platform.OS === 'web') {
                const { error: authError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                    },
                });
                if (authError) throw authError;
                return;
            }

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
                        {/* Home button to return to read-only feed */}
                        <TouchableOpacity
                            style={styles.homeButton}
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = '/';
                                } else {
                                    router.replace('/');
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                            <Text style={styles.homeButtonText}>Explorar</Text>
                        </TouchableOpacity>

                        {/* Logo Section */}
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                logoAnimatedStyle,
                            ]}
                        >
                            <View style={styles.logoGlow}>
                                <WowLogo width={280} height={100} />
                            </View>
                            <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                        </Animated.View>

                        {/* Form Section */}
                        <Animated.View
                            style={[
                                styles.formWrapper,
                                formAnimatedStyle,
                            ]}
                        >
                            <BlurView intensity={20} tint="dark" style={styles.formBlur}>
                                <LinearGradient
                                    colors={['rgba(15, 23, 42, 0.85)', 'rgba(10, 15, 30, 0.95)']}
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
                                                colors={['rgba(99, 102, 241, 0.3)', 'rgba(34, 211, 238, 0.15)']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.inputGradientBorder}
                                            >
                                                <View style={styles.inputContainer}>
                                                    <Ionicons name="key" size={20} color="#818CF8" style={styles.inputIcon} />
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
                                                colors={['#4F46E5', '#6366F1', '#06B6D4']}
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

                                        <View style={styles.dividerContainer}>
                                            <View style={styles.divider} />
                                            <View style={styles.divider} />
                                        </View>

                                        <TouchableOpacity
                                            style={styles.sendEventButton}
                                            onPress={openFlyerModal}
                                            activeOpacity={0.75}
                                        >
                                            <Ionicons name="megaphone-outline" size={18} color="#10B981" />
                                            <Text style={styles.sendEventButtonText}>Enviar mi evento a WoW</Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </BlurView>
                        </Animated.View>

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                Al continuar, aceptas nuestros
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        router.push('/terminos');
                                    } else {
                                        Linking.openURL('https://wo-w-nu.vercel.app/terminos');
                                    }
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                                style={styles.footerLink}
                            >
                                <Text style={[styles.footerText, styles.linkHighlight]}> términos</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerText}> y </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        router.push('/privacidad');
                                    } else {
                                        Linking.openURL('https://wo-w-nu.vercel.app/privacidad');
                                    }
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                                style={styles.footerLink}
                            >
                                <Text style={[styles.footerText, styles.linkHighlight]}>privacidad</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Submit Event Flyer Modal */}
                <Modal
                    visible={showFlyerModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowFlyerModal(false)}
                >
                    <View style={flyerStyles.modalContainer}>
                        <LinearGradient
                            colors={['#030303', '#05080f', '#030303']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Header */}
                        <View style={flyerStyles.modalHeader}>
                            <TouchableOpacity
                                onPress={() => setShowFlyerModal(false)}
                                style={flyerStyles.closeButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                            <Text style={flyerStyles.modalTitle}>Enviar evento a WoW</Text>
                            <View style={{ width: 38 }} />
                        </View>

                        <ScrollView
                            style={flyerStyles.scrollView}
                            contentContainerStyle={flyerStyles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {flyerSuccess ? (
                                <View style={flyerStyles.successContainer}>
                                    <View style={flyerStyles.successIcon}>
                                        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                                    </View>
                                    <Text style={flyerStyles.successTitle}>¡Evento recibido!</Text>
                                    <Text style={flyerStyles.successSubtitle}>
                                        Revisaremos tu evento y lo publicaremos en WoW si cumple con los requisitos. Puede tomar unas horas.
                                    </Text>
                                    <TouchableOpacity
                                        style={flyerStyles.doneButton}
                                        onPress={() => setShowFlyerModal(false)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={flyerStyles.doneButtonText}>Listo</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Text style={flyerStyles.sectionLabel}>Flyer del evento *</Text>
                                    <TouchableOpacity
                                        style={flyerStyles.imagePicker}
                                        onPress={handlePickFlyerImage}
                                        activeOpacity={0.75}
                                    >
                                        {flyerImage ? (
                                            <Image
                                                source={{ uri: flyerImage }}
                                                style={flyerStyles.flyerPreview}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={flyerStyles.imagePickerEmpty}>
                                                <Ionicons name="image-outline" size={40} color="#4B5563" />
                                                <Text style={flyerStyles.imagePickerText}>Seleccionar flyer</Text>
                                                <Text style={flyerStyles.imagePickerHint}>JPG, PNG • desde tu galería</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {flyerImage && (
                                        <TouchableOpacity
                                            style={flyerStyles.changeImageLink}
                                            onPress={handlePickFlyerImage}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="refresh" size={14} color="#818CF8" />
                                            <Text style={flyerStyles.changeImageLinkText}>Cambiar imagen</Text>
                                        </TouchableOpacity>
                                    )}

                                    <Text style={flyerStyles.sectionLabel}>Tu nombre o empresa</Text>
                                    <View style={flyerStyles.inputWrapper}>
                                        <TextInput
                                            style={flyerStyles.textInput}
                                            placeholder="Ej: Café Tarro, DJ Marcos, ..."
                                            placeholderTextColor="#4B5563"
                                            value={flyerSenderName}
                                            onChangeText={setFlyerSenderName}
                                            returnKeyType="next"
                                        />
                                    </View>

                                    <Text style={flyerStyles.sectionLabel}>Detalles adicionales</Text>
                                    <View style={flyerStyles.inputWrapper}>
                                        <TextInput
                                            style={[flyerStyles.textInput, flyerStyles.textArea]}
                                            placeholder="Agrega info que no esté en el flyer: precio, link de reservas, edad mínima..."
                                            placeholderTextColor="#4B5563"
                                            value={flyerDescription}
                                            onChangeText={setFlyerDescription}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[flyerStyles.submitButton, (!flyerImage || flyerSubmitting) && flyerStyles.submitButtonDisabled]}
                                        onPress={handleSubmitFlyer}
                                        disabled={!flyerImage || flyerSubmitting}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#059669', '#10B981']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={flyerStyles.submitButtonGradient}
                                        >
                                            {flyerSubmitting ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="send" size={18} color="#fff" />
                                                    <Text style={flyerStyles.submitButtonText}>Enviar a WoW</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <Text style={flyerStyles.disclaimer}>
                                        El equipo de WoW revisará tu evento antes de publicarlo. Nos reservamos el derecho de no publicar contenido inapropiado.
                                    </Text>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </Modal>
            </View>
        );
    }

    // Step 2: Google sign in after code validation
    return (
        <View style={styles.container}>
            <InteractiveBackground />
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                {/* Logo Section */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        logoAnimatedStyle,
                    ]}
                >
                    <View style={styles.logoGlow}>
                        <WowLogo width={200} height={70} />
                    </View>
                    <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                </Animated.View>

                {/* Form Section */}
                <Animated.View
                    style={[
                        styles.formWrapper,
                        formAnimatedStyle,
                    ]}
                >
                    <BlurView intensity={20} tint="dark" style={styles.formBlur}>
                        <LinearGradient
                            colors={['rgba(20, 35, 50, 0.85)', 'rgba(15, 25, 40, 0.95)']}
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
                                    <Ionicons name="arrow-back" size={18} color="#818CF8" />
                                    <Text style={styles.backButtonText}>Cambiar código</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        Al continuar, aceptas nuestros
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                router.push('/terminos');
                            } else {
                                Linking.openURL('https://wo-w-nu.vercel.app/terminos');
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                        style={styles.footerLink}
                    >
                        <Text style={[styles.footerText, styles.linkHighlight]}> términos</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerText}> y </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                router.push('/privacidad');
                            } else {
                                Linking.openURL('https://wo-w-nu.vercel.app/privacidad');
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                        style={styles.footerLink}
                    >
                        <Text style={[styles.footerText, styles.linkHighlight]}>privacidad</Text>
                    </TouchableOpacity>
                </View>
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
    // Elegant geometric shapes
    shape1: {
        position: 'absolute',
        left: -SCREEN_WIDTH * 0.15,
        top: SCREEN_HEIGHT * 0.12,
    },
    shape2: {
        position: 'absolute',
        right: -SCREEN_WIDTH * 0.1,
        top: SCREEN_HEIGHT * 0.72,
    },
    shape3: {
        position: 'absolute',
        left: SCREEN_WIDTH * 0.05,
        bottom: SCREEN_HEIGHT * 0.05,
    },
    shape4: {
        position: 'absolute',
        right: SCREEN_WIDTH * 0.12,
        top: SCREEN_HEIGHT * 0.08,
    },
    shape5: {
        position: 'absolute',
        left: SCREEN_WIDTH * 0.2,
        top: SCREEN_HEIGHT * 0.03,
    },
    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoGlow: {
        // Remove shadow on web as it creates a square background effect
        ...Platform.select({
            ios: {
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 25,
            },
            android: {
                elevation: 0,
            },
            web: {
                // No shadow on web - it creates ugly square
            },
        }),
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(200, 210, 220, 0.85)',
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
        borderColor: 'rgba(99, 102, 241, 0.15)',
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
        shadowColor: '#6366F1',
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
        color: '#818CF8',
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
        color: '#818CF8',
        fontSize: 15,
        fontWeight: '500',
    },
    footerText: {
        textAlign: 'center',
        color: 'rgba(107, 114, 128, 0.8)',
        fontSize: 13,
        marginTop: 16,
    },
    footerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLink: {
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        marginBottom: 12,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    sendEventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    sendEventButtonText: {
        color: '#10B981',
        fontSize: 15,
        fontWeight: '600',
    },
});

const flyerStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#030303',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
        gap: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 8,
        marginBottom: 2,
    },
    imagePicker: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(75, 85, 99, 0.5)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        minHeight: 200,
    },
    imagePickerEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    imagePickerText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
    },
    imagePickerHint: {
        color: '#4B5563',
        fontSize: 12,
    },
    flyerPreview: {
        width: '100%',
        height: 260,
    },
    changeImageLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-end',
        paddingVertical: 4,
    },
    changeImageLinkText: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '500',
    },
    inputWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(75, 85, 99, 0.4)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        overflow: 'hidden',
    },
    textInput: {
        padding: 14,
        fontSize: 15,
        color: '#fff',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    submitButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonGradient: {
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    disclaimer: {
        fontSize: 12,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 4,
    },
    successContainer: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 16,
    },
    successIcon: {
        marginBottom: 8,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
    },
    successSubtitle: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    doneButton: {
        marginTop: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 14,
    },
    doneButtonText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '600',
    },
});

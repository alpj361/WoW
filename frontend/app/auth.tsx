import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WowLogo } from '../src/components/WowLogo';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { authState } from '../src/utils/authState';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AuthScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const [step, setStep] = useState<1 | 2>(1);
    const [invitationCode, setInvitationCode] = useState('');
    const [validatedCode, setValidatedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
                    <View style={styles.logoContainer}>
                        <WowLogo width={180} height={60} />
                        <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Acceso por Invitación</Text>
                        <Text style={styles.subtitle}>
                            Ingresa tu código único para registrarte
                        </Text>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Ionicons name="key" size={20} color="#8B5CF6" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Código de invitación"
                                placeholderTextColor="#6B7280"
                                value={invitationCode}
                                onChangeText={(text) => setInvitationCode(text.toUpperCase())}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={handleValidateCode}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.primaryButtonText}>Continuar</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={handleGoogleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.linkText}>
                                ¿Ya tienes cuenta? <Text style={styles.linkHighlight}>Inicia sesión</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>
                        Solicita tu código de invitación al administrador
                    </Text>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Step 2: Google sign in after code validation
    return (
        <View style={styles.container}>
            <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
                <View style={styles.logoContainer}>
                    <WowLogo width={180} height={60} />
                    <Text style={styles.tagline}>Descubre eventos increíbles</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>¡Bienvenido!</Text>
                    <Text style={styles.subtitle}>
                        Continúa con tu cuenta de Google
                    </Text>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.googleButton, loading && styles.buttonDisabled]}
                        onPress={handleGoogleRegister}
                        disabled={loading}
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
                    >
                        <Ionicons name="arrow-back" size={18} color="#8B5CF6" />
                        <Text style={styles.backButtonText}>Cambiar código</Text>
                    </TouchableOpacity>
                </View>

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
        backgroundColor: '#0F0F0F',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    tagline: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: '#1F1F1F',
        borderRadius: 20,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3A3A',
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#fff',
    },
    primaryButton: {
        backgroundColor: '#8B5CF6',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    googleButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    backButtonText: {
        color: '#8B5CF6',
        fontSize: 14,
    },
    linkButton: {
        paddingVertical: 8,
    },
    linkText: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
    },
    linkHighlight: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 12,
    },
});

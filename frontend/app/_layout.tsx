import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { Tabs, Slot, useSegments, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewport } from '../src/components/WebViewport';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import SplashScreen from '../src/components/SplashScreen';
import { authState } from '../src/utils/authState';
import { GlassTabBar } from '../src/components/GlassTabBar';

// Inner layout that uses auth context
function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const { user, loading, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [isVerifiedAuth, setIsVerifiedAuth] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const navigationRef = useRef(false);

  // Check if we're on an auth route
  const isAuthRoute = segments[0] === 'auth' || segments[0] === 'auth-callback' || segments[0] === 'auth-verify';

  // Check if auth callback is processing or verified
  useEffect(() => {
    // Initial check
    const initialState = authState.getState();
    setIsProcessingAuth(initialState.isProcessing);
    setIsVerifiedAuth(initialState.isVerified);

    // Subscribe to changes
    const unsubscribe = authState.subscribe((state) => {
      setIsProcessingAuth(state.isProcessing);
      setIsVerifiedAuth(state.isVerified);
    });

    return () => unsubscribe();
  }, []);

  // Timeout protection: if loading takes too long, force redirect
  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (Platform.OS === 'ios') {
        console.log('🍎 [iOS] _layout: Auth loading timed out after 10s, forcing redirect');
      } else {
        console.log('⚠️ _layout: Auth loading timed out after 10s, forcing redirect');
      }
      setHasTimedOut(true);
    }, 10000); // 10 second timeout (reduced from 30s for better UX)

    return () => clearTimeout(timeout);
  }, [loading]);

  // Handle navigation based on auth state
  // CRITICAL: We do NOT redirect to /auth when no user - that causes infinite loop.
  // Instead, we conditionally render auth screen below.
  useEffect(() => {
    // Don't navigate while loading or processing auth (unless timed out)
    if ((loading && !hasTimedOut) || isProcessingAuth) {
      return;
    }

    // Prevent multiple navigations
    if (navigationRef.current) {
      console.log('🔍 _layout: Navigation already pending, skipping');
      return;
    }

    // Case 1: On auth-callback - let it handle its own navigation
    if (segments[0] === 'auth-callback') {
      console.log('🔍 _layout: On auth-callback, letting it handle navigation');
      return;
    }

    // Case 2: Authenticated user on auth screen - go to home
    // Only do this if on /auth specifically, not auth-callback
    if (user && segments[0] === 'auth' && segments.length === 1) {
      console.log('🔍 _layout: User authenticated on /auth, redirecting to /');
      navigationRef.current = true;
      router.replace('/');
      setTimeout(() => { navigationRef.current = false; }, 1000);
      return;
    }

    // NOTE: We do NOT redirect to /auth here - that's handled by conditional rendering below
  }, [user, loading, hasTimedOut, isAuthRoute, isProcessingAuth, isVerifiedAuth, segments, router]);

  // If on auth route, render just that screen (let it handle its flow)
  // CRITICAL: Check this BEFORE loading state, otherwise auth-callback is blocked
  // by the session check it is supposed to resolve!
  if (isAuthRoute) {
    return (
      <WebViewport>
        <View style={styles.container}>
          <Slot />
        </View>
      </WebViewport>
    );
  }

  // While loading auth state, show loading indicator (not just black screen)
  if (loading && !hasTimedOut) {
    if (Platform.OS === 'ios') {
      console.log('🍎 [iOS] _layout: Showing loading indicator');
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // If timed out, force redirect to auth
  if (hasTimedOut) {
    console.log('⚠️ _layout: Timeout reached, forcing redirect to /auth');
    return <Redirect href="/auth" />;
  }

  // If not authenticated and not on auth route, redirect to auth
  // Using Redirect component instead of router.replace() to avoid infinite loop
  if (!user && !isAuthRoute) {
    // If auth-callback marked user as verified, wait for state update
    if (isVerifiedAuth) {
      console.log('🔍 _layout: Waiting for user state after verification');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      );
    }
    console.log('🔍 _layout: No user, using Redirect to /auth');
    return <Redirect href="/auth" />;
  }

  // Authenticated - show tabs
  return (
    <WebViewport>
      <View style={styles.container}>
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#8B5CF6',
            tabBarInactiveTintColor: '#6B7280',
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Explorar',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="compass" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="create"
            options={{
              title: 'Crear',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="add-circle" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="places"
            options={{
              title: 'Spots',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="globe" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="extractions"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="myevents"
            options={{
              title: 'Mis Eventos',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="bookmark" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
          {/* Hide auth screens from tabs */}
          <Tabs.Screen
            name="auth"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="auth-callback"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="auth-verify"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="event/[id]"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="radial-demo"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </WebViewport>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

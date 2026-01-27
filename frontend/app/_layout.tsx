import React, { useEffect, useState, useRef } from 'react';
import { Tabs, Slot, useSegments, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewport } from '../src/components/WebViewport';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import SplashScreen from '../src/components/SplashScreen';
import { authState } from '../src/utils/authState';

// Inner layout that uses auth context
function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const { user, loading, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const navigationRef = useRef(false);

  // Check if we're on an auth route
  const isAuthRoute = segments[0] === 'auth' || segments[0] === 'auth-callback' || segments[0] === 'auth-verify';

  // Check if auth callback is processing
  useEffect(() => {
    // Initial check
    setIsProcessingAuth(authState.getState().isProcessing);

    // Subscribe to changes
    const unsubscribe = authState.subscribe((state) => {
      setIsProcessingAuth(state.isProcessing);
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
      console.log('⚠️ _layout: Auth loading timed out after 30s, forcing redirect');
      setHasTimedOut(true);
    }, 30000); // 30 second timeout (increased for slower networks)

    return () => clearTimeout(timeout);
  }, [loading]);

  // Handle navigation based on auth state
  useEffect(() => {
    // Don't navigate while loading or processing auth (unless timed out)
    if ((loading && !hasTimedOut) || isProcessingAuth) {
      return;
    }

    // Prevent multiple navigations
    if (navigationRef.current) {
      return;
    }

    // Case 1: On auth-callback - let it handle its own navigation
    if (segments[0] === 'auth-callback') {
      console.log('🔍 _layout: On auth-callback, letting it handle navigation');
      return;
    }

    // Case 2: Not authenticated (no user) and not on auth route - go to auth
    // Also redirect if session exists but no user (incomplete auth state)
    if (!user && !isAuthRoute) {
      console.log('🔍 _layout: No user, not on auth route, redirecting to /auth');
      navigationRef.current = true;
      router.replace('/auth');
      setTimeout(() => { navigationRef.current = false; }, 1000);
      return;
    }

    // Case 3: Authenticated user on auth screen (not callback) - go to home
    // Only do this if on /auth specifically, not auth-callback
    if (user && segments[0] === 'auth' && segments.length === 1) {
      console.log('🔍 _layout: User authenticated on /auth, redirecting to /');
      navigationRef.current = true;
      router.replace('/');
      setTimeout(() => { navigationRef.current = false; }, 1000);
      return;
    }
  }, [user, loading, hasTimedOut, isAuthRoute, isProcessingAuth, segments, router]);

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // If not authenticated and not on auth route, show loading briefly while redirecting
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // Authenticated - show tabs
  return (
    <WebViewport>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1A1A1A',
              borderTopColor: '#2A2A2A',
              borderTopWidth: 1,
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#8B5CF6',
            tabBarInactiveTintColor: '#6B7280',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
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

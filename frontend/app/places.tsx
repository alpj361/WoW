import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassSphere, SphereSize } from '../src/components/GlassSphere';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Place {
  imageUrl: string;
  alt: string;
  placeName: string;
  size: SphereSize;
}

const PLACES: Place[] = [
  // Coffee shops
  {
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=85&w=800&auto=format&fit=crop',
    alt: 'Cozy coffee shop interior',
    placeName: 'Café Artesanal',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=85&w=800&auto=format&fit=crop',
    alt: 'Modern coffee bar',
    placeName: 'Rooftop Coffee',
    size: 'md',
  },
  // Bars
  {
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=85&w=800&auto=format&fit=crop',
    alt: 'Cocktail bar with neon lights',
    placeName: 'Speakeasy Bar',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=85&w=800&auto=format&fit=crop',
    alt: 'Rooftop bar at night',
    placeName: 'Sky Lounge',
    size: 'md',
  },
  // --- TITLE BREAK ---
  // Restaurants
  {
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=85&w=800&auto=format&fit=crop',
    alt: 'Elegant restaurant interior',
    placeName: 'Bistro Urbano',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=85&w=800&auto=format&fit=crop',
    alt: 'Street food market',
    placeName: 'Food Hall',
    size: 'md',
  },
  // More places
  {
    imageUrl: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?q=85&w=800&auto=format&fit=crop',
    alt: 'Brunch spot with plants',
    placeName: 'Garden Brunch',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?q=85&w=800&auto=format&fit=crop',
    alt: 'Wine bar with bottles',
    placeName: 'Wine & Tapas',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=85&w=800&auto=format&fit=crop',
    alt: 'Craft beer pub',
    placeName: 'Cervecería',
    size: 'md',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=85&w=800&auto=format&fit=crop',
    alt: 'Specialty coffee',
    placeName: 'Third Wave',
    size: 'sm',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=85&w=800&auto=format&fit=crop',
    alt: 'Cozy restaurant',
    placeName: 'La Terraza',
    size: 'md',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=85&w=800&auto=format&fit=crop',
    alt: 'Dessert cafe',
    placeName: 'Dulce Café',
    size: 'sm',
  },
];

// Split places for masonry layout
const topPlaces = PLACES.slice(0, 4);
const bottomPlaces = PLACES.slice(4);

export default function PlacesScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const showScrollHint = useSharedValue(1);

  // Animated styles
  const scrollHintStyle = useAnimatedStyle(() => ({
    opacity: showScrollHint.value,
    transform: [{ translateY: showScrollHint.value === 0 ? 20 : 0 }],
  }));

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.value = y;
    showScrollHint.value = withTiming(y <= 50 ? 1 : 0, { duration: 200 });
  };

  // Render masonry column
  const renderMasonryColumn = (
    places: Place[],
    isRightColumn: boolean,
    startIndex: number,
  ) => {
    const columnPlaces = places.filter((_, i) =>
      isRightColumn ? i % 2 === 1 : i % 2 === 0
    );

    return (
      <View style={[styles.masonryColumn, isRightColumn && styles.masonryColumnRight]}>
        {columnPlaces.map((place, i) => {
          const actualIndex = isRightColumn ? i * 2 + 1 : i * 2;
          const delay = (startIndex + actualIndex) * 100;

          return (
            <Animated.View
              key={place.placeName}
              entering={SlideInUp.delay(delay).springify().damping(15)}
              style={styles.sphereWrapper}
            >
              <GlassSphere
                imageUrl={place.imageUrl}
                alt={place.alt}
                placeName={place.placeName}
                size={place.size}
                index={startIndex + actualIndex}
                delay={delay / 1000}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Subtitle */}
        <Animated.Text
          entering={FadeIn.delay(100).duration(500)}
          style={styles.subtitle}
        >
          Descubre la ciudad
        </Animated.Text>

        {/* Top bubbles masonry */}
        <View style={styles.masonryContainer}>
          {renderMasonryColumn(topPlaces, false, 0)}
          {renderMasonryColumn(topPlaces, true, 0)}
        </View>

        {/* Hero Title */}
        <Animated.View
          entering={FadeIn.delay(400).duration(600)}
          style={styles.heroContainer}
        >
          <Text style={styles.heroTitle}>SOON</Text>
          <Text style={styles.heroTitle}>PLACES</Text>
        </Animated.View>

        {/* Bottom bubbles masonry */}
        <View style={styles.masonryContainer}>
          {renderMasonryColumn(bottomPlaces, false, 4)}
          {renderMasonryColumn(bottomPlaces, true, 4)}
        </View>

        {/* Extra padding at bottom */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Scroll hint - fixed at bottom */}
      <Animated.View style={[styles.scrollHint, scrollHintStyle]}>
        <Text style={styles.scrollHintText}>scroll</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Subtitle
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 20,
    fontWeight: '400',
  },
  // Masonry layout
  masonryContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  masonryColumn: {
    flex: 1,
    gap: 14,
  },
  masonryColumnRight: {
    marginTop: 40,
  },
  sphereWrapper: {
    alignItems: 'center',
  },
  // Hero title
  heroContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-condensed',
      default: 'System',
    }),
    fontSize: SCREEN_WIDTH * 0.22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.2,
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
  // Scroll hint
  scrollHint: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    backdropFilter: 'blur(16px)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  scrollHintText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});

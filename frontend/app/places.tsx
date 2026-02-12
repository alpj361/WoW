import React from 'react';
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
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
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
    size: 'lg',
  },
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
    size: 'md',
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
    size: 'lg',
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

// Organic scattered layout — each row has a preset config for visual variation
interface RowConfig {
  items: number[];       // indices into PLACES[]
  offsets: number[];     // horizontal offset per bubble (%)
  verticalNudge: number; // px nudge for the whole row
}

const ROW_CONFIGS: RowConfig[] = [
  { items: [0, 1], offsets: [5, -3], verticalNudge: 0 },
  { items: [2, 3], offsets: [-8, 6], verticalNudge: -12 },
  { items: [4, 5, 6], offsets: [2, -5, 8], verticalNudge: -8 },
  { items: [7, 8], offsets: [10, -6], verticalNudge: -16 },
  { items: [9, 10, 11], offsets: [-4, 7, 0], verticalNudge: -10 },
];

export default function PlacesScreen() {
  const insets = useSafeAreaInsets();

  const renderScatteredRow = (config: RowConfig, rowIndex: number) => {
    const places = config.items.map(i => PLACES[i]);
    const globalDelay = rowIndex * 120;

    return (
      <View
        key={`row-${rowIndex}`}
        style={[
          styles.scatteredRow,
          { marginTop: config.verticalNudge },
        ]}
      >
        {places.map((place, i) => {
          const offset = config.offsets[i] || 0;
          const itemDelay = globalDelay + i * 80;

          return (
            <Animated.View
              key={place.placeName}
              entering={SlideInUp.delay(itemDelay).springify().damping(14).stiffness(100)}
              style={[
                styles.bubbleWrapper,
                {
                  marginLeft: `${Math.max(0, offset)}%`,
                  marginRight: `${Math.max(0, -offset)}%`,
                } as any,
              ]}
            >
              <GlassSphere
                imageUrl={place.imageUrl}
                alt={place.alt}
                placeName={place.placeName}
                size={place.size}
                index={config.items[i]}
                delay={itemDelay / 1000}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Split rows around the hero title
  const topRows = ROW_CONFIGS.slice(0, 2);
  const bottomRows = ROW_CONFIGS.slice(2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Subtitle */}
        <Animated.Text
          entering={FadeIn.delay(100).duration(500)}
          style={styles.subtitle}
        >
          Tus lugares favoritos conectados
        </Animated.Text>

        {/* Top scattered bubbles */}
        {topRows.map((cfg, i) => renderScatteredRow(cfg, i))}

        {/* Hero Title */}
        <Animated.View
          entering={FadeIn.delay(400).duration(600)}
          style={styles.heroContainer}
        >
          <Text style={styles.heroTitle}>SOON</Text>
          <Text style={styles.heroTitle}>PLACES</Text>
        </Animated.View>

        {/* Bottom scattered bubbles */}
        {bottomRows.map((cfg, i) => renderScatteredRow(cfg, i + topRows.length))}

        {/* Bottom padding */}
        <View style={{ height: 140 }} />
      </ScrollView>

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
    paddingHorizontal: 20,
    paddingTop: 12,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 24,
    fontWeight: '400',
  },
  // Scattered organic layout
  scatteredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bubbleWrapper: {
    alignItems: 'center',
    flexShrink: 1,
  },
  // Hero title
  heroContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-condensed',
      default: 'System',
    }),
    fontSize: Math.min(SCREEN_WIDTH * 0.22, 80),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: Math.min(SCREEN_WIDTH * 0.2, 72),
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
});

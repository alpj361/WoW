import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const attendees = [
  { name: 'Miguel', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { name: 'Sofia', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
  { name: 'Carlos', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
  { name: 'Ana', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { name: 'David', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
];

// Glass Attendees Component
function GlassAttendees() {
  // Animation for each avatar
  const avatarScales = attendees.map(() => useSharedValue(0));
  const avatarOpacities = attendees.map(() => useSharedValue(0));
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entry animation
    attendees.forEach((_, index) => {
      const delay = 300 + index * 100;
      avatarScales[index].value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      avatarOpacities[index].value = withDelay(
        delay,
        withTiming(1, { duration: 300 })
      );
    });

    // Subtle pulse animation for the container
    pulseScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const avatarStyles = attendees.map((_, index) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: avatarScales[index].value }],
      opacity: avatarOpacities[index].value,
    }))
  );

  return (
    <Animated.View style={[styles.glassContainer, containerStyle]}>
      <BlurView intensity={40} tint="dark" style={styles.blurView}>
        <View style={styles.glassContent}>
          {/* Avatars row */}
          <View style={styles.avatarsRow}>
            {attendees.map((attendee, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.avatarWrapper,
                  { marginLeft: index > 0 ? -12 : 0, zIndex: attendees.length - index },
                  avatarStyles[index],
                ]}
              >
                <Image
                  source={{ uri: attendee.image }}
                  style={styles.avatar}
                />
              </Animated.View>
            ))}
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.attendeesCount}>{attendees.length} asistirán</Text>
            <Text style={styles.attendeesLabel}>Personas que conoces</Text>
          </View>

          {/* Arrow indicator */}
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      </BlurView>

      {/* Glow effect */}
      <View style={styles.glowEffect} />
    </Animated.View>
  );
}

// Event Card Component (similar to main explore)
function DemoEventCard() {
  const cardWidth = Math.min(SCREEN_WIDTH * 0.9, 340);
  const cardHeight = Math.min(SCREEN_HEIGHT * 0.6, 480);

  return (
    <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
      {/* Background Image */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=800&fit=crop' }}
        style={styles.eventImage}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* Glass Attendees at top */}
      <View style={styles.glassPosition}>
        <GlassAttendees />
      </View>

      {/* Category badge */}
      <View style={styles.categoryBadge}>
        <Ionicons name="musical-notes" size={10} color="#fff" />
        <Text style={styles.categoryText}>Música & Cultura</Text>
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        <Text style={styles.title}>Festival de Jazz</Text>
        <Text style={styles.subtitle}>Una noche de música inolvidable</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.metaText}>15 Feb, 2026</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.metaText}>20:00</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.metaText}>Parque Central</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <View style={[styles.actionButton, styles.skipButton]}>
            <Ionicons name="close" size={28} color="#EF4444" />
          </View>
          <View style={[styles.actionButton, styles.saveButton]}>
            <Ionicons name="heart" size={28} color="#10B981" />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RadialDemoScreen() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Glass Attendees</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Card */}
        <View style={styles.content}>
          <DemoEventCard />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Componente glass mostrando asistentes confirmados
          </Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card styles
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Glass attendees position
  glassPosition: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  // Glass component styles
  glassContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  blurView: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  glassContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: '20%',
    right: '20%',
    height: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 20,
    transform: [{ scaleX: 1.5 }],
  },
  avatarsRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(30,30,30,0.8)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  attendeesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  attendeesLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Category badge
  categoryBadge: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Bottom content
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  // Action buttons
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  skipButton: {
    borderColor: '#EF4444',
  },
  saveButton: {
    borderColor: '#10B981',
  },
  // Info
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});

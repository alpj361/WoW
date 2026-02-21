import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Event } from '../store/eventStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PARALLAX_OVERSHOOT = 28;

const isEventToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const d     = new Date(dateStr);
    return (
      d.getDate()     === today.getDate()   &&
      d.getMonth()    === today.getMonth()  &&
      d.getFullYear() === today.getFullYear()
    );
  } catch { return false; }
};

const getCategoryGradient = (category: string): readonly [string, string, ...string[]] => {
  switch (category) {
    case 'music':     return ['rgba(139,92,246,0.8)', 'rgba(109,40,217,0.9)'];
    case 'volunteer': return ['rgba(236,72,153,0.8)', 'rgba(190,24,93,0.9)'];
    default:          return ['rgba(245,158,11,0.8)', 'rgba(217,119,6,0.9)'];
  }
};

const getCategoryIcon  = (c: string) => c === 'music' ? 'musical-notes' : c === 'volunteer' ? 'heart' : 'fast-food';
const getCategoryLabel = (c: string) => c === 'music' ? 'Música & Cultura' : c === 'volunteer' ? 'Voluntariado' : 'General';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventCardProps {
  event:        Event;
  onSave?:      () => void;
  onSkip?:      () => void;
  showActions?: boolean;
  onPress?:     () => void;
  /** SharedValue from VerticalEventStack drag — drives parallax on image */
  parallaxY?:   SharedValue<number>;
  /** Entrance stagger delay in ms */
  staggerDelay?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSave,
  onSkip,
  showActions  = true,
  onPress,
  parallaxY,
  staggerDelay = 0,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const gradient      = getCategoryGradient(event.category);
  const icon          = getCategoryIcon(event.category);
  const categoryLabel = getCategoryLabel(event.category);
  const router        = useRouter();
  const { user }      = useAuth();
  const isGuest       = !user;
  const showHoy       = isEventToday(event.date);

  const cardWidth  = Math.min(screenWidth  * 0.88, 360);
  const cardHeight = Math.min(screenHeight * 0.62, 520);

  // ── Entrance animation ──────────────────────────────────────────────────────
  const entranceScale   = useSharedValue(0.92);
  const entranceOpacity = useSharedValue(0);

  useEffect(() => {
    entranceScale.value   = withDelay(staggerDelay, withSpring(1, { damping: 18, stiffness: 200 }));
    entranceOpacity.value = withDelay(staggerDelay, withTiming(1, { duration: 320 }));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity:   entranceOpacity.value,
    transform: [{ scale: entranceScale.value }],
  }));

  // ── HOY badge pulse ─────────────────────────────────────────────────────────
  const hoyPulse = useSharedValue(1);
  useEffect(() => {
    if (!showHoy) return;
    hoyPulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 550 }),
        withTiming(1,    { duration: 550 }),
      ),
      -1, false,
    );
  }, [showHoy]);

  const hoyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoyPulse.value }],
    opacity:   interpolate(hoyPulse.value, [1, 1.18], [0.9, 1]),
  }));

  // ── Parallax image ──────────────────────────────────────────────────────────
  const fallbackParallax = useSharedValue(0);
  const activeParallax   = parallaxY ?? fallbackParallax;

  const parallaxStyle = useAnimatedStyle(() => {
    const shift = interpolate(
      activeParallax.value,
      [-120, 0, 120],
      [-PARALLAX_OVERSHOOT, 0, PARALLAX_OVERSHOOT],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY: shift }] };
  });

  // ── Button animations ───────────────────────────────────────────────────────
  const skipScale    = useSharedValue(1);
  const saveScale    = useSharedValue(1);
  const skipRotation = useSharedValue(0);
  const saveRotation = useSharedValue(0);

  const triggerHaptic = async (type: 'success' | 'medium') => {
    if (Platform.OS === 'web') return;
    try {
      type === 'success'
        ? await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handlePress = () => {
    if (onPress) { onPress(); return; }
    if (isGuest)  return;
    if (event.id) router.push(`/event/${event.id}`);
  };

  const skipGesture = Gesture.Tap()
    .onBegin(() => {
      skipScale.value    = withSpring(0.85, { damping: 15, stiffness: 400 });
      skipRotation.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(0, { duration: 50 }));
    })
    .onFinalize((_, ok) => {
      skipScale.value = withSpring(1, { damping: 10, stiffness: 300 });
      if (ok && onSkip) { runOnJS(triggerHaptic)('medium'); runOnJS(onSkip)(); }
    });

  const saveGesture = Gesture.Tap()
    .onBegin(() => {
      saveScale.value    = withSpring(0.85, { damping: 15, stiffness: 400 });
      saveRotation.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(0, { duration: 50 }));
    })
    .onFinalize((_, ok) => {
      saveScale.value = withSpring(1, { damping: 10, stiffness: 300 });
      if (ok && onSave) { runOnJS(triggerHaptic)('success'); runOnJS(onSave)(); }
    });

  const skipAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: skipScale.value }, { rotate: `${skipRotation.value}deg` }] }));
  const saveAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }, { rotate: `${saveRotation.value}deg` }] }));

  // ── Glass panel ─────────────────────────────────────────────────────────────
  const GlassInfoPanel = () => {
    const content = (
      <View style={styles.glassContent}>
        {/* Category badge + HOY badge row */}
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name={icon as any} size={12} color="#fff" />
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>

          {showHoy && (
            <Animated.View style={[styles.hoyBadge, hoyStyle]}>
              <Text style={styles.hoyText}>HOY</Text>
            </Animated.View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        {event.description && (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        )}

        <View style={styles.metaRow}>
          {event.date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{event.date}</Text>
            </View>
          )}
          {event.time && (
            <View style={styles.metaItem}>
              <Ionicons name="time" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{event.time}</Text>
            </View>
          )}
        </View>

        {event.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationText} numberOfLines={1}>{event.location}</Text>
          </View>
        )}

        {event.price && parseFloat(String(event.price)) > 0 && (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>Q{parseFloat(String(event.price)).toFixed(0)}</Text>
          </View>
        )}
      </View>
    );

    if (Platform.OS === 'web') {
      return <View style={[styles.glassPanel, styles.glassPanelWeb]}>{content}</View>;
    }
    return (
      <BlurView intensity={40} tint="dark" style={styles.glassPanel}>
        <View style={styles.glassPanelOverlay} />
        {content}
      </BlurView>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }, entranceStyle]}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardTouchable} activeOpacity={0.95} onPress={handlePress}>

          {/* Parallax image container — overflow:hidden is on styles.card */}
          {event.image ? (
            <Animated.View style={[styles.parallaxContainer, parallaxStyle]}>
              <Image
                source={{ uri: event.image }}
                style={styles.eventImage}
                contentFit="cover"
                transition={200}
              />
            </Animated.View>
          ) : (
            <LinearGradient
              colors={gradient}
              style={styles.placeholderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon as any} size={80} color="rgba(255,255,255,0.2)" />
            </LinearGradient>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />

          <GlassInfoPanel />
        </TouchableOpacity>

        {showActions && (
          <View style={styles.actionsContainer} pointerEvents="box-none">
            <GestureDetector gesture={skipGesture}>
              <Animated.View style={[styles.actionButton, styles.skipButton, skipAnimStyle]}>
                <Ionicons name="close" size={28} color="#fff" />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={saveGesture}>
              <Animated.View style={[styles.actionButton, styles.saveButton, saveAnimStyle]}>
                <Ionicons name="heart" size={28} color="#fff" />
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTouchable: {
    flex: 1,
  },
  // Parallax: image container is PARALLAX_OVERSHOOT*2 px taller than card
  parallaxContainer: {
    position: 'absolute',
    top:    -PARALLAX_OVERSHOOT,
    bottom: -PARALLAX_OVERSHOOT,
    left:   0,
    right:  0,
  },
  eventImage: {
    flex: 1,
  },
  placeholderGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // Glass panel
  glassPanel: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassPanelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,30,40,0.6)',
  },
  glassPanelWeb: {
    backgroundColor: 'rgba(30,30,40,0.85)',
    backdropFilter: 'blur(20px)',
  } as any,
  glassContent: {
    padding: 16,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // HOY badge — neon green pulse
  hoyBadge: {
    backgroundColor: 'rgba(16,185,129,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.6)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  hoyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    flex: 1,
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  skipButton: {
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    backgroundColor: 'rgba(16,185,129,0.85)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
});

export default EventCard;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
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
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Event } from '../store/eventStore';

interface EventCardProps {
  event: Event;
  onSave?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
  onPress?: () => void;
}

const getCategoryGradient = (category: string): readonly [string, string, ...string[]] => {
  switch (category) {
    case 'music':
      return ['rgba(139, 92, 246, 0.8)', 'rgba(109, 40, 217, 0.9)'];
    case 'volunteer':
      return ['rgba(236, 72, 153, 0.8)', 'rgba(190, 24, 93, 0.9)'];
    default:
      return ['rgba(245, 158, 11, 0.8)', 'rgba(217, 119, 6, 0.9)'];
  }
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'music':
      return 'musical-notes';
    case 'volunteer':
      return 'heart';
    default:
      return 'fast-food';
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'music':
      return 'Música & Cultura';
    case 'volunteer':
      return 'Voluntariado';
    default:
      return 'General';
  }
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSave,
  onSkip,
  showActions = true,
  onPress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const gradient = getCategoryGradient(event.category);
  const icon = getCategoryIcon(event.category);
  const categoryLabel = getCategoryLabel(event.category);

  const cardWidth = Math.min(screenWidth * 0.88, 360);
  const cardHeight = Math.min(screenHeight * 0.62, 520);

  const router = useRouter();
  const { user } = useAuth();
  const isGuest = !user;

  // Animation values for buttons
  const skipScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const skipRotation = useSharedValue(0);
  const saveRotation = useSharedValue(0);

  const handlePress = () => {
    console.log('[EventCard] handlePress fired — onPress defined:', !!onPress, 'isGuest:', isGuest, 'title:', event.title);
    if (onPress) {
      onPress();
      return;
    }
    // Guest mode: do nothing on tap
    if (isGuest) return;
    if (event.id) {
      router.push(`/event/${event.id}`);
    }
  };

  const triggerHaptic = async (type: 'success' | 'medium') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) { }
  };

  // Skip button gesture
  const skipGesture = Gesture.Tap()
    .onBegin(() => {
      skipScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
      skipRotation.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    })
    .onFinalize((_, success) => {
      skipScale.value = withSpring(1, { damping: 10, stiffness: 300 });
      if (success && onSkip) {
        runOnJS(triggerHaptic)('medium');
        runOnJS(onSkip)();
      }
    });

  // Save button gesture
  const saveGesture = Gesture.Tap()
    .onBegin(() => {
      saveScale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
      saveRotation.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    })
    .onFinalize((_, success) => {
      saveScale.value = withSpring(1, { damping: 10, stiffness: 300 });
      if (success && onSave) {
        runOnJS(triggerHaptic)('success');
        runOnJS(onSave)();
      }
    });

  const skipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: skipScale.value },
      { rotate: `${skipRotation.value}deg` },
    ],
  }));

  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: saveScale.value },
      { rotate: `${saveRotation.value}deg` },
    ],
  }));

  // Glassmorphic info panel content
  const GlassInfoPanel = () => {
    const content = (
      <View style={styles.glassContent}>
        <View style={styles.categoryBadge}>
          <Ionicons name={icon as any} size={12} color="#fff" />
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
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
      return (
        <View style={[styles.glassPanel, styles.glassPanelWeb]}>
          {content}
        </View>
      );
    }

    return (
      <BlurView intensity={40} tint="dark" style={styles.glassPanel}>
        <View style={styles.glassPanelOverlay} />
        {content}
      </BlurView>
    );
  };

  return (
    <View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardTouchable}
          activeOpacity={0.95}
          onPress={handlePress}
        >
          {/* Background Image or Gradient (fallback when no image) */}
          {event.image ? (
            <Image
              source={{ uri: event.image }}
              style={styles.eventImage}
              resizeMode="cover"
            />
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

          {/* Gradient overlay for better text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />

          {/* Glassmorphic info panel */}
          <GlassInfoPanel />
        </TouchableOpacity>

        {/* Action buttons */}
        {showActions && (
          <View style={styles.actionsContainer} pointerEvents="box-none">
            <GestureDetector gesture={skipGesture}>
              <Animated.View style={[styles.actionButton, styles.skipButton, skipAnimatedStyle]}>
                <Ionicons name="close" size={28} color="#fff" />
              </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={saveGesture}>
              <Animated.View style={[styles.actionButton, styles.saveButton, saveAnimatedStyle]}>
                <Ionicons name="heart" size={28} color="#fff" />
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>
    </View>
  );
};

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
    // Glass card border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTouchable: {
    flex: 1,
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // Glass panel styles
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
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
  },
  glassPanelWeb: {
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    backdropFilter: 'blur(20px)',
  },
  glassContent: {
    padding: 16,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.6)',
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
  // Action buttons
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
    // Glass effect
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  skipButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default EventCard;

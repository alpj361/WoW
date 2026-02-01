import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CollectibleAnimationProps {
  visible: boolean;
  eventTitle: string;
  eventImage?: string;
  eventCategory: string;
  emoji?: string;
  onComplete: () => void;
}

const getCategoryGradient = (category: string): readonly [string, string, ...string[]] => {
  switch (category) {
    case 'music':
      return ['#8B5CF6', '#6D28D9'];
    case 'volunteer':
      return ['#EC4899', '#BE185D'];
    default:
      return ['#F59E0B', '#D97706'];
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

// Particle component for sparkle effects
const Particle: React.FC<{ delay: number; angle: number }> = ({ delay, angle }) => {
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [0, 120]);
    const opacity = interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = interpolate(progress.value, [0, 0.3, 1], [0, 1.2, 0.5]);
    
    return {
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleText}>✦</Text>
    </Animated.View>
  );
};

export const CollectibleAnimation: React.FC<CollectibleAnimationProps> = ({
  visible,
  eventTitle,
  eventImage,
  eventCategory,
  emoji,
  onComplete,
}) => {
  const [showParticles, setShowParticles] = useState(false);
  
  // Animation values
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const cardRotateY = useSharedValue(-90);

  const gradient = getCategoryGradient(eventCategory);
  const icon = getCategoryIcon(eventCategory);

  const triggerHaptic = async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  };

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.value = 0;
      rotate.value = 0;
      translateY.value = 100;
      opacity.value = 0;
      glowOpacity.value = 0;
      textOpacity.value = 0;
      containerOpacity.value = 0;
      cardRotateY.value = -90;
      setShowParticles(false);

      // Fade in container
      containerOpacity.value = withTiming(1, { duration: 200 });

      // Card reveal animation with 3D flip effect
      cardRotateY.value = withDelay(200, withSpring(-5, { damping: 12, stiffness: 100 }, () => {
        cardRotateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }));

      // Scale and entrance animation
      scale.value = withDelay(200, withSpring(1.1, { damping: 8, stiffness: 100 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 150 });
        runOnJS(triggerHaptic)();
        runOnJS(setShowParticles)(true);
      }));

      translateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));
      opacity.value = withDelay(200, withTiming(1, { duration: 400 }));

      // Subtle bounce rotation
      rotate.value = withDelay(300, withSequence(
        withSpring(5, { damping: 10, stiffness: 200 }),
        withSpring(-3, { damping: 10, stiffness: 200 }),
        withSpring(0, { damping: 15, stiffness: 200 })
      ));

      // Glow pulse
      glowOpacity.value = withDelay(400, withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(0.3, { duration: 400 }),
        withTiming(0.5, { duration: 300 })
      ));

      // Text reveal
      textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

      // Auto close after animation
      const timeout = setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onComplete)();
        });
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { perspective: 1000 },
      { rotateY: `${cardRotateY.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, containerAnimatedStyle]}>
        {/* Glow effect behind card */}
        <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
          <LinearGradient
            colors={[gradient[0], 'transparent']}
            style={styles.glow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Particles */}
        {showParticles && (
          <View style={styles.particlesContainer}>
            {[...Array(12)].map((_, i) => (
              <Particle key={i} delay={i * 50} angle={(i * Math.PI * 2) / 12} />
            ))}
          </View>
        )}

        {/* Main Card */}
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <LinearGradient
            colors={['#2A2A2A', '#1A1A1A']}
            style={styles.card}
          >
            {/* Poster Image */}
            <LinearGradient
              colors={gradient}
              style={styles.posterContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {eventImage ? (
                <Image source={{ uri: eventImage }} style={styles.posterImage} />
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name={icon as any} size={50} color="rgba(255,255,255,0.6)" />
                </View>
              )}
              
              {/* Shiny overlay effect */}
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'transparent', 'rgba(255,255,255,0.1)']}
                style={styles.shineEffect}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </LinearGradient>

            {/* Collectible Badge */}
            <View style={styles.collectibleBadge}>
              <LinearGradient
                colors={gradient}
                style={styles.badgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.badgeText}>Coleccionado</Text>
              </LinearGradient>
            </View>

            {/* Event Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {eventTitle}
              </Text>
              {emoji && (
                <View style={styles.emojiContainer}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Holographic border effect */}
          <LinearGradient
            colors={[...gradient, gradient[0]]}
            style={styles.holoBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Text below card */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.collectedText}>¡Añadido a tu colección!</Text>
          <Text style={styles.subText}>Este evento ahora está en tus asistidos</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  particlesContainer: {
    position: 'absolute',
    width: 240,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particleText: {
    fontSize: 16,
    color: '#FFD700',
  },
  cardContainer: {
    width: 200,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 4,
  },
  posterContainer: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shineEffect: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    top: '-25%',
    left: '-25%',
    transform: [{ rotate: '45deg' }],
    opacity: 0.4,
  },
  collectibleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 12,
    alignItems: 'center',
  },
  eventTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  emojiContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 24,
  },
  holoBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  textContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  collectedText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CollectibleAnimation;

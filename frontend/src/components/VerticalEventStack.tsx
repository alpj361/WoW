import React, { useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '../store/eventStore';
import { EventCard } from './EventCard';

const DRAG_THRESHOLD = 80;

// AnimatedCard component that handles individual card animations
interface AnimatedCardProps {
  event: Event;
  diff: number;
  translateY: SharedValue<number>;
  onSave?: () => void;
  onSkip?: () => void;
  showActions: boolean;
}

const AnimatedCard = memo(({ event, diff, translateY, onSave, onSkip, showActions }: AnimatedCardProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (diff === 0) {
      // Current card - responds to drag
      const dragProgress = interpolate(
        translateY.value,
        [-DRAG_THRESHOLD * 2, 0, DRAG_THRESHOLD * 2],
        [-50, 0, 50],
        Extrapolation.CLAMP,
      );
      const scaleProgress = interpolate(
        Math.abs(translateY.value),
        [0, DRAG_THRESHOLD * 2],
        [1, 0.95],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateY: dragProgress },
          { scale: scaleProgress },
        ],
        opacity: 1,
        zIndex: 10,
      };
    } else if (diff === -1) {
      // Previous card
      const baseY = -100;
      const moveProgress = interpolate(
        translateY.value,
        [0, DRAG_THRESHOLD * 2],
        [0, 60],
        Extrapolation.CLAMP,
      );
      const scaleProgress = interpolate(
        translateY.value,
        [0, DRAG_THRESHOLD * 2],
        [0.88, 0.94],
        Extrapolation.CLAMP,
      );
      const opacityProgress = interpolate(
        translateY.value,
        [0, DRAG_THRESHOLD * 2],
        [0.6, 0.85],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateY: baseY + moveProgress },
          { scale: scaleProgress },
        ],
        opacity: opacityProgress,
        zIndex: 5,
      };
    } else if (diff === 1) {
      // Next card
      const baseY = 100;
      const moveProgress = interpolate(
        translateY.value,
        [-DRAG_THRESHOLD * 2, 0],
        [-60, 0],
        Extrapolation.CLAMP,
      );
      const scaleProgress = interpolate(
        translateY.value,
        [-DRAG_THRESHOLD * 2, 0],
        [0.94, 0.88],
        Extrapolation.CLAMP,
      );
      const opacityProgress = interpolate(
        translateY.value,
        [-DRAG_THRESHOLD * 2, 0],
        [0.85, 0.6],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateY: baseY + moveProgress },
          { scale: scaleProgress },
        ],
        opacity: opacityProgress,
        zIndex: 5,
      };
    }
    return {
      transform: [{ translateY: 0 }, { scale: 1 }],
      opacity: 0,
      zIndex: 0,
    };
  });

  return (
    <Animated.View style={[styles.cardPosition, animatedStyle]}>
      <EventCard
        event={event}
        onSave={onSave}
        onSkip={onSkip}
        showActions={showActions}
      />
    </Animated.View>
  );
});

const VELOCITY_THRESHOLD = 500;

interface VerticalEventStackProps {
  events: Event[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSave: (event: Event) => void;
  onSkip: (event: Event) => void;
  readOnly?: boolean;
}

export const VerticalEventStack: React.FC<VerticalEventStackProps> = ({
  events,
  currentIndex,
  onIndexChange,
  onSave,
  onSkip,
  readOnly = false,
}) => {
  const translateY = useSharedValue(0);
  const lastNavTime = useRef(0);
  const isAnimating = useRef(false);
  const containerRef = useRef<View>(null);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }
  }, []);

  const navigateTo = useCallback(
    (direction: number) => {
      const now = Date.now();
      if (now - lastNavTime.current < 300 || isAnimating.current) return;
      lastNavTime.current = now;
      isAnimating.current = true;

      if (direction > 0 && currentIndex < events.length - 1) {
        triggerHaptic();
        onIndexChange(currentIndex + 1);
      } else if (direction < 0 && currentIndex > 0) {
        triggerHaptic();
        onIndexChange(currentIndex - 1);
      }

      setTimeout(() => {
        isAnimating.current = false;
      }, 300);
    },
    [currentIndex, events.length, onIndexChange, triggerHaptic],
  );

  // Scroll-wheel support for web desktop
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWheel = (evt: any) => {
      evt.preventDefault();
      const delta = evt.deltaY as number;
      if (Math.abs(delta) > 30) {
        navigateTo(delta > 0 ? 1 : -1);
      }
    };

    // Attach to the stack element on web for scroll wheel navigation
    const target = document.querySelector('[data-event-stack]') || document;
    target.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      target.removeEventListener('wheel', handleWheel);
    };
  }, [navigateTo]);

  const gesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .onUpdate((e) => {
      translateY.value = e.translationY * 0.6;
    })
    .onEnd((e) => {
      const shouldNavigate =
        Math.abs(e.translationY) > DRAG_THRESHOLD ||
        Math.abs(e.velocityY) > VELOCITY_THRESHOLD;

      if (shouldNavigate) {
        if (e.translationY < 0 || e.velocityY < -VELOCITY_THRESHOLD) {
          runOnJS(navigateTo)(1);
        } else if (e.translationY > 0 || e.velocityY > VELOCITY_THRESHOLD) {
          runOnJS(navigateTo)(-1);
        }
      }
      translateY.value = withSpring(0, { damping: 25, stiffness: 350 });
    });

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 10 };
    } else if (diff === -1) {
      return { y: -100, scale: 0.88, opacity: 0.6, zIndex: 5 };
    } else if (diff === -2) {
      return { y: -170, scale: 0.78, opacity: 0.3, zIndex: 4 };
    } else if (diff === 1) {
      return { y: 100, scale: 0.88, opacity: 0.6, zIndex: 5 };
    } else if (diff === 2) {
      return { y: 170, scale: 0.78, opacity: 0.3, zIndex: 4 };
    } else {
      return { y: diff > 0 ? 250 : -250, scale: 0.7, opacity: 0, zIndex: 0 };
    }
  };

  const isVisible = (index: number) => {
    return Math.abs(index - currentIndex) <= 2;
  };

  // Render a single card with proper animation handling
  const renderCard = (event: Event, index: number) => {
    if (!isVisible(index)) return null;

    const diff = index - currentIndex;
    const isCurrent = diff === 0;
    const isPrev = diff === -1;
    const isNext = diff === 1;

    // For cards that need animation (current, prev, next)
    if (isCurrent || isPrev || isNext) {
      return (
        <AnimatedCard
          key={event.id}
          event={event}
          diff={diff}
          translateY={translateY}
          onSave={isCurrent && !readOnly ? () => onSave(event) : undefined}
          onSkip={isCurrent && !readOnly ? () => onSkip(event) : undefined}
          showActions={isCurrent && !readOnly}
        />
      );
    }

    // Static cards (far from current)
    const style = getCardStyle(index);
    return (
      <Animated.View
        key={event.id}
        style={[
          styles.cardPosition,
          {
            zIndex: style.zIndex,
            transform: [
              { translateY: style.y },
              { scale: style.scale },
            ],
            opacity: style.opacity,
          },
        ]}
      >
        <EventCard event={event} showActions={false} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} ref={containerRef}>
      {/* Card Stack */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={styles.stackContainer}
          {...(Platform.OS === 'web' ? { 'data-event-stack': 'true' } as any : {})}
        >
          {events.map((event, index) => renderCard(event, index))}
        </Animated.View>
      </GestureDetector>

      {/* Navigation dots (right side) */}
      <View style={styles.dotsContainer}>
        {events.slice(0, Math.min(events.length, 10)).map((_, index) => {
          const isActive = index === currentIndex;
          const isNearby = Math.abs(index - currentIndex) <= 2;

          if (!isNearby && index !== 0 && index !== events.length - 1) {
            return null;
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onIndexChange(index)}
              style={[
                styles.dot,
                isActive && styles.dotActive,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            />
          );
        })}
      </View>

      {/* Counter (left side) */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterCurrent}>
          {String(currentIndex + 1).padStart(2, '0')}
        </Text>
        <View style={styles.counterDivider} />
        <Text style={styles.counterTotal}>
          {String(events.length).padStart(2, '0')}
        </Text>
      </View>

      {/* Scroll hint */}
      {currentIndex === 0 && events.length > 1 && (
        <View style={styles.hintContainer}>
          <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.4)" />
          <Text style={styles.hintText}>Desliza para explorar</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPosition: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Navigation dots
  dotsContainer: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -50 }],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    height: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  // Counter
  counterContainer: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -30 }],
    alignItems: 'center',
  },
  counterCurrent: {
    fontSize: 28,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  counterDivider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  counterTotal: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontVariant: ['tabular-nums'],
  },
  // Hint
  hintContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default VerticalEventStack;

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '../store/eventStore';
import { EventCard } from './EventCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAG_THRESHOLD = 60;

interface VerticalEventStackProps {
  events: Event[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSave: (event: Event) => void;
  onSkip: (event: Event) => void;
}

export const VerticalEventStack: React.FC<VerticalEventStackProps> = ({
  events,
  currentIndex,
  onIndexChange,
  onSave,
  onSkip,
}) => {
  const translateY = useSharedValue(0);
  const lastNavTime = useRef(0);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  }, []);

  const navigateTo = useCallback(
    (direction: number) => {
      const now = Date.now();
      if (now - lastNavTime.current < 350) return;
      lastNavTime.current = now;

      if (direction > 0 && currentIndex < events.length - 1) {
        triggerHaptic();
        onIndexChange(currentIndex + 1);
      } else if (direction < 0 && currentIndex > 0) {
        triggerHaptic();
        onIndexChange(currentIndex - 1);
      }
    },
    [currentIndex, events.length, onIndexChange, triggerHaptic],
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -DRAG_THRESHOLD) {
        runOnJS(navigateTo)(1);
      } else if (e.translationY > DRAG_THRESHOLD) {
        runOnJS(navigateTo)(-1);
      }
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    });

  const getCardStyle = (index: number) => {
    const total = events.length;
    const diff = index - currentIndex;

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 10, rotateX: '0deg' };
    } else if (diff === -1) {
      return { y: -130, scale: 0.85, opacity: 0.5, zIndex: 4, rotateX: '6deg' };
    } else if (diff === -2) {
      return { y: -220, scale: 0.72, opacity: 0.25, zIndex: 3, rotateX: '12deg' };
    } else if (diff === 1) {
      return { y: 130, scale: 0.85, opacity: 0.5, zIndex: 4, rotateX: '-6deg' };
    } else if (diff === 2) {
      return { y: 220, scale: 0.72, opacity: 0.25, zIndex: 3, rotateX: '-12deg' };
    } else {
      return { y: diff > 0 ? 350 : -350, scale: 0.6, opacity: 0, zIndex: 0, rotateX: '0deg' };
    }
  };

  const isVisible = (index: number) => {
    return Math.abs(index - currentIndex) <= 2;
  };

  const currentEvent = events[currentIndex];

  // Animated style for the active card that responds to drag
  const activeCardDragStyle = useAnimatedStyle(() => {
    const dragProgress = interpolate(
      translateY.value,
      [-DRAG_THRESHOLD * 2, 0, DRAG_THRESHOLD * 2],
      [-40, 0, 40],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY: dragProgress }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Card Stack */}
      <GestureDetector gesture={gesture}>
        <View style={styles.stackContainer}>
          {events.map((event, index) => {
            if (!isVisible(index)) return null;
            const style = getCardStyle(index);
            const isCurrent = index === currentIndex;

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
                  isCurrent ? activeCardDragStyle : undefined,
                ]}
              >
                <EventCard
                  event={event}
                  onSave={isCurrent ? () => onSave(event) : undefined}
                  onSkip={isCurrent ? () => onSkip(event) : undefined}
                  showActions={isCurrent}
                />
              </Animated.View>
            );
          })}
        </View>
      </GestureDetector>

      {/* Navigation dots (right side) */}
      <View style={styles.dotsContainer}>
        {events.map((_, index) => {
          const isActive = index === currentIndex;
          // Only show nearby dots to avoid clutter
          if (Math.abs(index - currentIndex) > 3 && index !== 0 && index !== events.length - 1) {
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
      {currentIndex === 0 && (
        <View style={styles.hintContainer}>
          <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.4)" />
          <Text style={styles.hintText}>Desliza para explorar</Text>
          <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.4)" />
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
    right: 6,
    top: '50%',
    transform: [{ translateY: -50 }],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    height: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  // Counter
  counterContainer: {
    position: 'absolute',
    left: 6,
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
    bottom: 8,
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

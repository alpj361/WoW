import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useEventStore, Event } from '../src/store/eventStore';
import { EventCard } from '../src/components/EventCard';
import { CategoryFilter } from '../src/components/CategoryFilter';
import { WowLogo } from '../src/components/WowLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const IS_WEB = Platform.OS === 'web';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const {
    events,
    isLoading,
    currentCategory,
    setCategory,
    fetchEvents,
    saveEvent,
  } = useEventStore();

  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [events]);

  const currentEvent = events[currentIndex];
  const nextEvent = events[currentIndex + 1];

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotation.value = withSpring(0);
    scale.value = withSpring(1);
  }, []);

  const goToNextCard = useCallback(() => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    resetPosition();
  }, [currentIndex, events.length, resetPosition]);

  const handleSwipeRight = useCallback(async () => {
    if (currentEvent) {
      try {
        await saveEvent(currentEvent.id);
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
    goToNextCard();
  }, [currentEvent, saveEvent, goToNextCard]);

  const handleSwipeLeft = useCallback(() => {
    goToNextCard();
  }, [goToNextCard]);

  const animateSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      translateX.value = withTiming(targetX, { duration: 300 }, () => {
        runOnJS(direction === 'right' ? handleSwipeRight : handleSwipeLeft)();
      });
      rotation.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
    },
    [handleSwipeRight, handleSwipeLeft]
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.5;
      rotation.value = (e.translationX / SCREEN_WIDTH) * 20;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(animateSwipe)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(animateSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / SWIPE_THRESHOLD;
    const newScale = 0.95 + Math.min(progress, 1) * 0.05;
    return {
      transform: [{ scale: newScale }],
      opacity: 0.5 + Math.min(progress, 1) * 0.5,
    };
  });

  const renderCardContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyTitle}>No hay eventos</Text>
          <Text style={styles.emptyText}>
            Parece que no hay eventos disponibles.
          </Text>
        </View>
      );
    }

    if (currentIndex >= events.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>¡Has visto todos!</Text>
          <Text style={styles.emptyText}>
            Has revisado todos los eventos disponibles.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setCurrentIndex(0);
              fetchEvents();
            }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Ver de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cardStackContainer}>
        {/* Next card (behind) */}
        {nextEvent && (
          <Animated.View style={[styles.nextCard, nextCardStyle]}>
            <EventCard event={nextEvent} showActions={false} />
          </Animated.View>
        )}

        {/* Current card */}
        {currentEvent && (
          IS_WEB ? (
            <Animated.View style={[styles.currentCard, cardStyle]}>
              <EventCard
                event={currentEvent}
                onSave={() => animateSwipe('right')}
                onSkip={() => animateSwipe('left')}
                showActions={true}
              />
            </Animated.View>
          ) : (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.currentCard, cardStyle]}>
                <EventCard
                  event={currentEvent}
                  onSave={() => animateSwipe('right')}
                  onSkip={() => animateSwipe('left')}
                  showActions={true}
                />
              </Animated.View>
            </GestureDetector>
          )
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <WowLogo width={100} height={32} />
        <Text style={styles.tagline}>Descubre y Vive Eventos</Text>
      </View>

      <CategoryFilter
        selectedCategory={currentCategory}
        onSelectCategory={setCategory}
      />

      <View style={styles.cardsContainer}>
        {renderCardContent()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  cardStackContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCard: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
  },
  nextCard: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
    height: '100%',
    opacity: 0.5,
    transform: [{ scale: 0.92 }, { translateY: 8 }],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

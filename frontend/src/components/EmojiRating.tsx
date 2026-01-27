import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// 4 positive emojis + 4 negative emojis
const positiveEmojis = ['🔥', '❤️', '🎉', '🤩'];
const negativeEmojis = ['😴', '👎', '😒', '💔'];

interface EmojiRatingProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  eventTitle?: string;
}

const AnimatedEmojiButton: React.FC<{
  emoji: string;
  variant: 'positive' | 'negative';
  onSelect: (emoji: string) => void;
  index: number;
}> = ({ emoji, variant, onSelect, index }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const triggerHaptic = async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSequence(
        withSpring(0.8, { damping: 10, stiffness: 400 }),
        withSpring(1.3, { damping: 8, stiffness: 300 })
      );
      rotation.value = withSequence(
        withSpring(-15, { damping: 10, stiffness: 400 }),
        withSpring(15, { damping: 10, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 300 })
      );
    })
    .onFinalize((_, success) => {
      if (success) {
        triggerHaptic();
        onSelect(emoji);
      } else {
        scale.value = withSpring(1);
        rotation.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={ZoomIn.delay(100 + index * 50).springify()}
        style={[
          styles.emojiButton,
          variant === 'positive' ? styles.positiveEmoji : styles.negativeEmoji,
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

export const EmojiRating: React.FC<EmojiRatingProps> = ({
  visible,
  onClose,
  onSelect,
  eventTitle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          entering={FadeInUp.springify().damping(15)}
          style={styles.container}
        >
          <Animated.Text entering={FadeIn.delay(50)} style={styles.title}>
            ¿Cómo estuvo?
          </Animated.Text>
          {eventTitle && (
            <Animated.Text entering={FadeIn.delay(100)} style={styles.eventTitle} numberOfLines={1}>
              {eventTitle}
            </Animated.Text>
          )}
          
          {/* Positive emojis */}
          <Animated.Text entering={FadeIn.delay(150)} style={styles.sectionLabel}>
            Me gustó
          </Animated.Text>
          <View style={styles.emojiRow}>
            {positiveEmojis.map((emoji, index) => (
              <AnimatedEmojiButton
                key={emoji}
                emoji={emoji}
                variant="positive"
                onSelect={onSelect}
                index={index}
              />
            ))}
          </View>

          {/* Negative emojis */}
          <Animated.Text entering={FadeIn.delay(250)} style={styles.sectionLabel}>
            No me gustó
          </Animated.Text>
          <View style={styles.emojiRow}>
            {negativeEmojis.map((emoji, index) => (
              <AnimatedEmojiButton
                key={emoji}
                emoji={emoji}
                variant="negative"
                onSelect={onSelect}
                index={index + 4}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => onSelect('')}
          >
            <Text style={styles.skipText}>Omitir calificación</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1F1F1F',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positiveEmoji: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  negativeEmoji: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  emoji: {
    fontSize: 28,
  },
  skipButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default EmojiRating;

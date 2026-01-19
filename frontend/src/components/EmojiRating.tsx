import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';

// 4 positive emojis + 4 negative emojis
const positiveEmojis = ['🔥', '❤️', '🎉', '🤩'];
const negativeEmojis = ['😴', '👎', '😒', '💔'];

interface EmojiRatingProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  eventTitle?: string;
}

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
        <View style={styles.container}>
          <Text style={styles.title}>¿Cómo estuvo?</Text>
          {eventTitle && (
            <Text style={styles.eventTitle} numberOfLines={1}>
              {eventTitle}
            </Text>
          )}
          
          {/* Positive emojis */}
          <Text style={styles.sectionLabel}>Me gustó</Text>
          <View style={styles.emojiRow}>
            {positiveEmojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiButton, styles.positiveEmoji]}
                onPress={() => onSelect(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Negative emojis */}
          <Text style={styles.sectionLabel}>No me gustó</Text>
          <View style={styles.emojiRow}>
            {negativeEmojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiButton, styles.negativeEmoji]}
                onPress={() => onSelect(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => onSelect('')}
          >
            <Text style={styles.skipText}>Omitir calificación</Text>
          </TouchableOpacity>
        </View>
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

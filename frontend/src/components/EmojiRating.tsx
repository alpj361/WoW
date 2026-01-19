import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';

const emojis = ['🔥', '❤️', '😍', '🎉', '👏', '✨', '🤩', '💯'];

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
          <View style={styles.emojiGrid}>
            {emojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default EmojiRating;

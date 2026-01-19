import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../store/eventStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.3, SCREEN_HEIGHT * 0.55);

interface EventCardProps {
  event: Event;
  onSave?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
}

const getCategoryGradient = (category: string): string[] => {
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
}) => {
  const gradient = getCategoryGradient(event.category);
  const icon = getCategoryIcon(event.category);
  const categoryLabel = getCategoryLabel(event.category);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {event.image ? (
          <Image
            source={{ uri: event.image }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name={icon as any} size={80} color="rgba(255,255,255,0.5)" />
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.categoryBadge}>
            <Ionicons name={icon as any} size={16} color="#fff" />
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            
            {event.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {event.description}
              </Text>
            ) : null}

            <View style={styles.infoRow}>
              {event.date && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.infoText}>{event.date}</Text>
                </View>
              )}
              {event.time && (
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.infoText}>{event.time}</Text>
                </View>
              )}
            </View>

            {event.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={32} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
    backgroundColor: '#1F1F1F',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  skipButton: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  saveButton: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
});

export default EventCard;

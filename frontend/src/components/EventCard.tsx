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
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.2, SCREEN_HEIGHT * 0.50);

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
    <View style={styles.cardWrapper}>
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
              <Ionicons name={icon as any} size={60} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          >
            <View style={styles.topRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name={icon as any} size={14} color="#fff" />
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              
              {event.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {event.description}
                </Text>
              ) : null}

              <View style={styles.metaContainer}>
                {event.date && (
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={styles.infoText}>{event.date}</Text>
                  </View>
                )}
                {event.time && (
                  <View style={styles.infoItem}>
                    <Ionicons name="time" size={14} color="#fff" />
                    <Text style={styles.infoText}>{event.time}</Text>
                  </View>
                )}
              </View>

              {event.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={30} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={30} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
  },
  gradient: {
    flex: 1,
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  contentContainer: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 16,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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

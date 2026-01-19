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
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.15, SCREEN_HEIGHT * 0.6);

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
              <Ionicons name={icon as any} size={50} color="rgba(255,255,255,0.25)" />
            </View>
          )}

          {/* Content overlay */}
          <View style={styles.overlay}>
            <View style={styles.topRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name={icon as any} size={12} color="#fff" />
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
            </View>

            <View style={styles.bottomContent}>
              <Text style={styles.title}>{event.title}</Text>
              
              {event.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {event.description}
                </Text>
              )}

              {(event.date || event.time) && (
                <View style={styles.metaContainer}>
                  {event.date && (
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar" size={12} color="#fff" />
                      <Text style={styles.infoText}>{event.date}</Text>
                    </View>
                  )}
                  {event.time && (
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={12} color="#fff" />
                      <Text style={styles.infoText}>{event.time}</Text>
                    </View>
                  )}
                </View>
              )}

              {event.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={28} color="#10B981" />
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
    position: 'relative',
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
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomContent: {
    backgroundColor: '#000000',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#cccccc',
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
    gap: 3,
  },
  infoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    paddingVertical: 12,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
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

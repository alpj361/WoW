import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Event } from '../store/eventStore';

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
  const { width: screenWidth } = useWindowDimensions();
  const gradient = getCategoryGradient(event.category);
  const icon = getCategoryIcon(event.category);
  const categoryLabel = getCategoryLabel(event.category);

  // Dimensiones dinámicas de la tarjeta - ancho relativo, altura flexible
  const cardWidth = Math.min(screenWidth * 0.9, 340);

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.card, { width: cardWidth }]}>
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
              <Ionicons name={icon as any} size={40} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.contentGradient}
          />

          <View style={styles.overlay}>
            <View style={styles.categoryBadge}>
              <Ionicons name={icon as any} size={10} color="#fff" />
              <Text style={styles.categoryText}>{categoryLabel}</Text>
            </View>

            <View style={styles.bottomContent}>
              <Text style={styles.title} numberOfLines={1}>{event.title}</Text>

              {event.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {event.description}
                </Text>
              )}

              <View style={styles.metaRow}>
                {event.date && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{event.date}</Text>
                  </View>
                )}
                {event.time && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{event.time}</Text>
                  </View>
                )}
                {event.location && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Botones superpuestos sobre la tarjeta */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
    maxHeight: 480,
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
  contentGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomContent: {
    gap: 2,
    width: '100%',
    paddingBottom: 80, // Espacio para los botones superpuestos
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '500',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skipButton: {
    borderColor: '#EF4444',
  },
  saveButton: {
    borderColor: '#10B981',
  },
});

export default EventCard;

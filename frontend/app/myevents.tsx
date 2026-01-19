import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore, SavedEventData, AttendedEventData } from '../src/store/eventStore';
import { EmojiRating } from '../src/components/EmojiRating';
import { LinearGradient } from 'expo-linear-gradient';

type Tab = 'saved' | 'attended';

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

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const {
    savedEvents,
    attendedEvents,
    fetchSavedEvents,
    fetchAttendedEvents,
    unsaveEvent,
    markAttended,
    removeAttended,
  } = useEventStore();

  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModal, setRatingModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
  }>({ visible: false, eventId: '', eventTitle: '' });

  useEffect(() => {
    fetchSavedEvents();
    fetchAttendedEvents();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSavedEvents(), fetchAttendedEvents()]);
    setRefreshing(false);
  }, []);

  const handleMarkAttended = (eventId: string, eventTitle: string) => {
    setRatingModal({ visible: true, eventId, eventTitle });
  };

  const handleSelectEmoji = async (emoji: string) => {
    try {
      await markAttended(ratingModal.eventId, emoji || undefined);
      setRatingModal({ visible: false, eventId: '', eventTitle: '' });
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar como asistido.');
    }
  };

  const handleUnsave = (eventId: string) => {
    Alert.alert(
      'Eliminar de guardados',
      '¿Seguro que quieres quitar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => unsaveEvent(eventId),
        },
      ]
    );
  };

  const handleRemoveAttended = (eventId: string) => {
    Alert.alert(
      'Eliminar de asistidos',
      '¿Seguro que quieres quitar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeAttended(eventId),
        },
      ]
    );
  };

  const renderSavedItem = (item: SavedEventData) => {
    const { event } = item;
    const gradient = getCategoryGradient(event.category);
    const icon = getCategoryIcon(event.category);

    return (
      <View key={event.id} style={styles.eventCard}>
        <LinearGradient
          colors={gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardIconContainer}>
              <Ionicons name={icon as any} size={40} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </LinearGradient>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.title}
          </Text>
          {event.date && (
            <View style={styles.cardInfo}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>{event.date}</Text>
            </View>
          )}
          {event.location && (
            <View style={styles.cardInfo}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.attendButton}
              onPress={() => handleMarkAttended(event.id, event.title)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.attendButtonText}>Asistí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleUnsave(event.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderAttendedItem = (item: AttendedEventData) => {
    const { event, attended } = item;
    const gradient = getCategoryGradient(event.category);
    const icon = getCategoryIcon(event.category);

    return (
      <View key={event.id} style={styles.eventCard}>
        <LinearGradient
          colors={gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardIconContainer}>
              <Ionicons name={icon as any} size={40} color="rgba(255,255,255,0.6)" />
            </View>
          )}
          {attended.emoji_rating && (
            <View style={styles.emojiOverlay}>
              <Text style={styles.emojiText}>{attended.emoji_rating}</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.title}
          </Text>
          {event.date && (
            <View style={styles.cardInfo}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>{event.date}</Text>
            </View>
          )}
          {event.location && (
            <View style={styles.cardInfo}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleMarkAttended(event.id, event.title)}
            >
              <Text style={styles.rateButtonText}>
                {attended.emoji_rating ? 'Cambiar' : 'Calificar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveAttended(event.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Mis Eventos</Text>
        <Text style={styles.subtitle}>Tu historial personal</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons
            name="bookmark"
            size={20}
            color={activeTab === 'saved' ? '#8B5CF6' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'saved' && styles.tabTextActive,
            ]}
          >
            Guardados ({savedEvents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attended' && styles.tabActive]}
          onPress={() => setActiveTab('attended')}
        >
          <Ionicons
            name="checkmark-done"
            size={20}
            color={activeTab === 'attended' ? '#10B981' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'attended' && styles.tabTextActive,
              activeTab === 'attended' && { color: '#10B981' },
            ]}
          >
            Asistidos ({attendedEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
      >
        {activeTab === 'saved' ? (
          savedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>Sin eventos guardados</Text>
              <Text style={styles.emptyText}>
                Los eventos que guardes aparecerán aquí
              </Text>
            </View>
          ) : (
            savedEvents.map(renderSavedItem)
          )
        ) : attendedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyTitle}>Sin eventos asistidos</Text>
            <Text style={styles.emptyText}>
              Marca los eventos a los que has asistido
            </Text>
          </View>
        ) : (
          attendedEvents.map(renderAttendedItem)
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      <EmojiRating
        visible={ratingModal.visible}
        onClose={() => setRatingModal({ visible: false, eventId: '', eventTitle: '' })}
        onSelect={handleSelectEmoji}
        eventTitle={ratingModal.eventTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  emojiOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  attendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attendButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  rateButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rateButtonText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

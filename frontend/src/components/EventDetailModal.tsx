import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Event } from '../store/eventStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
}

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'music': return 'Música & Cultura';
    case 'volunteer': return 'Voluntariado';
    default: return 'General';
  }
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'music': return 'musical-notes';
    case 'volunteer': return 'heart';
    default: return 'fast-food';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'music': return '#8B5CF6';
    case 'volunteer': return '#EC4899';
    default: return '#F59E0B';
  }
};

// Parse YYYY-MM-DD without timezone shift
const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return `${days[d.getDay()]}, ${parts[2]} de ${months[parts[1] - 1]} ${parts[0]}`;
    }
  } catch { }
  return dateStr;
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, visible, onClose }) => {
  console.log('[EventDetailModal] render — visible:', visible, 'event:', event?.title ?? 'null');
  // Derive values safely — event may be null briefly during the slide-out animation
  const categoryColor = event ? getCategoryColor(event.category) : '#8B5CF6';
  const categoryLabel = event ? getCategoryLabel(event.category) : '';
  const categoryIcon = (event ? getCategoryIcon(event.category) : 'calendar') as any;
  const hasPrice = event?.price && parseFloat(String(event.price)) > 0;

  // Track image load error for expired/broken image URLs
  const [imageError, setImageError] = React.useState(false);
  // Reset error state when event changes
  React.useEffect(() => { setImageError(false); }, [event?.id]);

  const handleOpenRegistration = () => {
    if (event?.registration_form_url) {
      Linking.openURL(event.registration_form_url).catch(() => { });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {event ? (
            <>
              {/* Header image — falls back to gradient when image is missing or expired */}
              {event.image && !imageError ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: event.image }}
                    style={styles.headerImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(15,15,15,0.95)']}
                    locations={[0.3, 1]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {/* Close button */}
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <BlurView intensity={30} tint="dark" style={styles.closeButtonBlur}>
                      <Ionicons name="close" size={22} color="#fff" />
                    </BlurView>
                  </TouchableOpacity>
                  {/* Category badge */}
                  <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}CC` }]}>
                    <Ionicons name={categoryIcon} size={12} color="#fff" />
                    <Text style={styles.categoryText}>{categoryLabel}</Text>
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={[categoryColor, '#0F0F0F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.gradientHeader}
                >
                  <Ionicons name={categoryIcon} size={64} color="rgba(255,255,255,0.2)" />
                  <TouchableOpacity style={styles.closeButtonNoImage} onPress={onClose}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                  <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}CC`, bottom: 16, top: undefined }]}>
                    <Ionicons name={categoryIcon} size={12} color="#fff" />
                    <Text style={styles.categoryText}>{categoryLabel}</Text>
                  </View>
                </LinearGradient>
              )}

              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <Text style={styles.title}>{event.title}</Text>

                {/* Meta info row */}
                <View style={styles.metaRow}>
                  {event.date && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={16} color={categoryColor} />
                      <Text style={styles.metaText}>{formatDisplayDate(event.date)}</Text>
                    </View>
                  )}
                  {event.time && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color={categoryColor} />
                      <Text style={styles.metaText}>
                        {event.time}{event.end_time ? ` – ${event.end_time}` : ''}
                      </Text>
                    </View>
                  )}
                  {event.location && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={16} color={categoryColor} />
                      <Text style={styles.metaText}>{event.location}</Text>
                    </View>
                  )}
                  {event.organizer && (
                    <View style={styles.metaItem}>
                      <Ionicons name="person" size={16} color={categoryColor} />
                      <Text style={styles.metaText}>{event.organizer}</Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                {hasPrice && (
                  <View style={[styles.priceCard, { borderColor: `${categoryColor}55` }]}>
                    <View style={styles.priceLeft}>
                      <Ionicons name="cash" size={20} color="#F59E0B" />
                      <Text style={styles.priceLabel}>Precio de entrada</Text>
                    </View>
                    <Text style={styles.priceAmount}>
                      Q{parseFloat(String(event.price)).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Description */}
                {event.description && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sobre el evento</Text>
                    <Text style={styles.description}>{event.description}</Text>
                  </View>
                )}

                {/* Registration button */}
                {event.registration_form_url && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: categoryColor }]}
                    onPress={handleOpenRegistration}
                  >
                    <Ionicons name="link" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Registrarme</Text>
                  </TouchableOpacity>
                )}

                {/* Guest notice — hidden on web since login is disabled there */}
                {Platform.OS !== 'web' && (
                  <View style={styles.guestNotice}>
                    <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                    <Text style={styles.guestNoticeText}>
                      Inicia sesión para guardar eventos y recibir recordatorios
                    </Text>
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.82,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 220,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientHeader: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonNoImage: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 30,
  },
  metaRow: {
    gap: 10,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#D1D5DB',
    fontSize: 14,
    flex: 1,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  priceAmount: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F1F1F',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  guestNoticeText: {
    color: '#6B7280',
    fontSize: 13,
    flex: 1,
  },
});

export default EventDetailModal;

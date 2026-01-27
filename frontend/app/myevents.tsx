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
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { TouchableOpacity as GestureTouchable, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore, SavedEventData, AttendedEventData } from '../src/store/eventStore';
import { EmojiRating } from '../src/components/EmojiRating';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { QRScanner } from '../src/components/QRScanner';
import { scanAttendance, getAttendanceList, AttendanceListItem } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

type Tab = 'saved' | 'attended' | 'hosted';

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
  const router = useRouter();
  const {
    savedEvents,
    attendedEvents,
    hostedEvents,
    fetchSavedEvents,
    fetchAttendedEvents,
    fetchHostedEvents,
    fetchEventAttendees,
    fetchEventRegistrations,
    approveRegistration,
    rejectRegistration,
    unsaveEvent,
    markAttended,
    removeAttended,
    resubmitRegistration,
    deleteEvent,
  } = useEventStore();

  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModal, setRatingModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
  }>({ visible: false, eventId: '', eventTitle: '' });

  const [attendeesModal, setAttendeesModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    attendees: any[];
    loading: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', attendees: [], loading: false });

  const [registrationsModal, setRegistrationsModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    registrations: any[];
    loading: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', registrations: [], loading: false });

  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    registrationId: string;
    userName: string;
    reason: string;
  }>({ visible: false, registrationId: '', userName: '', reason: '' });

  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    event: any | null;
  }>({ visible: false, event: null });

  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerForEvent } = useEventStore();
  const { user } = useAuth();

  // QR Scanner and Attendance List states
  const [scannerModal, setScannerModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
  }>({ visible: false, eventId: '', eventTitle: '' });

  const [attendanceListModal, setAttendanceListModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    attendees: AttendanceListItem[];
    loading: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', attendees: [], loading: false });

  useEffect(() => {
    fetchSavedEvents();
    fetchAttendedEvents();
    fetchHostedEvents();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSavedEvents(),
      fetchAttendedEvents(),
      fetchHostedEvents()
    ]);
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
          onPress: async () => {
            try {
              await unsaveEvent(eventId);
            } catch (error) {
              console.error('Error unsaving:', error);
              Alert.alert('Error', 'No se pudo eliminar de guardados');
            }
          },
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
          onPress: async () => {
            try {
              await removeAttended(eventId);
            } catch (error) {
              console.error('Error removing attended:', error);
              Alert.alert('Error', 'No se pudo eliminar de asistidos');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHosted = (eventId: string) => {
    Alert.alert(
      'Eliminar evento',
      '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el evento.');
            }
          },
        },
      ]
    );
  };
  const handleShowAttendees = async (eventId: string, eventTitle: string) => {
    // Check if event has price/registration - show registrations modal instead
    const event = hostedEvents.find(h => h.event.id === eventId)?.event;
    const hasPrice = event?.price && parseFloat(String(event.price)) > 0;
    const hasForm = !!event?.registration_form_url;

    if (hasPrice || hasForm) {
      handleShowRegistrations(eventId, eventTitle);
      return;
    }

    setAttendeesModal({
      visible: true,
      eventId,
      eventTitle,
      attendees: [],
      loading: true
    });

    try {
      const attendees = await fetchEventAttendees(eventId);
      setAttendeesModal(prev => ({ ...prev, attendees, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los asistentes.');
      setAttendeesModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleShowRegistrations = async (eventId: string, eventTitle: string) => {
    setRegistrationsModal({
      visible: true,
      eventId,
      eventTitle,
      registrations: [],
      loading: true
    });

    try {
      const registrations = await fetchEventRegistrations(eventId);
      setRegistrationsModal(prev => ({ ...prev, registrations, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
      setRegistrationsModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await approveRegistration(registrationId);
      // Refresh registrations
      if (registrationsModal.eventId) {
        const registrations = await fetchEventRegistrations(registrationsModal.eventId);
        setRegistrationsModal(prev => ({ ...prev, registrations }));
      }
      // Refresh saved events to update badges
      await fetchSavedEvents();
      Alert.alert('¡Aprobado!', 'La solicitud ha sido aprobada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aprobar la solicitud');
    }
  };

  const handleRejectClick = (registrationId: string, userName: string) => {
    setRejectModal({
      visible: true,
      registrationId,
      userName,
      reason: ''
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      Alert.alert('Error', 'Por favor ingresa una razón para el rechazo');
      return;
    }

    try {
      await rejectRegistration(rejectModal.registrationId, rejectModal.reason);
      setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' });

      // Refresh registrations
      if (registrationsModal.eventId) {
        const registrations = await fetchEventRegistrations(registrationsModal.eventId);
        setRegistrationsModal(prev => ({ ...prev, registrations }));
      }
      // Refresh saved events to update badges
      await fetchSavedEvents();
      Alert.alert('Rechazado', 'La solicitud ha sido rechazada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el comprobante.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPaymentReceiptUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentModal.event) return;

    if (!paymentReceiptUrl) {
      Alert.alert('Error', 'Por favor sube el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerForEvent(
        paymentModal.event.id,
        paymentReceiptUrl,
        paymentModal.event.registration_form_url ? true : false
      );
      setPaymentModal({ visible: false, event: null });
      setPaymentReceiptUrl('');
      // Refresh saved events to show pending badge
      await fetchSavedEvents();
      Alert.alert(
        '¡Solicitud enviada!',
        'Tu solicitud de registro ha sido enviada. El organizador la revisará pronto.'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async (eventId: string) => {
    const event = savedEvents.find(s => s.event.id === eventId)?.event;
    if (!event) return;

    // Check if event has price
    const hasPrice = event.price && parseFloat(String(event.price)) > 0;

    if (hasPrice) {
      // Show payment modal again
      setPaymentModal({ visible: true, event });
    } else {
      // Resubmit directly if free
      try {
        await resubmitRegistration(eventId);
        await fetchSavedEvents();
        Alert.alert('¡Reenviado!', 'Tu solicitud ha sido reenviada');
      } catch (error) {
        Alert.alert('Error', 'No se pudo reenviar la solicitud');
      }
    }
  };

  // QR Scanner handlers
  const handleOpenScanner = (eventId: string, eventTitle: string) => {
    setScannerModal({ visible: true, eventId, eventTitle });
  };

  const handleQRScanned = async (scannedData: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al host');
      return;
    }

    try {
      // scannedData should be the user_id from the QR code
      await scanAttendance(scannerModal.eventId, scannedData);
      Alert.alert('✅ Asistencia Registrada', 'El usuario fue marcado como asistente');
      // Refresh hosted events
      await fetchHostedEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'No se pudo registrar la asistencia';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleShowAttendanceList = async (eventId: string, eventTitle: string) => {
    setAttendanceListModal({
      visible: true,
      eventId,
      eventTitle,
      attendees: [],
      loading: true
    });

    try {
      const attendees = await getAttendanceList(eventId);
      setAttendanceListModal(prev => ({ ...prev, attendees, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la lista de asistencia');
      setAttendanceListModal(prev => ({ ...prev, visible: false }));
    }
  };

  const renderHostedItem = (item: any) => {
    const { event } = item;
    const gradient = getCategoryGradient(event.category);
    const icon = getCategoryIcon(event.category);
    const attendeeCount = event.attendee_count || 0;

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
          <View style={styles.attendeeBadge}>
            <Ionicons name="people" size={12} color="#fff" />
            <Text style={styles.attendeeBadgeText}>{attendeeCount}</Text>
          </View>
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

          <View style={styles.hostActions}>
            {event.requires_attendance_check && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => handleOpenScanner(event.id, event.title)}
              >
                <Ionicons name="qr-code-outline" size={16} color="#8B5CF6" />
                <Text style={styles.scanButtonText}>Escanear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.viewAttendeesButton}
              onPress={() => {
                if (event.requires_attendance_check) {
                  handleShowAttendanceList(event.id, event.title);
                } else {
                  handleShowAttendees(event.id, event.title);
                }
              }}
            >
              <Ionicons name="list" size={16} color="#F59E0B" />
              <Text style={styles.viewAttendeesText}>Lista</Text>
            </TouchableOpacity>
            <GestureTouchable
              style={styles.removeButton}
              onPress={() => {
                console.log('Delete hosted pressed:', event.id);
                handleDeleteHosted(event.id);
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </GestureTouchable>
          </View>
        </View>
      </View>
    );
  };

  const renderSavedItem = (item: SavedEventData) => {
    const { event, registration } = item;
    const gradient = getCategoryGradient(event.category);
    const icon = getCategoryIcon(event.category);

    // Check if event has price
    const eventPrice = event.price ? parseFloat(String(event.price)) : 0;
    const hasPrice = eventPrice > 0;

    // Check registration status
    const isApproved = registration?.status === 'approved';
    const isPending = registration?.status === 'pending';
    const isRejected = registration?.status === 'rejected';

    return (
      <View key={event.id} style={styles.eventCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(`/event/${event.id}`)}
        >
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
            {hasPrice && !isApproved && !isPending && !isRejected && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>Q{eventPrice.toFixed(2)}</Text>
              </View>
            )}
            {isApproved && (
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.confirmedBadgeText}>Confirmado</Text>
              </View>
            )}
            {isPending && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={12} color="#fff" />
                <Text style={styles.pendingBadgeText}>Pendiente</Text>
              </View>
            )}
            {isRejected && (
              <View style={styles.rejectedBadge}>
                <Ionicons name="close-circle" size={12} color="#fff" />
                <Text style={styles.rejectedBadgeText}>Rechazado</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
            {isRejected ? (
              <View style={styles.rejectionContainer}>
                {registration?.rejection_reason && (
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionLabel}>Razón: </Text>
                    <Text style={styles.rejectionText} numberOfLines={2}>
                      {registration.rejection_reason}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.resubmitButton}
                  onPress={() => handleResubmit(event.id)}
                >
                  <Ionicons name="refresh" size={16} color="#8B5CF6" />
                  <Text style={styles.resubmitText}>Reenviar</Text>
                </TouchableOpacity>
              </View>
            ) : hasPrice && event.user_id && !isPending && !isApproved ? (
              <TouchableOpacity
                style={styles.reserveButton}
                onPress={() => setPaymentModal({ visible: true, event })}
              >
                <Ionicons name="card" size={18} color="#F59E0B" />
                <Text style={styles.reserveButtonText}>Reservar</Text>
              </TouchableOpacity>
            ) : isPending ? (
              <View style={styles.pendingButton}>
                <Ionicons name="time" size={18} color="#F59E0B" />
                <Text style={styles.pendingButtonText}>En revisión</Text>
              </View>
            ) : event.requires_attendance_check ? (
              <View style={styles.hostManagedAttendance}>
                <Ionicons name="qr-code" size={18} color="#8B5CF6" />
                <Text style={styles.hostManagedText}>Asistencia por QR</Text>
              </View>
            ) : (isApproved || (!hasPrice && !isPending && !event.user_id)) ? (
              <TouchableOpacity
                style={styles.attendButton}
                onPress={() => handleMarkAttended(event.id, event.title)}
              >
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.attendButtonText}>Asistí</Text>
              </TouchableOpacity>
            ) : null}
            <GestureTouchable
              style={styles.removeButton}
              onPress={() => {
                console.log('Delete saved pressed:', event.id);
                handleUnsave(event.id);
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </GestureTouchable>
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
            <GestureTouchable
              style={styles.removeButton}
              onPress={() => {
                console.log('Delete attended pressed:', event.id);
                handleRemoveAttended(event.id);
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </GestureTouchable>
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosted' && styles.tabActive]}
          onPress={() => setActiveTab('hosted')}
        >
          <Ionicons
            name="person-circle"
            size={20}
            color={activeTab === 'hosted' ? '#F59E0B' : '#6B7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'hosted' && styles.tabTextActive,
              activeTab === 'hosted' && { color: '#F59E0B' },
            ]}
          >
            Anfitrión ({hostedEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <GestureScrollView
        style={styles.content}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
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
        ) : activeTab === 'attended' ? (
          attendedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>Sin eventos asistidos</Text>
              <Text style={styles.emptyText}>
                Marca los eventos a los que has asistido
              </Text>
            </View>
          ) : (
            attendedEvents.map(renderAttendedItem)
          )
        ) : (
          hostedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-circle-outline" size={64} color="#4B5563" />
              <Text style={styles.emptyTitle}>Sin eventos organizados</Text>
              <Text style={styles.emptyText}>
                Tus eventos creados aparecerán aquí
              </Text>
            </View>
          ) : (
            hostedEvents.map(renderHostedItem)
          )
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </GestureScrollView>

      <EmojiRating
        visible={ratingModal.visible}
        onClose={() => setRatingModal({ visible: false, eventId: '', eventTitle: '' })}
        onSelect={handleSelectEmoji}
        eventTitle={ratingModal.eventTitle}
      />

      {/* Attendees Modal */}
      {attendeesModal.visible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAttendeesModal(prev => ({ ...prev, visible: false }))}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asistentes</Text>
              <TouchableOpacity onPress={() => setAttendeesModal(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{attendeesModal.eventTitle}</Text>

            {attendeesModal.loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color="#F59E0B" size="large" />
              </View>
            ) : attendeesModal.attendees.length === 0 ? (
              <View style={styles.emptyModal}>
                <Text style={styles.emptyModalText}>Aún no hay interesados</Text>
              </View>
            ) : (
              <ScrollView style={styles.attendeesList}>
                {attendeesModal.attendees.map((attendee) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    {attendee.profiles?.avatar_url ? (
                      <Image source={{ uri: attendee.profiles.avatar_url }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={styles.attendeeAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>
                        {attendee.profiles?.full_name || 'Usuario'}
                      </Text>
                      <Text style={styles.attendeeEmail}>
                        {attendee.profiles?.email || 'Sin email'}
                      </Text>
                    </View>
                    <Text style={styles.attendeeDate}>
                      {new Date(attendee.saved_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Registrations Modal */}
      <Modal
        visible={registrationsModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitudes de Registro</Text>
              <TouchableOpacity onPress={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{registrationsModal.eventTitle}</Text>

            {registrationsModal.loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color="#F59E0B" size="large" />
              </View>
            ) : registrationsModal.registrations.length === 0 ? (
              <View style={styles.emptyModal}>
                <Text style={styles.emptyModalText}>No hay solicitudes pendientes</Text>
              </View>
            ) : (
              <ScrollView style={styles.attendeesList}>
                {registrationsModal.registrations.map((registration) => (
                  <View key={registration.id} style={styles.registrationItem}>
                    {registration.user?.avatar_url ? (
                      <Image source={{ uri: registration.user.avatar_url }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={styles.attendeeAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.registrationInfo}>
                      <Text style={styles.attendeeName}>
                        {registration.user?.full_name || 'Usuario'}
                      </Text>
                      <Text style={styles.attendeeEmail}>
                        {registration.user?.email || 'Sin email'}
                      </Text>
                      <View style={styles.statusBadgeContainer}>
                        {registration.status === 'pending' && (
                          <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                            <Text style={styles.statusBadgeText}>Pendiente</Text>
                          </View>
                        )}
                        {registration.status === 'approved' && (
                          <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                            <Text style={styles.statusBadgeText}>Aprobado</Text>
                          </View>
                        )}
                        {registration.status === 'rejected' && (
                          <View style={[styles.statusBadge, { backgroundColor: '#EF4444' }]}>
                            <Text style={styles.statusBadgeText}>Rechazado</Text>
                          </View>
                        )}
                      </View>
                      {registration.payment_receipt_url && (
                        <TouchableOpacity
                          style={styles.viewReceiptButton}
                          onPress={() => Alert.alert('Comprobante', 'Funcionalidad para ver imagen próximamente')}
                        >
                          <Ionicons name="image" size={14} color="#8B5CF6" />
                          <Text style={styles.viewReceiptText}>Ver comprobante</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {registration.status === 'pending' && (
                      <View style={styles.registrationActions}>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApprove(registration.id)}
                        >
                          <Ionicons name="checkmark" size={18} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectClick(registration.id, registration.user?.full_name || 'Usuario')}
                        >
                          <Ionicons name="close" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })}
          />
          <View style={[styles.modalContent, { height: 'auto', paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
              <TouchableOpacity onPress={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.rejectModalBody}>
              <Text style={styles.rejectModalText}>
                ¿Estás seguro de rechazar la solicitud de <Text style={styles.rejectModalName}>{rejectModal.userName}</Text>?
              </Text>
              <Text style={styles.rejectModalLabel}>Razón del rechazo:</Text>
              <TextInput
                style={styles.rejectInput}
                placeholder="Ej: No cumple con los requisitos..."
                placeholderTextColor="#6B7280"
                value={rejectModal.reason}
                onChangeText={(text) => setRejectModal(prev => ({ ...prev, reason: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.confirmRejectButton, !rejectModal.reason.trim() && styles.confirmRejectButtonDisabled]}
                onPress={handleConfirmReject}
                disabled={!rejectModal.reason.trim()}
              >
                <Ionicons name="close-circle" size={20} color="#FFF" />
                <Text style={styles.confirmRejectText}>Confirmar Rechazo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={scannerModal.visible}
        onClose={() => setScannerModal({ visible: false, eventId: '', eventTitle: '' })}
        onScan={handleQRScanned}
        eventTitle={scannerModal.eventTitle}
      />

      {/* Attendance List Modal */}
      <Modal
        visible={attendanceListModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttendanceListModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setAttendanceListModal(prev => ({ ...prev, visible: false }))}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lista de Asistencia</Text>
              <TouchableOpacity onPress={() => setAttendanceListModal(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{attendanceListModal.eventTitle}</Text>

            {attendanceListModal.loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color="#8B5CF6" size="large" />
              </View>
            ) : attendanceListModal.attendees.length === 0 ? (
              <View style={styles.emptyModal}>
                <Text style={styles.emptyModalText}>No hay asistentes registrados</Text>
              </View>
            ) : (
              <>
                <View style={styles.attendanceStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{attendanceListModal.attendees.filter(a => a.confirmed).length}</Text>
                    <Text style={styles.statLabel}>Confirmados</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>
                      {attendanceListModal.attendees.filter(a => a.attended || a.scanned_by_host).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#A78BFA' }]}>Asistieron</Text>
                  </View>
                </View>
                <ScrollView style={styles.attendeesList}>
                  {attendanceListModal.attendees.map((attendee, index) => (
                    <View key={`${attendee.user_id}-${index}`} style={styles.attendeeItem}>
                      {attendee.user_avatar ? (
                        <Image source={{ uri: attendee.user_avatar }} style={styles.attendeeAvatar} />
                      ) : (
                        <View style={styles.attendeeAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.attendeeInfo}>
                        <Text style={styles.attendeeName}>
                          {attendee.user_name || 'Usuario'}
                        </Text>
                        <Text style={styles.attendeeEmail}>
                          {attendee.user_email || 'Sin email'}
                        </Text>
                        {attendee.scanned_by_host && attendee.scanned_at && (
                          <Text style={styles.scannedTime}>
                            ✓ Escaneado {new Date(attendee.scanned_at).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        )}
                      </View>
                      {attendee.scanned_by_host || attendee.attended ? (
                        <View style={styles.attendedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                        </View>
                      ) : attendee.confirmed ? (
                        <View style={styles.pendingAttendanceBadge}>
                          <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        </View>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={paymentModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModal({ visible: false, event: null })}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPaymentModal({ visible: false, event: null })}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comprobante de Pago</Text>
              <TouchableOpacity onPress={() => setPaymentModal({ visible: false, event: null })}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.attendeesList}>
              {paymentModal.event?.price && (
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Precio del Evento</Text>
                  <Text style={styles.priceAmount}>Q{paymentModal.event.price.toFixed(2)}</Text>
                </View>
              )}

              {paymentModal.event?.bank_name && paymentModal.event?.bank_account_number && (
                <View style={styles.bankInfo}>
                  <Text style={styles.bankInfoLabel}>Información de Pago</Text>
                  <View style={styles.bankInfoRow}>
                    <Ionicons name="business" size={16} color="#9CA3AF" />
                    <Text style={styles.bankInfoText}>{paymentModal.event.bank_name}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Ionicons name="card" size={16} color="#9CA3AF" />
                    <Text style={styles.bankInfoText}>{paymentModal.event.bank_account_number}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.uploadLabel}>Sube el comprobante de pago</Text>

              {paymentReceiptUrl ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: paymentReceiptUrl }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeReceipt}
                    onPress={() => setPaymentReceiptUrl('')}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickReceipt}
                >
                  <Ionicons name="cloud-upload" size={32} color="#8B5CF6" />
                  <Text style={styles.uploadButtonText}>Seleccionar Imagen</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitPaymentButton,
                  (!paymentReceiptUrl || isSubmitting) && styles.submitPaymentButtonDisabled
                ]}
                onPress={handleSubmitPayment}
                disabled={!paymentReceiptUrl || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.submitPaymentText}>Enviar Solicitud</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  attendeeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attendeeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  confirmedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  confirmedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  pendingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  rejectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rejectedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    opacity: 0.7,
  },
  pendingButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
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
  viewAttendeesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAttendeesText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyModalText: {
    color: '#6B7280',
    fontSize: 16,
  },
  attendeesList: {
    flex: 1,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  attendeeAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  attendeeEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  attendeeDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  registrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  registrationInfo: {
    flex: 1,
  },
  statusBadgeContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewReceiptText: {
    color: '#8B5CF6',
    fontSize: 12,
  },
  registrationActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectModalBody: {
    padding: 20,
  },
  rejectModalText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  rejectModalName: {
    color: '#FFF',
    fontWeight: '600',
  },
  rejectModalLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rejectInput: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  confirmRejectButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmRejectButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  confirmRejectText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Payment Modal Styles
  priceCard: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    color: '#E9D5FF',
    fontSize: 14,
    marginBottom: 8,
  },
  priceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  bankInfo: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bankInfoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bankInfoText: {
    color: '#FFF',
    fontSize: 14,
  },
  uploadLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  receiptPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeReceipt: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  submitPaymentButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  submitPaymentButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  submitPaymentText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  rejectionReasonBox: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#EF4444',
  },
  rejectionLabel: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rejectionText: {
    color: '#FCA5A5',
    fontSize: 11,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resubmitText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  hostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#FDB022',
    marginTop: 4,
  },
  scannedTime: {
    fontSize: 11,
    color: '#8B5CF6',
    marginTop: 4,
  },
  attendedBadge: {
    padding: 4,
  },
  pendingAttendanceBadge: {
    padding: 4,
  },
  hostManagedAttendance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hostManagedText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
});

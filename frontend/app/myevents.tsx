import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Pressable,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useEventStore, HostedEventData, Event } from '../src/store/eventStore';
import EventForm from '../src/components/EventForm';
import { useProcesionStore, ProcesionDB, mapDBToProcesion, isProcessionLive } from '../src/store/procesionStore';
import { ProcessionDetailModal } from '../src/components/ProcessionDetailModal';
import { useAuth } from '../src/context/AuthContext';
import { QRScanner } from '../src/components/QRScanner';
import { scanAttendance, getAttendanceList, AttendanceListItem } from '../src/services/api';

const { width } = Dimensions.get('window');

// -- Types --
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'published': return '#4ADE80';
    case 'draft': return '#94A3B8';
    case 'cancelled': return '#F87171';
    case 'completed': return '#60A5FA';
    default: return '#94A3B8';
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'published': return 'Publicado';
    case 'draft': return 'Borrador';
    case 'cancelled': return 'Cancelado';
    case 'completed': return 'Finalizado';
    default: return status || 'Borrador';
  }
};

export default function MyEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();

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
    removeAttended,
    deleteEvent,
  } = useEventStore();

  const {
    savedProcesiones,
    procesiones: allStoreProcesiones,
    cargandoTurnos,
    fetchSavedProcesiones,
    fetchProcesiones,
    fetchCargandoTurnos,
    unsaveProcesion,
  } = useProcesionStore();

  // -- State --
  const [activeTab, setActiveTab] = useState<'collection' | 'attended' | 'hosted'>('collection');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  // Attendees modal
  const [attendeesModal, setAttendeesModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    attendees: any[];
    loading: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', attendees: [], loading: false });

  // Registrations modal
  const [registrationsModal, setRegistrationsModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    registrations: any[];
    loading: boolean;
    activeTab: 'payments' | 'attendance';
    hasPayments: boolean;
    hasAttendance: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', registrations: [], loading: false, activeTab: 'payments', hasPayments: false, hasAttendance: false });

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    registrationId: string;
    userName: string;
    reason: string;
  }>({ visible: false, registrationId: '', userName: '', reason: '' });

  // Scanner modal
  const [scannerModal, setScannerModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
  }>({ visible: false, eventId: '', eventTitle: '' });

  // Attendance list modal
  const [attendanceListModal, setAttendanceListModal] = useState<{
    visible: boolean;
    eventId: string;
    eventTitle: string;
    attendees: AttendanceListItem[];
    loading: boolean;
  }>({ visible: false, eventId: '', eventTitle: '', attendees: [], loading: false });

  // Receipt viewer
  const [receiptModal, setReceiptModal] = useState<{
    visible: boolean;
    imageUrl: string;
    userName: string;
  }>({ visible: false, imageUrl: '', userName: '' });

  // Procession Modal
  const [procesionModal, setProcesionModal] = useState<{
    visible: boolean;
    procesion: any | null;
    rawDb?: ProcesionDB | null;
  }>({ visible: false, procesion: null, rawDb: null });

  // Edit hosted event modal (private events only)
  const [editModal, setEditModal] = useState<{ visible: boolean; event: Event | null }>({ visible: false, event: null });

  // -- Load Data --
  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchSavedEvents(),
        fetchAttendedEvents(),
        fetchHostedEvents(),
        fetchSavedProcesiones(),
        fetchCargandoTurnos(),
        fetchProcesiones('cuaresma-2026'),
      ]);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      isFirstLoad.current = false;
    }
  }, [fetchSavedEvents, fetchAttendedEvents, fetchHostedEvents, fetchSavedProcesiones, fetchCargandoTurnos, fetchProcesiones]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        loadData();
      }
    }, [loadData])
  );

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadData();
  };

  // -- Handlers --

  const handleDeleteHosted = async (eventId: string) => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el evento.');
            }
          },
        },
      ]
    );
  };

  const handleUnsave = async (eventId: string) => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar de guardados');
            }
          },
        },
      ]
    );
  };

  const handleUnsaveProcesion = async (procesionId: string) => {
    Alert.alert(
      'Eliminar de guardados',
      '¿Seguro que quieres quitar esta procesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsaveProcesion(procesionId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar de guardados');
            }
          },
        },
      ]
    );
  };

  const handleRemoveAttended = async (eventId: string) => {
    Alert.alert(
      'Eliminar de colección',
      '¿Seguro que quieres quitar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAttended(eventId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar de la colección');
            }
          },
        },
      ]
    );
  };

  // -- Attendees / Registrations --
  const handleShowAttendees = async (eventId: string, eventTitle: string) => {
    const hostedItem = hostedEvents.find(h => h.event.id === eventId);
    const event = hostedItem?.event as any;
    const hasPrice = event?.price && parseFloat(String(event.price)) > 0;
    const hasForm = !!event?.registration_form_url;

    if (hasPrice || hasForm) {
      handleShowRegistrations(eventId, eventTitle);
      return;
    }

    setAttendeesModal({ visible: true, eventId, eventTitle, attendees: [], loading: true });
    try {
      const attendees = await fetchEventAttendees(eventId);
      setAttendeesModal(prev => ({ ...prev, attendees, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los asistentes.');
      setAttendeesModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleShowRegistrations = async (eventId: string, eventTitle: string, initialTab: 'payments' | 'attendance' = 'payments') => {
    const hostedItem = hostedEvents.find(h => h.event.id === eventId);
    const event = hostedItem?.event as any;
    const hasPrice = event?.price && parseFloat(String(event.price)) > 0;
    const hasForm = !!event?.registration_form_url;
    const hasAttendance = !!event?.requires_attendance_check;

    setRegistrationsModal({
      visible: true,
      eventId,
      eventTitle,
      registrations: [],
      loading: true,
      activeTab: initialTab,
      hasPayments: hasPrice || hasForm,
      hasAttendance,
    });

    try {
      const registrations = await fetchEventRegistrations(eventId);
      setRegistrationsModal(prev => ({ ...prev, registrations, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
      setRegistrationsModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleTabChange = async (tab: 'payments' | 'attendance') => {
    setRegistrationsModal(prev => ({ ...prev, activeTab: tab }));
    if (tab === 'attendance' && registrationsModal.hasAttendance) {
      setAttendanceListModal(prev => ({ ...prev, loading: true, eventId: registrationsModal.eventId, eventTitle: registrationsModal.eventTitle }));
      try {
        const attendees = await getAttendanceList(registrationsModal.eventId);
        setAttendanceListModal(prev => ({ ...prev, attendees, loading: false, visible: false }));
      } catch (error) {
        setAttendanceListModal(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await approveRegistration(registrationId);
      if (registrationsModal.eventId) {
        const registrations = await fetchEventRegistrations(registrationsModal.eventId);
        setRegistrationsModal(prev => ({ ...prev, registrations }));
      }
      await fetchSavedEvents();
      Alert.alert('¡Aprobado!', 'La solicitud ha sido aprobada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aprobar la solicitud');
    }
  };

  const handleRejectClick = (registrationId: string, userName: string) => {
    setRejectModal({ visible: true, registrationId, userName, reason: '' });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      Alert.alert('Error', 'Por favor ingresa una razón para el rechazo');
      return;
    }
    try {
      await rejectRegistration(rejectModal.registrationId, rejectModal.reason);
      setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' });
      if (registrationsModal.eventId) {
        const registrations = await fetchEventRegistrations(registrationsModal.eventId);
        setRegistrationsModal(prev => ({ ...prev, registrations }));
      }
      await fetchSavedEvents();
      Alert.alert('Rechazado', 'La solicitud ha sido rechazada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  // -- QR Scanner --
  const handleOpenScanner = (eventId: string, eventTitle: string) => {
    setScannerModal({ visible: true, eventId, eventTitle });
  };

  const handleQRScanned = async (scannedData: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar al host');
      return;
    }
    try {
      await scanAttendance(scannerModal.eventId, scannedData, user.id);
      await fetchHostedEvents();
    } catch (error: any) {
      let errorMessage = 'No se pudo registrar la asistencia';
      if (error.response?.data?.error) errorMessage = error.response.data.error;
      else if (error.message) errorMessage = error.message;

      if (errorMessage.includes('not confirmed')) {
        Alert.alert('Usuario No Confirmado', 'Este usuario no está confirmado para el evento.');
      } else if (errorMessage.includes('not require attendance')) {
        Alert.alert('Asistencia No Requerida', 'Este evento no tiene habilitada la opción de llevar asistencia.');
      } else if (errorMessage.includes('Only the event host')) {
        Alert.alert('Sin Permiso', 'Solo el organizador del evento puede escanear asistencias.');
      } else {
        Alert.alert('Error al Escanear', errorMessage);
      }
      throw error;
    }
  };

  const handleShowAttendanceList = async (eventId: string, eventTitle: string) => {
    setAttendanceListModal({ visible: true, eventId, eventTitle, attendees: [], loading: true });
    try {
      const attendees = await getAttendanceList(eventId);
      setAttendanceListModal(prev => ({ ...prev, attendees, loading: false }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la lista de asistencia');
      setAttendanceListModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleOpenProcesion = (proc: ProcesionDB) => {
    const mapped = mapDBToProcesion(proc);
    setProcesionModal({ visible: true, procesion: mapped, rawDb: proc });
  };


  // -- Renders --

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Mis Eventos</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create')}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collection' && styles.activeTab]}
          onPress={() => { setActiveTab('collection'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, activeTab === 'collection' && styles.activeTabText]}>
            Interesados
          </Text>
          {(() => {
            const savedProcIds = new Set(savedProcesiones.map((p: ProcesionDB) => p.id));
            const extraCargando = allStoreProcesiones.filter(
              (p: ProcesionDB) => cargandoTurnos[p.id] !== undefined && !savedProcIds.has(p.id)
            ).length;
            const total = savedEvents.length + savedProcesiones.length + extraCargando;
            return total > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{total}</Text></View>
            ) : null;
          })()}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'attended' && styles.activeTab]}
          onPress={() => { setActiveTab('attended'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, activeTab === 'attended' && styles.activeTabText]}>
            Colección
          </Text>
          {attendedEvents.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{attendedEvents.length}</Text></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosted' && styles.activeTab]}
          onPress={() => { setActiveTab('hosted'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, activeTab === 'hosted' && styles.activeTabText]}>
            Anfitrión
          </Text>
          {hostedEvents.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{hostedEvents.length}</Text></View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );



  const renderSavedCard = (item: any, index: number) => {
    const event = item.event || item;
    const imageUri = event.image || event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.savedCard}
        onPress={() => { Haptics.selectionAsync(); router.push(`/event/${event.id}`); }}
        onLongPress={() => handleUnsave(event.id)}
        delayLongPress={500}
        activeOpacity={0.9}
      >
        <Image source={{ uri: imageUri }} style={styles.savedImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.savedGradient}
        >
          <View style={styles.savedContent}>
            <Text style={styles.savedTitle} numberOfLines={2}>{event.title}</Text>
            {event.date && (
              <Text style={styles.savedDate}>
                {format(new Date(event.date.substring(0, 10) + 'T12:00:00'), 'd MMM', { locale: es })}
              </Text>
            )}
          </View>
        </LinearGradient>
        <TouchableOpacity
          style={styles.unsaveBtn}
          onPress={() => handleUnsave(event.id)}
        >
          <Ionicons name="bookmark" size={16} color="#4ADE80" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderAttendedItem = (item: any) => {
    const event = item.event || item;
    const imageUri = event.image || event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';
    const count = item.attended?.count;

    return (
      <TouchableOpacity
        key={`attended-${event.id}`}
        style={styles.attendedItem}
        onPress={() => { Haptics.selectionAsync(); router.push(`/event/${event.id}`); }}
        onLongPress={() => handleRemoveAttended(event.id)}
        delayLongPress={500}
      >
        <Image source={{ uri: imageUri }} style={styles.attendedImage} />
        <View style={styles.attendedInfo}>
          <Text style={styles.attendedTitle} numberOfLines={1}>{event.title}</Text>
          <View style={styles.attendedMeta}>
            <Feather name="calendar" size={12} color="#94A3B8" />
            {event.date && (
              <Text style={styles.attendedDate}>
                {format(new Date(event.date.substring(0, 10) + 'T12:00:00'), 'd MMMM yyyy', { locale: es })}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.attendedStatus}>
          {count && count > 1 ? (
            <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>X{count}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>Asistido</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHostedCard = ({ item }: { item: HostedEventData }) => {
    const event = item.event as any;
    const attendees = event.attendee_count || 0;
    // saves_count: número real de gente interesada (guardados)
    const saves = event.saves_count || 0;
    const registrations = event.registrations_count || 0;

    const hasPrice = event.price && parseFloat(String(event.price)) > 0;
    const hasForm = !!event.registration_form_url;
    const hasAttendance = !!event.requires_attendance_check;
    const imageUri = event.image || event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';

    return (
      <TouchableOpacity
        style={styles.hostCard}
        onPress={() => { Haptics.selectionAsync(); router.push(`/event/${event.id}`); }}
        activeOpacity={0.95}
      >
        {/* Header Event Info */}
        <View style={styles.hostHeader}>
          <Image source={{ uri: imageUri }} style={styles.hostThumb} />
          <View style={styles.hostInfo}>
            <Text style={styles.hostTitle} numberOfLines={1}>{event.title}</Text>
            <View style={styles.hostMetaRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status || 'draft') + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(event.status || 'draft') }]} />
                <Text style={[styles.statusLabel, { color: getStatusColor(event.status || 'draft') }]}>
                  {getStatusLabel(event.status || 'draft')}
                </Text>
              </View>
              {event.date && (
                <Text style={styles.hostDate}>
                  {format(new Date(event.date.substring(0, 10) + 'T12:00:00'), 'd MMM', { locale: es })}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.moreBtn, { opacity: 0.4, marginRight: 2 }]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.selectionAsync();
              setEditModal({ visible: true, event: event as Event });
            }}
          >
            <Feather name="edit-2" size={15} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={(e) => { e.stopPropagation(); handleDeleteHosted(event.id); }}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{attendees}</Text>
            <Text style={styles.statLabel}>Asistentes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{saves}</Text>
            <Text style={styles.statLabel}>Interesados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{registrations}</Text>
            <Text style={styles.statLabel}>Registros</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          {/* Gestionar - opens proper modal based on event type */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              if (hasPrice || hasForm || hasAttendance) {
                handleShowRegistrations(event.id, event.title, hasPrice || hasForm ? 'payments' : 'attendance');
              } else {
                handleShowAttendees(event.id, event.title);
              }
            }}
          >
            <Feather name="users" size={16} color="#fff" />
            <Text style={styles.actionText}>Gestionar</Text>
          </TouchableOpacity>

          {/* Escanear - solo si el evento requiere control de asistencia */}
          {hasAttendance ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.scanBtn]}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenScanner(event.id, event.title);
              }}
            >
              <Ionicons name="qr-code-outline" size={16} color="#000" />
              <Text style={[styles.actionText, { color: '#000' }]}>Escanear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#1e293b' }]}
              onPress={(e) => {
                e.stopPropagation();
                router.push({ pathname: '/event/[id]', params: { id: event.id } });
              }}
            >
              <Feather name="edit-2" size={16} color="#94A3B8" />
              <Text style={[styles.actionText, { color: '#94A3B8' }]}>Ver evento</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavedProcesionCard = (proc: ProcesionDB, turno?: number) => {
    const imageUri = proc.imagenes_procesion?.[0] || proc.imagenes_recorrido?.[0] || null;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    const [y, m, d] = proc.fecha.split('-').map(Number);
    const dateStr = `${d} ${months[m - 1]}`;
    const isLive = isProcessionLive(proc);

    return (
      <TouchableOpacity
        key={`proc-${proc.id}`}
        style={[
          styles.savedCard,
          { borderColor: turno ? 'rgba(234, 179, 8, 0.4)' : '#7C3AED33', borderWidth: 1 }
        ]}
        onPress={() => { Haptics.selectionAsync(); handleOpenProcesion(proc); }}
        onLongPress={() => handleUnsaveProcesion(proc.id)}
        delayLongPress={500}
        activeOpacity={0.9}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.savedImage} resizeMode="cover" />
        ) : (
          <View style={[styles.savedImage, { backgroundColor: '#1E1040', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="cross-outline" size={40} color="#7C3AED" />
          </View>
        )}
        {isLive && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#EF4444',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
              EN VIVO
            </Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(30,16,64,0.95)']}
          style={styles.savedGradient}
        >
          <View style={styles.savedContent}>
            <Text style={styles.savedTitle} numberOfLines={2}>{proc.nombre}</Text>
            <Text style={[styles.savedDate, { color: '#C4B5FD' }]}>{dateStr}</Text>
          </View>
        </LinearGradient>
        <View style={[styles.unsaveBtn, { backgroundColor: '#7C3AED20' }]}>
          <MaterialCommunityIcons name="cross-outline" size={16} color="#A78BFA" />
        </View>
        {/* Turno badge — shown when user has registered as cargador */}
        {!!turno && (
          <View style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(234, 179, 8, 0.9)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            zIndex: 10,
          }}>
            <FontAwesome5 name="people-carry" size={10} color="#1a1000" />
            <Text style={{ color: '#1a1000', fontSize: 11, fontWeight: '800' }}>
              #{turno}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCollectionTab = () => {
    // Build merged list: saved procesiones + cargando processions that aren't saved
    const savedProcIds = new Set(savedProcesiones.map(p => p.id));
    const extraCargandoProcs = allStoreProcesiones.filter(
      p => cargandoTurnos[p.id] !== undefined && !savedProcIds.has(p.id)
    );
    const allProcsToShow = [...savedProcesiones, ...extraCargandoProcs];

    const hasProc = allProcsToShow.length > 0;
    const hasEvents = savedEvents.length > 0;
    const isEmpty = !hasProc && !hasEvents;

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Feather name="bookmark" size={40} color="#334155" />
            <Text style={styles.emptyText}>No tienes eventos en interesados</Text>
          </View>
        ) : (
          <>
            {/* ── Processions (saved + cargando) ── */}
            {hasProc && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
                  <MaterialCommunityIcons name="cross-outline" size={18} color="#A78BFA" />
                  <Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                    Procesiones
                  </Text>
                  <View style={{ backgroundColor: '#7C3AED33', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                    <Text style={{ color: '#C4B5FD', fontSize: 11, fontWeight: 'bold' }}>{allProcsToShow.length}</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
                  {allProcsToShow.map(proc => (
                    <View key={`proc-scroll-${proc.id}`} style={{ width: (width - 48) / 2, marginHorizontal: 4 }}>
                      {renderSavedProcesionCard(proc, cargandoTurnos[proc.id])}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Saved Events ── */}
            {hasEvents && (
              <>
                {hasProc && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
                    <Feather name="calendar" size={15} color="#4ADE80" />
                    <Text style={{ color: '#4ADE80', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                      Eventos
                    </Text>
                    <View style={{ backgroundColor: '#4ADE8033', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                      <Text style={{ color: '#86EFAC', fontSize: 11, fontWeight: 'bold' }}>{savedEvents.length}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.masonryGrid}>
                  <View style={styles.masonryCol}>
                    {savedEvents.filter((_, i) => i % 2 === 0).map((item, i) => renderSavedCard(item, i))}
                  </View>
                  <View style={styles.masonryCol}>
                    {savedEvents.filter((_, i) => i % 2 !== 0).map((item, i) => renderSavedCard(item, i))}
                  </View>
                </View>
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderAttendedTab = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {attendedEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={40} color="#334155" />
          <Text style={styles.emptyText}>Tu colección está vacía</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {attendedEvents.map(renderAttendedItem)}
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderHostedTab = () => (
    <View style={{ flex: 1 }}>
      {hostedEvents.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconInfo}>
            <Feather name="calendar" size={48} color="#334155" />
          </View>
          <Text style={styles.emptyTitle}>No has creado eventos</Text>
          <Text style={styles.emptySubtitle}>
            Organiza tu primer evento y adminístralo desde aquí.
          </Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={() => router.push('/create')}>
            <Text style={styles.createFirstText}>Crear Evento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hostedEvents}
          renderItem={renderHostedCard}
          keyExtractor={item => item.event.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {renderHeader()}

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ADE80" />
          </View>
        ) : (
          activeTab === 'collection' ? renderCollectionTab() :
            activeTab === 'attended' ? renderAttendedTab() :
              renderHostedTab()
        )}
      </View>

      {/* ---- QR Scanner ---- */}
      <QRScanner
        visible={scannerModal.visible}
        onClose={() => setScannerModal({ visible: false, eventId: '', eventTitle: '' })}
        onScan={handleQRScanned}
        eventTitle={scannerModal.eventTitle}
      />

      {/* ---- Attendees Modal ---- */}
      <Modal
        visible={attendeesModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttendeesModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAttendeesModal(prev => ({ ...prev, visible: false }))} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Interesados</Text>
              <TouchableOpacity onPress={() => setAttendeesModal(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{attendeesModal.eventTitle}</Text>
            {attendeesModal.loading ? (
              <View style={styles.centered}><ActivityIndicator color="#4ADE80" size="large" /></View>
            ) : attendeesModal.attendees.length === 0 ? (
              <View style={styles.emptyModal}><Text style={styles.emptyModalText}>Aún no hay interesados</Text></View>
            ) : (
              <ScrollView style={styles.attendeesList}>
                {attendeesModal.attendees.map((attendee: any) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    {attendee.profiles?.avatar_url ? (
                      <Image source={{ uri: attendee.profiles.avatar_url }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={styles.attendeeAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{attendee.profiles?.full_name || 'Usuario'}</Text>
                      <Text style={styles.attendeeEmail}>{attendee.profiles?.email || 'Sin email'}</Text>
                    </View>
                    <Text style={styles.attendeeDate}>
                      {attendee.saved_at ? new Date(attendee.saved_at).toLocaleDateString('es-MX') : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ---- Registrations Modal ---- */}
      <Modal
        visible={registrationsModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestión</Text>
              <TouchableOpacity onPress={() => setRegistrationsModal(prev => ({ ...prev, visible: false }))}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{registrationsModal.eventTitle}</Text>

            {/* Tabs dentro del modal */}
            {registrationsModal.hasPayments && registrationsModal.hasAttendance && (
              <View style={styles.modalTabsContainer}>
                <TouchableOpacity
                  style={[styles.modalTab, registrationsModal.activeTab === 'payments' && styles.modalTabActive]}
                  onPress={() => handleTabChange('payments')}
                >
                  <Ionicons name="card" size={18} color={registrationsModal.activeTab === 'payments' ? '#F59E0B' : '#6B7280'} />
                  <Text style={[styles.modalTabText, registrationsModal.activeTab === 'payments' && { color: '#F59E0B' }]}>Pagos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalTab, registrationsModal.activeTab === 'attendance' && styles.modalTabActive]}
                  onPress={() => handleTabChange('attendance')}
                >
                  <Ionicons name="list" size={18} color={registrationsModal.activeTab === 'attendance' ? '#8B5CF6' : '#6B7280'} />
                  <Text style={[styles.modalTabText, registrationsModal.activeTab === 'attendance' && { color: '#8B5CF6' }]}>Asistencia</Text>
                </TouchableOpacity>
              </View>
            )}

            {registrationsModal.loading ? (
              <View style={styles.centered}><ActivityIndicator color="#F59E0B" size="large" /></View>
            ) : registrationsModal.activeTab === 'payments' ? (
              registrationsModal.registrations.length === 0 ? (
                <View style={styles.emptyModal}><Text style={styles.emptyModalText}>No hay solicitudes</Text></View>
              ) : (
                <ScrollView style={styles.attendeesList}>
                  {registrationsModal.registrations.map((reg: any) => (
                    <View key={reg.id} style={styles.registrationItem}>
                      {reg.user?.avatar_url ? (
                        <Image source={{ uri: reg.user.avatar_url }} style={styles.attendeeAvatar} />
                      ) : (
                        <View style={styles.attendeeAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.registrationInfo}>
                        <Text style={styles.attendeeName}>{reg.user?.full_name || 'Usuario'}</Text>
                        <Text style={styles.attendeeEmail}>{reg.user?.email || 'Sin email'}</Text>
                        <View style={styles.statusBadgeContainer}>
                          {reg.status === 'pending' && (
                            <View style={[styles.statusBadgeSmall, { backgroundColor: '#F59E0B' }]}>
                              <Text style={styles.statusBadgeText}>Pendiente</Text>
                            </View>
                          )}
                          {reg.status === 'approved' && (
                            <View style={[styles.statusBadgeSmall, { backgroundColor: '#10B981' }]}>
                              <Text style={styles.statusBadgeText}>Aprobado</Text>
                            </View>
                          )}
                          {reg.status === 'rejected' && (
                            <View style={[styles.statusBadgeSmall, { backgroundColor: '#EF4444' }]}>
                              <Text style={styles.statusBadgeText}>Rechazado</Text>
                            </View>
                          )}
                        </View>
                        {reg.payment_receipt_url && (
                          <TouchableOpacity
                            style={styles.viewReceiptButton}
                            onPress={() => setReceiptModal({ visible: true, imageUrl: reg.payment_receipt_url!, userName: reg.user?.full_name || 'Usuario' })}
                          >
                            <Ionicons name="image" size={14} color="#8B5CF6" />
                            <Text style={styles.viewReceiptText}>Ver comprobante</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {reg.status === 'pending' && (
                        <View style={styles.registrationActions}>
                          <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(reg.id)}>
                            <Ionicons name="checkmark" size={18} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectClick(reg.id, reg.user?.full_name || 'Usuario')}>
                            <Ionicons name="close" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )
            ) : (
              // Tab de Asistencia
              attendanceListModal.loading ? (
                <View style={styles.centered}><ActivityIndicator color="#8B5CF6" size="large" /></View>
              ) : attendanceListModal.attendees.length === 0 ? (
                <View style={styles.emptyModal}><Text style={styles.emptyModalText}>No hay asistentes registrados</Text></View>
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
                          <Text style={styles.attendeeName}>{attendee.user_name || 'Usuario'}</Text>
                          <Text style={styles.attendeeEmail}>{attendee.user_email || 'Sin email'}</Text>
                          {attendee.scanned_by_host && attendee.scanned_at && (
                            <Text style={styles.scannedTime}>
                              ✓ Escaneado {new Date(attendee.scanned_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
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
              )
            )}
          </View>
        </View>
      </Modal>

      {/* ---- Reject Reason Modal ---- */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })} />
          <View style={[styles.modalContent, { height: 'auto', paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
              <TouchableOpacity onPress={() => setRejectModal({ visible: false, registrationId: '', userName: '', reason: '' })}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={{ color: '#CBD5E1', lineHeight: 22 }}>
                ¿Estás seguro de rechazar la solicitud de{' '}
                <Text style={{ color: '#fff', fontWeight: '700' }}>{rejectModal.userName}</Text>?
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Razón del rechazo:</Text>
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
                style={[styles.confirmRejectButton, !rejectModal.reason.trim() && { opacity: 0.5 }]}
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

      {/* ---- Receipt Viewer Modal ---- */}
      <Modal
        visible={receiptModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptModal({ visible: false, imageUrl: '', userName: '' })}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.92)' }]}>
          <Pressable style={styles.modalBackdrop} onPress={() => setReceiptModal({ visible: false, imageUrl: '', userName: '' })} />
          <View style={{ padding: 20, alignItems: 'center', gap: 16 }}>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Comprobante de {receiptModal.userName}</Text>
            <Image
              source={{ uri: receiptModal.imageUrl }}
              style={{ width: width - 40, height: (width - 40) * 1.4, borderRadius: 12 }}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.confirmRejectButton, { backgroundColor: '#334155' }]}
              onPress={() => setReceiptModal({ visible: false, imageUrl: '', userName: '' })}
            >
              <Text style={styles.confirmRejectText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Procession Detail Modal */}
      <ProcessionDetailModal
        visible={procesionModal.visible}
        procesion={procesionModal.procesion}
        rawDb={procesionModal.rawDb ?? null}
        onClose={() => setProcesionModal({ visible: false, procesion: null, rawDb: null })}
      />

      {/* Edit hosted event modal — private events only */}
      <Modal
        visible={editModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModal({ visible: false, event: null })}
      >
        <View style={{ flex: 1, backgroundColor: '#121212' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#1e293b',
          }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Editar evento</Text>
            <TouchableOpacity onPress={() => setEditModal({ visible: false, event: null })}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {editModal.event && (
            <EventForm
              eventId={editModal.event.id}
              initialData={editModal.event}
              isModal
              onSuccess={() => {
                setEditModal({ visible: false, event: null });
                fetchHostedEvents();
              }}
              onCancel={() => setEditModal({ visible: false, event: null })}
            />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#4ADE80',
  },
  tabText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4ADE80',
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  listContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 14,
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  // Masonry Grid
  masonryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  masonryCol: {
    width: '48%',
    gap: 16,
  },
  savedCard: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  savedImage: {
    width: '100%',
    height: '100%',
  },
  savedGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  unsaveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  savedContent: {
    gap: 4,
  },
  savedTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savedDate: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  // Attended List
  listContainer: {
    gap: 12,
  },
  attendedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  attendedImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  attendedInfo: {
    flex: 1,
    gap: 4,
  },
  attendedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attendedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendedDate: {
    color: '#94A3B8',
    fontSize: 13,
  },
  attendedStatus: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  // Hosted Card
  hostCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    gap: 16,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  hostInfo: {
    flex: 1,
    gap: 6,
  },
  hostTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hostDate: {
    color: '#94A3B8',
    fontSize: 13,
  },
  moreBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  scanBtn: {
    backgroundColor: '#4ADE80',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Empty States
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: -40,
  },
  emptyIconInfo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  createFirstBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
  },
  createFirstText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  modalTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginHorizontal: 20,
  },
  modalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modalTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  modalTabText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  centered: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModal: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  attendeesList: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  attendeeAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeInfo: {
    flex: 1,
    gap: 2,
  },
  attendeeName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  attendeeEmail: {
    color: '#94A3B8',
    fontSize: 13,
  },
  attendeeDate: {
    color: '#64748B',
    fontSize: 12,
  },
  registrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  registrationInfo: {
    flex: 1,
    gap: 4,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewReceiptText: {
    color: '#8B5CF6',
    fontSize: 13,
  },
  registrationActions: {
    flexDirection: 'row',
    gap: 8,
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
  // Attendance stats
  attendanceStats: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: '700',
  },
  scannedTime: {
    color: '#8B5CF6',
    fontSize: 12,
    marginTop: 2,
  },
  attendedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingAttendanceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Reject modal
  rejectInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  confirmRejectButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmRejectText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

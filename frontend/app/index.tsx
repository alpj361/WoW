
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Pressable,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useEventStore, Event } from '../src/store/eventStore';
import { CategoryFilter } from '../src/components/CategoryFilter';
import { WowLogo } from '../src/components/WowLogo';
import { AnimatedToast } from '../src/components/AnimatedToast';
import { SwipeCardSkeleton } from '../src/components/SkeletonLoader';
import { VerticalEventStack } from '../src/components/VerticalEventStack';
import { FreshDataBanner } from '../src/components/FreshDataBanner';
import { ProcessionesListView } from '../src/components/ProcessionesListView';
import { FeedModeToggle, type FeedMode } from '../src/components/FeedModeToggle';
import { EventDetailModal } from '../src/components/EventDetailModal';
import { LinearGradient } from 'expo-linear-gradient';
import { submitEventFlyer } from '../src/services/api';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const isGuest = !user;
  const {
    events,
    isLoading,
    isLoadingFeed,
    currentCategory,
    setCategory,
    fetchEvents,
    saveEvent,
    denyEvent,
    fetchSavedEvents,
    fetchDeniedEvents,
    silentRefreshFeed,
    hasNewFeedData,
    clearNewDataFlags,
  } = useEventStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstLoad = useRef(true);

  // Submit event flyer
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [flyerImage, setFlyerImage] = useState<string | null>(null);
  const [flyerDescription, setFlyerDescription] = useState('');
  const [flyerSenderName, setFlyerSenderName] = useState('');
  const [flyerSubmitting, setFlyerSubmitting] = useState(false);
  const [flyerSuccess, setFlyerSuccess] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'like' | 'skip' | 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Guests don't need saved/denied events
      if (!isGuest) {
        await Promise.all([fetchSavedEvents(), fetchDeniedEvents()]);
      }
      await fetchEvents();
      setIsInitialized(true);
      isFirstLoad.current = false;
    };
    init();
  }, [isGuest]);

  // Silent refresh when tab is focused (after first load)
  useFocusEffect(
    useCallback(() => {
      if (!isFirstLoad.current) {
        // Silently check for new data in background
        silentRefreshFeed();
      }
    }, [silentRefreshFeed])
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [events]);

  const currentEvent = events[currentIndex];

  const goToNextCard = useCallback(() => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, events.length]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!isGuest) {
      await Promise.all([fetchSavedEvents(), fetchDeniedEvents()]);
    }
    await fetchEvents();
    setCurrentIndex(0);
    clearNewDataFlags();
    setRefreshing(false);
  }, [fetchEvents, fetchSavedEvents, fetchDeniedEvents, clearNewDataFlags, isGuest]);

  // Handler for "new data available" banner
  const handleRefreshFromBanner = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerForEvent } = useEventStore();

  // Haptic feedback helper
  const triggerHaptic = useCallback(async (type: 'success' | 'light' | 'medium') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'medium') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) { }
  }, []);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'like' | 'skip' | 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handleSwipeRight = useCallback(async () => {
    console.log('🎯 handleSwipeRight called');
    triggerHaptic('success');

    // Guest mode: just navigate to next card, no save action
    if (isGuest) {
      goToNextCard();
      return;
    }

    if (currentEvent) {
      console.log('📋 Current event:', {
        id: currentEvent.id,
        title: currentEvent.title,
        price: currentEvent.price,
        priceType: typeof currentEvent.price
      });

      try {
        // Check if event has price
        const eventPrice = currentEvent.price ? parseFloat(String(currentEvent.price)) : 0;
        const hasPrice = eventPrice > 0;
        const isHostEvent = !!currentEvent.user_id;

        console.log('💰 Price check:', { eventPrice, hasPrice, isHostEvent });

        if (hasPrice) {
          if (isHostEvent) {
            console.log('🚪 Host Event HAS price, saving then showing payment alert');
            await saveEvent(currentEvent.id);
            showToast('¡Guardado! 💜', 'like');
            setShowPaymentAlert(true);
          } else {
            console.log('ℹ️ Public Event HAS price, showing info alert');
            await saveEvent(currentEvent.id);
            showToast('¡Guardado! 💜', 'like');

            Alert.alert(
              'Evento con Costo',
              `Este evento tiene un costo de Q${eventPrice.toFixed(2)}. Contacta al organizador o revisa la descripción para pagar.`,
              [{ text: 'Entendido', onPress: goToNextCard }]
            );
          }
        } else {
          console.log('🆓 Event is FREE, just saving');
          await saveEvent(currentEvent.id);
          showToast('¡Guardado! 💜', 'like');
          goToNextCard();
        }
      } catch (error) {
        console.error('❌ Error saving event:', error);
        showToast('Error al guardar', 'error');
        goToNextCard();
      }
    } else {
      console.log('⚠️ No current event');
      goToNextCard();
    }
  }, [currentEvent, saveEvent, goToNextCard, triggerHaptic, showToast, isGuest]);

  const handleSwipeLeft = useCallback(async () => {
    triggerHaptic('medium');
    // Guest mode: just navigate to next card, no deny action
    if (isGuest) {
      goToNextCard();
      return;
    }
    if (currentEvent) {
      console.log('🚫 Denying event:', currentEvent.id);
      denyEvent(currentEvent.id);
      showToast('Pasado', 'skip');
    }
    goToNextCard();
  }, [goToNextCard, currentEvent, denyEvent, triggerHaptic, showToast, isGuest]);

  const handleSaveEvent = useCallback(async (event: Event) => {
    handleSwipeRight();
  }, [handleSwipeRight]);

  const handleSkipEvent = useCallback(async (event: Event) => {
    handleSwipeLeft();
  }, [handleSwipeLeft]);

  const renderCardContent = () => {
    // Show skeleton until initialized OR while loading with no events
    if (!isInitialized || (isLoadingFeed && events.length === 0)) {
      return <SwipeCardSkeleton />;
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyTitle}>No hay eventos</Text>
          <Text style={styles.emptyText}>
            Parece que no hay eventos disponibles.
          </Text>
        </View>
      );
    }

    if (currentIndex >= events.length) {
      if (hasNewFeedData) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles" size={64} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>¡Nuevos eventos!</Text>
            <Text style={styles.emptyText}>
              Hemos encontrado eventos recientes.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: '#8B5CF6' }]}
              onPress={handleRefreshFromBanner}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>Cargar nuevos</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>¡Has visto todos!</Text>
          <Text style={styles.emptyText}>
            Has revisado todos los eventos disponibles.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setCurrentIndex(0);
              fetchEvents();
            }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Ver de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // This case is handled outside ScrollView now
    return null;
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
    if (!currentEvent) return;

    if (!paymentReceiptUrl) {
      Alert.alert('Error', 'Por favor sube el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerForEvent(
        currentEvent.id,
        paymentReceiptUrl,
        currentEvent.registration_form_url ? true : false
      );
      setShowPaymentModal(false);
      setPaymentReceiptUrl('');
      Alert.alert(
        '¡Solicitud enviada!',
        'Tu solicitud de registro ha sido enviada. El organizador la revisará pronto.',
        [{ text: 'OK', onPress: goToNextCard }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest event detail modal
  const [guestSelectedEvent, setGuestSelectedEvent] = useState<Event | null>(null);
  const [showGuestEventDetail, setShowGuestEventDetail] = useState(false);

  const handleGuestCardPress = useCallback((event: Event) => {
    console.log('[index] handleGuestCardPress called, event:', event?.title, 'id:', event?.id);
    setGuestSelectedEvent(event);
    setShowGuestEventDetail(true);
    console.log('[index] showGuestEventDetail set to true');
  }, []);

  // Feed mode toggle (Eventos | Cuaresma)
  const [feedMode, setFeedMode] = useState<FeedMode>('eventos');
  const isCuaresmaMode = feedMode === 'cuaresma';

  // Determine if we should show the vertical stack (gestures) or scrollable content
  const showVerticalStack = !isCuaresmaMode && isInitialized && events.length > 0 && currentIndex < events.length;

  const openFlyerModal = () => {
    setFlyerImage(null);
    setFlyerDescription('');
    setFlyerSenderName('');
    setFlyerSuccess(false);
    setShowFlyerModal(true);
  };

  const handlePickFlyerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar el flyer.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFlyerImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  const handleSubmitFlyer = async () => {
    if (!flyerImage) {
      Alert.alert('Imagen requerida', 'Por favor selecciona el flyer de tu evento.');
      return;
    }
    setFlyerSubmitting(true);
    try {
      await submitEventFlyer(
        flyerImage,
        flyerSenderName.trim() || undefined,
        flyerDescription.trim() || undefined
      );
      setFlyerSuccess(true);
    } catch {
      Alert.alert('Error', 'No pudimos enviar tu evento. Intenta de nuevo más tarde.');
    } finally {
      setFlyerSubmitting(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Toast notification */}
      <AnimatedToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={1500}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {/* New data banner */}
      <FreshDataBanner
        visible={hasNewFeedData}
        message="Hay nuevos eventos"
        onPress={handleRefreshFromBanner}
        onDismiss={clearNewDataFlags}
      />

      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <View>
          <WowLogo width={100} height={32} variant={isCuaresmaMode ? 'cuaresma' : 'default'} />
          <Text style={[styles.tagline, isCuaresmaMode && { color: '#C4B5FD' }]}>
            {isCuaresmaMode ? 'Cuaresma 2026' : 'Descubre y Vive Eventos'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.flyerFab}
          onPress={openFlyerModal}
          activeOpacity={0.75}
        >
          <Ionicons name="megaphone-outline" size={15} color="#10B981" />
          <Text style={styles.flyerFabText}>Enviar evento</Text>
        </TouchableOpacity>
      </View>

      <FeedModeToggle mode={feedMode} onModeChange={setFeedMode} />

      {/* Category filters only in Eventos mode */}
      {!isCuaresmaMode && (
        <CategoryFilter
          selectedCategory={currentCategory}
          onSelectCategory={setCategory}
        />
      )}

      {/* Procesiones view */}
      {isCuaresmaMode ? (
        <View style={styles.stackContainer}>
          <ProcessionesListView />
        </View>
      ) : showVerticalStack ? (
        <View style={styles.stackContainer}>
          <VerticalEventStack
            events={events}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            onSave={handleSaveEvent}
            onSkip={handleSkipEvent}
            readOnly={isGuest}
            onCardPress={isGuest ? handleGuestCardPress : undefined}
          />
        </View>
      ) : (
        /* ScrollView only for loading/empty states with pull-to-refresh */
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        >
          <View style={styles.cardsContainer}>
            {renderCardContent()}
          </View>
        </ScrollView>
      )}

      {/* Payment Alert Modal */}
      <Modal
        visible={showPaymentAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <Pressable
            style={styles.alertBackdrop}
            onPress={() => {
              setShowPaymentAlert(false);
              goToNextCard();
            }}
          />
          <View style={styles.alertBox}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="cash" size={48} color="#F59E0B" />
            </View>

            <Text style={styles.alertTitle}>Este evento requiere pago</Text>

            {currentEvent?.price && (
              <Text style={styles.alertPrice}>Q{currentEvent.price.toFixed(2)}</Text>
            )}

            <Text style={styles.alertMessage}>
              Has guardado este evento en tus favoritos. Para asistir, necesitas completar el pago.
            </Text>

            <View style={styles.alertButtons}>
              <TouchableOpacity
                style={styles.alertButtonPrimary}
                onPress={() => {
                  setShowPaymentAlert(false);
                  setShowPaymentModal(true);
                }}
              >
                <Ionicons name="card" size={20} color="#FFF" />
                <Text style={styles.alertButtonPrimaryText}>Completar Pago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertButtonSecondary}
                onPress={() => {
                  setShowPaymentAlert(false);
                  goToNextCard();
                }}
              >
                <Text style={styles.alertButtonSecondaryText}>Más Tarde</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guest Event Detail Modal */}
      <EventDetailModal
        event={guestSelectedEvent}
        visible={showGuestEventDetail}
        onClose={() => setShowGuestEventDetail(false)}
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setShowPaymentModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comprobante de Pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {currentEvent?.price && (
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Precio del Evento</Text>
                  <Text style={styles.priceAmount}>Q{currentEvent.price.toFixed(2)}</Text>
                </View>
              )}

              {currentEvent?.bank_name && currentEvent?.bank_account_number && (
                <View style={styles.bankInfo}>
                  <Text style={styles.bankInfoLabel}>Información de Pago</Text>
                  <View style={styles.bankInfoRow}>
                    <Ionicons name="business" size={16} color="#9CA3AF" />
                    <Text style={styles.bankInfoText}>{currentEvent.bank_name}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Ionicons name="card" size={16} color="#9CA3AF" />
                    <Text style={styles.bankInfoText}>{currentEvent.bank_account_number}</Text>
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
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                (!paymentReceiptUrl || isSubmitting) && styles.modalButtonDisabled
              ]}
              onPress={handleSubmitPayment}
              disabled={!paymentReceiptUrl || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Submit Event Flyer Modal */}
      <Modal
        visible={showFlyerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFlyerModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#030303' }}>
          {/* Header */}
          <View style={flyerModalStyles.header}>
            <TouchableOpacity
              onPress={() => setShowFlyerModal(false)}
              style={flyerModalStyles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
            <Text style={flyerModalStyles.title}>Enviar evento a WoW</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            contentContainerStyle={flyerModalStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {flyerSuccess ? (
              <View style={flyerModalStyles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                <Text style={flyerModalStyles.successTitle}>¡Evento recibido!</Text>
                <Text style={flyerModalStyles.successSubtitle}>
                  Revisaremos tu evento y lo publicaremos en WoW si cumple con los requisitos. Puede tomar unas horas.
                </Text>
                <TouchableOpacity
                  style={flyerModalStyles.doneButton}
                  onPress={() => setShowFlyerModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={flyerModalStyles.doneButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={flyerModalStyles.label}>Flyer del evento *</Text>
                <TouchableOpacity style={flyerModalStyles.imagePicker} onPress={handlePickFlyerImage} activeOpacity={0.75}>
                  {flyerImage ? (
                    <Image source={{ uri: flyerImage }} style={flyerModalStyles.preview} resizeMode="cover" />
                  ) : (
                    <View style={flyerModalStyles.imageEmpty}>
                      <Ionicons name="image-outline" size={40} color="#4B5563" />
                      <Text style={flyerModalStyles.imageEmptyText}>Seleccionar flyer</Text>
                      <Text style={flyerModalStyles.imageEmptyHint}>Desde tu galería</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {flyerImage && (
                  <TouchableOpacity style={flyerModalStyles.changeLink} onPress={handlePickFlyerImage} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={13} color="#818CF8" />
                    <Text style={flyerModalStyles.changeLinkText}>Cambiar imagen</Text>
                  </TouchableOpacity>
                )}

                <Text style={flyerModalStyles.label}>Tu nombre o empresa</Text>
                <View style={flyerModalStyles.inputBox}>
                  <TextInput
                    style={flyerModalStyles.input}
                    placeholder="Ej: Café Tarro, DJ Marcos..."
                    placeholderTextColor="#4B5563"
                    value={flyerSenderName}
                    onChangeText={setFlyerSenderName}
                  />
                </View>

                <Text style={flyerModalStyles.label}>Detalles adicionales</Text>
                <View style={flyerModalStyles.inputBox}>
                  <TextInput
                    style={[flyerModalStyles.input, flyerModalStyles.textArea]}
                    placeholder="Info que no está en el flyer: precio, link de reservas, edad mínima..."
                    placeholderTextColor="#4B5563"
                    value={flyerDescription}
                    onChangeText={setFlyerDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[flyerModalStyles.submitButton, (!flyerImage || flyerSubmitting) && flyerModalStyles.submitDisabled]}
                  onPress={handleSubmitFlyer}
                  disabled={!flyerImage || flyerSubmitting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#059669', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={flyerModalStyles.submitGradient}
                  >
                    {flyerSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={17} color="#fff" />
                        <Text style={flyerModalStyles.submitText}>Enviar a WoW</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={flyerModalStyles.disclaimer}>
                  El equipo de WoW revisará tu evento antes de publicarlo.
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stackContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalBody: {
    padding: 20,
  },
  modalButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  modalButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  // Alert Modal styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertBox: {
    backgroundColor: '#1F1F1F',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  alertPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginVertical: 8,
  },
  alertMessage: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  alertButtons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  alertButtonPrimary: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alertButtonPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertButtonSecondary: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonSecondaryText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  flyerFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  flyerFabText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
});

const flyerModalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  imagePicker: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    minHeight: 200,
  },
  imageEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  imageEmptyText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  imageEmptyHint: {
    color: '#4B5563',
    fontSize: 12,
  },
  preview: {
    width: '100%',
    height: 260,
  },
  changeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
  },
  changeLinkText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '500',
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  input: {
    padding: 14,
    fontSize: 15,
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 4,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  doneButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
});

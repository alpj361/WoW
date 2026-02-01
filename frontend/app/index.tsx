
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useEventStore, Event } from '../src/store/eventStore';
import { EventCard } from '../src/components/EventCard';
import { CategoryFilter } from '../src/components/CategoryFilter';
import { WowLogo } from '../src/components/WowLogo';
import { SwipeOverlay } from '../src/components/SwipeOverlay';
import { AnimatedToast } from '../src/components/AnimatedToast';
import { SwipeCardSkeleton } from '../src/components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const IS_WEB = Platform.OS === 'web';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const {
    events,
    isLoading,
    currentCategory,
    setCategory,
    fetchEvents,
    saveEvent,
    denyEvent,
    fetchSavedEvents,
    fetchDeniedEvents,
  } = useEventStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Toast state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'like' | 'skip' | 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Load saved/denied FIRST, then fetch events to ensure filtering works
    const init = async () => {
      await Promise.all([fetchSavedEvents(), fetchDeniedEvents()]);
      fetchEvents();
    };
    init();
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [events]);

  const currentEvent = events[currentIndex];
  const nextEvent = events[currentIndex + 1];

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotation.value = withSpring(0);
    scale.value = withSpring(1);
  }, []);

  const goToNextCard = useCallback(() => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
    resetPosition();
  }, [currentIndex, events.length, resetPosition]);

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
    } catch (e) {}
  }, []);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'like' | 'skip' | 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handleSwipeRight = useCallback(async () => {
    console.log('🎯 handleSwipeRight called');
    triggerHaptic('success');
    
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
  }, [currentEvent, saveEvent, goToNextCard, triggerHaptic, showToast]);

  const handleSwipeLeft = useCallback(async () => {
    triggerHaptic('medium');
    if (currentEvent) {
      console.log('🚫 Denying event:', currentEvent.id);
      denyEvent(currentEvent.id);
      showToast('Pasado', 'skip');
    }
    goToNextCard();
  }, [goToNextCard, currentEvent, denyEvent, triggerHaptic, showToast]);

  const animateSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      translateX.value = withTiming(targetX, { duration: 300 }, () => {
        runOnJS(direction === 'right' ? handleSwipeRight : handleSwipeLeft)();
      });
      rotation.value = withTiming(direction === 'right' ? 15 : -15, { duration: 300 });
    },
    [handleSwipeRight, handleSwipeLeft]
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.5;
      rotation.value = (e.translationX / SCREEN_WIDTH) * 20;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(animateSwipe)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(animateSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / SWIPE_THRESHOLD;
    const newScale = 0.95 + Math.min(progress, 1) * 0.05;
    return {
      transform: [{ scale: newScale }],
      opacity: 0.5 + Math.min(progress, 1) * 0.5,
    };
  });

  // Swipe overlay styles
  const likeOverlayStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.5, 1]) }],
    };
  });

  const skipOverlayStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.5, 1]) }],
    };
  });

  const renderCardContent = () => {
    if (isLoading) {
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

    return (
      <View style={styles.cardStackContainer}>
        {/* Next card (behind) */}
        {nextEvent && (
          <Animated.View style={[styles.nextCard, nextCardStyle]}>
            <EventCard event={nextEvent} showActions={false} />
          </Animated.View>
        )}

        {/* Current card */}
        {currentEvent && (
          IS_WEB ? (
            <Animated.View style={[styles.currentCard, cardStyle]}>
              {/* Swipe overlays */}
              <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, likeOverlayStyle]}>
                <View style={styles.overlayIconCircle}>
                  <Ionicons name="heart" size={28} color="#10B981" />
                </View>
                <Text style={[styles.overlayText, { color: '#10B981' }]}>GUARDAR</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeOverlay, styles.skipOverlay, skipOverlayStyle]}>
                <View style={[styles.overlayIconCircle, styles.skipIconCircle]}>
                  <Ionicons name="close" size={28} color="#EF4444" />
                </View>
                <Text style={[styles.overlayText, { color: '#EF4444' }]}>PASAR</Text>
              </Animated.View>
              <EventCard
                event={currentEvent}
                onSave={() => animateSwipe('right')}
                onSkip={() => animateSwipe('left')}
                showActions={true}
              />
            </Animated.View>
          ) : (
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.currentCard, cardStyle]}>
                {/* Swipe overlays */}
                <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, likeOverlayStyle]}>
                  <View style={styles.overlayIconCircle}>
                    <Ionicons name="heart" size={28} color="#10B981" />
                  </View>
                  <Text style={[styles.overlayText, { color: '#10B981' }]}>GUARDAR</Text>
                </Animated.View>
                <Animated.View style={[styles.swipeOverlay, styles.skipOverlay, skipOverlayStyle]}>
                  <View style={[styles.overlayIconCircle, styles.skipIconCircle]}>
                    <Ionicons name="close" size={28} color="#EF4444" />
                  </View>
                  <Text style={[styles.overlayText, { color: '#EF4444' }]}>PASAR</Text>
                </Animated.View>
                <EventCard
                  event={currentEvent}
                  onSave={() => animateSwipe('right')}
                  onSkip={() => animateSwipe('left')}
                  showActions={true}
                />
              </Animated.View>
            </GestureDetector>
          )
        )}
      </View>
    );
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

      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <WowLogo width={100} height={32} />
        <Text style={styles.tagline}>Descubre y Vive Eventos</Text>
      </View>

      <CategoryFilter
        selectedCategory={currentCategory}
        onSelectCategory={setCategory}
      />

      <View style={styles.cardsContainer}>
        {renderCardContent()}
      </View>

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
  cardsContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  cardStackContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCard: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
  },
  nextCard: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
    height: '100%',
    opacity: 0.5,
    transform: [{ scale: 0.92 }, { translateY: 8 }],
  },
  // Swipe overlay styles
  swipeOverlay: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    alignItems: 'center',
    gap: 6,
  },
  likeOverlay: {
    left: 20,
  },
  skipOverlay: {
    right: 20,
  },
  overlayIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  overlayText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
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
});

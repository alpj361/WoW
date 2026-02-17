import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  groupByDate,
  formatShortDate,
  isToday,
  type Procesion,
} from '../data/cuaresma-data';
import { useProcesionStore, type ProcesionDB, isProcessionLive } from '../store/procesionStore';
import { ProcessionDetailModal } from './ProcessionDetailModal';
import { useAuth } from '../context/AuthContext';

const DRAG_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Extended type to include raw DB data for logic checks */
type UIProcession = Procesion & { _id: string; raw: ProcesionDB };

/** Map Supabase ProcesionDB → cuaresma-data Procesion interface */
function mapDBtoProcesion(db: ProcesionDB): UIProcession {
  // Convert ISO date "2026-02-17" → "17 de febrero 2026"
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [y, m, d] = db.fecha.split('-').map(Number);
  const fechaStr = `${d} de ${months[m - 1]} ${y}`;

  return {
    _id: db.id,
    nombre_procesion: db.nombre,
    fecha: fechaStr,
    puntos_referencia: db.puntos_referencia || [],
    imagenes_recorrido: (db.imagenes_recorrido || []).map(url => ({ value: url })),
    imagenes_procesion: db.imagenes_procesion || [],
    horarios: {
      salida: db.hora_salida || 'N/A',
      entrada: db.hora_entrada || 'N/A',
    },
    raw: db,
  };
}

/** Get the best display image: poster first, then tour map fallback */
function getProcessionImage(p: Procesion): string | null {
  if (p.imagenes_procesion.length > 0) return p.imagenes_procesion[0];
  if (p.imagenes_recorrido.length > 0) return p.imagenes_recorrido[0].value;
  return null;
}

function processionId(p: Procesion & { _id?: string }) {
  if (p._id) return p._id;
  return `${p.nombre_procesion}-${p.fecha}`;
}

// ─── Animated Procession Card ─────────────────────────────────────────────────

interface AnimatedProcCardProps {
  procesion: Procesion;
  diff: number;
  translateY: SharedValue<number>;
  isLiked: boolean;
  isGuest: boolean;
  isTodayProcession: boolean;
  isLive: boolean; // Added isLive prop
  counter: string;
  onPress: () => void;
  onToggleLike: () => void;
}

const AnimatedProcCard = memo(({
  procesion,
  diff,
  translateY,
  isLiked,
  isGuest,
  isTodayProcession,
  isLive,
  counter,
  onPress,
  onToggleLike,
}: AnimatedProcCardProps) => {
  const imageUri = getProcessionImage(procesion);

  const animatedStyle = useAnimatedStyle(() => {
    if (diff === 0) {
      const dragProgress = interpolate(
        translateY.value,
        [-DRAG_THRESHOLD * 2, 0, DRAG_THRESHOLD * 2],
        [-50, 0, 50],
        Extrapolation.CLAMP,
      );
      const scaleProgress = interpolate(
        Math.abs(translateY.value),
        [0, DRAG_THRESHOLD * 2],
        [1, 0.95],
        Extrapolation.CLAMP,
      );
      return {
        transform: [{ translateY: dragProgress }, { scale: scaleProgress }],
        opacity: 1,
        zIndex: 10,
      };
    } else if (diff === -1) {
      const baseY = -100;
      const move = interpolate(translateY.value, [0, DRAG_THRESHOLD * 2], [0, 60], Extrapolation.CLAMP);
      const scale = interpolate(translateY.value, [0, DRAG_THRESHOLD * 2], [0.88, 0.94], Extrapolation.CLAMP);
      const opacity = interpolate(translateY.value, [0, DRAG_THRESHOLD * 2], [0.6, 0.85], Extrapolation.CLAMP);
      return { transform: [{ translateY: baseY + move }, { scale }], opacity, zIndex: 5 };
    } else if (diff === 1) {
      const baseY = 100;
      const move = interpolate(translateY.value, [-DRAG_THRESHOLD * 2, 0], [-60, 0], Extrapolation.CLAMP);
      const scale = interpolate(translateY.value, [-DRAG_THRESHOLD * 2, 0], [0.94, 0.88], Extrapolation.CLAMP);
      const opacity = interpolate(translateY.value, [-DRAG_THRESHOLD * 2, 0], [0.85, 0.6], Extrapolation.CLAMP);
      return { transform: [{ translateY: baseY + move }, { scale }], opacity, zIndex: 5 };
    }
    return { transform: [{ translateY: 0 }, { scale: 1 }], opacity: 0, zIndex: 0 };
  });

  return (
    <Animated.View style={[styles.cardPosition, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={[styles.mainCard, isTodayProcession && styles.mainCardToday]}>
        {/* Image */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="flower" size={48} color="#7C3AED" />
          </View>
        )}

        {/* Live Badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}

        {/* Counter badge */}
        <View style={styles.cardCounter}>
          <Text style={styles.cardCounterText}>{counter}</Text>
        </View>

        {/* Today badge */}
        {isTodayProcession && (
          <View style={styles.todayCardBadge}>
            <View style={styles.todayDot} />
            <Text style={styles.todayCardText}>HOY</Text>
          </View>
        )}

        {/* Cuaresma badge */}
        <View style={styles.cuaresmaBadge}>
          <Ionicons name="flower-outline" size={12} color="#E9D5FF" />
          <Text style={styles.cuaresmaBadgeText}>Cuaresma</Text>
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {procesion.nombre_procesion.toUpperCase()}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#A78BFA" />
            <Text style={styles.infoText}>{procesion.fecha}</Text>
          </View>
          {procesion.horarios.salida !== 'N/A' &&
            procesion.horarios.salida !== 'Pendiente de confirmar' &&
            procesion.horarios.salida !== 'Por confirmar' && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color="#A78BFA" />
                <Text style={styles.infoText}>{procesion.horarios.salida}</Text>
              </View>
            )}
          {procesion.puntos_referencia.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#A78BFA" />
              <Text style={styles.infoText} numberOfLines={1}>
                {procesion.puntos_referencia[0].lugar}
              </Text>
            </View>
          )}
        </View>

        {/* Like overlay — logged-in only */}
        {!isGuest && (
          <TouchableOpacity
            style={[styles.likeOverlay, isLiked && styles.likeOverlayActive]}
            onPress={(e) => { e.stopPropagation(); onToggleLike(); }}
            activeOpacity={0.7}
          >
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? '#FFF' : '#C4B5FD'} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProcessionesListView() {
  const { user } = useAuth();
  const isGuest = !user;
  const { procesiones: procDB, savedProcesionIds, isLoading, fetchProcesiones, fetchSavedProcesiones, toggleSaveProcesion } = useProcesionStore();
  const [selectedProcession, setSelectedProcession] = useState<Procesion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchProcesiones('cuaresma-2026');
    if (!isGuest) fetchSavedProcesiones();
  }, [isGuest]);

  // Map DB data to the UI interface
  const allProcesiones = procDB.map(mapDBtoProcesion);
  const grouped = groupByDate(allProcesiones);
  const likedIds = savedProcesionIds;

  const translateY = useSharedValue(0);
  const lastNavTime = useRef(0);
  const isAnimating = useRef(false);

  const toggleLike = useCallback((p: Procesion & { _id?: string }) => {
    if (isGuest) return;
    const id = processionId(p);
    toggleSaveProcesion(id).catch(err => console.error('Failed to toggle save:', err));
  }, [isGuest, toggleSaveProcesion]);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }
  }, []);

  const navigateTo = useCallback((direction: number) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300 || isAnimating.current) return;
    lastNavTime.current = now;
    isAnimating.current = true;

    if (direction > 0 && currentIndex < allProcesiones.length - 1) {
      triggerHaptic();
      setCurrentIndex(prev => prev + 1);
      setShowTimeline(false);
    } else if (direction > 0 && currentIndex === allProcesiones.length - 1) {
      // Past last card → show timeline
      triggerHaptic();
      setShowTimeline(true);
    } else if (direction < 0) {
      if (showTimeline) {
        setShowTimeline(false);
      } else if (currentIndex > 0) {
        triggerHaptic();
        setCurrentIndex(prev => prev - 1);
      }
    }

    setTimeout(() => { isAnimating.current = false; }, 300);
  }, [currentIndex, allProcesiones.length, triggerHaptic, showTimeline]);

  // Scroll-wheel support for web desktop
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWheel = (evt: any) => {
      evt.preventDefault();
      const delta = evt.deltaY as number;
      if (Math.abs(delta) > 30) navigateTo(delta > 0 ? 1 : -1);
    };
    const target = document.querySelector('[data-proc-stack]') || document;
    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => { target.removeEventListener('wheel', handleWheel); };
  }, [navigateTo]);

  const gesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .onUpdate((e) => { translateY.value = e.translationY * 0.6; })
    .onEnd((e) => {
      const shouldNav = Math.abs(e.translationY) > DRAG_THRESHOLD || Math.abs(e.velocityY) > VELOCITY_THRESHOLD;
      if (shouldNav) {
        if (e.translationY < 0 || e.velocityY < -VELOCITY_THRESHOLD) runOnJS(navigateTo)(1);
        else if (e.translationY > 0 || e.velocityY > VELOCITY_THRESHOLD) runOnJS(navigateTo)(-1);
      }
      translateY.value = withSpring(0, { damping: 25, stiffness: 350 });
    });

  const getStaticStyle = (index: number) => {
    const diff = index - currentIndex;
    if (diff === 0) return { y: 0, scale: 1, opacity: 1, zIndex: 10 };
    if (diff === -1) return { y: -100, scale: 0.88, opacity: 0.6, zIndex: 5 };
    if (diff === -2) return { y: -170, scale: 0.78, opacity: 0.3, zIndex: 4 };
    if (diff === 1) return { y: 100, scale: 0.88, opacity: 0.6, zIndex: 5 };
    if (diff === 2) return { y: 170, scale: 0.78, opacity: 0.3, zIndex: 4 };
    return { y: diff > 0 ? 250 : -250, scale: 0.7, opacity: 0, zIndex: 0 };
  };

  const isVisible = (index: number) => Math.abs(index - currentIndex) <= 2;

  const renderCard = (procesion: UIProcession, index: number) => {
    if (!isVisible(index)) return null;
    const diff = index - currentIndex;
    const isCurrent = diff === 0;
    const isPrev = diff === -1;
    const isNext = diff === 1;
    const id = processionId(procesion);

    if (isCurrent || isPrev || isNext) {
      return (
        <AnimatedProcCard
          key={id}
          procesion={procesion}
          diff={diff}
          translateY={translateY}
          isLiked={likedIds.has(id)}
          isGuest={isGuest}
          isTodayProcession={isToday(procesion.fecha)}
          isLive={isProcessionLive(procesion.raw)}
          counter={`${index + 1}/${allProcesiones.length}`}
          onPress={() => setSelectedProcession(procesion)}
          onToggleLike={() => toggleLike(procesion)}
        />
      );
    }

    // Static far cards
    const style = getStaticStyle(index);
    const imageUri = getProcessionImage(procesion);
    return (
      <Animated.View
        key={id}
        style={[
          styles.cardPosition,
          { zIndex: style.zIndex, transform: [{ translateY: style.y }, { scale: style.scale }], opacity: style.opacity },
        ]}
      >
        <View style={styles.mainCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="flower" size={48} color="#7C3AED" />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {procesion.nombre_procesion.toUpperCase()}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ─── Timeline / Cronogram ──────────────────────────────────────────────────

  const renderTimeline = () => (
    <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.timelineHeader}>
        <View style={styles.timelineIndicator} />
        <Text style={styles.timelineTitle}>Cronograma</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{allProcesiones.length} PROCESIONES</Text>
        </View>
      </View>

      {Array.from(grouped.entries()).map(([fecha, procesiones]) => {
        const shortDate = formatShortDate(fecha);
        const isTodayDate = isToday(fecha);
        return (
          <View key={fecha} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <View style={[styles.dateBadge, isTodayDate && styles.dateBadgeToday]}>
                <Text style={[styles.dateDayOfWeek, isTodayDate && styles.dateTextToday]}>{shortDate.dayOfWeek}</Text>
                <Text style={[styles.dateDay, isTodayDate && styles.dateTextToday]}>{shortDate.day}</Text>
                <Text style={[styles.dateMonth, isTodayDate && styles.dateTextToday]}>{shortDate.month}</Text>
              </View>
              {isTodayDate && (
                <View style={styles.todayIndicator}>
                  <View style={styles.livePulse} />
                  <Text style={styles.todayLabelTimeline}>HOY</Text>
                </View>
              )}
              <View style={styles.dateLine} />
            </View>
            {procesiones.map((p, idx) => {
              const procesion = p as UIProcession;
              const id = processionId(procesion);
              const isLiked = likedIds.has(id);
              const thumbUri = getProcessionImage(procesion);
              return (
                <TouchableOpacity
                  key={`${fecha}-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => setSelectedProcession(procesion)}
                  style={[styles.timelineCard, isTodayDate && styles.timelineCardToday, isLiked && styles.timelineCardLiked]}
                >
                  {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.timelineThumb} />
                  ) : (
                    <View style={[styles.timelineThumb, styles.timelineThumbPlaceholder]}>
                      <Ionicons name="flower-outline" size={16} color="#7C3AED" />
                    </View>
                  )}
                  {isProcessionLive(procesion.raw) && (
                    <View style={styles.timelineLiveBadge}>
                      <View style={styles.timelineLiveDot} />
                      <Text style={styles.timelineLiveText}>EN VIVO</Text>
                    </View>
                  )}
                  <View style={styles.timelineCardContent}>
                    <Text style={styles.timelineCardTitle} numberOfLines={1}>{procesion.nombre_procesion}</Text>
                    <View style={styles.timelineCardMeta}>
                      <Ionicons name="time-outline" size={12} color="#A78BFA" />
                      <Text style={styles.timelineCardMetaText}>
                        {procesion.horarios.salida !== 'N/A' && procesion.horarios.salida !== 'Pendiente de confirmar' && procesion.horarios.salida !== 'Por confirmar'
                          ? procesion.horarios.salida : 'Horario por confirmar'}
                      </Text>
                    </View>
                  </View>
                  {isLiked && <Ionicons name="heart" size={16} color="#A855F7" />}
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
      <View style={{ height: 80 }} />
    </ScrollView>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isLoading && allProcesiones.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={{ color: '#A78BFA', marginTop: 12, fontSize: 14 }}>Cargando procesiones…</Text>
      </View>
    );
  }

  return (
    <>
      {showTimeline ? (
        <View style={styles.container}>
          {/* Back to cards button */}
          <TouchableOpacity style={styles.backToCards} onPress={() => setShowTimeline(false)} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color="#C4B5FD" />
            <Text style={styles.backToCardsText}>Volver a procesiones</Text>
          </TouchableOpacity>
          {renderTimeline()}
        </View>
      ) : (
        <View style={styles.container}>
          {/* Card Stack */}
          <GestureDetector gesture={gesture}>
            <Animated.View
              style={styles.stackContainer}
              {...(Platform.OS === 'web' ? { 'data-proc-stack': 'true' } as any : {})}
            >
              {allProcesiones.map((p, i) => renderCard(p, i))}
            </Animated.View>
          </GestureDetector>

          {/* Navigation dots (right side) */}
          <View style={styles.dotsContainer}>
            {allProcesiones.slice(0, Math.min(allProcesiones.length, 12)).map((_, index) => {
              const isActive = index === currentIndex;
              const isNearby = Math.abs(index - currentIndex) <= 2;
              if (!isNearby && index !== 0 && index !== allProcesiones.length - 1) return null;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentIndex(index)}
                  style={[styles.dot, isActive && styles.dotActive]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                />
              );
            })}
            {/* Timeline dot */}
            <View style={styles.dotDivider} />
            <TouchableOpacity
              onPress={() => setShowTimeline(true)}
              style={[styles.dotTimeline]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="list-outline" size={10} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Counter (left side) */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterCurrent}>{String(currentIndex + 1).padStart(2, '0')}</Text>
            <View style={styles.counterDivider} />
            <Text style={styles.counterTotal}>{String(allProcesiones.length).padStart(2, '0')}</Text>
          </View>

          {/* Scroll hint if first card */}
          {currentIndex === 0 && allProcesiones.length > 1 && (
            <View style={styles.hintContainer}>
              <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.4)" />
              <Text style={styles.hintText}>Desliza para explorar</Text>
            </View>
          )}

          {/* Timeline hint at last card */}
          {currentIndex === allProcesiones.length - 1 && (
            <View style={styles.hintContainer}>
              <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.4)" />
              <Text style={styles.hintText}>Desliza para cronograma</Text>
            </View>
          )}
        </View>
      )}

      <ProcessionDetailModal
        procesion={selectedProcession}
        visible={selectedProcession !== null}
        onClose={() => setSelectedProcession(null)}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPosition: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Procession Card
  mainCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1B2E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    maxHeight: '92%',
  },
  mainCardToday: {
    borderColor: 'rgba(168, 85, 247, 0.6)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#2A1A3E',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCounter: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  todayCardBadge: {
    position: 'absolute',
    top: 12,
    left: 70,
    backgroundColor: 'rgba(52, 211, 153, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  todayCardText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cuaresmaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  cuaresmaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#A855F7',
    lineHeight: 22,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#D1D5DB',
  },

  // Like overlay
  likeOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 181, 253, 0.3)',
  },
  likeOverlayActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#A855F7',
  },
  likeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  likeLabelActive: {
    color: '#FFF',
  },

  // Nav dots
  dotsContainer: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: [{ translateY: -60 }],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    height: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  dotDivider: {
    width: 10,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 2,
  },
  dotTimeline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Counter
  counterContainer: {
    position: 'absolute',
    left: 6,
    top: '50%',
    transform: [{ translateY: -30 }],
    alignItems: 'center',
  },
  counterCurrent: {
    fontSize: 26,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  counterDivider: {
    width: 22,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 5,
  },
  counterTotal: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontVariant: ['tabular-nums'],
  },

  // Hint
  hintContainer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Back to cards
  backToCards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backToCardsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C4B5FD',
  },

  // Timeline
  timelineScroll: {
    flex: 1,
  },
  timelineScrollContent: {
    paddingHorizontal: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timelineIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Live Badge Styles
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Timeline Live Badge
  timelineLiveBadge: {
    position: 'absolute',
    bottom: -6,
    left: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#1E1B2E',
  },
  timelineLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  timelineLiveText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.3,
  },

  // Date groups
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dateBadge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 46,
  },
  dateBadgeToday: {
    backgroundColor: '#7C3AED',
  },
  dateDayOfWeek: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5E7EB',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  dateTextToday: {
    color: '#FFF',
  },
  todayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  todayLabelTimeline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A3E',
  },

  // Timeline cards
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B2E',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    gap: 10,
  },
  timelineCardToday: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  timelineCardLiked: {
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  timelineThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2A1A3E',
  },
  timelineThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCardContent: {
    flex: 1,
    gap: 4,
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  timelineCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineCardMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

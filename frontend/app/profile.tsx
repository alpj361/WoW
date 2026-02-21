import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  LayoutChangeEvent,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useEventStore } from '../src/store/eventStore';
import { useAuth } from '../src/context/AuthContext';
import { DigitalCard, CardDesign, DigitalCardRef, CollectedPin } from '../src/components/DigitalCard';
import { PinMovementTest } from '../src/components/pins/PinMovementTest';
import { PinAwardOverlay } from '../src/components/pins/PinAwardOverlay';
import { UserQRCode } from '../src/components/UserQRCode';


interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
  isLast?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  color = '#fff',
  isLast = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingButton, isLast && styles.settingButtonLast]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View
        style={[
          styles.settingIconContainer,
          { backgroundColor: `${color}20` },
        ]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color }]}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );
}

// Generate member ID: 01-version-year-member_number
// Example: 01-001-26-0001
const generateMemberId = (memberNumber?: number): string => {
  const prefix = '01';
  const version = '001'; // App version 0.0.1
  const year = '26'; // 2026
  const number = memberNumber ? String(memberNumber).padStart(4, '0') : '0001';
  return `${prefix}-${version}-${year}-${number}`;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { savedEvents, attendedEvents, fetchEvents } = useEventStore();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic');
  const [showPinTest, setShowPinTest] = useState(false);
  const [showPinAward, setShowPinAward] = useState(false);
  const [showUserQR, setShowUserQR] = useState(false);
  const [collectedPins, setCollectedPins] = useState<CollectedPin[]>([]);
  const [activeTab, setActiveTab] = useState<'ecard' | 'escanear'>('ecard');
  const [cardWidth, setCardWidth] = useState(0);
  const cardRef = useRef<DigitalCardRef>(null);
  const slideAnim = useSharedValue(0);

  // Refresh profile on mount to ensure avatar_url is up-to-date
  useEffect(() => {
    refreshProfile();
  }, []);

  // Get container width on layout
  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setCardWidth(width);
  };

  // Handle tab switch with animation
  const handleTabSwitch = (tab: 'ecard' | 'escanear') => {
    if (tab === activeTab) return;

    slideAnim.value = withSpring(tab === 'escanear' ? -cardWidth : 0, {
      damping: 20,
      stiffness: 90,
    });

    setActiveTab(tab);
  };

  // Animated style for the slider
  const sliderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  // Get user display name
  const userName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';
  const userEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const memberNumber = profile?.member_number;
  const memberId = generateMemberId(memberNumber);

  // Check if user is alpha or admin (dev features access)
  const isDevUser = profile?.role === 'alpha' || profile?.role === 'admin';

  const handleObtainPin = () => {
    // Step 1: Flip the card to back first (if not already flipped)
    cardRef.current?.flipToBack();

    // Step 2: After card finishes flipping, show the pin award overlay
    setTimeout(() => {
      setShowPinAward(true);
    }, 600);
  };

  const handlePinAttach = () => {
    // Add pin to collection with isNew flag for magnetic snap animation
    const newPin: CollectedPin = {
      id: `pin-${Date.now()}`,
      name: 'Miembro AESDI',
      image: null,
      isNew: true,
    };
    setCollectedPins(prev => [...prev, newPin]);

    // Close the overlay immediately
    setShowPinAward(false);
  };

  const handleRefreshEvents = () => {
    Alert.alert(
      'Actualizar eventos',
      '¿Quieres cargar los eventos desde el servidor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            try {
              await fetchEvents();
              Alert.alert('¡Listo!', 'Eventos actualizados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron cargar los eventos.');
            }
          },
        },
      ]
    );
  };

  const savedCount = savedEvents.length;
  const attendedCount = attendedEvents.length;
  const ratedCount = attendedEvents.filter((e) => e.attended?.emoji_rating).length;

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          {/* Demo Banner */}
          <View style={styles.demoBanner}>
            <Ionicons name="flask" size={16} color="#F59E0B" />
            <Text style={styles.demoBannerText}>Demo - Version de prueba</Text>
          </View>

          {/* Avatar */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#8B5CF6" />
            </View>
          )}

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userBio}>{userEmail}</Text>
        </View>

        {/* Digital Card */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>TU TARJETA DIGITAL</Text>
            <TouchableOpacity
              style={styles.editCardButton}
              onPress={() => {
                const designs: CardDesign[] = ['classic', 'ticket', 'pyramid'];
                const currentIndex = designs.indexOf(cardDesign);
                const nextIndex = (currentIndex + 1) % designs.length;
                setCardDesign(designs[nextIndex]);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="color-wand" size={14} color="#8B5CF6" />
              <Text style={styles.editCardText}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Toggle: ECARD | ESCANEAR */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ecard' && styles.tabActive]}
              onPress={() => handleTabSwitch('ecard')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'ecard' && styles.tabTextActive]}>
                ECARD
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'escanear' && styles.tabActive]}
              onPress={() => handleTabSwitch('escanear')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'escanear' && styles.tabTextActive]}>
                ESCANEAR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cards Slider Container */}
          <View style={styles.cardsSliderContainer} onLayout={handleContainerLayout}>
            <Animated.View
              style={[
                styles.cardsSlider,
                sliderAnimatedStyle,
              ]}
            >
              {/* Original Digital Card */}
              <View style={[styles.cardSlide, { width: cardWidth }]}>
                <DigitalCard
                  ref={cardRef}
                  userName={userName}
                  memberId={memberId}
                  design={cardDesign}
                  pins={collectedPins}
                />
              </View>

              {/* QR Code Card */}
              <View style={[styles.cardSlide, { width: cardWidth }]}>
                <TouchableOpacity
                  style={styles.qrCardContainer}
                  onPress={() => setShowUserQR(true)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#1a1a2e', '#16213e', '#0f0f23']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qrCard}
                  >
                    {/* Card Border */}
                    <View style={styles.qrCardBorder} />

                    {/* QR Code */}
                    <View style={styles.qrCodeWrapper}>
                      <View style={styles.qrCodeContainer}>
                        <QRCode
                          value={`WOW-USER-${user?.id || memberId}`}
                          size={150}
                          backgroundColor="#fff"
                          color="#1a1a2e"
                        />
                      </View>
                    </View>

                    {/* Tap to enlarge hint */}
                    <View style={styles.tapHint}>
                      <Ionicons name="expand-outline" size={16} color="#8B5CF6" />
                      <Text style={styles.tapHintText}>Toca para ampliar</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Obtener PIN Button - only show on ECARD tab for alpha/admin users */}
          {activeTab === 'ecard' && isDevUser && (
            <TouchableOpacity
              style={styles.obtainPinButton}
              onPress={handleObtainPin}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.obtainPinText}>Obtener PIN</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Guardados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{attendedCount}</Text>
            <Text style={styles.statLabel}>Asistidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ratedCount}</Text>
            <Text style={styles.statLabel}>Calificados</Text>
          </View>
        </View>

        {/* Preferencias Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleMargin}>PREFERENCIAS</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="notifications"
              title="Notificaciones"
              subtitle="Proximamente"
            />
            <SettingItem
              icon="location"
              title="Ubicacion"
              subtitle="Proximamente"
            />
            <SettingItem
              icon="color-palette"
              title="Apariencia"
              subtitle="Tema oscuro"
              isLast
            />
          </View>
        </View>

        {/* Desarrollo Section - only for alpha/admin users */}
        {isDevUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleMargin}>DESARROLLO</Text>
            <View style={styles.settingsGroup}>
              <SettingItem
                icon="globe"
                title="Spots"
                subtitle="Lugares y ubicaciones"
                onPress={() => router.push('/places')}
                color="#10B981"
              />
              <SettingItem
                icon="move"
                title="Test de Movimiento"
                subtitle="Prueba el movimiento 3D del pin"
                onPress={() => setShowPinTest(true)}
                color="#F59E0B"
              />
              <SettingItem
                icon="planet"
                title="Radial Demo"
                subtitle="Demo de avatares orbitando"
                onPress={() => router.push('/radial-demo')}
                color="#8B5CF6"
                isLast
              />
            </View>
          </View>
        )}

        {/* Informacion Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleMargin}>INFORMACION</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="help-circle"
              title="Ayuda y Soporte"
              subtitle="Preguntas frecuentes"
            />
            <SettingItem
              icon="document-text"
              title="Terminos y Condiciones"
              onPress={() => {
                if (Platform.OS === 'web') {
                  router.push('/terminos');
                } else {
                  Linking.openURL('https://wo-w-nu.vercel.app/terminos');
                }
              }}
            />
            <SettingItem
              icon="shield"
              title="Privacidad"
              onPress={() => {
                if (Platform.OS === 'web') {
                  router.push('/privacidad');
                } else {
                  Linking.openURL('https://wo-w-nu.vercel.app/privacidad');
                }
              }}
            />
            <SettingItem
              icon="information-circle"
              title="Version"
              subtitle="0.0.1 MVP"
              showArrow={false}
              isLast
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appLogo}>WOW</Text>
          <Text style={styles.appTagline}>Descubre y Vive Eventos</Text>
          <Text style={styles.appDescription}>
            Desarrollado con amor para conectar personas con experiencias
            inolvidables
          </Text>
        </View>

        {/* Cerrar Sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Cerrar Sesión',
                '¿Estás seguro que deseas cerrar sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: () => signOut(),
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#F87171" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Pin Movement Test Modal */}
      <Modal
        visible={showPinTest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPinTest(false)}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowPinTest(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <PinMovementTest />
        </GestureHandlerRootView>
      </Modal>

      {/* Pin Award Overlay */}
      {showPinAward && (
        <GestureHandlerRootView style={styles.pinAwardContainer}>
          <PinAwardOverlay
            visible={showPinAward}
            pinName="Miembro AESDI"
            onAttach={handlePinAttach}
            onDismiss={() => setShowPinAward(false)}
            targetPosition={{ x: 100, y: -200 }}
          />
        </GestureHandlerRootView>
      )}

      {/* User QR Code Modal */}
      <UserQRCode
        visible={showUserQR}
        onClose={() => setShowUserQR(false)}
        userId={user?.id || ''}
        userName={userName}
      />

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    marginBottom: 16,
  },
  demoBannerText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
  },
  editCardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleMargin: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  settingsGroup: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingButtonLast: {
    borderBottomWidth: 0,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appLogo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 6,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  bottomSpacing: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  obtainPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  obtainPinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pinAwardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  // Tab Toggle Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#fff',
  },
  // Cards Slider Styles
  cardsSliderContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  cardsSlider: {
    flexDirection: 'row',
  },
  cardSlide: {
  },
  // QR Card Styles
  qrCardContainer: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  qrCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  qrCodeWrapper: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  qrCodeContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 8,
  },
  tapHintText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '600',
  },
});

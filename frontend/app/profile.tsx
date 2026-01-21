import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../src/store/eventStore';
import { DigitalCard, CardDesign, DigitalCardRef, CollectedPin } from '../src/components/DigitalCard';
import { PinMovementTest } from '../src/components/pins/PinMovementTest';
import { PinAwardOverlay } from '../src/components/pins/PinAwardOverlay';

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

export default function ProfileScreen() {
  const { savedEvents, attendedEvents, fetchEvents } = useEventStore();
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic');
  const [showPinTest, setShowPinTest] = useState(false);
  const [showPinAward, setShowPinAward] = useState(false);
  const [collectedPins, setCollectedPins] = useState<CollectedPin[]>([]);
  const cardRef = useRef<DigitalCardRef>(null);

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Demo Banner */}
          <View style={styles.demoBanner}>
            <Ionicons name="flask" size={16} color="#F59E0B" />
            <Text style={styles.demoBannerText}>Demo - Version de prueba</Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#8B5CF6" />
          </View>

          <Text style={styles.userName}>Juan Perez</Text>
          <Text style={styles.userBio}>Explorando eventos increibles</Text>
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
          <DigitalCard
            ref={cardRef}
            userName="Juan Perez"
            memberId="WOW-2024-001"
            design={cardDesign}
            pins={collectedPins}
          />

          {/* Obtener PIN Button */}
          <TouchableOpacity
            style={styles.obtainPinButton}
            onPress={handleObtainPin}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.obtainPinText}>Obtener PIN</Text>
          </TouchableOpacity>
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

        {/* Desarrollo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleMargin}>DESARROLLO</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="sync"
              title="Actualizar eventos"
              subtitle="Cargar desde el servidor"
              onPress={handleRefreshEvents}
              color="#8B5CF6"
              isLast
            />
            {/* Test de Movimiento - hidden for now
            <SettingItem
              icon="move"
              title="Test de Movimiento"
              subtitle="Prueba el movimiento 3D del pin"
              onPress={() => setShowPinTest(true)}
              color="#F59E0B"
            />
            */}
          </View>
        </View>

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
            />
            <SettingItem icon="shield" title="Privacidad" />
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
    paddingTop: 40,
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
});

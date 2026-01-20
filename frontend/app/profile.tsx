import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../src/store/eventStore';
import { DigitalCard } from '../src/components/DigitalCard';

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
  const { savedEvents, attendedEvents, seedData } = useEventStore();

  const handleSeedData = () => {
    Alert.alert(
      'Cargar datos de ejemplo',
      '¿Quieres cargar eventos de ejemplo? Esto eliminará los datos actuales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar',
          onPress: async () => {
            try {
              await seedData();
              Alert.alert('¡Listo!', 'Eventos de ejemplo cargados.');
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        {/* Demo Banner */}
        <View style={styles.demoBanner}>
          <Ionicons name="flask" size={14} color="#F59E0B" />
          <Text style={styles.demoBannerText}>Demo - Version de prueba</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#8B5CF6" />
        </View>

        <Text style={styles.userName}>Juan Perez</Text>
        <Text style={styles.userBio}>Explorando eventos increibles</Text>
      </View>

      {/* Digital Card */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>TU TARJETA DIGITAL</Text>
        <DigitalCard userName="Juan Perez" memberId="WOW-2024-001" />
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
            icon="sparkles"
            title="Cargar eventos de ejemplo"
            subtitle="Reinicia con datos de prueba"
            onPress={handleSeedData}
            color="#8B5CF6"
            isLast
          />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 32,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 12,
  },
  demoBannerText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userBio: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
});

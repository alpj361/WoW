import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DigitalCard } from './DigitalCard';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  color = '#fff',
  isLast = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.settingItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${color}33` }, // 20% opacity
        ]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
  );
};

interface ProfileScreenProps {
  savedCount?: number;
  attendedCount?: number;
  ratedCount?: number;
  onSeedData?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  savedCount = 0,
  attendedCount = 0,
  ratedCount = 0,
  onSeedData,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        {/* Demo Banner */}
        <View style={styles.demoBanner}>
          <Ionicons name="flask" size={16} color="#F59E0B" />
          <Text style={styles.demoBannerText}>Demo - Version de prueba</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#8B5CF6" />
        </View>

        <Text style={styles.userName}>Usuario WOW</Text>
        <Text style={styles.userBio}>Explorando eventos increibles</Text>
      </View>

      {/* Digital Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TU TARJETA DIGITAL</Text>
        <DigitalCard userName="Usuario WOW" memberId="WOW-2024-001" />
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
        <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="notifications"
            title="Notificaciones"
            subtitle="Proximamente"
            color="#fff"
          />
          <SettingItem
            icon="location"
            title="Ubicacion"
            subtitle="Proximamente"
            color="#fff"
          />
          <SettingItem
            icon="color-palette"
            title="Apariencia"
            subtitle="Tema oscuro"
            color="#fff"
            isLast
          />
        </View>
      </View>

      {/* Desarrollo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESARROLLO</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="sparkles"
            title="Cargar eventos de ejemplo"
            subtitle="Reinicia con datos de prueba"
            onPress={onSeedData}
            color="#8B5CF6"
            isLast
          />
        </View>
      </View>

      {/* Informacion Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMACION</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="help-circle"
            title="Ayuda y Soporte"
            subtitle="Preguntas frecuentes"
            color="#fff"
          />
          <SettingItem
            icon="document-text"
            title="Terminos y Condiciones"
            color="#fff"
          />
          <SettingItem icon="shield" title="Privacidad" color="#fff" />
          <SettingItem
            icon="information-circle"
            title="Version"
            subtitle="0.0.1 MVP"
            showArrow={false}
            color="#fff"
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
    </ScrollView>
  );
};

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
    borderRadius: 100,
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
    color: '#fff',
  },
  userBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginBottom: 12,
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
    color: '#fff',
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
  settingsGroup: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
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
    fontSize: 32,
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
    lineHeight: 20,
    paddingHorizontal: 32,
    marginTop: 16,
  },
});

export default ProfileScreen;

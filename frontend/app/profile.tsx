import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../src/store/eventStore';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  color?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  color = '#fff',
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color }]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && onPress && (
      <Ionicons name="chevron-forward" size={20} color="#4B5563" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color="#8B5CF6" />
        </View>
        <Text style={styles.userName}>Usuario WOW</Text>
        <Text style={styles.userBio}>Explorando eventos increíbles</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedEvents.length}</Text>
          <Text style={styles.statLabel}>Guardados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{attendedEvents.length}</Text>
          <Text style={styles.statLabel}>Asistidos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {attendedEvents.filter((e) => e.attended.emoji_rating).length}
          </Text>
          <Text style={styles.statLabel}>Calificados</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="notifications-outline"
            title="Notificaciones"
            subtitle="Próximamente"
          />
          <SettingItem
            icon="location-outline"
            title="Ubicación"
            subtitle="Próximamente"
          />
          <SettingItem
            icon="color-palette-outline"
            title="Apariencia"
            subtitle="Tema oscuro"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desarrollo</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="sparkles-outline"
            title="Cargar eventos de ejemplo"
            subtitle="Reinicia con datos de prueba"
            onPress={handleSeedData}
            color="#8B5CF6"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="help-circle-outline"
            title="Ayuda y Soporte"
            subtitle="Preguntas frecuentes"
          />
          <SettingItem
            icon="document-text-outline"
            title="Términos y Condiciones"
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacidad"
          />
          <SettingItem
            icon="information-circle-outline"
            title="Versión"
            subtitle="0.0.1 MVP"
            showArrow={false}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appLogo}>WOW</Text>
        <Text style={styles.appTagline}>Descubre y Vive Eventos</Text>
        <Text style={styles.appCopyright}>
          Desarrollado con amor para conectar{"\n"}personas con experiencias inolvidables
        </Text>
      </View>

      <View style={{ height: insets.bottom + 40 }} />
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
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  statNumber: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
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
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  appCopyright: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

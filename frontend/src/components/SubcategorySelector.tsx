import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Subcategory {
  id: string;
  label: string;
  category: string;
  color: string;
  icon: string;
}

export const SUBCATEGORIES: Subcategory[] = [
  // música & cultura
  { id: 'rock-concert', label: 'Concierto Rock', category: 'music', color: '#8B5CF6', icon: 'musical-notes' },
  { id: 'pop-concert', label: 'Concierto Pop', category: 'music', color: '#EC4899', icon: 'musical-notes' },
  { id: 'electronic-concert', label: 'Electrónica / DJ', category: 'music', color: '#06B6D4', icon: 'radio' },
  { id: 'reggaeton-urbano', label: 'Reggaetón / Urbano', category: 'music', color: '#F59E0B', icon: 'mic' },
  { id: 'jazz-blues', label: 'Jazz & Blues', category: 'music', color: '#D97706', icon: 'musical-note' },
  { id: 'classical-music', label: 'Música Clásica', category: 'music', color: '#6D28D9', icon: 'musical-notes' },
  { id: 'latin-salsa', label: 'Salsa / Cumbia', category: 'music', color: '#EF4444', icon: 'musical-notes' },
  { id: 'folk-traditional', label: 'Folklore / Regional', category: 'music', color: '#84CC16', icon: 'musical-notes' },
  { id: 'indie-alternative', label: 'Indie / Alternativo', category: 'music', color: '#A855F7', icon: 'musical-notes' },
  { id: 'hip-hop-rap', label: 'Hip-Hop / Rap', category: 'music', color: '#F97316', icon: 'mic' },
  { id: 'metal-hardcore', label: 'Metal / Hardcore', category: 'music', color: '#374151', icon: 'musical-notes' },
  { id: 'acoustic-unplugged', label: 'Acústico / Unplugged', category: 'music', color: '#78716C', icon: 'musical-note' },
  { id: 'open-mic', label: 'Open Mic / Jam Session', category: 'music', color: '#10B981', icon: 'mic-outline' },
  { id: 'live-band', label: 'Banda en Vivo', category: 'music', color: '#8B5CF6', icon: 'musical-notes' },
  { id: 'music-festival', label: 'Festival de Música', category: 'music', color: '#F59E0B', icon: 'flag' },
  { id: 'dj-set', label: 'DJ Set / Night Club', category: 'music', color: '#06B6D4', icon: 'disc' },
  { id: 'karaoke', label: 'Karaoke', category: 'music', color: '#EC4899', icon: 'mic' },
  { id: 'art-exhibition', label: 'Exposición de Arte', category: 'music', color: '#D946EF', icon: 'color-palette' },
  { id: 'theater-play', label: 'Obra de Teatro', category: 'music', color: '#B45309', icon: 'film' },
  { id: 'dance-performance', label: 'Presentación de Baile', category: 'music', color: '#EC4899', icon: 'body' },
  { id: 'comedy-show', label: 'Stand-Up / Comedia', category: 'music', color: '#F59E0B', icon: 'happy' },
  { id: 'poetry-slam', label: 'Poesía / Slam Poetry', category: 'music', color: '#6366F1', icon: 'book' },
  { id: 'film-screening', label: 'Proyección de Película', category: 'music', color: '#1E293B', icon: 'videocam' },
  { id: 'cultural-festival', label: 'Festival Cultural', category: 'music', color: '#DC2626', icon: 'flag' },
  { id: 'art-music-gathering', label: 'Velada Arte & Música', category: 'music', color: '#C084FC', icon: 'color-palette' },
  // voluntariado clásico
  { id: 'environmental-cleanup', label: 'Limpieza Ambiental', category: 'volunteer', color: '#16A34A', icon: 'leaf' },
  { id: 'tree-planting', label: 'Siembra de Árboles', category: 'volunteer', color: '#15803D', icon: 'leaf' },
  { id: 'animal-rescue', label: 'Rescate Animal', category: 'volunteer', color: '#F97316', icon: 'paw' },
  { id: 'food-bank', label: 'Banco de Alimentos', category: 'volunteer', color: '#EAB308', icon: 'fast-food' },
  { id: 'community-build', label: 'Construcción Comunitaria', category: 'volunteer', color: '#B45309', icon: 'hammer' },
  { id: 'tutoring-education', label: 'Tutoría / Educación', category: 'volunteer', color: '#3B82F6', icon: 'book' },
  { id: 'medical-campaign', label: 'Campaña Médica', category: 'volunteer', color: '#EF4444', icon: 'medkit' },
  { id: 'blood-donation', label: 'Donación de Sangre', category: 'volunteer', color: '#DC2626', icon: 'heart' },
  { id: 'clothing-drive', label: 'Colecta de Ropa', category: 'volunteer', color: '#8B5CF6', icon: 'shirt' },
  { id: 'elderly-support', label: 'Apoyo a Adultos Mayores', category: 'volunteer', color: '#F59E0B', icon: 'people' },
  { id: 'children-support', label: 'Apoyo a Niños', category: 'volunteer', color: '#EC4899', icon: 'happy' },
  { id: 'disaster-relief', label: 'Ayuda en Desastres', category: 'volunteer', color: '#EF4444', icon: 'alert' },
  { id: 'habitat-restoration', label: 'Restauración de Hábitat', category: 'volunteer', color: '#16A34A', icon: 'earth' },
  { id: 'fundraiser-walk', label: 'Caminata Benéfica', category: 'volunteer', color: '#10B981', icon: 'footsteps' },
  { id: 'beach-cleanup', label: 'Limpieza de Playa / Río', category: 'volunteer', color: '#0EA5E9', icon: 'water' },
  { id: 'mental-health-awareness', label: 'Salud Mental', category: 'volunteer', color: '#A855F7', icon: 'heart' },
  { id: 'youth-mentorship', label: 'Mentoría Juvenil', category: 'volunteer', color: '#06B6D4', icon: 'school' },
  // ONGs, causas sociales & comunidades
  { id: 'lgbt-awareness', label: 'Comunidad LGBT+', category: 'volunteer', color: '#F472B6', icon: 'heart' },
  { id: 'political-youth', label: 'Juventud Política', category: 'volunteer', color: '#6366F1', icon: 'megaphone' },
  { id: 'university-awareness', label: 'Conciencia Universitaria', category: 'volunteer', color: '#3B82F6', icon: 'school' },
  { id: 'ong-campaign', label: 'Campaña ONG', category: 'volunteer', color: '#10B981', icon: 'ribbon' },
  { id: 'human-rights', label: 'Derechos Humanos', category: 'volunteer', color: '#EF4444', icon: 'people' },
  { id: 'womens-rights', label: 'Derechos de la Mujer', category: 'volunteer', color: '#EC4899', icon: 'female' },
  { id: 'indigenous-rights', label: 'Pueblos Indígenas', category: 'volunteer', color: '#D97706', icon: 'earth' },
  { id: 'migrant-support', label: 'Apoyo a Migrantes', category: 'volunteer', color: '#F59E0B', icon: 'airplane' },
  { id: 'anti-corruption', label: 'Transparencia / Anticorrupción', category: 'volunteer', color: '#64748B', icon: 'shield' },
  { id: 'climate-activism', label: 'Activismo Climático', category: 'volunteer', color: '#16A34A', icon: 'thunderstorm' },
  { id: 'disability-rights', label: 'Inclusión / Discapacidad', category: 'volunteer', color: '#8B5CF6', icon: 'accessibility' },
  { id: 'animal-rights', label: 'Derechos Animales', category: 'volunteer', color: '#F97316', icon: 'paw' },
  { id: 'peace-culture', label: 'Cultura de Paz', category: 'volunteer', color: '#06B6D4', icon: 'globe' },
  { id: 'civic-education', label: 'Educación Cívica', category: 'volunteer', color: '#0EA5E9', icon: 'book' },
  { id: 'social-entrepreneurship', label: 'Emprendimiento Social', category: 'volunteer', color: '#84CC16', icon: 'bulb' },
  // general
  { id: 'networking-event', label: 'Networking', category: 'general', color: '#3B82F6', icon: 'people' },
  { id: 'startup-pitch', label: 'Pitch / Demo Day', category: 'general', color: '#8B5CF6', icon: 'rocket' },
  { id: 'workshop-skills', label: 'Taller de Habilidades', category: 'general', color: '#F59E0B', icon: 'build' },
  { id: 'conference-talk', label: 'Conferencia / Charla', category: 'general', color: '#6366F1', icon: 'mic' },
  { id: 'sports-game', label: 'Partido Deportivo', category: 'general', color: '#10B981', icon: 'football' },
  { id: 'running-race', label: 'Carrera / Maratón', category: 'general', color: '#16A34A', icon: 'footsteps' },
  { id: 'yoga-wellness', label: 'Yoga / Bienestar', category: 'general', color: '#A855F7', icon: 'body' },
  { id: 'food-tasting', label: 'Festival Gastronómico', category: 'general', color: '#EAB308', icon: 'restaurant' },
  { id: 'flea-market', label: 'Mercadillo / Feria', category: 'general', color: '#F97316', icon: 'storefront' },
  { id: 'farmers-market', label: 'Mercado de Productores', category: 'general', color: '#84CC16', icon: 'leaf' },
  { id: 'art-craft-fair', label: 'Feria de Arte', category: 'general', color: '#EC4899', icon: 'color-palette' },
  { id: 'book-club', label: 'Club de Lectura', category: 'general', color: '#6366F1', icon: 'book' },
  { id: 'language-exchange', label: 'Intercambio de Idiomas', category: 'general', color: '#0EA5E9', icon: 'chatbubbles' },
  { id: 'gaming-tournament', label: 'Torneo de Videojuegos', category: 'general', color: '#8B5CF6', icon: 'game-controller' },
  { id: 'tech-meetup', label: 'Meetup de Tecnología', category: 'general', color: '#3B82F6', icon: 'code-slash' },
  { id: 'photography-walk', label: 'Salida Fotográfica', category: 'general', color: '#1E293B', icon: 'camera' },
  { id: 'hiking-outdoors', label: 'Senderismo / Outdoor', category: 'general', color: '#16A34A', icon: 'trail-sign' },
  { id: 'hackathon', label: 'Hackathon', category: 'general', color: '#06B6D4', icon: 'terminal' },
  { id: 'launch-party', label: 'Lanzamiento de Producto', category: 'general', color: '#8B5CF6', icon: 'rocket' },
  { id: 'private-party', label: 'Fiesta / Cumpleaños', category: 'general', color: '#EC4899', icon: 'balloon' },
];

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Música & Cultura',
  volunteer: 'Voluntariado',
  general: 'General',
};

interface SubcategorySelectorProps {
  category: string;
  value: string | null;
  onChange: (subcategory: string | null) => void;
}

export default function SubcategorySelector({ category, value, onChange }: SubcategorySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const byCategory = SUBCATEGORIES.filter(s => s.category === category);
    if (!search.trim()) return byCategory;
    const q = search.trim().toLowerCase();
    return byCategory.filter(s => s.label.toLowerCase().includes(q));
  }, [category, search]);

  const selected = SUBCATEGORIES.find(s => s.id === value) ?? null;

  const handleSelect = (sub: Subcategory) => {
    onChange(sub.id);
    setModalVisible(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
    setModalVisible(false);
    setSearch('');
  };

  const handleOpen = () => {
    setSearch('');
    setModalVisible(true);
  };

  return (
    <>
      {/* Trigger button */}
      <View style={styles.container}>
        <Text style={styles.label}>Tipo de evento</Text>
        <TouchableOpacity style={styles.trigger} onPress={handleOpen} activeOpacity={0.7}>
          {selected ? (
            <>
              <View style={[styles.triggerDot, { backgroundColor: selected.color }]} />
              <Ionicons name={selected.icon as any} size={16} color={selected.color} />
              <Text style={[styles.triggerText, { color: '#fff' }]} numberOfLines={1}>
                {selected.label}
              </Text>
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="list" size={16} color="#6B7280" />
              <Text style={styles.triggerPlaceholder}>Seleccionar tipo de evento</Text>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: 'auto' }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />

          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <View>
                  <Text style={styles.sheetTitle}>Tipo de evento</Text>
                  <Text style={styles.sheetSubtitle}>
                    {CATEGORY_LABELS[category] ?? category} · {filtered.length} opciones
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Searchbar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar tipo de evento..."
                  placeholderTextColor="#4B5563"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* List */}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Clear option */}
              {value && (
                <TouchableOpacity style={styles.clearRow} onPress={handleClear}>
                  <View style={styles.clearIconWrap}>
                    <Ionicons name="close" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.clearRowText}>Sin tipo de evento</Text>
                </TouchableOpacity>
              )}

              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={36} color="#374151" />
                  <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
                </View>
              ) : (
                filtered.map((sub) => {
                  const isSelected = value === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.row, isSelected && styles.rowSelected]}
                      onPress={() => handleSelect(sub)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: sub.color + '22' }]}>
                        <Ionicons name={sub.icon as any} size={18} color={sub.color} />
                      </View>
                      <Text style={[styles.rowLabel, isSelected && { color: '#fff' }]}>
                        {sub.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  triggerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  triggerPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
  },
  // Modal
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '78%',
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    padding: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    marginBottom: 4,
  },
  clearIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearRowText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 2,
  },
  rowSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    paddingHorizontal: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '400',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});

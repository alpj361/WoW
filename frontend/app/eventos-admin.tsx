import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/services/supabase';
import type { Event } from '../src/store/eventStore';
import { AnimatedToast } from '../src/components/AnimatedToast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Row ─────────────────────────────────────────────────────────────────────

function EventAdminRow({
  item,
  index,
  onPress,
}: {
  item: Event;
  index: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 40, withSpring(1, { damping: 15 }));
    translateY.value = withDelay(index * 40, withSpring(0, { damping: 15 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.rowThumb} />
        ) : (
          <View style={[styles.rowThumb, styles.rowThumbPlaceholder]}>
            <Ionicons name="image-outline" size={18} color="#4B5563" />
          </View>
        )}
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {[item.category, item.date, item.location].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#8B5CF6" />
    </TouchableOpacity>
  );
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

interface EditSheetProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: Event) => void;
  onDeleted: (id: string) => void;
}

function EditSheet({ event, visible, onClose, onSaved, onDeleted }: EditSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [registrationFormUrl, setRegistrationFormUrl] = useState('');
  const [requiresAttendance, setRequiresAttendance] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDates, setRecurringDates] = useState('');
  const [tags, setTags] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sections, setSections] = useState({
    info: true,
    media: false,
    pricing: false,
    advanced: false,
  });

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const populateForm = (e: Event) => {
    setTitle(e.title || '');
    setDescription(e.description || '');
    setCategory(e.category || '');
    setSubcategory(e.subcategory || '');
    setOrganizer(e.organizer || '');
    setDate(e.date || '');
    setTime(e.time || '');
    setEndTime(e.end_time || '');
    setLocation(e.location || '');
    setImageUrl(e.image || '');
    setPrice(e.price != null ? String(e.price) : '');
    setBankName(e.bank_name || '');
    setBankAccount(e.bank_account_number || '');
    setRegistrationFormUrl(e.registration_form_url || '');
    setRequiresAttendance(!!e.requires_attendance_check);
    setIsRecurring(!!e.is_recurring);
    setRecurringDates((e.recurring_dates || []).join(', '));
    setTags((e.tags || []).join(', '));
    setTargetAudience((e.target_audience || []).join(', '));
  };

  // Fetch fresh data every time sheet opens
  useEffect(() => {
    if (!visible || !event?.id) return;

    setIsFetching(true);
    populateForm(event);

    supabase
      .from('events')
      .select('*')
      .eq('id', event.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) populateForm(data as Event);
      })
      .finally(() => setIsFetching(false));
  }, [visible, event?.id]);

  // Animate sheet
  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 20, stiffness: 120 })
      : withTiming(SCREEN_HEIGHT, { duration: 280 });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePickImage = async () => {
    if (!event) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingImage(true);

    try {
      let ext = 'jpg';
      if (asset.mimeType) {
        ext = asset.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      } else if (asset.fileName) {
        ext = asset.fileName.split('.').pop() || 'jpg';
      }
      const fileName = `events/${event.id}/${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const contentType = blob.type || asset.mimeType || `image/${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('events-images')
        .upload(fileName, blob, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('events-images')
        .getPublicUrl(fileName);

      setImageUrl(urlData.publicUrl);
      showToast('Imagen subida');
    } catch (err: any) {
      showToast(err?.message || 'Error al subir imagen', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!event) return;
    setIsSaving(true);
    try {
      const payload: Partial<Event> = {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        subcategory: subcategory.trim() || null,
        organizer: organizer.trim() || null,
        date: date.trim() || null,
        time: time.trim() || null,
        end_time: endTime.trim() || null,
        location: location.trim() || null,
        image: imageUrl.trim() || null,
        price: price.trim() ? parseFloat(price.trim()) : null,
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccount.trim() || null,
        registration_form_url: registrationFormUrl.trim() || null,
        requires_attendance_check: requiresAttendance,
        is_recurring: isRecurring,
        recurring_dates: recurringDates.trim()
          ? recurringDates.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        tags: tags.trim()
          ? tags.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        target_audience: targetAudience.trim()
          ? targetAudience.split(',').map(s => s.trim()).filter(Boolean)
          : null,
      };

      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id);

      if (error) throw error;

      onSaved({ ...event, ...payload } as Event);
      showToast('Guardado exitosamente');
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      // Delete related records first
      await supabase.from('denied_events').delete().eq('event_id', event.id);
      await supabase.from('event_registrations').delete().eq('event_id', event.id);
      await supabase.from('attended_events').delete().eq('event_id', event.id);
      await supabase.from('saved_events').delete().eq('event_id', event.id);

      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;

      onDeleted(event.id);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!visible && !event) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Ionicons name="close" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {title || 'Editar Evento'}
          </Text>
          {isFetching
            ? <ActivityIndicator size="small" color="#8B5CF6" style={{ width: 36 }} />
            : <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
          }
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ─── Info básica ─── */}
            <SectionHeader title="Info básica" expanded={sections.info} onToggle={() => toggleSection('info')} />
            {sections.info && (
              <View style={styles.sectionBody}>
                <Text style={styles.label}>Título</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título del evento" placeholderTextColor="#4B5563" />

                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descripción..."
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Categoría</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="ej. música, deporte..." placeholderTextColor="#4B5563" />

                <Text style={styles.label}>Subcategoría</Text>
                <TextInput style={styles.input} value={subcategory} onChangeText={setSubcategory} placeholder="ej. concierto, torneo..." placeholderTextColor="#4B5563" />

                <Text style={styles.label}>Organizador</Text>
                <TextInput style={styles.input} value={organizer} onChangeText={setOrganizer} placeholder="Nombre del organizador" placeholderTextColor="#4B5563" />

                <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-03-15" placeholderTextColor="#4B5563" />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Hora inicio</Text>
                    <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="19:00" placeholderTextColor="#4B5563" />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Hora fin</Text>
                    <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="22:00" placeholderTextColor="#4B5563" />
                  </View>
                </View>

                <Text style={styles.label}>Ubicación</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Dirección o lugar" placeholderTextColor="#4B5563" />
              </View>
            )}

            {/* ─── Imagen ─── */}
            <SectionHeader title="Imagen" expanded={sections.media} onToggle={() => toggleSection('media')} />
            {sections.media && (
              <View style={styles.sectionBody}>
                {imageUrl ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.imageRemove} onPress={() => setImageUrl('')}>
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <Text style={styles.label}>URL de imagen</Text>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://..."
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  keyboardType="url"
                />

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? <ActivityIndicator size="small" color="#8B5CF6" />
                    : <Ionicons name="cloud-upload-outline" size={18} color="#8B5CF6" />
                  }
                  <Text style={styles.addButtonText}>
                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Precios y registro ─── */}
            <SectionHeader title="Precios y registro" expanded={sections.pricing} onToggle={() => toggleSection('pricing')} />
            {sections.pricing && (
              <View style={styles.sectionBody}>
                <Text style={styles.label}>Precio (GTQ)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#4B5563"
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Banco</Text>
                <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Nombre del banco" placeholderTextColor="#4B5563" />

                <Text style={styles.label}>Número de cuenta</Text>
                <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} placeholder="000-000-000" placeholderTextColor="#4B5563" />

                <Text style={styles.label}>URL formulario de registro</Text>
                <TextInput
                  style={styles.input}
                  value={registrationFormUrl}
                  onChangeText={setRegistrationFormUrl}
                  placeholder="https://forms.gle/..."
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            )}

            {/* ─── Avanzado ─── */}
            <SectionHeader title="Avanzado" expanded={sections.advanced} onToggle={() => toggleSection('advanced')} />
            {sections.advanced && (
              <View style={styles.sectionBody}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Requiere check de asistencia</Text>
                  </View>
                  <Switch
                    value={requiresAttendance}
                    onValueChange={setRequiresAttendance}
                    trackColor={{ false: '#374151', true: '#7C3AED' }}
                    thumbColor={requiresAttendance ? '#A78BFA' : '#9CA3AF'}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Evento recurrente</Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#374151', true: '#7C3AED' }}
                    thumbColor={isRecurring ? '#A78BFA' : '#9CA3AF'}
                  />
                </View>

                {isRecurring && (
                  <>
                    <Text style={styles.label}>Fechas recurrentes (separadas por coma)</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={recurringDates}
                      onChangeText={setRecurringDates}
                      placeholder="2026-03-01, 2026-03-08, ..."
                      placeholderTextColor="#4B5563"
                      multiline
                    />
                  </>
                )}

                <Text style={styles.label}>Tags (separados por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="familia, música, gratis..."
                  placeholderTextColor="#4B5563"
                />

                <Text style={styles.label}>Público objetivo (separados por coma)</Text>
                <TextInput
                  style={styles.input}
                  value={targetAudience}
                  onChangeText={setTargetAudience}
                  placeholder="adultos, jóvenes, niños..."
                  placeholderTextColor="#4B5563"
                />
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Save button */}
        <View style={styles.sheetFooter}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonLoading]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            }
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>

        <AnimatedToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={2500}
          onHide={() => setToastVisible(false)}
        />
      </Animated.View>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>¿Eliminar evento?</Text>
            <Text style={styles.confirmSubtitle}>
              Esta acción es irreversible. Se eliminarán también los registros, guardados y asistencias.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, isDeleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.confirmDeleteText}>Eliminar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EventosAdminScreen() {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data || []) as Event[]);
    } catch (err: any) {
      console.error('[EventosAdmin] fetch error:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = search.trim()
    ? events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    : events;

  const handleOpenEdit = (item: Event) => {
    setSelectedEvent(item);
    setSheetVisible(true);
  };

  const handleClose = () => {
    setSheetVisible(false);
    setTimeout(() => setSelectedEvent(null), 350);
  };

  const handleSaved = (updated: Event) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleted = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <BlurView intensity={60} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eventos Admin</Text>
        <TouchableOpacity onPress={fetchEvents} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={22} color="#8B5CF6" />
        </TouchableOpacity>
      </BlurView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título..."
          placeholderTextColor="#4B5563"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} eventos</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <EventAdminRow item={item} index={index} onPress={() => handleOpenEdit(item)} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color="#374151" />
              <Text style={styles.emptyText}>No se encontraron eventos</Text>
            </View>
          }
        />
      )}

      <EditSheet
        event={selectedEvent}
        visible={sheetVisible}
        onClose={handleClose}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F0F0F' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(139,92,246,0.12)',
    backgroundColor: 'rgba(15,15,25,0.85)',
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', color: '#FFFFFF',
    fontSize: 17, fontWeight: '700', letterSpacing: 0.3,
  },
  refreshButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16,
    backgroundColor: 'rgba(30,30,40,0.8)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, padding: 0 },

  countRow: { paddingHorizontal: 16, marginBottom: 8 },
  countText: {
    color: '#6B7280', fontSize: 12, fontWeight: '500',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },

  listContent: { paddingHorizontal: 16, paddingTop: 4 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30,30,40,0.6)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
    marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10,
    gap: 10,
  },
  rowThumb: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rowThumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
  },
  rowLeft: { flex: 1 },
  rowTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  rowMeta: { color: '#6B7280', fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  emptyText: { color: '#6B7280', fontSize: 14, marginTop: 8 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: '#111118',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1, textAlign: 'center',
    color: '#FFFFFF', fontSize: 16, fontWeight: '700',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetScroll: { flex: 1, paddingHorizontal: 16 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)', marginTop: 4,
  },
  sectionHeaderText: { color: '#E5E7EB', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  sectionBody: { paddingVertical: 12, gap: 4 },

  label: {
    color: '#9CA3AF', fontSize: 12, fontWeight: '500',
    marginBottom: 6, marginTop: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: '#FFFFFF', fontSize: 14,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-start' },

  imagePreviewContainer: { position: 'relative', marginBottom: 8 },
  imagePreview: {
    width: '100%', height: 160, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  imageRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#111118', borderRadius: 12 },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, marginTop: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  switchLabel: { color: '#E5E7EB', fontSize: 14, fontWeight: '500' },

  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed',
    borderColor: 'rgba(139,92,246,0.4)',
    backgroundColor: 'rgba(139,92,246,0.06)', marginTop: 8,
  },
  addButtonText: { color: '#8B5CF6', fontSize: 14, fontWeight: '600' },

  sheetFooter: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 15,
  },
  saveButtonLoading: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  confirmSheet: {
    backgroundColor: '#111118', borderRadius: 16,
    padding: 24, width: '100%', maxWidth: 360, gap: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  confirmTitle: { color: '#F5F3FF', fontSize: 18, fontWeight: '800' },
  confirmSubtitle: { color: '#9CA3AF', fontSize: 13, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
  },
  confirmCancelText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  confirmDelete: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#EF4444', alignItems: 'center',
  },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

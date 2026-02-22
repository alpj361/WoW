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
import { ProcesionDB, PuntoReferencia, useProcesionStore } from '../src/store/procesionStore';
import { AnimatedToast } from '../src/components/AnimatedToast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Ciudad Badge ────────────────────────────────────────────────────────────

function CiudadBadge({ ciudad }: { ciudad: string | null }) {
  if (!ciudad) return null;
  const isAntigua = ciudad.toLowerCase().includes('antigua');
  return (
    <View style={[styles.badge, isAntigua ? styles.badgeAntigua : styles.badgeCiudad]}>
      <Text style={[styles.badgeText, isAntigua ? styles.badgeTextAntigua : styles.badgeTextCiudad]}>
        {isAntigua ? 'ANTIGUA' : 'CIUDAD'}
      </Text>
    </View>
  );
}

// ─── Animated Row ────────────────────────────────────────────────────────────

function ProcesionAdminRow({
  item,
  index,
  onPress,
}: {
  item: ProcesionDB;
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
        <View style={styles.rowLeft}>
          <Text style={styles.rowNombre} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={styles.rowMeta}>
            {item.fecha} {item.hora_salida ? `· ${item.hora_salida}` : ''}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <CiudadBadge ciudad={item.ciudad} />
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

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

// ─── Punto Row ───────────────────────────────────────────────────────────────

function PuntoRow({
  punto,
  index,
  onChangeLugar,
  onChangeHora,
  onRemove,
}: {
  punto: PuntoReferencia;
  index: number;
  onChangeLugar: (text: string) => void;
  onChangeHora: (text: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.puntoRow}>
      <View style={styles.puntoNumber}>
        <Text style={styles.puntoNumberText}>{index + 1}</Text>
      </View>
      <TextInput
        style={[styles.input, styles.puntoInputLugar]}
        value={punto.lugar}
        onChangeText={onChangeLugar}
        placeholder="Lugar"
        placeholderTextColor="#4B5563"
      />
      <TextInput
        style={[styles.input, styles.puntoInputHora]}
        value={punto.hora}
        onChangeText={onChangeHora}
        placeholder="HH:MM"
        placeholderTextColor="#4B5563"
      />
      <TouchableOpacity onPress={onRemove} style={styles.puntoRemove}>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Image Thumbnail ─────────────────────────────────────────────────────────

function ImageThumb({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: () => void;
}) {
  return (
    <View style={styles.thumbContainer}>
      <Image source={{ uri }} style={styles.thumb} />
      <TouchableOpacity style={styles.thumbRemove} onPress={onRemove}>
        <Ionicons name="close-circle" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Edit Sheet ──────────────────────────────────────────────────────────────

interface EditSheetProps {
  procesion: ProcesionDB | null;
  visible: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSaved: (updated: ProcesionDB) => void;
  onCreated: (created: ProcesionDB) => void;
}

function EditSheet({ procesion, visible, isCreating, onClose, onSaved, onCreated }: EditSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Local form state
  const [nombre, setNombre] = useState('');
  const [iglesia, setIglesia] = useState('');
  const [ciudad, setCiudad] = useState<'Ciudad de Guatemala' | 'Antigua Guatemala' | ''>('');
  const [tipoProcesion, setTipoProcesion] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [lugarSalida, setLugarSalida] = useState('');
  const [puntosRef, setPuntosRef] = useState<PuntoReferencia[]>([]);
  const [imagenesProcession, setImagenesProcession] = useState<string[]>([]);
  const [imagenesRecorrido, setImagenesRecorrido] = useState<string[]>([]);
  const [liveUrl, setLiveUrl] = useState('');
  const [recorridoUrl, setRecorridoUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [uploadingType, setUploadingType] = useState<'procesion' | 'recorrido' | null>(null);
  const [sections, setSections] = useState({
    info: true,
    puntos: false,
    imagenes: false,
    recorrido: false,
    urls: false,
  });

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const populateForm = (p: ProcesionDB) => {
    setNombre(p.nombre || '');
    setIglesia(p.iglesia || '');
    setCiudad((p.ciudad as any) || '');
    setTipoProcesion(p.tipo_procesion || '');
    setFecha(p.fecha || '');
    setHoraSalida(p.hora_salida || '');
    setHoraEntrada(p.hora_entrada || '');
    setLugarSalida(p.lugar_salida || '');
    setPuntosRef(p.puntos_referencia ? [...p.puntos_referencia] : []);
    setImagenesProcession(p.imagenes_procesion ? [...p.imagenes_procesion] : []);
    setImagenesRecorrido(p.imagenes_recorrido ? [...p.imagenes_recorrido] : []);
    setLiveUrl(p.live_tracking_url || '');
    setRecorridoUrl(p.recorrido_maps_url || '');
    setFacebookUrl(p.facebook_url || '');
  };

  // On open: reset form (create mode) or fetch fresh data (edit mode)
  useEffect(() => {
    if (!visible) return;

    if (isCreating) {
      // Reset all fields to blank
      setNombre(''); setIglesia(''); setCiudad(''); setTipoProcesion('');
      setFecha(''); setHoraSalida(''); setHoraEntrada(''); setLugarSalida('');
      setPuntosRef([]); setImagenesProcession([]); setImagenesRecorrido([]);
      setLiveUrl(''); setRecorridoUrl(''); setFacebookUrl('');
      return;
    }

    if (!procesion?.id) return;

    setIsFetching(true);
    populateForm(procesion);

    supabase
      .from('procesiones')
      .select('*')
      .eq('id', procesion.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) populateForm(data as ProcesionDB);
      })
      .finally(() => setIsFetching(false));
  }, [visible, isCreating, procesion?.id]);

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddPunto = () => {
    setPuntosRef(prev => [...prev, { lugar: '', hora: '' }]);
  };

  const handleUpdatePuntoLugar = (index: number, text: string) => {
    setPuntosRef(prev => prev.map((p, i) => i === index ? { ...p, lugar: text } : p));
  };

  const handleUpdatePuntoHora = (index: number, text: string) => {
    setPuntosRef(prev => prev.map((p, i) => i === index ? { ...p, hora: text } : p));
  };

  const handleRemovePunto = (index: number) => {
    setPuntosRef(prev => prev.filter((_, i) => i !== index));
  };

  const handlePickImage = async (type: 'procesion' | 'recorrido') => {
    if (!procesion) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingType(type);

    try {
      // Derive extension from mimeType or fileName — never from the URI,
      // because on web asset.uri is a blob: URL with no file extension.
      let ext = 'jpg';
      if (asset.mimeType) {
        ext = asset.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      } else if (asset.fileName) {
        ext = asset.fileName.split('.').pop() || 'jpg';
      }
      const fileName = `${procesion.id}/${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const contentType = blob.type || asset.mimeType || `image/${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('procesiones')
        .upload(fileName, blob, { contentType });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('procesiones').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      if (type === 'procesion') {
        setImagenesProcession(prev => [...prev, publicUrl]);
      } else {
        setImagenesRecorrido(prev => [...prev, publicUrl]);
      }

      showToastMsg('Imagen subida');
    } catch (err: any) {
      showToastMsg(err?.message || 'Error al subir imagen', 'error');
    } finally {
      setUploadingType(null);
    }
  };

  const handleRemoveImagenProcesion = (index: number) => {
    setImagenesProcession(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveImagenRecorrido = (index: number) => {
    setImagenesRecorrido(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isCreating && !procesion) return;
    if (!nombre.trim()) { showToastMsg('El nombre es requerido', 'error'); return; }
    if (!fecha.trim()) { showToastMsg('La fecha es requerida', 'error'); return; }

    setIsSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        iglesia: iglesia.trim() || null,
        ciudad: ciudad || null,
        tipo_procesion: tipoProcesion.trim() || null,
        fecha: fecha.trim(),
        hora_salida: horaSalida.trim() || null,
        hora_entrada: horaEntrada.trim() || null,
        lugar_salida: lugarSalida.trim() || null,
        puntos_referencia: puntosRef.filter(p => p.lugar.trim()),
        imagenes_procesion: imagenesProcession,
        imagenes_recorrido: imagenesRecorrido,
        live_tracking_url: liveUrl.trim() || null,
        recorrido_maps_url: recorridoUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from('procesiones')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        onCreated(data as ProcesionDB);
        showToastMsg('Procesión creada');
        onClose();
      } else {
        const { error } = await supabase
          .from('procesiones')
          .update(payload)
          .eq('id', procesion!.id);

        if (error) throw error;
        onSaved({ ...procesion!, ...payload } as ProcesionDB);
        showToastMsg('Guardado exitosamente');
      }
    } catch (err: any) {
      showToastMsg(err?.message || 'Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible && !procesion) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + 16 }]}>
        {/* Sheet Header */}
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <Ionicons name="close" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {isCreating ? 'Nueva Procesión' : (nombre || 'Editar Procesión')}
          </Text>
          {isFetching
            ? <ActivityIndicator size="small" color="#8B5CF6" style={{ width: 36 }} />
            : <View style={{ width: 36 }} />
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
            {/* ─── Sección 1: Info básica ─── */}
            <SectionHeader
              title="Info básica"
              expanded={sections.info}
              onToggle={() => toggleSection('info')}
            />
            {sections.info && (
              <View style={styles.sectionBody}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre de la procesión"
                  placeholderTextColor="#4B5563"
                />

                <Text style={styles.label}>Iglesia / Templo</Text>
                <TextInput
                  style={styles.input}
                  value={iglesia}
                  onChangeText={setIglesia}
                  placeholder="Nombre del templo"
                  placeholderTextColor="#4B5563"
                />

                <Text style={styles.label}>Ciudad</Text>
                <View style={styles.pillRow}>
                  <TouchableOpacity
                    style={[styles.pill, ciudad === 'Ciudad de Guatemala' && styles.pillActive]}
                    onPress={() => setCiudad('Ciudad de Guatemala')}
                  >
                    <Text style={[styles.pillText, ciudad === 'Ciudad de Guatemala' && styles.pillTextActive]}>
                      Ciudad de Guatemala
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pill, ciudad === 'Antigua Guatemala' && styles.pillActiveOrange]}
                    onPress={() => setCiudad('Antigua Guatemala')}
                  >
                    <Text style={[styles.pillText, ciudad === 'Antigua Guatemala' && styles.pillTextActiveOrange]}>
                      Antigua Guatemala
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Tipo de procesión</Text>
                <TextInput
                  style={styles.input}
                  value={tipoProcesion}
                  onChangeText={setTipoProcesion}
                  placeholder="ej. Jesús Nazareno, Virgen..."
                  placeholderTextColor="#4B5563"
                />

                <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="2026-02-17"
                  placeholderTextColor="#4B5563"
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Hora salida</Text>
                    <TextInput
                      style={styles.input}
                      value={horaSalida}
                      onChangeText={setHoraSalida}
                      placeholder="08:00"
                      placeholderTextColor="#4B5563"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Hora entrada</Text>
                    <TextInput
                      style={styles.input}
                      value={horaEntrada}
                      onChangeText={setHoraEntrada}
                      placeholder="21:00"
                      placeholderTextColor="#4B5563"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Lugar de salida</Text>
                <TextInput
                  style={styles.input}
                  value={lugarSalida}
                  onChangeText={setLugarSalida}
                  placeholder="Parroquia de San Sebastián"
                  placeholderTextColor="#4B5563"
                />
              </View>
            )}

            {/* ─── Sección 2: Puntos de referencia ─── */}
            <SectionHeader
              title={`Puntos de referencia (${puntosRef.length})`}
              expanded={sections.puntos}
              onToggle={() => toggleSection('puntos')}
            />
            {sections.puntos && (
              <View style={styles.sectionBody}>
                {puntosRef.map((punto, i) => (
                  <PuntoRow
                    key={i}
                    punto={punto}
                    index={i}
                    onChangeLugar={text => handleUpdatePuntoLugar(i, text)}
                    onChangeHora={text => handleUpdatePuntoHora(i, text)}
                    onRemove={() => handleRemovePunto(i)}
                  />
                ))}
                <TouchableOpacity style={styles.addButton} onPress={handleAddPunto}>
                  <Ionicons name="add" size={18} color="#8B5CF6" />
                  <Text style={styles.addButtonText}>Agregar punto</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Sección 3: Imágenes de procesión ─── */}
            <SectionHeader
              title={`Imágenes de procesión (${imagenesProcession.length})`}
              expanded={sections.imagenes}
              onToggle={() => toggleSection('imagenes')}
            />
            {sections.imagenes && (
              <View style={styles.sectionBody}>
                <View style={styles.thumbGrid}>
                  {imagenesProcession.map((uri, i) => (
                    <ImageThumb
                      key={i}
                      uri={uri}
                      onRemove={() => handleRemoveImagenProcesion(i)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handlePickImage('procesion')}
                  disabled={uploadingType === 'procesion'}
                >
                  {uploadingType === 'procesion' ? (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  ) : (
                    <Ionicons name="image-outline" size={18} color="#8B5CF6" />
                  )}
                  <Text style={styles.addButtonText}>
                    {uploadingType === 'procesion' ? 'Subiendo...' : 'Añadir imagen'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Sección 4: Imagen de recorrido ─── */}
            <SectionHeader
              title={`Imágenes de recorrido (${imagenesRecorrido.length})`}
              expanded={sections.recorrido}
              onToggle={() => toggleSection('recorrido')}
            />
            {sections.recorrido && (
              <View style={styles.sectionBody}>
                <View style={styles.thumbGrid}>
                  {imagenesRecorrido.map((uri, i) => (
                    <ImageThumb
                      key={i}
                      uri={uri}
                      onRemove={() => handleRemoveImagenRecorrido(i)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handlePickImage('recorrido')}
                  disabled={uploadingType === 'recorrido'}
                >
                  {uploadingType === 'recorrido' ? (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  ) : (
                    <Ionicons name="map-outline" size={18} color="#8B5CF6" />
                  )}
                  <Text style={styles.addButtonText}>
                    {uploadingType === 'recorrido' ? 'Subiendo...' : 'Añadir recorrido'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Sección 5: URLs externas ─── */}
            <SectionHeader
              title="URLs externas"
              expanded={sections.urls}
              onToggle={() => toggleSection('urls')}
            />
            {sections.urls && (
              <View style={styles.sectionBody}>
                <Text style={styles.label}>Live tracking URL</Text>
                <TextInput
                  style={styles.input}
                  value={liveUrl}
                  onChangeText={setLiveUrl}
                  placeholder="https://..."
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  keyboardType="url"
                />

                <Text style={styles.label}>Recorrido Maps URL</Text>
                <TextInput
                  style={styles.input}
                  value={recorridoUrl}
                  onChangeText={setRecorridoUrl}
                  placeholder="https://maps.google.com/..."
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  keyboardType="url"
                />

                <Text style={styles.label}>Facebook URL</Text>
                <TextInput
                  style={styles.input}
                  value={facebookUrl}
                  onChangeText={setFacebookUrl}
                  placeholder="https://facebook.com/..."
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            )}

            {/* Spacing at bottom */}
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
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : isCreating ? 'Crear procesión' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toast */}
        <AnimatedToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={2500}
          onHide={() => setToastVisible(false)}
        />
      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProcesionesAdminScreen() {
  const insets = useSafeAreaInsets();
  const {
    procesiones: storeData,
    isLoading,
    fetchProcesiones,
  } = useProcesionStore();

  const [search, setSearch] = useState('');
  const [localData, setLocalData] = useState<ProcesionDB[]>([]);
  const [selectedProcesion, setSelectedProcesion] = useState<ProcesionDB | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Cargar todas las procesiones (sin filtro de ciudad ni holiday)
  useEffect(() => {
    fetchProcesiones();
  }, []);

  // Sincronizar datos del store con localData (para poder editar localmente)
  useEffect(() => {
    setLocalData(storeData);
  }, [storeData]);

  const filtered = search.trim()
    ? localData.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : localData;

  const handleOpenEdit = (item: ProcesionDB) => {
    setSelectedProcesion(item);
    setSheetVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedProcesion(null);
    setIsCreating(true);
    setSheetVisible(true);
  };

  const handleClose = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setSelectedProcesion(null);
      setIsCreating(false);
    }, 350);
  };

  const handleSaved = (updated: ProcesionDB) => {
    setLocalData(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleCreated = (created: ProcesionDB) => {
    setLocalData(prev => [created, ...prev]);
  };

  const renderItem = ({ item, index }: { item: ProcesionDB; index: number }) => (
    <ProcesionAdminRow
      item={item}
      index={index}
      onPress={() => handleOpenEdit(item)}
    />
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Glass Header */}
      <BlurView intensity={60} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Procesiones Admin</Text>
        <TouchableOpacity onPress={() => fetchProcesiones()} style={styles.refreshButton}>
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
          placeholder="Buscar por nombre..."
          placeholderTextColor="#4B5563"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count badge */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} procesiones</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando procesiones...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search" size={48} color="#374151" />
              <Text style={styles.emptyText}>No se encontraron procesiones</Text>
            </View>
          }
        />
      )}

      {/* FAB — Create new procesion */}
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={handleOpenCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Edit / Create sheet */}
      <EditSheet
        procesion={selectedProcesion}
        visible={sheetVisible}
        isCreating={isCreating}
        onClose={handleClose}
        onSaved={handleSaved}
        onCreated={handleCreated}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.12)',
    backgroundColor: 'rgba(15,15,25,0.85)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: 'rgba(30,30,40,0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
  },

  // Count
  countRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,40,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  rowLeft: {
    flex: 1,
    marginRight: 8,
  },
  rowNombre: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  rowMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeCiudad: {
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  badgeAntigua: {
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeTextCiudad: {
    color: '#A78BFA',
  },
  badgeTextAntigua: {
    color: '#FB923C',
  },

  // Loading / empty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },

  // Sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: '#111118',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  sectionHeaderText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sectionBody: {
    paddingVertical: 12,
    gap: 4,
  },

  // Form inputs
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  pillActiveOrange: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  pillText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#A78BFA',
    fontWeight: '600',
  },
  pillTextActiveOrange: {
    color: '#FB923C',
    fontWeight: '600',
  },

  // Puntos
  puntoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  puntoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoNumberText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
  },
  puntoInputLugar: {
    flex: 2,
  },
  puntoInputHora: {
    flex: 1,
  },
  puntoRemove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Image grid
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  thumbContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'visible',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#111118',
    borderRadius: 12,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139,92,246,0.4)',
    backgroundColor: 'rgba(139,92,246,0.06)',
    marginTop: 4,
  },
  addButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },

  // Sheet footer
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 15,
  },
  saveButtonLoading: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

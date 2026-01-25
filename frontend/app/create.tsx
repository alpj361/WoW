import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEventStore } from '../src/store/eventStore';
import { router } from 'expo-router';
import { analyzeImage, analyzeUrl } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

const categories = [
  { id: 'music', label: 'Música & Cultura', icon: 'musical-notes', color: '#8B5CF6' },
  { id: 'volunteer', label: 'Voluntariado', icon: 'heart', color: '#EC4899' },
  { id: 'general', label: 'General', icon: 'fast-food', color: '#F59E0B' },
];

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const { createEvent } = useEventStore();

  const { user, profile } = useAuth();

  // Check if user has permission to use URL feature (admin, alpha, or beta)
  const showUrlOption = React.useMemo(() => {
    const role = profile?.role?.toLowerCase() || '';
    return ['admin', 'alpha', 'beta'].includes(role);
  }, [profile]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Payment & Registration fields
  const [price, setPrice] = useState('');
  const [registrationFormUrl, setRegistrationFormUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Picker visibility state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // URL Modal state
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  // Format date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-MX', options);
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for storage (YYYY-MM-DD)
  const formatDateForStorage = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Format time for storage (HH:MM)
  const formatTimeForStorage = (date: Date): string => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && date) {
      setSelectedTime(date);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(image, title);

      if (result.success && result.analysis) {
        const { analysis } = result;

        // Auto-fill fields
        setTitle(analysis.event_name || title);
        setDescription(analysis.description || description);
        setLocation(analysis.location || location);

        // Parse Date
        if (analysis.date) {
          // Try to parse date strings like "20-10" (DD-MM) or "2023-10-20"
          let parsedDate = new Date();
          const dateParts = analysis.date.split(/[-/]/);

          if (dateParts.length === 3) {
            // YYYY-MM-DD
            parsedDate = new Date(analysis.date);
          } else if (dateParts.length === 2) {
            // DD-MM, assume current year
            const currentYear = new Date().getFullYear();
            // Check if parsing as DD-MM
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
            parsedDate.setFullYear(currentYear);
            parsedDate.setMonth(month);
            parsedDate.setDate(day);
          }
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
          }
        }

        // Parse Time
        if (analysis.time) {
          // Format "HH:MM"
          const timeParts = analysis.time.split(':');
          if (timeParts.length >= 2) {
            const parsedTime = new Date();
            parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            setSelectedTime(parsedTime);
          }
        }

        Alert.alert('¡Análisis Completado!', 'Hemos llenado los campos con la información detectada.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'No pudimos analizar la imagen. Intenta llenar los datos manualmente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!postUrl.trim()) return;

    setIsExtractingUrl(true);
    try {
      const result = await analyzeUrl(postUrl.trim());

      if (result.success) {
        // Set extracted image
        setImage(result.extracted_image_url);

        // Auto-fill form fields
        if (result.analysis) {
          setTitle(result.analysis.event_name || title);
          setDescription(result.analysis.description || description);
          setLocation(result.analysis.location || location);

          // Parse Date
          if (result.analysis.date && result.analysis.date !== 'No especificado') {
            let parsedDate = new Date();
            const dateParts = result.analysis.date.split(/[-/]/);
            if (dateParts.length === 3) {
              parsedDate = new Date(result.analysis.date);
            } else if (dateParts.length === 2) {
              const currentYear = new Date().getFullYear();
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1;
              parsedDate.setFullYear(currentYear);
              parsedDate.setMonth(month);
              parsedDate.setDate(day);
            }
            if (!isNaN(parsedDate.getTime())) {
              setSelectedDate(parsedDate);
            }
          }

          // Parse Time
          if (result.analysis.time && result.analysis.time !== 'No especificado') {
            const timeParts = result.analysis.time.split(':');
            if (timeParts.length >= 2) {
              const parsedTime = new Date();
              parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
              setSelectedTime(parsedTime);
            }
          }
        }

        setShowUrlModal(false);
        setPostUrl('');
        Alert.alert('¡Listo!', 'Hemos extraído la imagen y llenado los campos detectados.');
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      const errorMessage = error.response?.data?.error || 'No pudimos extraer el contenido del post. Verifica la URL.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el evento.');
      return;
    }

    // Validate payment fields if price > 0 (only for host events)
    const priceNum = parseFloat(price);
    if (priceNum > 0 && isHost) {
      if (!bankName.trim() || !bankAccountNumber.trim()) {
        Alert.alert('Error', 'Por favor completa la información bancaria para eventos de pago.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        date: selectedDate ? formatDateForStorage(selectedDate) : null,
        time: selectedTime ? formatTimeForStorage(selectedTime) : null,
        location: location.trim() || null,
        image,
        user_id: isHost ? user?.id : null,
        // Price and registration fields available for all events
        price: price && priceNum > 0 ? priceNum : null,
        registration_form_url: registrationFormUrl.trim() ? registrationFormUrl.trim() : null,
        bank_name: priceNum > 0 && bankName.trim() ? bankName.trim() : null,
        bank_account_number: priceNum > 0 && bankAccountNumber.trim() ? bankAccountNumber.trim() : null,
      });
      // Reset form and navigate to events
      setTitle('');
      setDescription('');
      setCategory('general');
      setSelectedDate(null);
      setSelectedTime(null);
      setLocation('');
      setImage(null);
      setIsHost(false);
      setPrice('');
      setRegistrationFormUrl('');
      setBankName('');
      setBankAccountNumber('');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el evento. Intenta de nuevo.');
    }
    setIsSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear Evento</Text>
          <Text style={styles.subtitle}>Comparte tu evento con la comunidad</Text>
        </View>

        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.previewImage} />

              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyzeImage}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.analyzeButtonText}>Analizar Flyer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#8B5CF6" />
                <Text style={styles.uploadText}>Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#8B5CF6" />
                <Text style={styles.uploadText}>Galería</Text>
              </TouchableOpacity>

              {showUrlOption && (
                <TouchableOpacity style={styles.uploadButton} onPress={() => setShowUrlModal(true)}>
                  <View style={styles.experimentalBadge}>
                    <Ionicons name="flask" size={12} color="#fff" />
                  </View>
                  <Ionicons name="link" size={32} color="#8B5CF6" />
                  <Text style={styles.uploadText}>Desde URL</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && { backgroundColor: cat.color },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={24}
                  color={category === cat.id ? '#fff' : cat.color}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Evento</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del evento"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cuéntanos sobre tu evento"
              placeholderTextColor="#6B7280"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Fecha</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.pickerButton}>
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                  <input
                    type="date"
                    value={selectedDate ? formatDateForStorage(selectedDate) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(new Date(e.target.value + 'T12:00:00'));
                      }
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: selectedDate ? '#fff' : '#6B7280',
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                  <Text style={selectedDate ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedDate ? formatDate(selectedDate) : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Hora</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.pickerButton}>
                  <Ionicons name="time" size={20} color="#8B5CF6" />
                  <input
                    type="time"
                    value={selectedTime ? formatTimeForStorage(selectedTime) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        setSelectedTime(date);
                      }
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: selectedTime ? '#fff' : '#6B7280',
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color="#8B5CF6" />
                  <Text style={selectedTime ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedTime ? formatTime(selectedTime) : 'Seleccionar hora'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ubicación</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Dónde será?"
              placeholderTextColor="#6B7280"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Payment & Registration Fields - Available for all events */}
          <View style={styles.divider} />
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Registro y Pago (Opcional)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Precio de Entrada (Q)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              value={price}
              onChangeText={(text) => {
                // Only allow numbers and decimal point
                const cleaned = text.replace(/[^0-9.]/g, '');
                // Allow only one decimal point
                const parts = cleaned.split('.');
                if (parts.length > 2) return;
                setPrice(cleaned);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputHint}>
              Deja en 0 o vacío si el evento es gratuito
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL del Formulario de Registro</Text>
            <TextInput
              style={styles.input}
              placeholder="https://forms.google.com/..."
              placeholderTextColor="#6B7280"
              value={registrationFormUrl}
              onChangeText={setRegistrationFormUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.inputHint}>
              Opcional: Google Forms, Typeform, etc.
            </Text>
          </View>

          {/* Bank info - only show if price > 0 AND isHost */}
          {parseFloat(price) > 0 && isHost && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Banco *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Banco Industrial, BAM, etc."
                  placeholderTextColor="#6B7280"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Cuenta *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Número de cuenta bancaria"
                  placeholderTextColor="#6B7280"
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  keyboardType="number-pad"
                />
                <Text style={styles.inputHint}>
                  Los usuarios enviarán el comprobante de pago aquí
                </Text>
              </View>
            </>
          )}

          {/* Host Toggle - Moved to bottom */}
          <View style={styles.divider} />
          <View style={styles.hostToggleContainer}>
            <View style={styles.hostToggleInfo}>
              <Ionicons name="person-circle" size={24} color="#8B5CF6" />
              <View>
                <Text style={styles.hostToggleTitle}>Soy el Anfitrión</Text>
                <Text style={styles.hostToggleSubtitle}>
                  Gestiona las solicitudes de registro
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, isHost && styles.toggleButtonActive]}
              onPress={() => setIsHost(!isHost)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleKnob, isHost && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!title.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Publicar Evento</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Date Picker Modal (iOS) */}
      {
        Platform.OS === 'ios' && showDatePicker && (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <Pressable
                style={styles.pickerModalDismiss}
                onPress={() => setShowDatePicker(false)}
              />
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Seleccionar Fecha</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerModalDone}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  locale="es-MX"
                  textColor="#fff"
                />
              </View>
            </View>
          </Modal>
        )
      }

      {/* Time Picker Modal (iOS) */}
      {
        Platform.OS === 'ios' && showTimePicker && (
          <Modal
            transparent
            animationType="slide"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <Pressable
                style={styles.pickerModalDismiss}
                onPress={() => setShowTimePicker(false)}
              />
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Seleccionar Hora</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerModalDone}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  locale="es-MX"
                  textColor="#fff"
                />
              </View>
            </View>
          </Modal>
        )
      }

      {/* Android Date Picker */}
      {
        Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )
      }

      {/* Android Time Picker */}
      {
        Platform.OS === 'android' && showTimePicker && (
          <DateTimePicker
            value={selectedTime || new Date()}
            mode="time"
            display="default"
            onChange={onTimeChange}
            is24Hour={false}
          />
        )
      }

      {/* URL Input Modal */}
      <Modal
        visible={showUrlModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable
            style={styles.pickerModalDismiss}
            onPress={() => setShowUrlModal(false)}
          />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Agregar desde Instagram</Text>
              <TouchableOpacity onPress={() => setShowUrlModal(false)}>
                <Text style={styles.pickerModalDone}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.inputLabel}>URL del Post de Instagram</Text>
              <TextInput
                style={styles.input}
                placeholder="https://instagram.com/p/ABC123..."
                placeholderTextColor="#6B7280"
                value={postUrl}
                onChangeText={setPostUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { marginTop: 16 },
                  (!postUrl.trim() || isExtractingUrl) && styles.submitButtonDisabled
                ]}
                onPress={handleAnalyzeUrl}
                disabled={!postUrl.trim() || isExtractingUrl}
              >
                {isExtractingUrl ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Extraer y Analizar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  imageSection: {
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    height: 120,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  analyzeButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  experimentalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 4,
    zIndex: 10,
  },
  categoryButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  hostToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  hostToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hostToggleSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  pickerText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  pickerModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerModalDone: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerModalDismiss: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});

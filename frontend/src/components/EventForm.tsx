import React, { useState, useEffect } from 'react';
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
    Linking,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEventStore } from '../store/eventStore';
import { router } from 'expo-router';
import { analyzeImage, analyzeExtractedImage, uploadImageBase64, uploadImageFromUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useExtractionStore } from '../store/extractionStore';
import { useDraftStore, DraftFormData } from '../store/draftStore';
import { processRecurringDates } from '../utils/dateUtils';
import AudienceSelector from './AudienceSelector';
import SubcategorySelector from './SubcategorySelector';
import TagSelector from './TagSelector';

// Define the interface for the component props
export interface EventFormProps {
    initialData?: any;
    eventId?: string; // If provided, form is in edit mode
    onSuccess?: () => void;
    onCancel?: () => void;
    isModal?: boolean; // To adjust styles/behavior if needed
}

export const categories = [
    { id: 'music', label: 'Música & Cultura', icon: 'musical-notes', color: '#8B5CF6' },
    { id: 'volunteer', label: 'Voluntariado', icon: 'heart', color: '#EC4899' },
    { id: 'general', label: 'General', icon: 'fast-food', color: '#F59E0B' },
];

export default function EventForm({ initialData, eventId, onSuccess, onCancel, isModal = false }: EventFormProps) {
    const insets = useSafeAreaInsets();
    const { createEvent, updateEvent } = useEventStore();
    const isEditMode = !!eventId;
    const { user, profile } = useAuth();
    const { queueExtraction } = useExtractionStore();
    const { saveDraft, updateDraft } = useDraftStore();

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
    const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
    const [location, setLocation] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    // Payment & Registration fields
    const [price, setPrice] = useState('');
    const [registrationFormUrl, setRegistrationFormUrl] = useState('');
    const [reservationContact, setReservationContact] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');

    // Attendance tracking
    const [requiresAttendance, setRequiresAttendance] = useState(false);

    // Target audience
    const [targetAudience, setTargetAudience] = useState<string[]>(['audiencia:general']);

    // Subcategory, tags, event features (alpha)
    const [subcategory, setSubcategory] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [eventFeatures, setEventFeatures] = useState<Record<string, string>>({});

    // Draft state
    const [draftId, setDraftId] = useState<string | null>(null);
    const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

    // Picker visibility state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showRecurringDatePicker, setShowRecurringDatePicker] = useState(false);
    const [recurringDates, setRecurringDates] = useState<Date[]>([]);

    // URL Modal state
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [postUrl, setPostUrl] = useState('');

    // Image selector state (for carousels)
    const [showImageSelector, setShowImageSelector] = useState(false);
    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [pendingAnalysis, setPendingAnalysis] = useState<any>(null);

    // Zoom / fullscreen image modal
    const [showImageZoom, setShowImageZoom] = useState(false);

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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format time for storage (HH:MM)
    const formatTimeForStorage = (date: Date): string => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Initialize form with data
    useEffect(() => {
        console.log('EventForm: initialData changed', initialData);
        if (initialData) {
            if (initialData.title) setTitle(initialData.title);
            if (initialData.description) setDescription(initialData.description);
            if (initialData.category) setCategory(initialData.category);
            if (initialData.location) setLocation(initialData.location);
            if (initialData.organizer) setOrganizer(initialData.organizer);
            if (initialData.image) setImage(initialData.image);

            if (initialData.draftId) setDraftId(initialData.draftId);
            if (initialData.extraction_job_id) setExtractionJobId(initialData.extraction_job_id);
            if (initialData.source_image_url) setSourceImageUrl(initialData.source_image_url);

            if (initialData.price) setPrice(String(initialData.price));
            if (initialData.registration_form_url) setRegistrationFormUrl(initialData.registration_form_url);
            if (initialData.reservation_contact) setReservationContact(initialData.reservation_contact);

            // Handle recurring
            if (initialData.is_recurring === 'true' || initialData.is_recurring === true) {
                setIsRecurring(true);
                if (initialData.recurring_dates) {
                    try {
                        const dates = typeof initialData.recurring_dates === 'string'
                            ? JSON.parse(initialData.recurring_dates)
                            : initialData.recurring_dates;

                        if (Array.isArray(dates)) {
                            setRecurringDates(dates.map((d: string) => {
                                const parts = d.split(/[-/]/);
                                if (parts.length === 3) {
                                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                }
                                return new Date(d);
                            }).sort((a: Date, b: Date) => a.getTime() - b.getTime()));
                        }
                    } catch (e) {
                        console.error('Error parsing recurring dates', e);
                    }
                }
            }

            // Handle target audience
            if (initialData.target_audience) {
                try {
                    const audience = typeof initialData.target_audience === 'string'
                        ? JSON.parse(initialData.target_audience)
                        : initialData.target_audience;

                    if (Array.isArray(audience)) {
                        console.log('EventForm: Setting targetAudience from initialData', audience);
                        setTargetAudience(audience);
                    }
                } catch (e) {
                    console.log('EventForm: Error parsing targetAudience', e);
                    if (typeof initialData.target_audience === 'string' && !initialData.target_audience.startsWith('[')) {
                        setTargetAudience([initialData.target_audience]);
                    }
                }
            } else {
                console.log('EventForm: No target_audience in initialData');
            }

            // Handle subcategory and tags
            if (initialData.subcategory) setSubcategory(initialData.subcategory);
            if (initialData.tags) {
                try {
                    const tagsData = typeof initialData.tags === 'string' ? JSON.parse(initialData.tags) : initialData.tags;
                    if (Array.isArray(tagsData)) setTags(tagsData);
                } catch (e) {
                    console.error('Error parsing tags', e);
                }
            }

            // Handle event features
            if (initialData.event_features && typeof initialData.event_features === 'object') {
                setEventFeatures(initialData.event_features);
            }

            // Handle date
            if (initialData.date && initialData.date !== 'No especificado') {
                let parsedDate = new Date();
                const dateParts = initialData.date.split(/[-/]/);
                if (dateParts.length === 3) {
                    // Manual parsing to avoid UTC conversion (which shifts date back 1 day in Western Hemisphere)
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed
                    const day = parseInt(dateParts[2]);
                    parsedDate = new Date(year, month, day);
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

            // Handle time
            if (initialData.time && initialData.time !== 'No especificado') {
                const timeParts = initialData.time.split(':');
                if (timeParts.length >= 2) {
                    const parsedTime = new Date();
                    parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                    setSelectedTime(parsedTime);
                }
            }

            // Handle end time
            if (initialData.end_time && initialData.end_time !== 'No especificado') {
                const timeParts = initialData.end_time.split(':');
                if (timeParts.length >= 2) {
                    const parsedEndTime = new Date();
                    parsedEndTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                    setSelectedEndTime(parsedEndTime);
                }
            }
        }
    }, [initialData]);

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

    const onEndTimeChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowEndTimePicker(false);
        }
        if (event.type === 'set' && date) {
            setSelectedEndTime(date);
        }
    };

    const onRecurringDateChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowRecurringDatePicker(false);
        }
        if (event.type === 'set' && date) {
            const dateStr = formatDateForStorage(date);
            const exists = recurringDates.some(d => formatDateForStorage(d) === dateStr);
            if (!exists) {
                setRecurringDates(prev => [...prev, date].sort((a, b) => a.getTime() - b.getTime()));
            }
        }
    };

    const removeRecurringDate = (dateToRemove: Date) => {
        const dateStr = formatDateForStorage(dateToRemove);
        setRecurringDates(prev => prev.filter(d => formatDateForStorage(d) !== dateStr));
    };

    const pickImage = async (autoAnalyze = false) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir imágenes.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImage(base64Image);
            if (autoAnalyze) {
                // Auto-analyze after picking, same as extractions flow
                await analyzeImageFromBase64(base64Image);
            }
        }
    };

    const takePhoto = async (autoAnalyze = false) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar fotos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImage(base64Image);
            if (autoAnalyze) {
                await analyzeImageFromBase64(base64Image);
            }
        }
    };

    // Helper: returns null if value is empty, "No especificado", "Gratis", or "N/A"
    const sanitizeAiValue = (val: string | null | undefined): string | null => {
        if (!val) return null;
        const trimmed = val.trim();
        const invalid = ['no especificado', 'gratis', 'n/a', 'none', 'null', ''];
        if (invalid.includes(trimmed.toLowerCase())) return null;
        return trimmed;
    };

    // Unified image analysis from base64 (same AI model as extractions)
    const analyzeImageFromBase64 = async (base64Image: string) => {
        setIsAnalyzing(true);
        try {
            let result;
            try {
                // Upload to storage to get a URL, then use the same endpoint as extracted images
                const uploadResult = await uploadImageBase64(base64Image);
                if (uploadResult.success && uploadResult.publicUrl) {
                    result = await analyzeExtractedImage(uploadResult.publicUrl, title || 'Event Flyer');
                }
            } catch {
                // Storage upload failed — fall back to base64 endpoint
            }

            // Fallback: direct base64 analysis
            if (!result) {
                result = await analyzeImage(base64Image, title);
            }

            if (result?.success && result.analysis) {
                applyAnalysisToForm(result.analysis);
                Alert.alert('¡Análisis Completado!', 'Hemos llenado los campos con la información detectada.');
            } else {
                Alert.alert('Sin resultados', 'No pudimos extraer información del flyer. Intenta llenar los datos manualmente.');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            Alert.alert('Error', 'No pudimos analizar la imagen. Intenta llenar los datos manualmente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!image) return;
        await analyzeImageFromBase64(image);
    };

    const handleAnalyzeUrl = async () => {
        if (!postUrl.trim()) return;

        if (!user?.id) {
            Alert.alert('Error', 'Debes iniciar sesión para usar esta función.');
            return;
        }

        try {
            const jobId = await queueExtraction(postUrl.trim(), user.id);

            if (!jobId) {
                Alert.alert('Error', 'No pudimos agregar la URL a la cola. Intenta de nuevo.');
                return;
            }

            setShowUrlModal(false);
            setPostUrl('');

            if (onSuccess) onSuccess(); // Or maybe specific callback for queueing?
            else {
                Alert.alert('Añadido a la cola', 'La URL se ha añadido a la cola de extracción.');
            }

        } catch (error: any) {
            console.error('Queue error:', error);
            Alert.alert('Error', 'No pudimos agregar la URL a la cola.');
        }
    };

    const analyzeAndSetImage = async (imageUrl: string) => {
        setIsAnalyzing(true);
        try {
            // Upload to Supabase Storage first to get a permanent URL
            let permanentUrl = imageUrl;
            try {
                const uploadResult = await uploadImageFromUrl(imageUrl);
                if (uploadResult.success && uploadResult.publicUrl) {
                    permanentUrl = uploadResult.publicUrl;
                }
            } catch {
                // Upload failed — fall back to original URL
            }

            setImage(permanentUrl);

            const analysisResult = await analyzeExtractedImage(permanentUrl, 'Event Flyer');

            if (analysisResult.success && analysisResult.analysis) {
                applyAnalysisToForm(analysisResult.analysis);
                Alert.alert('¡Listo!', 'Imagen analizada y campos llenados.');
            } else {
                Alert.alert('Imagen guardada', 'La imagen se guardó pero no pudimos extraer los detalles automáticamente.');
            }
        } catch (error: any) {
            console.error('Image analysis error:', error);
            Alert.alert('Imagen guardada', 'La imagen se guardó pero hubo un error al analizarla. Llena los campos manualmente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const applyAnalysisToForm = (analysis: any) => {
        if (!analysis) return;

        // Only update fields if AI returned a meaningful value
        const cleanName = sanitizeAiValue(analysis.event_name);
        if (cleanName) setTitle(cleanName);

        const cleanDesc = sanitizeAiValue(analysis.description);
        if (cleanDesc) setDescription(cleanDesc);

        const cleanLocation = sanitizeAiValue(analysis.location);
        if (cleanLocation) setLocation(cleanLocation);

        const cleanOrganizer = sanitizeAiValue(analysis.organizer);
        if (cleanOrganizer) setOrganizer(cleanOrganizer);

        const cleanRegUrl = sanitizeAiValue(analysis.registration_url);
        if (cleanRegUrl) setRegistrationFormUrl(cleanRegUrl);

        // Price — also exclude "Gratis" and non-numeric
        const cleanPrice = sanitizeAiValue(analysis.price);
        if (cleanPrice) {
            const priceMatch = cleanPrice.match(/[\d.]+/);
            if (priceMatch) setPrice(priceMatch[0]);
        }

        // Date + recurring — handled together via shared utility to avoid UTC shift and
        // ensure the closest future date is selected as main date for recurring events
        const { mainDate, recurringDates: parsedRecurring, isRecurring: detectedRecurring } =
            processRecurringDates(
                sanitizeAiValue(analysis.date),
                Array.isArray(analysis.recurring_dates) ? analysis.recurring_dates : [],
                analysis.is_recurring || false
            );

        if (mainDate) setSelectedDate(mainDate);
        setIsRecurring(detectedRecurring);
        if (detectedRecurring && parsedRecurring.length > 0) {
            setRecurringDates(parsedRecurring);
        }

        // Time
        const cleanTime = sanitizeAiValue(analysis.time);
        if (cleanTime) {
            const timeParts = cleanTime.split(':');
            if (timeParts.length >= 2) {
                const parsedTime = new Date();
                parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                setSelectedTime(parsedTime);
            }
        }

        // End time
        const cleanEndTime = sanitizeAiValue(analysis.end_time);
        if (cleanEndTime) {
            const endTimeParts = cleanEndTime.split(':');
            if (endTimeParts.length >= 2) {
                const parsedEndTime = new Date();
                parsedEndTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
                setSelectedEndTime(parsedEndTime);
            }
        }

        // Category from AI
        if (analysis.category && ['music', 'volunteer', 'general'].includes(analysis.category)) {
            setCategory(analysis.category);
        }
        // Subcategory from AI
        const cleanSubcategory = sanitizeAiValue(analysis.subcategory);
        if (cleanSubcategory) setSubcategory(cleanSubcategory);

        // Tags from AI
        if (Array.isArray(analysis.tags) && analysis.tags.length > 0) {
            setTags(analysis.tags);
        }
        // Event features from AI
        if (analysis.event_features && typeof analysis.event_features === 'object') {
            setEventFeatures(analysis.event_features as Record<string, string>);
        }
    };

    const handleSelectImage = async (imageUrl: string) => {
        setShowImageSelector(false);
        setExtractedImages([]);
        setPendingAnalysis(null);
        await analyzeAndSetImage(imageUrl);
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Por favor ingresa un título para el borrador.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'Debes iniciar sesión para guardar borradores.');
            return;
        }

        setIsSubmitting(true);

        const draftData: DraftFormData = {
            user_id: user.id,
            extraction_job_id: extractionJobId || null,
            title: title.trim(),
            description: description.trim() || null,
            category: category,
            image: image,
            date: selectedDate ? formatDateForStorage(selectedDate) : null,
            time: selectedTime ? formatTimeForStorage(selectedTime) : null,
            location: location.trim() || null,
            organizer: organizer.trim() || null,
            price: price ? parseFloat(price) : null,
            registration_form_url: registrationFormUrl.trim() || null,
            reservation_contact: reservationContact.trim() || null,
            source_image_url: sourceImageUrl || image,
            target_audience: targetAudience.length > 0 ? targetAudience : ['audiencia:general'],
            end_time: selectedEndTime ? formatTimeForStorage(selectedEndTime) : null,
            is_recurring: isRecurring,
            recurring_dates: isRecurring && recurringDates.length > 0
                ? recurringDates.map(d => formatDateForStorage(d))
                : null,
            subcategory: subcategory || null,
            tags: tags.length > 0 ? tags : null,
            event_features: showUrlOption && Object.keys(eventFeatures).length > 0 ? eventFeatures : null,
        };

        let success: boolean;

        if (draftId) {
            success = await updateDraft(draftId, draftData);
        } else {
            const newDraftId = await saveDraft(draftData);
            success = !!newDraftId;
            if (newDraftId) setDraftId(newDraftId);
        }

        setIsSubmitting(false);

        if (success) {
            Alert.alert(
                'Borrador guardado',
                'Tu borrador se ha guardado exitosamente.',
                [{
                    text: 'OK',
                    onPress: () => {
                        if (onSuccess) onSuccess();
                    }
                }]
            );
        } else {
            Alert.alert('Error', 'No se pudo guardar el borrador. Intenta de nuevo.');
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Por favor ingresa un título para el evento.');
            return;
        }

        const priceNum = parseFloat(price);
        if (priceNum > 0 && isHost) {
            if (!bankName.trim() || !bankAccountNumber.trim()) {
                Alert.alert('Error', 'Por favor completa la información bancaria para eventos de pago.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const eventPayload = {
                title: title.trim(),
                description: description.trim(),
                category,
                date: selectedDate ? formatDateForStorage(selectedDate) : null,
                time: selectedTime ? formatTimeForStorage(selectedTime) : null,
                end_time: selectedEndTime ? formatTimeForStorage(selectedEndTime) : null,
                location: location.trim() || null,
                organizer: organizer.trim() || null,
                image,
                price: price && priceNum > 0 ? priceNum : null,
                registration_form_url: registrationFormUrl.trim() ? registrationFormUrl.trim() : null,
                reservation_contact: reservationContact.trim() || null,
                bank_name: priceNum > 0 && bankName.trim() ? bankName.trim() : null,
                bank_account_number: priceNum > 0 && bankAccountNumber.trim() ? bankAccountNumber.trim() : null,
                requires_attendance_check: isHost && requiresAttendance,
                is_recurring: isRecurring,
                recurring_dates: isRecurring && recurringDates.length > 0 ? recurringDates.map(d => formatDateForStorage(d)) : null,
                target_audience: targetAudience.length > 0 ? targetAudience : ['audiencia:general'],
                subcategory: subcategory || null,
                tags: tags.length > 0 ? tags : null,
                event_features: showUrlOption && Object.keys(eventFeatures).length > 0 ? eventFeatures : null,
            };

            if (isEditMode) {
                await updateEvent(eventId!, eventPayload);
            } else {
                await createEvent({ ...eventPayload, user_id: isHost ? user?.id : null });
            }

            if (isEditMode) {
                if (onSuccess) onSuccess();
            } else {
                // Clear form after create
                setTitle('');
                setDescription('');
                setCategory('general');
                setSelectedDate(null);
                setSelectedTime(null);
                setSelectedEndTime(null);
                setLocation('');
                setOrganizer('');
                setImage(null);
                setIsHost(false);
                setPrice('');
                setRegistrationFormUrl('');
                setBankName('');
                setBankAccountNumber('');
                setRequiresAttendance(false);
                setIsRecurring(false);
                setRecurringDates([]);
                setTargetAudience(['audiencia:general']);
                setSubcategory(null);
                setTags([]);
                setEventFeatures({});

                if (onSuccess) onSuccess();
                if (!isModal) {
                    router.replace('/');
                }
            }

        } catch (error) {
            Alert.alert('Error', isEditMode ? 'No se pudo actualizar el evento.' : 'No se pudo crear el evento. Intenta de nuevo.');
        }
        setIsSubmitting(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingTop: isModal ? 20 : insets.top + 10,
                        flexGrow: 1
                    }
                ]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
                {isModal ? (
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{isEditMode ? 'Editar Evento' : 'Crear Evento'}</Text>
                        <View style={{ width: 60 }} />
                    </View>
                ) : (
                    <View style={styles.header}>
                        <Text style={styles.title}>{isEditMode ? 'Editar Evento' : 'Crear Evento'}</Text>
                        <Text style={styles.subtitle}>{isEditMode ? 'Actualiza los detalles de tu evento' : 'Comparte tu evento con la comunidad'}</Text>
                    </View>
                )}

                {/* Image Upload Section */}
                <View style={styles.imageSection}>
                    {isAnalyzing ? (
                        <View style={styles.loadingContainer}>
                    <View style={styles.loadingLettersRow}>
                        {'Analizando...'.split('').map((letter, index) => (
                            <Text
                                key={index}
                                style={styles.loadingLetter}
                            >
                                {letter}
                            </Text>
                        ))}
                    </View>
                            <View style={styles.loadingDotsRow}>
                                <ActivityIndicator size="large" color="#8B5CF6" />
                            </View>
                            <Text style={styles.loadingSubtext}>
                                Analizando imagen con IA...
                            </Text>
                        </View>
                    ) : image ? (
                        <View style={styles.imagePreview}>
                            {/* Tap image to zoom */}
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => setShowImageZoom(true)}
                            >
                                <Image source={{ uri: image }} style={styles.previewImage} />
                                {/* Zoom hint badge */}
                                <View style={styles.zoomHintBadge}>
                                    <Ionicons name="expand" size={14} color="#fff" />
                                    <Text style={styles.zoomHintText}>Toca para ampliar</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Remove button */}
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setImage(null)}
                            >
                                <Ionicons name="close-circle" size={28} color="#EF4444" />
                            </TouchableOpacity>

                            {/* Change poster button — visible in edit mode */}
                            {isEditMode && (
                                <TouchableOpacity
                                    style={styles.changePosterButton}
                                    onPress={() =>
                                        Alert.alert('Cambiar poster', 'Elige una opción', [
                                            { text: 'Galería', onPress: () => pickImage(false) },
                                            { text: 'Cámara', onPress: () => takePhoto(false) },
                                            { text: 'Cancelar', style: 'cancel' },
                                        ])
                                    }
                                >
                                    <Ionicons name="camera" size={15} color="#fff" />
                                    <Text style={styles.changePosterText}>Cambiar poster</Text>
                                </TouchableOpacity>
                            )}

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
                            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(true)}>
                                <Ionicons name="camera" size={32} color="#8B5CF6" />
                                <Text style={styles.uploadText}>Tomar Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(true)}>
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

                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => {
                                    Alert.alert(
                                        '📱 Envía tu Flyer por WhatsApp',
                                        'Puedes enviar tus imágenes de eventos por este número.\n\nAsegúrate de enviar imágenes con los detalles del evento y que sean legibles. De lo contrario, no serán aceptados.\n\n⚠️ Por ahora solo acepta imágenes.',
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Abrir WhatsApp',
                                                onPress: () => {
                                                    const phoneNumber = '50252725024';
                                                    const message = encodeURIComponent('Hola! Quiero enviar un flyer de evento 📸');
                                                    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
                                                    Linking.openURL(whatsappUrl).catch(() => {
                                                        Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tenerlo instalado.');
                                                    });
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                                <Text style={styles.uploadText}>WhatsApp</Text>
                            </TouchableOpacity>
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
                                onPress={() => { setCategory(cat.id); setSubcategory(null); setTags([]); }}
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

                {/* Subcategory + Tags */}
                <View style={styles.section}>
                    <SubcategorySelector
                        category={category}
                        value={subcategory}
                        onChange={setSubcategory}
                    />
                    <TagSelector
                        category={category}
                        value={tags}
                        onChange={setTags}
                    />
                    {/* Event Features — alpha only */}
                    {showUrlOption && (
                        <View style={styles.featuresSection}>
                            <Text style={styles.featuresTitle}>
                                <Ionicons name="flask" size={14} color="#F59E0B" /> Características (Alpha)
                            </Text>
                            {[
                                { key: 'mood', label: 'Estado de ánimo', options: ['energético', 'relajado', 'romántico', 'social', 'íntimo'] },
                                { key: 'vibe', label: 'Ambiente', options: ['casual', 'formal', 'underground', 'familiar', 'exclusivo'] },
                                { key: 'timeOfDay', label: 'Horario', options: ['mañana', 'tarde', 'noche', 'madrugada'] },
                                { key: 'socialSetting', label: 'Contexto social', options: ['en pareja', 'con amigos', 'solo', 'en grupo', 'familiar'] },
                            ].map(({ key, label, options }) => (
                                <View key={key} style={styles.featureRow}>
                                    <Text style={styles.featureLabel}>{label}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                                        {options.map(opt => {
                                            const isSelected = eventFeatures[key] === opt;
                                            return (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={[styles.featureChip, isSelected && styles.featureChipActive]}
                                                    onPress={() => {
                                                        setEventFeatures(prev => isSelected
                                                            ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
                                                            : { ...prev, [key]: opt }
                                                        );
                                                    }}
                                                >
                                                    <Text style={[styles.featureChipText, isSelected && styles.featureChipTextActive]}>
                                                        {opt}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ))}
                        </View>
                    )}
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
                            <Text style={styles.inputLabel}>Hora Inicio</Text>
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
                                        {selectedTime ? formatTime(selectedTime) : 'Hora inicio'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Hora Fin</Text>
                            {Platform.OS === 'web' ? (
                                <View style={styles.pickerButton}>
                                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                                    <input
                                        type="time"
                                        value={selectedEndTime ? formatTimeForStorage(selectedEndTime) : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const date = new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                setSelectedEndTime(date);
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: selectedEndTime ? '#fff' : '#6B7280',
                                            fontSize: 14,
                                            outline: 'none',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowEndTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                                    <Text style={selectedEndTime ? styles.pickerText : styles.pickerPlaceholder}>
                                        {selectedEndTime ? formatTime(selectedEndTime) : 'Hora fin'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Recurring Event Toggle */}
                    <View style={styles.recurringContainer}>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => {
                                setIsRecurring(!isRecurring);
                                if (isRecurring) {
                                    setRecurringDates([]);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
                                {isRecurring && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.checkboxLabel}>Evento Recurrente</Text>
                                <Text style={styles.checkboxHint}>Agregar fechas adicionales del evento</Text>
                            </View>
                        </TouchableOpacity>

                        {isRecurring && (
                            <View style={styles.recurringDatesSection}>
                                {/* Add Date Button */}
                                {Platform.OS === 'web' ? (
                                    <View style={styles.addDateRow}>
                                        <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                                        <input
                                            type="date"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const newDate = new Date(e.target.value + 'T12:00:00');
                                                    const dateStr = formatDateForStorage(newDate);
                                                    const exists = recurringDates.some(d => formatDateForStorage(d) === dateStr);
                                                    if (!exists) {
                                                        setRecurringDates(prev => [...prev, newDate].sort((a, b) => a.getTime() - b.getTime()));
                                                    }
                                                    e.target.value = '';
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#8B5CF6',
                                                fontSize: 14,
                                                outline: 'none',
                                                cursor: 'pointer',
                                            }}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        <Text style={styles.addDateText}>Agregar fecha</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.addDateRow}
                                        onPress={() => setShowRecurringDatePicker(true)}
                                    >
                                        <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                                        <Text style={styles.addDateText}>Agregar fecha</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Selected Dates */}
                                {recurringDates.length > 0 && (
                                    <View style={styles.selectedDatesContainer}>
                                        {recurringDates.map((date, index) => (
                                            <View key={index} style={styles.selectedDateChip}>
                                                <Text style={styles.selectedDateText}>{formatDate(date)}</Text>
                                                <TouchableOpacity onPress={() => removeRecurringDate(date)}>
                                                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Organizador</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="@instagram_del_organizador"
                            placeholderTextColor="#6B7280"
                            value={organizer}
                            onChangeText={(text) => {
                                if (text && !text.startsWith('@')) {
                                    setOrganizer('@' + text);
                                } else {
                                    setOrganizer(text);
                                }
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Target Audience Selector */}
                    <AudienceSelector
                        value={targetAudience}
                        onChange={(newAudience) => {
                            console.log('EventForm: Audience changed', newAudience);
                            setTargetAudience(newAudience);
                        }}
                        label="Organizado para"
                    />

                    {/* Payment & Registration Fields */}
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
                                const cleaned = text.replace(/[^0-9.]/g, '');
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Contacto para Reservas</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="@instagram, +502 1234-5678 o correo@email.com"
                            placeholderTextColor="#6B7280"
                            value={reservationContact}
                            onChangeText={setReservationContact}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="default"
                        />
                        <Text style={styles.inputHint}>
                            Opcional: número de WhatsApp, Instagram o correo electrónico
                        </Text>
                    </View>

                    {/* Bank info */}
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

                    {/* Host Toggle */}
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

                    {/* Attendance Toggle */}
                    {isHost && (
                        <View style={styles.hostToggleContainer}>
                            <View style={styles.hostToggleInfo}>
                                <Ionicons name="qr-code-outline" size={24} color="#F59E0B" />
                                <View>
                                    <Text style={styles.hostToggleTitle}>Llevar asistencia</Text>
                                    <Text style={styles.hostToggleSubtitle}>
                                        Solo asistidos si escaneo su QR personal
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.toggleButton, requiresAttendance && styles.toggleButtonActive]}
                                onPress={() => setRequiresAttendance(!requiresAttendance)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.toggleKnob, requiresAttendance && styles.toggleKnobActive]} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Save Draft Button — only shown when creating, not editing */}
                {!isEditMode && (
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: '#374151', marginBottom: 12 },
                            (!title.trim() || isSubmitting) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSaveDraft}
                        disabled={!title.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>
                                    {draftId ? 'Guardar Cambios en Borrador' : 'Guardar como Borrador'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

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
                            <Ionicons name={isEditMode ? 'save' : 'add-circle'} size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                {isEditMode ? 'Actualizar Evento' : 'Publicar Evento'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>

            {/* Date Picker Modal (iOS) */}
            {Platform.OS === 'ios' && showDatePicker && (
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
            )}

            {/* Time Picker Modal (iOS) */}
            {Platform.OS === 'ios' && showTimePicker && (
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
            )}

            {/* Android Date/Time Pickers */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}
            {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                    value={selectedTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    is24Hour={false}
                />
            )}

            {/* End Time Pickers */}
            {Platform.OS === 'ios' && showEndTimePicker && (
                <Modal
                    transparent
                    animationType="slide"
                    visible={showEndTimePicker}
                    onRequestClose={() => setShowEndTimePicker(false)}
                >
                    <View style={styles.pickerModalOverlay}>
                        <Pressable
                            style={styles.pickerModalDismiss}
                            onPress={() => setShowEndTimePicker(false)}
                        />
                        <View style={styles.pickerModalContent}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.pickerModalTitle}>Hora de Finalización</Text>
                                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                                    <Text style={styles.pickerModalDone}>Listo</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={selectedEndTime || new Date()}
                                mode="time"
                                display="spinner"
                                onChange={onEndTimeChange}
                                locale="es-MX"
                                textColor="#fff"
                            />
                        </View>
                    </View>
                </Modal>
            )}
            {Platform.OS === 'android' && showEndTimePicker && (
                <DateTimePicker
                    value={selectedEndTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={onEndTimeChange}
                    is24Hour={false}
                />
            )}

            {/* Recurring Date Picker */}
            {Platform.OS === 'ios' && showRecurringDatePicker && (
                <Modal
                    transparent
                    animationType="slide"
                    visible={showRecurringDatePicker}
                    onRequestClose={() => setShowRecurringDatePicker(false)}
                >
                    <View style={styles.pickerModalOverlay}>
                        <Pressable
                            style={styles.pickerModalDismiss}
                            onPress={() => setShowRecurringDatePicker(false)}
                        />
                        <View style={styles.pickerModalContent}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.pickerModalTitle}>Agregar Fecha Recurrente</Text>
                                <TouchableOpacity onPress={() => setShowRecurringDatePicker(false)}>
                                    <Text style={styles.pickerModalDone}>Listo</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={new Date()}
                                mode="date"
                                display="spinner"
                                onChange={onRecurringDateChange}
                                minimumDate={new Date()}
                                locale="es-MX"
                                textColor="#fff"
                            />
                        </View>
                    </View>
                </Modal>
            )}
            {Platform.OS === 'android' && showRecurringDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={onRecurringDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* Fullscreen Image Zoom Modal */}
            <Modal
                visible={showImageZoom}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImageZoom(false)}
            >
                <Pressable style={styles.imageZoomOverlay} onPress={() => setShowImageZoom(false)}>
                    <TouchableOpacity style={styles.imageZoomClose} onPress={() => setShowImageZoom(false)}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                    {image && (
                        <Image
                            source={{ uri: image }}
                            style={styles.imageZoomFull}
                            resizeMode="contain"
                        />
                    )}
                </Pressable>
            </Modal>

            {/* URL Input Modal */}
            <Modal
                visible={showUrlModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowUrlModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.pickerModalOverlay}>
                        <Pressable
                            style={styles.pickerModalDismiss}
                            onPress={() => setShowUrlModal(false)}
                        />
                        <View style={[styles.pickerModalContent, { paddingBottom: 40 }]}>
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
                                        (!postUrl.trim()) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleAnalyzeUrl}
                                    disabled={!postUrl.trim()}
                                >
                                    <Ionicons name="cloud-upload" size={24} color="#fff" />
                                    <Text style={styles.submitButtonText}>Extraer Info</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
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
    loadingContainer: {
        height: 200,
        backgroundColor: '#1F1F1F',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingLettersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingLetter: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8B5CF6',
        marginHorizontal: 1,
    },
    loadingDotsRow: {
        marginTop: 8,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
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
    recurringContainer: {
        marginBottom: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#1F1F1F',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#6B7280',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    checkboxHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    recurringDatesSection: {
        marginTop: 12,
    },
    addDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1F1F1F',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderStyle: 'dashed',
    },
    addDateText: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedDatesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    selectedDateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2A2A2A',
        paddingVertical: 8,
        paddingLeft: 12,
        paddingRight: 8,
        borderRadius: 20,
    },
    selectedDateText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    featuresSection: {
        marginTop: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
        padding: 12,
    },
    featuresTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
        marginBottom: 12,
    },
    featureRow: {
        marginBottom: 10,
    },
    featureLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    featureChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#1F1F1F',
        borderWidth: 1,
        borderColor: '#374151',
    },
    featureChipActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: '#F59E0B',
    },
    featureChipText: {
        fontSize: 12,
        color: '#6B7280',
    },
    featureChipTextActive: {
        color: '#F59E0B',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    cancelButton: {
        padding: 8,
    },
    cancelButtonText: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    zoomHintBadge: {
        position: 'absolute',
        bottom: 56,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    zoomHintText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
    },
    changePosterButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    changePosterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    imageZoomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageZoomClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 8,
    },
    imageZoomFull: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.82,
    },
});

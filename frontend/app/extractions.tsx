import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    ScrollView,
    Pressable,
    AppState,
    AppStateStatus,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useExtractionStore, Extraction, ExtractionStatus } from '../src/store/extractionStore';
import { useDraftStore, EventDraft, DraftFormData } from '../src/store/draftStore';
import { supabase } from '../src/services/supabase';
import { AnimatedLoader, InlineLoader, MiniSphereLoader } from '../src/components/AnimatedLoader';
import { useAuth } from '../src/context/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const categories = [
    { id: 'music', label: 'Musica', icon: 'musical-notes', color: '#8B5CF6' },
    { id: 'volunteer', label: 'Voluntariado', icon: 'heart', color: '#EC4899' },
    { id: 'general', label: 'General', icon: 'fast-food', color: '#F59E0B' },
];

export default function ExtractionsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const {
        extractions,
        isPolling,
        fetchExtractions,
        startPolling,
        stopPolling,
        removeExtraction,
        clearCompleted,
        selectImage,
        retryExtraction,
    } = useExtractionStore();

    const {
        drafts,
        fetchDrafts,
        saveDraft,
        updateDraft,
        deleteDraft,
        publishDraft,
        isLoading: isDraftLoading,
    } = useDraftStore();

    // Image selector modal state
    const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Multi-select mode for images
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [analysisQueue, setAnalysisQueue] = useState<{ extractionId: string; imageUrl: string }[]>([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    // Create event modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentDraftData, setCurrentDraftData] = useState<Partial<DraftFormData> | null>(null);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [lastAnalyzedId, setLastAnalyzedId] = useState<string | null>(null);
    const [pendingAnalysisQueue, setPendingAnalysisQueue] = useState<{ extractionId: string; imageUrl: string }[]>([]);

    // Form state for create modal
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formCategory, setFormCategory] = useState('general');
    const [formDate, setFormDate] = useState<Date | null>(null);
    const [formTime, setFormTime] = useState<Date | null>(null);
    const [formLocation, setFormLocation] = useState('');
    const [formOrganizer, setFormOrganizer] = useState('');
    const [formImage, setFormImage] = useState<string | null>(null);
    const [formPrice, setFormPrice] = useState('');
    const [formRegistrationUrl, setFormRegistrationUrl] = useState('');

    // Picker visibility
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Submitting state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track app state for foreground refresh
    const appState = useRef(AppState.currentState);

    // Start polling on mount, stop on unmount
    useEffect(() => {
        if (user?.id) {
            startPolling(user.id);
            fetchDrafts(user.id);
        }

        return () => {
            stopPolling();
        };
    }, [user?.id]);

    // Re-start polling when app returns to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App returned to foreground, refreshing extractions...');
                if (user?.id) {
                    fetchExtractions(user.id);
                    fetchDrafts(user.id);
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user?.id, fetchExtractions, fetchDrafts]);

    // Watch for completed analysis to open create modal
    useEffect(() => {
        if (!lastAnalyzedId) return;

        const justCompleted = extractions.find(e =>
            e.id === lastAnalyzedId &&
            e.status === 'completed' &&
            e.analysis
        );

        if (justCompleted) {
            // Open create modal with pre-filled data
            openCreateModalWithAnalysis(justCompleted);
            setLastAnalyzedId(null);
        }
    }, [extractions, lastAnalyzedId]);

    // Process analysis queue one by one
    useEffect(() => {
        const processNextInQueue = async () => {
            if (pendingAnalysisQueue.length === 0 || isProcessingQueue) return;

            setIsProcessingQueue(true);
            const next = pendingAnalysisQueue[0];

            // Trigger analysis for next image
            setLastAnalyzedId(next.extractionId);
            await selectImage(next.extractionId, next.imageUrl);
        };

        processNextInQueue();
    }, [pendingAnalysisQueue, isProcessingQueue]);

    // When analysis completes, continue with queue
    useEffect(() => {
        if (!isProcessingQueue) return;

        const currentExtraction = extractions.find(e =>
            pendingAnalysisQueue.length > 0 &&
            e.id === pendingAnalysisQueue[0]?.extractionId
        );

        if (currentExtraction?.status === 'completed' || currentExtraction?.status === 'failed') {
            // Remove from queue and continue
            setPendingAnalysisQueue(prev => prev.slice(1));
            setIsProcessingQueue(false);
            setCurrentQueueIndex(prev => prev + 1);
        }
    }, [extractions, isProcessingQueue, pendingAnalysisQueue]);

    const openCreateModalWithAnalysis = (extraction: Extraction) => {
        const analysis = extraction.analysis;
        if (!analysis) return;

        // Parse date - manually to avoid timezone issues
        let parsedDate: Date | null = null;
        if (analysis.date && analysis.date !== 'No especificado') {
            const dateParts = analysis.date.split(/[-/]/).map(Number);
            if (dateParts.length === 3) {
                // Format: YYYY-MM-DD or DD-MM-YYYY
                let year: number, month: number, day: number;
                if (dateParts[0] > 1000) {
                    // YYYY-MM-DD
                    [year, month, day] = dateParts;
                } else {
                    // DD-MM-YYYY
                    [day, month, year] = dateParts;
                }
                parsedDate = new Date(year, month - 1, day);
            } else if (dateParts.length === 2) {
                // DD-MM format, add current year
                const currentYear = new Date().getFullYear();
                const [day, month] = dateParts;
                parsedDate = new Date(currentYear, month - 1, day);
            }
            if (parsedDate && isNaN(parsedDate.getTime())) parsedDate = null;
        }

        // Parse time
        let parsedTime: Date | null = null;
        if (analysis.time && analysis.time !== 'No especificado') {
            const timeParts = analysis.time.split(':');
            if (timeParts.length >= 2) {
                parsedTime = new Date();
                parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            }
        }

        setFormTitle(analysis.event_name || '');
        setFormDescription(analysis.description || '');
        setFormLocation(analysis.location || '');
        setFormOrganizer(analysis.organizer || '');
        setFormDate(parsedDate);
        setFormTime(parsedTime);
        setFormImage(extraction.selectedImage || null);
        setFormCategory('general');
        // Parse price from analysis
        let priceValue = '';
        if (analysis.price && analysis.price !== 'No especificado' && analysis.price !== 'Gratis') {
            // Extract numeric value from price string (e.g., "Q50", "50 GTQ", "50")
            const priceMatch = analysis.price.match(/[\d.]+/);
            if (priceMatch) {
                priceValue = priceMatch[0];
            }
        }
        setFormPrice(priceValue);
        setFormRegistrationUrl(analysis.registration_url || '');
        setEditingDraftId(null);

        setCurrentDraftData({
            extraction_job_id: extraction.id,
            source_image_url: extraction.selectedImage,
        });

        setShowCreateModal(true);
    };

    const openCreateModalForEdit = (draft: EventDraft) => {
        // Parse date - manually to avoid timezone issues
        let parsedDate: Date | null = null;
        if (draft.date) {
            const dateParts = draft.date.split('-').map(Number);
            if (dateParts.length === 3) {
                const [year, month, day] = dateParts;
                parsedDate = new Date(year, month - 1, day);
            }
            if (parsedDate && isNaN(parsedDate.getTime())) parsedDate = null;
        }

        // Parse time
        let parsedTime: Date | null = null;
        if (draft.time) {
            const timeParts = draft.time.split(':');
            if (timeParts.length >= 2) {
                parsedTime = new Date();
                parsedTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            }
        }

        setFormTitle(draft.title || '');
        setFormDescription(draft.description || '');
        setFormLocation(draft.location || '');
        setFormOrganizer(draft.organizer || '');
        setFormDate(parsedDate);
        setFormTime(parsedTime);
        setFormImage(draft.image || null);
        setFormCategory(draft.category || 'general');
        setFormPrice(draft.price ? String(draft.price) : '');
        setFormRegistrationUrl(draft.registration_form_url || '');
        setEditingDraftId(draft.id);

        setCurrentDraftData({
            extraction_job_id: draft.extraction_job_id,
            source_image_url: draft.source_image_url,
        });

        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormTitle('');
        setFormDescription('');
        setFormCategory('general');
        setFormDate(null);
        setFormTime(null);
        setFormLocation('');
        setFormOrganizer('');
        setFormImage(null);
        setFormPrice('');
        setFormRegistrationUrl('');
        setEditingDraftId(null);
        setCurrentDraftData(null);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetForm();
    };

    const formatDateForStorage = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const formatTimeForStorage = (date: Date): string => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('es-MX', options);
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleSaveDraft = async () => {
        if (!formTitle.trim()) {
            Alert.alert('Error', 'Por favor ingresa un titulo para el evento.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'Debes iniciar sesion para guardar borradores.');
            return;
        }

        setIsSubmitting(true);

        const draftData: DraftFormData = {
            user_id: user.id,
            extraction_job_id: currentDraftData?.extraction_job_id || null,
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            category: formCategory,
            image: formImage,
            date: formDate ? formatDateForStorage(formDate) : null,
            time: formTime ? formatTimeForStorage(formTime) : null,
            location: formLocation.trim() || null,
            organizer: formOrganizer.trim() || null,
            price: formPrice ? parseFloat(formPrice) : null,
            registration_form_url: formRegistrationUrl.trim() || null,
            source_image_url: currentDraftData?.source_image_url || formImage,
        };

        let success: boolean;

        if (editingDraftId) {
            success = await updateDraft(editingDraftId, draftData);
        } else {
            const draftId = await saveDraft(draftData);
            success = !!draftId;
        }

        setIsSubmitting(false);

        if (success) {
            // Reset extraction to 'ready' so user can select more images
            const extractionJobId = currentDraftData?.extraction_job_id;
            if (extractionJobId) {
                await resetExtractionToReady(extractionJobId);
            }

            closeCreateModal();

            // Check if there are more images in the queue
            if (pendingAnalysisQueue.length > 0) {
                Alert.alert(
                    'Borrador guardado',
                    `Borrador guardado. Procesando ${pendingAnalysisQueue.length} imagen(es) restante(s)...`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Borrador guardado',
                    'Tu borrador se ha guardado. Puedes publicarlo cuando quieras.',
                    [{ text: 'OK' }]
                );
            }
        } else {
            Alert.alert('Error', 'No se pudo guardar el borrador. Intenta de nuevo.');
        }
    };

    // Reset extraction to ready status
    const resetExtractionToReady = async (extractionId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('extraction_jobs')
                .update({ status: 'ready', analysis_result: null, selected_image_url: null })
                .eq('id', extractionId);

            if (error) return false;

            // Refresh local state
            if (user?.id) {
                fetchExtractions(user.id);
            }

            return true;
        } catch {
            return false;
        }
    };

    const [processingDraftId, setProcessingDraftId] = useState<string | null>(null);

    const handlePublishDraft = (draftId: string) => {
        const executePublish = () => {
            setProcessingDraftId(draftId);
            publishDraft(draftId)
                .then((success) => {
                    if (success) {
                        if (Platform.OS === 'web') {
                            window.alert('Tu evento ya esta visible para todos.');
                        } else {
                            Alert.alert('Evento publicado', 'Tu evento ya esta visible para todos.');
                        }
                    } else {
                        if (Platform.OS === 'web') {
                            window.alert('No se pudo publicar el evento. Intenta de nuevo.');
                        } else {
                            Alert.alert('Error', 'No se pudo publicar el evento. Intenta de nuevo.');
                        }
                    }
                })
                .finally(() => {
                    setProcessingDraftId(null);
                });
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Quieres publicar este borrador como evento?')) {
                executePublish();
            }
        } else {
            Alert.alert(
                'Publicar evento',
                '¿Quieres publicar este borrador como evento?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Publicar', onPress: executePublish }
                ]
            );
        }
    };

    const handleDeleteDraft = (draftId: string) => {
        const executeDelete = () => {
            setProcessingDraftId(draftId);
            deleteDraft(draftId)
                .then((success) => {
                    if (!success) {
                        if (Platform.OS === 'web') {
                            window.alert('No se pudo eliminar el borrador. Intenta de nuevo.');
                        } else {
                            Alert.alert('Error', 'No se pudo eliminar el borrador. Intenta de nuevo.');
                        }
                    }
                })
                .finally(() => {
                    setProcessingDraftId(null);
                });
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Estas seguro de eliminar este borrador?')) {
                executeDelete();
            }
        } else {
            Alert.alert(
                'Eliminar borrador',
                '¿Estas seguro de eliminar este borrador?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const getStatusInfo = (status: ExtractionStatus): { icon: string; color: string; text: string } => {
        switch (status) {
            case 'pending':
                return { icon: 'time-outline', color: '#9CA3AF', text: 'En cola' };
            case 'extracting':
                return { icon: 'cloud-download-outline', color: '#3B82F6', text: 'Extrayendo...' };
            case 'ready':
                return { icon: 'images-outline', color: '#8B5CF6', text: 'Listo para seleccionar' };
            case 'analyzing':
                return { icon: 'sparkles-outline', color: '#F59E0B', text: 'Analizando...' };
            case 'completed':
                return { icon: 'checkmark-circle', color: '#10B981', text: 'Completado' };
            case 'failed':
                return { icon: 'alert-circle', color: '#EF4444', text: 'Error' };
            default:
                return { icon: 'help-circle-outline', color: '#6B7280', text: 'Desconocido' };
        }
    };

    const handleExtractionPress = (extraction: Extraction) => {
        if (extraction.status === 'ready' && extraction.images?.length) {
            setSelectedExtraction(extraction);
        } else if (extraction.status === 'failed' && extraction.images?.length) {
            // Failed but has images - allow retry by opening image selector
            setSelectedExtraction(extraction);
        } else if (extraction.status === 'completed') {
            // Open create modal with analysis data
            openCreateModalWithAnalysis(extraction);
        }
    };

    const handleRetry = async (extraction: Extraction) => {
        if (extraction.images?.length) {
            // Has images, open selector to retry analysis
            setSelectedExtraction(extraction);
        } else {
            // No images, need to re-extract
            await retryExtraction(extraction.id);
        }
    };

    // Toggle image selection for multi-select mode
    const toggleImageSelection = (imageUrl: string) => {
        setSelectedImages(prev =>
            prev.includes(imageUrl)
                ? prev.filter(url => url !== imageUrl)
                : [...prev, imageUrl]
        );
    };

    // Select all images
    const handleSelectAll = () => {
        if (!selectedExtraction?.images) return;
        if (selectedImages.length === selectedExtraction.images.length) {
            // Deselect all
            setSelectedImages([]);
        } else {
            // Select all
            setSelectedImages([...selectedExtraction.images]);
        }
    };

    // Single image direct analysis (tap on image)
    const handleSelectImage = async (imageUrl: string) => {
        if (!selectedExtraction) return;

        setIsAnalyzing(true);
        setLastAnalyzedId(selectedExtraction.id);
        await selectImage(selectedExtraction.id, imageUrl);
        setIsAnalyzing(false);
        setSelectedExtraction(null);
        setSelectedImages([]);
    };

    // Analyze selected images (queue them)
    const handleAnalyzeSelected = async () => {
        if (!selectedExtraction || selectedImages.length === 0) return;

        // Create queue of images to analyze
        const queue = selectedImages.map(imageUrl => ({
            extractionId: selectedExtraction.id,
            imageUrl,
        }));

        // Close modal and start processing
        setSelectedExtraction(null);

        // Start processing the first one
        setIsAnalyzing(true);
        setPendingAnalysisQueue(queue.slice(1)); // Rest of queue
        setCurrentQueueIndex(0);
        setAnalysisQueue(queue);

        // Analyze first image
        setLastAnalyzedId(queue[0].extractionId);
        await selectImage(queue[0].extractionId, queue[0].imageUrl);
        setIsAnalyzing(false);
        setSelectedImages([]);
    };

    // Close image selector and reset selection
    const closeImageSelector = () => {
        setSelectedExtraction(null);
        setSelectedImages([]);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Eliminar extraccion',
            '¿Estas seguro de eliminar esta extraccion?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => removeExtraction(id) }
            ]
        );
    };

    const handleClearCompleted = () => {
        if (user?.id) {
            clearCompleted(user.id);
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString();
    };

    // Format date string from Supabase (YYYY-MM-DD) to readable format
    // Parse manually to avoid timezone issues
    const formatDraftDate = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            if (!year || !month || !day) return dateString;

            const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            return `${day} ${months[month - 1]} ${year}`;
        } catch {
            return dateString;
        }
    };

    const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (event.type === 'set' && date) {
            setFormDate(date);
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (event.type === 'set' && date) {
            setFormTime(date);
        }
    };

    const renderExtraction = ({ item }: { item: Extraction }) => {
        const statusInfo = getStatusInfo(item.status);
        const isLoading = item.status === 'pending' || item.status === 'extracting' || item.status === 'analyzing';

        return (
            <TouchableOpacity
                style={styles.extractionCard}
                onPress={() => handleExtractionPress(item)}
                disabled={isLoading || (item.status === 'failed' && !item.images?.length)}
                activeOpacity={0.7}
            >
                <View style={styles.thumbnail}>
                    {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.thumbnailImage} />
                    ) : (
                        <View style={styles.thumbnailPlaceholder}>
                            {isLoading ? (
                                <MiniSphereLoader />
                            ) : (
                                <Ionicons name="image-outline" size={24} color="#6B7280" />
                            )}
                        </View>
                    )}
                    {item.images && item.images.length > 1 && (
                        <View style={styles.imageCountBadge}>
                            <Text style={styles.imageCountText}>{item.images.length}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.extractionContent}>
                    <Text style={styles.extractionUrl} numberOfLines={1}>
                        {item.url.replace('https://www.instagram.com/', 'instagram.com/')}
                    </Text>

                    <View style={styles.statusRow}>
                        {isLoading ? (
                            <InlineLoader color={statusInfo.color} />
                        ) : (
                            <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                        )}
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                        <Text style={styles.timeText}>{formatTimestamp(item.updatedAt)}</Text>
                    </View>

                    {item.error && item.status === 'failed' && (
                        <Text style={styles.errorText} numberOfLines={1}>
                            {item.error}{item.images?.length ? ' • Toca para reintentar' : ''}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderDraft = ({ item }: { item: EventDraft }) => {
        const isProcessing = processingDraftId === item.id;

        return (
            <View style={[styles.draftCard, isProcessing && styles.draftCardProcessing]}>
                <View style={styles.draftThumbnail}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.thumbnailImage} />
                    ) : (
                        <View style={styles.thumbnailPlaceholder}>
                            <Ionicons name="document-text-outline" size={24} color="#6B7280" />
                        </View>
                    )}
                </View>

                <View style={styles.draftContent}>
                    <Text style={styles.draftTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.draftMeta} numberOfLines={1}>
                        {item.category}{item.date ? ` • ${formatDraftDate(item.date)}` : ''}
                    </Text>
                </View>

                {isProcessing ? (
                    <View style={styles.draftLoadingContainer}>
                        <ActivityIndicator color="#8B5CF6" size="small" />
                    </View>
                ) : (
                    <View style={styles.draftActions}>
                        <TouchableOpacity
                            style={styles.draftActionButton}
                            onPress={() => openCreateModalForEdit(item)}
                        >
                            <Ionicons name="pencil" size={18} color="#8B5CF6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.draftActionButton, styles.publishButton]}
                            onPress={() => handlePublishDraft(item.id)}
                        >
                            <Ionicons name="send" size={18} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.draftActionButton}
                            onPress={() => handleDeleteDraft(item.id)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const pendingCount = extractions.filter(e =>
        e.status === 'pending' || e.status === 'extracting' || e.status === 'analyzing'
    ).length;

    const readyCount = extractions.filter(e => e.status === 'ready').length;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Extracciones</Text>
                    <Text style={styles.subtitle}>
                        {pendingCount > 0 ? `${pendingCount} procesando` : ''}
                        {pendingCount > 0 && readyCount > 0 ? ' • ' : ''}
                        {readyCount > 0 ? `${readyCount} listas` : ''}
                        {pendingCount === 0 && readyCount === 0 && extractions.length > 0 ? 'Todo listo' : ''}
                        {drafts.length > 0 ? ` • ${drafts.length} borradores` : ''}
                        {isPolling && pendingCount > 0 && ' (actualizando...)'}
                    </Text>
                </View>
                {extractions.some(e => e.status === 'completed' || e.status === 'failed') && (
                    <TouchableOpacity onPress={handleClearCompleted} style={styles.clearButton}>
                        <Ionicons name="trash-bin-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Drafts Section */}
                {drafts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text" size={20} color="#F59E0B" />
                            <Text style={styles.sectionTitle}>Borradores pendientes</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{drafts.length}</Text>
                            </View>
                        </View>
                        {drafts.map(draft => (
                            <View key={draft.id}>
                                {renderDraft({ item: draft })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Extractions Section */}
                <View style={styles.section}>
                    {extractions.length > 0 && (
                        <View style={styles.sectionHeader}>
                            <Ionicons name="cloud-download" size={20} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>Extracciones</Text>
                        </View>
                    )}

                    {extractions.length === 0 && drafts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cloud-download-outline" size={64} color="#3A3A3A" />
                            <Text style={styles.emptyTitle}>No hay extracciones</Text>
                            <Text style={styles.emptyText}>
                                Las URLs de Instagram que agregues apareceran aqui mientras se procesan.
                                {'\n\n'}
                                Puedes cerrar la app y volver mas tarde - tus extracciones se guardan automaticamente.
                            </Text>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={() => router.push('/create')}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createButtonText}>Crear evento</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        extractions.map(extraction => (
                            <View key={extraction.id}>
                                {renderExtraction({ item: extraction })}
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Image Selector Modal */}
            <Modal
                visible={!!selectedExtraction}
                transparent
                animationType="slide"
                onRequestClose={closeImageSelector}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={styles.modalDismiss}
                        onPress={closeImageSelector}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedImages.length > 0
                                    ? `${selectedImages.length} seleccionada(s)`
                                    : 'Selecciona imagenes'}
                            </Text>
                            <TouchableOpacity onPress={closeImageSelector}>
                                <Text style={styles.modalCancel}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>

                        {isAnalyzing ? (
                            <View style={styles.analyzingContainer}>
                                <AnimatedLoader text="Analizando" size={180} />
                                {analysisQueue.length > 1 && (
                                    <Text style={styles.queueProgressText}>
                                        {currentQueueIndex + 1} de {analysisQueue.length}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <>
                                <View style={styles.modalSubtitleRow}>
                                    <Text style={styles.modalSubtitle}>
                                        Toca para analizar una, o selecciona varias.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.selectAllButton}
                                        onPress={handleSelectAll}
                                    >
                                        <Ionicons
                                            name={selectedImages.length === selectedExtraction?.images?.length
                                                ? "checkbox"
                                                : "square-outline"}
                                            size={18}
                                            color="#8B5CF6"
                                        />
                                        <Text style={styles.selectAllText}>
                                            {selectedImages.length === selectedExtraction?.images?.length
                                                ? 'Deseleccionar'
                                                : 'Seleccionar todas'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.imageScrollContent}
                                >
                                    {selectedExtraction?.images?.map((imgUrl, index) => {
                                        const isSelected = selectedImages.includes(imgUrl);
                                        return (
                                            <View key={index} style={styles.imageOptionContainer}>
                                                <TouchableOpacity
                                                    onPress={() => handleSelectImage(imgUrl)}
                                                    style={[
                                                        styles.imageOption,
                                                        isSelected && styles.imageOptionSelected,
                                                    ]}
                                                    activeOpacity={0.8}
                                                >
                                                    <Image
                                                        source={{ uri: imgUrl }}
                                                        style={styles.imageOptionImage}
                                                        resizeMode="cover"
                                                    />
                                                    <View style={styles.imageOptionBadge}>
                                                        <Text style={styles.imageOptionBadgeText}>
                                                            {index + 1} / {selectedExtraction.images?.length}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <View style={styles.selectedOverlay}>
                                                            <Ionicons name="checkmark-circle" size={32} color="#8B5CF6" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.selectImageButton,
                                                        isSelected && styles.selectImageButtonActive,
                                                    ]}
                                                    onPress={() => toggleImageSelection(imgUrl)}
                                                >
                                                    <Ionicons
                                                        name={isSelected ? "checkbox" : "square-outline"}
                                                        size={18}
                                                        color={isSelected ? "#fff" : "#8B5CF6"}
                                                    />
                                                    <Text style={[
                                                        styles.selectImageButtonText,
                                                        isSelected && styles.selectImageButtonTextActive,
                                                    ]}>
                                                        {isSelected ? 'Seleccionada' : 'Seleccionar'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </ScrollView>

                                {/* Analyze selected button */}
                                {selectedImages.length > 0 && (
                                    <View style={styles.analyzeSelectedContainer}>
                                        <TouchableOpacity
                                            style={styles.analyzeSelectedButton}
                                            onPress={handleAnalyzeSelected}
                                        >
                                            <Ionicons name="sparkles" size={20} color="#fff" />
                                            <Text style={styles.analyzeSelectedText}>
                                                Analizar {selectedImages.length} imagen{selectedImages.length > 1 ? 'es' : ''}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.analyzeHint}>
                                            Se procesaran una por una para evitar errores
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Create Event Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="slide"
                onRequestClose={closeCreateModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.createModalOverlay}>
                        <Pressable
                            style={styles.modalDismiss}
                            onPress={closeCreateModal}
                        />
                        <View style={styles.createModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingDraftId ? 'Editar Borrador' : 'Crear Borrador'}
                                </Text>
                                <TouchableOpacity onPress={closeCreateModal}>
                                    <Text style={styles.modalCancel}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.createForm}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Image Preview */}
                                {formImage && (
                                    <View style={styles.formImagePreview}>
                                        <Image
                                            source={{ uri: formImage }}
                                            style={styles.formPreviewImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}

                                {/* Category Selection */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Categoria</Text>
                                    <View style={styles.categoryGrid}>
                                        {categories.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[
                                                    styles.categoryButton,
                                                    formCategory === cat.id && { backgroundColor: cat.color },
                                                ]}
                                                onPress={() => setFormCategory(cat.id)}
                                            >
                                                <Ionicons
                                                    name={cat.icon as any}
                                                    size={20}
                                                    color={formCategory === cat.id ? '#fff' : cat.color}
                                                />
                                                <Text
                                                    style={[
                                                        styles.categoryLabel,
                                                        formCategory === cat.id && styles.categoryLabelActive,
                                                    ]}
                                                >
                                                    {cat.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Title */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Titulo *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="Nombre del evento"
                                        placeholderTextColor="#6B7280"
                                        value={formTitle}
                                        onChangeText={setFormTitle}
                                    />
                                </View>

                                {/* Description */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Descripcion</Text>
                                    <TextInput
                                        style={[styles.formInput, styles.textArea]}
                                        placeholder="Detalles del evento"
                                        placeholderTextColor="#6B7280"
                                        value={formDescription}
                                        onChangeText={setFormDescription}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Date & Time */}
                                <View style={styles.formRow}>
                                    <View style={[styles.formSection, { flex: 1 }]}>
                                        <Text style={styles.formLabel}>Fecha</Text>
                                        <TouchableOpacity
                                            style={styles.pickerButton}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Ionicons name="calendar" size={18} color="#8B5CF6" />
                                            <Text style={formDate ? styles.pickerText : styles.pickerPlaceholder}>
                                                {formDate ? formatDate(formDate) : 'Seleccionar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.formSection, { flex: 1 }]}>
                                        <Text style={styles.formLabel}>Hora</Text>
                                        <TouchableOpacity
                                            style={styles.pickerButton}
                                            onPress={() => setShowTimePicker(true)}
                                        >
                                            <Ionicons name="time" size={18} color="#8B5CF6" />
                                            <Text style={formTime ? styles.pickerText : styles.pickerPlaceholder}>
                                                {formTime ? formatTime(formTime) : 'Seleccionar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Location */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Ubicacion</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="Donde sera el evento"
                                        placeholderTextColor="#6B7280"
                                        value={formLocation}
                                        onChangeText={setFormLocation}
                                    />
                                </View>

                                {/* Organizer */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Organizador</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="@instagram_del_organizador"
                                        placeholderTextColor="#6B7280"
                                        value={formOrganizer}
                                        onChangeText={(text) => {
                                            if (text && !text.startsWith('@')) {
                                                setFormOrganizer('@' + text);
                                            } else {
                                                setFormOrganizer(text);
                                            }
                                        }}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                {/* Price */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Precio (Q)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="0.00 (Gratis)"
                                        placeholderTextColor="#6B7280"
                                        value={formPrice}
                                        onChangeText={(text) => {
                                            const cleaned = text.replace(/[^0-9.]/g, '');
                                            const parts = cleaned.split('.');
                                            if (parts.length <= 2) setFormPrice(cleaned);
                                        }}
                                        keyboardType="decimal-pad"
                                    />
                                </View>

                                {/* Registration URL */}
                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>URL de registro (opcional)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="https://forms.google.com/..."
                                        placeholderTextColor="#6B7280"
                                        value={formRegistrationUrl}
                                        onChangeText={setFormRegistrationUrl}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="url"
                                    />
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.saveButton,
                                        (!formTitle.trim() || isSubmitting) && styles.saveButtonDisabled,
                                    ]}
                                    onPress={handleSaveDraft}
                                    disabled={!formTitle.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="save" size={20} color="#fff" />
                                            <Text style={styles.saveButtonText}>
                                                {editingDraftId ? 'Actualizar Borrador' : 'Guardar Borrador'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* iOS Date Picker Modal */}
            {Platform.OS === 'ios' && showDatePicker && (
                <Modal
                    transparent
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.pickerModalOverlay}>
                        <Pressable
                            style={styles.modalDismiss}
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
                                value={formDate || new Date()}
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

            {/* iOS Time Picker Modal */}
            {Platform.OS === 'ios' && showTimePicker && (
                <Modal
                    transparent
                    animationType="slide"
                    visible={showTimePicker}
                    onRequestClose={() => setShowTimePicker(false)}
                >
                    <View style={styles.pickerModalOverlay}>
                        <Pressable
                            style={styles.modalDismiss}
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
                                value={formTime || new Date()}
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

            {/* Android Date Picker */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={formDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* Android Time Picker */}
            {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                    value={formTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    is24Hour={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F1F',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    clearButton: {
        marginLeft: 'auto',
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    badge: {
        backgroundColor: '#F59E0B',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    extractionCard: {
        flexDirection: 'row',
        backgroundColor: '#1F1F1F',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    imageCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    extractionContent: {
        flex: 1,
        gap: 4,
    },
    extractionUrl: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 12,
    },
    timeText: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 'auto',
    },
    errorText: {
        fontSize: 11,
        color: '#EF4444',
    },
    deleteButton: {
        padding: 8,
    },
    // Draft card styles
    draftCard: {
        flexDirection: 'row',
        backgroundColor: '#1F1F1F',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F59E0B33',
    },
    draftCardProcessing: {
        opacity: 0.6,
    },
    draftLoadingContainer: {
        paddingHorizontal: 16,
    },
    draftThumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
    },
    draftContent: {
        flex: 1,
        gap: 2,
    },
    draftTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    draftMeta: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    draftActions: {
        flexDirection: 'row',
        gap: 4,
    },
    draftActionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
    },
    publishButton: {
        backgroundColor: '#10B98133',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 16,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalDismiss: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1F1F1F',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    modalCancel: {
        fontSize: 16,
        color: '#8B5CF6',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        flex: 1,
    },
    imageScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        gap: 12,
    },
    imageOption: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#2A2A2A',
        marginRight: 12,
    },
    imageOptionImage: {
        width: 180,
        height: 240,
    },
    imageOptionBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    imageOptionBadgeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    analyzingContainer: {
        padding: 24,
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
    },
    queueProgressText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 12,
    },
    modalSubtitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
    },
    selectAllText: {
        color: '#8B5CF6',
        fontSize: 12,
        fontWeight: '500',
    },
    imageOptionContainer: {
        marginRight: 12,
        alignItems: 'center',
        gap: 8,
    },
    imageOptionSelected: {
        borderColor: '#8B5CF6',
        borderWidth: 3,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    selectImageButtonActive: {
        backgroundColor: '#8B5CF6',
    },
    selectImageButtonText: {
        color: '#8B5CF6',
        fontSize: 12,
        fontWeight: '500',
    },
    selectImageButtonTextActive: {
        color: '#fff',
    },
    analyzeSelectedContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        alignItems: 'center',
        gap: 8,
    },
    analyzeSelectedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#8B5CF6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
    },
    analyzeSelectedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    analyzeHint: {
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
    },
    // Create Modal styles
    createModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    createModalContent: {
        backgroundColor: '#1F1F1F',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    createForm: {
        padding: 16,
    },
    formImagePreview: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    formPreviewImage: {
        width: '100%',
        height: 150,
    },
    formSection: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9CA3AF',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#2A2A2A',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#3A3A3A',
    },
    textArea: {
        height: 80,
        paddingTop: 14,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#2A2A2A',
        borderRadius: 10,
        alignItems: 'center',
        gap: 4,
    },
    categoryLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
        textAlign: 'center',
    },
    categoryLabelActive: {
        color: '#fff',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2A2A2A',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#3A3A3A',
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
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#F59E0B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#4B5563',
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Picker Modal styles
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
});

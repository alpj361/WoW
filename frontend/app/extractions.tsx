import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import EventForm from '../src/components/EventForm';




/**
 * Process recurring event dates to set the closest future date as main date
 * and remaining future dates as recurring_dates
 *
 * For recurring events: IGNORE the main date field (often wrong) and use only recurring_dates
 * For non-recurring events: use the main date
 *
 * @param mainDateStr - The main date from analysis (format: YYYY-MM-DD or DD-MM-YYYY)
 * @param recurringDatesStr - Array of recurring dates (format: YYYY-MM-DD)
 * @param isRecurringEvent - Whether the event is marked as recurring
 * @returns { mainDate: Date | null, recurringDates: Date[], isRecurring: boolean }
 */
const processRecurringDates = (
    mainDateStr: string | null | undefined,
    recurringDatesStr: string[] | null | undefined,
    isRecurringEvent: boolean = false
): { mainDate: Date | null; recurringDates: Date[]; isRecurring: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to parse a date string (handles YYYY-MM-DD and DD-MM-YYYY)
    const parseDate = (dateStr: string): Date | null => {
        const parts = dateStr.split(/[-/]/).map(Number);
        if (parts.length === 3) {
            let year: number, month: number, day: number;
            if (parts[0] > 1000) {
                // YYYY-MM-DD
                [year, month, day] = parts;
            } else {
                // DD-MM-YYYY
                [day, month, year] = parts;
            }
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
        } else if (parts.length === 2) {
            // DD-MM format, add current year
            const currentYear = new Date().getFullYear();
            const [day, month] = parts;
            const date = new Date(currentYear, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
        }
        return null;
    };

    // For recurring events with recurring_dates: ONLY use recurring_dates (ignore mainDateStr)
    // The AI often puts wrong dates in the main date field for recurring events
    if (isRecurringEvent && recurringDatesStr && recurringDatesStr.length > 0) {
        const recurringParsed: Date[] = [];
        for (const dateStr of recurringDatesStr) {
            const date = parseDate(dateStr);
            if (date) recurringParsed.push(date);
        }

        if (recurringParsed.length > 0) {
            // Sort all dates
            recurringParsed.sort((a, b) => a.getTime() - b.getTime());

            // Filter future dates
            const futureDates = recurringParsed.filter(d => d >= today);

            if (futureDates.length > 0) {
                // First future date is main, rest are recurring
                return {
                    mainDate: futureDates[0],
                    recurringDates: futureDates.slice(1),
                    isRecurring: futureDates.length > 1
                };
            } else {
                // All dates in past - use the last (most recent) one
                return {
                    mainDate: recurringParsed[recurringParsed.length - 1],
                    recurringDates: recurringParsed.slice(0, -1),
                    isRecurring: recurringParsed.length > 1
                };
            }
        }
    }

    // Non-recurring event or no recurring_dates: just use main date
    if (mainDateStr && mainDateStr !== 'No especificado') {
        const mainDate = parseDate(mainDateStr);
        if (mainDate) {
            return { mainDate, recurringDates: [], isRecurring: false };
        }
    }

    return { mainDate: null, recurringDates: [], isRecurring: false };
};

export default function ExtractionsScreen({ embedded = false }: { embedded?: boolean } = {}) {
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
    const [lastAnalyzedId, setLastAnalyzedId] = useState<string | null>(null);
    const [pendingAnalysisQueue, setPendingAnalysisQueue] = useState<{ extractionId: string; imageUrl: string }[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [analysisQueue, setAnalysisQueue] = useState<{ extractionId: string; imageUrl: string }[]>([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    // Batch analysis mode - auto-creates drafts without opening modal
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchTotal, setBatchTotal] = useState(0);
    const [batchCompleted, setBatchCompleted] = useState(0);
    const [batchDraftsCreated, setBatchDraftsCreated] = useState(0);
    const [batchSourceExtraction, setBatchSourceExtraction] = useState<Extraction | null>(null);

    // Guard ref to prevent re-calling openCreateModalWithAnalysis when extractions array updates from polling
    const processedAnalysisRef = useRef<string | null>(null);

    // Modal state for editing drafts
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [currentDraft, setCurrentDraft] = useState<any>(null);



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

    // Watch for completed analysis - either open modal or auto-create draft (batch mode)
    useEffect(() => {
        if (!lastAnalyzedId) return;

        const targetExtraction = extractions.find(e => e.id === lastAnalyzedId);
        if (!targetExtraction) return;

        // Handle completed analysis
        if (targetExtraction.status === 'completed' && targetExtraction.analysis) {
            // Guard: don't re-process the same extraction (polling updates extractions array every 3s)
            if (processedAnalysisRef.current === lastAnalyzedId) {
                setLastAnalyzedId(null);
                return;
            }
            processedAnalysisRef.current = lastAnalyzedId;

            if (isBatchMode) {
                // Batch mode: auto-create draft without opening modal
                autoCreateDraftFromAnalysis(targetExtraction);
            } else {
                // Normal mode: open create modal with pre-filled data
                openCreateModalWithAnalysis(targetExtraction);
            }
            setLastAnalyzedId(null);
        }

        // Handle failed analysis in batch mode
        if (targetExtraction.status === 'failed' && isBatchMode) {
            // Increment completed counter but not drafts counter
            setBatchCompleted(prev => prev + 1);

            // Check if batch is complete
            const newCompleted = batchCompleted + 1;
            if (newCompleted >= batchTotal) {
                setIsBatchMode(false);
                setBatchTotal(0);
                setBatchCompleted(0);
                setBatchSourceExtraction(null);

                if (user?.id) {
                    fetchDrafts(user.id);
                }

                const failedCount = newCompleted - batchDraftsCreated;
                Alert.alert(
                    'Análisis completado',
                    `Se crearon ${batchDraftsCreated} borrador${batchDraftsCreated !== 1 ? 'es' : ''}.${failedCount > 0 ? `\n${failedCount} imagen${failedCount !== 1 ? 'es' : ''} fallaron.` : ''}`,
                    [{ text: 'OK' }]
                );
            }

            setLastAnalyzedId(null);
        }
    }, [extractions, lastAnalyzedId, isBatchMode, batchCompleted, batchTotal, batchDraftsCreated, user?.id]);

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

        // In batch mode, 'ready' means the draft was auto-created and we can continue
        // In normal mode, 'completed' means user needs to interact with modal
        const canContinue = currentExtraction?.status === 'failed' ||
            (isBatchMode && currentExtraction?.status === 'ready') ||
            (!isBatchMode && currentExtraction?.status === 'completed');

        if (canContinue) {
            // Remove from queue and continue
            setPendingAnalysisQueue(prev => prev.slice(1));
            setIsProcessingQueue(false);
            setCurrentQueueIndex(prev => prev + 1);
        }
    }, [extractions, isProcessingQueue, pendingAnalysisQueue, isBatchMode]);

    const buildDraftDataFromAnalysis = (extraction: Extraction, userId: string): DraftFormData => {
        const analysis = extraction.analysis!;

        const { mainDate, recurringDates, isRecurring } = processRecurringDates(
            analysis.date,
            analysis.recurring_dates,
            analysis.is_recurring || false
        );

        const dateStr = mainDate ? mainDate.toISOString().split('T')[0] : null;
        const recurringDatesStr: string[] | null = recurringDates.length > 0
            ? recurringDates.map(d => d.toISOString().split('T')[0])
            : null;

        const timeStr = (analysis.time && analysis.time !== 'No especificado') ? analysis.time : null;
        const endTimeStr = (analysis.end_time && analysis.end_time !== 'No especificado') ? analysis.end_time : null;

        let priceValue: number | null = null;
        if (analysis.price && analysis.price !== 'No especificado' && analysis.price !== 'Gratis') {
            const match = analysis.price.match(/[\d.]+/);
            if (match) priceValue = parseFloat(match[0]);
        }

        return {
            user_id: userId,
            extraction_job_id: extraction.id,
            title: analysis.event_name || 'Evento sin título',
            description: analysis.description || null,
            category: analysis.category || 'general',
            image: extraction.selectedImage || null,
            date: dateStr,
            time: timeStr,
            location: analysis.location || null,
            organizer: analysis.organizer || null,
            price: priceValue,
            registration_form_url: analysis.registration_url || null,
            source_image_url: extraction.selectedImage || null,
            target_audience: ['audiencia:general'],
            end_time: endTimeStr,
            is_recurring: isRecurring,
            recurring_dates: recurringDatesStr,
            subcategory: analysis.subcategory || null,
            tags: analysis.tags?.length ? analysis.tags : null,
            event_features: analysis.event_features || null,
        };
    };

    const openCreateModalWithAnalysis = async (extraction: Extraction) => {
        if (!extraction.analysis || !user?.id) return;
        const draftData = buildDraftDataFromAnalysis(extraction, user.id);
        const draftId = await saveDraft(draftData);
        if (draftId) {
            Alert.alert(
                'Borrador creado',
                'Se ha creado un borrador con la información analizada. Puedes editarlo en la pestaña "Borradores".',
                [{ text: 'OK' }]
            );
            await resetExtractionToReady(extraction.id);
        } else {
            Alert.alert('Error', 'No se pudo crear el borrador.');
        }
    };

    const openCreateModalForEdit = (draft: EventDraft) => {
        const draftData = {
            draftId: draft.id,
            extraction_job_id: draft.extraction_job_id || undefined,
            title: draft.title,
            description: draft.description || '',
            category: draft.category || 'general',
            image: draft.image || '',
            date: draft.date || '',
            time: draft.time || '',
            end_time: draft.end_time || '',
            location: draft.location || '',
            organizer: draft.organizer || '',
            price: draft.price ? String(draft.price) : '',
            registration_form_url: draft.registration_form_url || '',
            source_image_url: draft.source_image_url || '',
            target_audience: draft.target_audience || [],
            is_recurring: draft.is_recurring,
            recurring_dates: draft.recurring_dates || [],
            subcategory: draft.subcategory || null,
            tags: draft.tags || [],
            event_features: draft.event_features || null,
        };

        setCurrentDraft(draftData);
        setIsCreateModalVisible(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalVisible(false);
        setCurrentDraft(null);
        if (user?.id) {
            fetchDrafts(user.id);
        }
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

    // Auto-create draft from analysis (batch mode)
    const autoCreateDraftFromAnalysis = async (extraction: Extraction) => {
        if (!user?.id || !extraction.analysis) return;

        const draftData = buildDraftDataFromAnalysis(extraction, user.id);
        const draftId = await saveDraft(draftData);

        if (draftId) {
            setBatchDraftsCreated(prev => prev + 1);
        }

        setBatchCompleted(prev => prev + 1);

        // Reset extraction to ready for next image
        await resetExtractionToReady(extraction.id);

        // Check if batch is complete
        if (batchCompleted + 1 >= batchTotal) {
            // Batch complete!
            const draftsCreated = batchDraftsCreated + (draftId ? 1 : 0);
            setIsBatchMode(false);
            setBatchTotal(0);
            setBatchCompleted(0);
            setBatchDraftsCreated(0);
            setBatchSourceExtraction(null);

            // Refresh drafts
            if (user?.id) {
                await fetchDrafts(user.id);
            }

            Alert.alert(
                'Análisis completado',
                `Se crearon ${draftsCreated} borrador${draftsCreated !== 1 ? 'es' : ''} exitosamente.\n\nPuedes verlos en la sección de Borradores.`,
                [{ text: 'OK' }]
            );
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

        const isMultiple = selectedImages.length > 1;

        // Create queue of images to analyze
        const queue = selectedImages.map(imageUrl => ({
            extractionId: selectedExtraction.id,
            imageUrl,
        }));

        // Close modal and start processing
        const sourceExtraction = selectedExtraction;
        setSelectedExtraction(null);

        if (isMultiple) {
            // Batch mode: auto-create drafts for each analysis
            setIsBatchMode(true);
            setBatchTotal(queue.length);
            setBatchCompleted(0);
            setBatchDraftsCreated(0);
            setBatchSourceExtraction(sourceExtraction);
        }

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
        <View style={[styles.container, !embedded && { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                {!embedded && (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
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

            {/* Batch Analysis Progress Banner */}
            {isBatchMode && (
                <View style={styles.batchProgressBanner}>
                    <View style={styles.batchProgressContent}>
                        <MiniSphereLoader />
                        <View style={styles.batchProgressText}>
                            <Text style={styles.batchProgressTitle}>
                                Analizando imágenes ({batchCompleted + 1}/{batchTotal})
                            </Text>
                            <Text style={styles.batchProgressSubtitle}>
                                {batchDraftsCreated > 0
                                    ? `${batchDraftsCreated} borrador${batchDraftsCreated !== 1 ? 'es' : ''} creado${batchDraftsCreated !== 1 ? 's' : ''}`
                                    : 'Creando borradores automáticamente...'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.batchProgressBar}>
                        <View
                            style={[
                                styles.batchProgressFill,
                                { width: `${((batchCompleted) / batchTotal) * 100}%` }
                            ]}
                        />
                    </View>
                </View>
            )}

            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={true} nestedScrollEnabled={true}>
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

                                <FlatList
                                    data={selectedExtraction?.images || []}
                                    keyExtractor={(item, index) => `${index}`}
                                    numColumns={3}
                                    contentContainerStyle={styles.imageGrid}
                                    renderItem={({ item }) => {
                                        const isSelected = selectedImages.includes(item);
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.imageItem,
                                                    isSelected && styles.imageItemSelected
                                                ]}
                                                onPress={() => toggleImageSelection(item)}
                                                onLongPress={() => handleSelectImage(item)}
                                            >
                                                <Image source={{ uri: item }} style={styles.gridImage} />
                                                {isSelected && (
                                                    <View style={styles.checkOverlay}>
                                                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={styles.selectAllButton}
                                        onPress={handleSelectAll}
                                    >
                                        <Text style={styles.selectAllText}>
                                            {selectedImages.length === (selectedExtraction?.images?.length || 0)
                                                ? 'Deseleccionar todo'
                                                : 'Seleccionar todo'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.analyzeButton,
                                            selectedImages.length === 0 && styles.analyzeButtonDisabled
                                        ]}
                                        onPress={handleAnalyzeSelected}
                                        disabled={selectedImages.length === 0}
                                    >
                                        <Text style={styles.analyzeButtonText}>
                                            {selectedImages.length > 1
                                                ? `Analizar (${selectedImages.length})`
                                                : 'Analizar imagen'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Event Form Modal for Editing Drafts */}
            <Modal
                visible={isCreateModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeCreateModal}
            >
                <View style={{ flex: 1 }}>
                    <EventForm
                        initialData={currentDraft}
                        onSuccess={closeCreateModal}
                        onCancel={closeCreateModal}
                        isModal={true}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#0F0F0F',
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    backButton: {
        marginBottom: 10,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    badge: {
        backgroundColor: '#4B3F1B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FCD34D',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    extractionCard: {
        backgroundColor: '#1F1F1F',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        marginRight: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    imageCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    extractionContent: {
        flex: 1,
    },
    extractionUrl: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
    draftCard: {
        backgroundColor: '#1F1F1F',
        borderRadius: 16,
        marginBottom: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    draftCardProcessing: {
        opacity: 0.7,
    },
    draftThumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        marginRight: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    draftContent: {
        flex: 1,
        marginRight: 8,
    },
    draftTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    draftMeta: {
        fontSize: 12,
        color: '#6B7280',
    },
    draftLoadingContainer: {
        padding: 8,
    },
    draftActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    draftActionButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#2A2A2A',
    },
    publishButton: {
        backgroundColor: '#064E3B',
    },
    clearButton: {
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalDismiss: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1F1F1F',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    modalCancel: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    analyzingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    queueProgressText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 16,
    },
    modalSubtitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        flex: 1,
        marginRight: 16,
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
    imageGrid: {
        padding: 2,
    },
    imageItem: {
        flex: 1 / 3,
        aspectRatio: 1,
        margin: 2,
        position: 'relative',
    },
    imageItemSelected: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    checkOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#1F1F1F',
    },
    analyzeButton: {
        backgroundColor: '#8B5CF6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#374151',
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        color: '#9CA3AF',
        fontSize: 12,
        textAlign: 'center',
    },
    // Batch analysis progress styles
    batchProgressBanner: {
        backgroundColor: '#1F1F1F',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
        padding: 16,
    },
    batchProgressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    batchProgressText: {
        flex: 1,
    },
    batchProgressTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    batchProgressSubtitle: {
        color: '#9CA3AF',
        fontSize: 13,
        marginTop: 2,
    },
    batchProgressBar: {
        height: 4,
        backgroundColor: '#2A2A2A',
        borderRadius: 2,
        overflow: 'hidden',
    },
    batchProgressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
    },
});

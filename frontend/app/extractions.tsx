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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useExtractionStore, Extraction, ExtractionStatus } from '../src/store/extractionStore';
import { AnimatedLoader, InlineLoader, MiniSphereLoader } from '../src/components/AnimatedLoader';
import { useAuth } from '../src/context/AuthContext';

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
    } = useExtractionStore();

    // Image selector modal state
    const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Track app state for foreground refresh
    const appState = useRef(AppState.currentState);

    // Start polling on mount, stop on unmount
    useEffect(() => {
        if (user?.id) {
            startPolling(user.id);
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
                // App has come to the foreground, refresh data
                console.log('App returned to foreground, refreshing extractions...');
                if (user?.id) {
                    fetchExtractions(user.id);
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user?.id, fetchExtractions]);

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
        } else if (extraction.status === 'completed') {
            // Navigate to create with pre-filled data
            router.push({
                pathname: '/create',
                params: {
                    extractionId: extraction.id,
                    image: extraction.selectedImage,
                    title: extraction.analysis?.event_name || '',
                    description: extraction.analysis?.description || '',
                    location: extraction.analysis?.location || '',
                    date: extraction.analysis?.date || '',
                    time: extraction.analysis?.time || '',
                }
            });
        }
    };

    const handleSelectImage = async (imageUrl: string) => {
        if (!selectedExtraction) return;

        setIsAnalyzing(true);
        await selectImage(selectedExtraction.id, imageUrl);
        setIsAnalyzing(false);
        setSelectedExtraction(null);

        // Show feedback that analysis has started
        Alert.alert(
            'Análisis iniciado',
            'La imagen se está analizando. Puedes cerrar la app y volver más tarde.',
            [{ text: 'OK' }]
        );
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Eliminar extracción',
            '¿Estás seguro de eliminar esta extracción?',
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

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString();
    };

    const renderExtraction = ({ item }: { item: Extraction }) => {
        const statusInfo = getStatusInfo(item.status);
        const isLoading = item.status === 'pending' || item.status === 'extracting' || item.status === 'analyzing';

        return (
            <TouchableOpacity
                style={styles.extractionCard}
                onPress={() => handleExtractionPress(item)}
                disabled={isLoading || item.status === 'failed'}
                activeOpacity={0.7}
            >
                {/* Thumbnail or placeholder */}
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

                {/* Content */}
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
                        <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
                    </View>

                    {item.error && item.status === 'failed' && (
                        <Text style={styles.errorText} numberOfLines={1}>{item.error}</Text>
                    )}
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
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
                        {isPolling && pendingCount > 0 && ' (actualizando...)'}
                    </Text>
                </View>
                {extractions.some(e => e.status === 'completed' || e.status === 'failed') && (
                    <TouchableOpacity onPress={handleClearCompleted} style={styles.clearButton}>
                        <Ionicons name="trash-bin-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {extractions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cloud-download-outline" size={64} color="#3A3A3A" />
                    <Text style={styles.emptyTitle}>No hay extracciones</Text>
                    <Text style={styles.emptyText}>
                        Las URLs de Instagram que agregues aparecerán aquí mientras se procesan.
                        {'\n\n'}
                        Puedes cerrar la app y volver más tarde - tus extracciones se guardan automáticamente.
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
                <FlatList
                    data={extractions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderExtraction}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Image Selector Modal */}
            <Modal
                visible={!!selectedExtraction}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedExtraction(null)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={styles.modalDismiss}
                        onPress={() => setSelectedExtraction(null)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecciona una imagen</Text>
                            <TouchableOpacity onPress={() => setSelectedExtraction(null)}>
                                <Text style={styles.modalCancel}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>

                        {isAnalyzing ? (
                            <View style={styles.analyzingContainer}>
                                <AnimatedLoader text="Analizando" size={180} />
                            </View>
                        ) : (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    Este post tiene {selectedExtraction?.images?.length || 0} imágenes.
                                </Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.imageScrollContent}
                                >
                                    {selectedExtraction?.images?.map((imgUrl, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => handleSelectImage(imgUrl)}
                                            style={styles.imageOption}
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
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
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
    list: {
        padding: 16,
        gap: 12,
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
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
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
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
});

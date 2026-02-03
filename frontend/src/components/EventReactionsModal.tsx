import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Pressable,
    Dimensions,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient';
import { useEventStore, PublicReaction } from '../store/eventStore';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Emoji reactions (quick select)
const EMOJI_REACTIONS = ['😍', '🔥', '👏', '🎉', '❤️', '🤩', '😂', '👍', '🙌', '💯'];

export interface EventReaction {
    emoji_rating?: string | null;
    reaction_sticker?: string | null;
    reaction_gif?: string | null;
    reaction_comment?: string | null;
}

interface EventReactionsModalProps {
    visible: boolean;
    onClose: () => void;
    event: {
        id: string;
        title: string;
        image?: string | null;
        category?: string;
        date?: string;
    };
    currentReaction?: EventReaction;
    onSave: (reaction: EventReaction) => Promise<void>;
}

export default function EventReactionsModal({
    visible,
    onClose,
    event,
    currentReaction,
    onSave,
}: EventReactionsModalProps) {
    const { user } = useAuth();
    const { fetchPublicReactions } = useEventStore();

    const [reactions, setReactions] = useState<PublicReaction[]>([]);
    const [isLoadingReactions, setIsLoadingReactions] = useState(true);
    const [showComposer, setShowComposer] = useState(false);

    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
        currentReaction?.emoji_rating || null
    );
    const [comment, setComment] = useState<string>(
        currentReaction?.reaction_comment || ''
    );
    const [isSaving, setIsSaving] = useState(false);

    // Load public reactions when modal opens
    useEffect(() => {
        if (visible && event.id) {
            loadReactions();
        }
    }, [visible, event.id]);

    const loadReactions = async () => {
        setIsLoadingReactions(true);
        try {
            const data = await fetchPublicReactions(event.id);
            setReactions(data);
        } catch (error) {
            console.error('Error loading reactions:', error);
        } finally {
            setIsLoadingReactions(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                emoji_rating: selectedEmoji,
                reaction_sticker: null,
                reaction_gif: null,
                reaction_comment: comment.trim() || null,
            });
            setShowComposer(false);
            // Reload reactions after saving
            await loadReactions();
        } catch (error) {
            console.error('Error saving reaction:', error);
            if (Platform.OS === 'web') {
                alert('No se pudo guardar la reacción');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(selectedEmoji === emoji ? null : emoji);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 7) return `hace ${diffDays}d`;
        return date.toLocaleDateString('es-GT', { month: 'short', day: 'numeric' });
    };

    const userHasReacted = reactions.some(r => r.user_id === user?.id);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.container}>
                    {/* Header with event info */}
                    <View style={styles.header}>
                        <View style={styles.eventInfo}>
                            {event.image && (
                                <Image source={{ uri: event.image }} style={styles.eventImage} />
                            )}
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventTitle} numberOfLines={2}>
                                    {event.title}
                                </Text>
                                <Text style={styles.reactionsCount}>
                                    {reactions.length} {reactions.length === 1 ? 'reacción' : 'reacciones'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Reactions Thread */}
                    <ScrollView
                        style={styles.reactionsThread}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.reactionsThreadContent}
                    >
                        {isLoadingReactions ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#8B5CF6" />
                                <Text style={styles.loadingText}>Cargando reacciones...</Text>
                            </View>
                        ) : reactions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#4B5563" />
                                <Text style={styles.emptyTitle}>Sin reacciones aún</Text>
                                <Text style={styles.emptySubtitle}>¡Sé el primero en compartir cómo estuvo!</Text>
                            </View>
                        ) : (
                            reactions.map((reaction) => (
                                <View
                                    key={reaction.id}
                                    style={[
                                        styles.reactionItem,
                                        reaction.user_id === user?.id && styles.reactionItemOwn
                                    ]}
                                >
                                    {/* User Avatar */}
                                    <View style={styles.avatarContainer}>
                                        {reaction.user_avatar ? (
                                            <Image source={{ uri: reaction.user_avatar }} style={styles.avatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Ionicons name="person" size={20} color="#9CA3AF" />
                                            </View>
                                        )}
                                    </View>

                                    {/* Reaction Content */}
                                    <View style={styles.reactionContent}>
                                        <View style={styles.reactionHeader}>
                                            <Text style={styles.userName}>
                                                {reaction.user_id === user?.id ? 'Tú' : reaction.user_name}
                                            </Text>
                                            <Text style={styles.reactionTime}>
                                                {formatTimeAgo(reaction.attended_at)}
                                            </Text>
                                        </View>

                                        {/* Emoji reaction */}
                                        {reaction.emoji_rating && (
                                            <View style={styles.emojiReaction}>
                                                <Text style={styles.reactionEmoji}>{reaction.emoji_rating}</Text>
                                            </View>
                                        )}

                                        {/* Comment */}
                                        {reaction.reaction_comment && (
                                            <Text style={styles.reactionComment}>{reaction.reaction_comment}</Text>
                                        )}

                                        {/* If no emoji and no comment, show attended badge */}
                                        {!reaction.emoji_rating && !reaction.reaction_comment && (
                                            <View style={styles.attendedBadge}>
                                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                                <Text style={styles.attendedText}>Asistió</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Composer Section */}
                    {showComposer ? (
                        <View style={styles.composer}>
                            <Text style={styles.composerTitle}>Tu reacción</Text>

                            {/* Emoji selector */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.emojiScroll}
                                contentContainerStyle={styles.emojiScrollContent}
                            >
                                {EMOJI_REACTIONS.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[
                                            styles.emojiButton,
                                            selectedEmoji === emoji && styles.emojiButtonSelected,
                                        ]}
                                        onPress={() => handleEmojiSelect(emoji)}
                                    >
                                        <Text style={styles.emojiText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Comment Input */}
                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Escribe un comentario..."
                                    placeholderTextColor="#6B7280"
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    maxLength={280}
                                />
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.composerActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowComposer(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.saveButtonGradient}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={16} color="#FFF" />
                                                <Text style={styles.saveButtonText}>Publicar</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* Add Reaction Button */
                        <TouchableOpacity
                            style={styles.addReactionButton}
                            onPress={() => setShowComposer(true)}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.addReactionGradient}
                            >
                                <Ionicons
                                    name={userHasReacted ? "create-outline" : "add-circle-outline"}
                                    size={20}
                                    color="#FFF"
                                />
                                <Text style={styles.addReactionText}>
                                    {userHasReacted ? 'Editar mi reacción' : 'Añadir reacción'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    container: {
        backgroundColor: '#0F0F0F',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F1F',
    },
    eventInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    eventImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#333',
    },
    eventDetails: {
        flex: 1,
    },
    eventTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    reactionsCount: {
        color: '#9CA3AF',
        fontSize: 13,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },

    // Loading state
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#6B7280',
        fontSize: 14,
        marginTop: 4,
    },

    // Reactions Thread
    reactionsThread: {
        flex: 1,
    },
    reactionsThreadContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    reactionItem: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    reactionItemOwn: {
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        marginHorizontal: -16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 0,
    },
    avatarContainer: {
        width: 40,
        height: 40,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionContent: {
        flex: 1,
    },
    reactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    reactionTime: {
        color: '#6B7280',
        fontSize: 12,
        marginLeft: 8,
    },
    emojiReaction: {
        alignSelf: 'flex-start',
        backgroundColor: '#1F1F1F',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 6,
    },
    reactionEmoji: {
        fontSize: 24,
    },
    reactionComment: {
        color: '#E5E7EB',
        fontSize: 15,
        lineHeight: 22,
    },
    attendedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    attendedText: {
        color: '#10B981',
        fontSize: 13,
    },

    // Composer
    composer: {
        borderTopWidth: 1,
        borderTopColor: '#1F1F1F',
        padding: 16,
        paddingBottom: 32,
    },
    composerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    emojiScroll: {
        marginBottom: 12,
    },
    emojiScrollContent: {
        gap: 8,
    },
    emojiButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1F1F1F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiButtonSelected: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    emojiText: {
        fontSize: 22,
    },
    commentInputContainer: {
        marginBottom: 12,
    },
    commentInput: {
        backgroundColor: '#1F1F1F',
        borderRadius: 12,
        padding: 12,
        color: '#FFF',
        fontSize: 15,
        minHeight: 60,
        maxHeight: 100,
        textAlignVertical: 'top',
    },
    composerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '500',
    },
    saveButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },

    // Add Reaction Button
    addReactionButton: {
        margin: 16,
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    addReactionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    addReactionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

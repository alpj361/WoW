import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type Procesion, isToday } from '../data/cuaresma-data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProcessionDetailModalProps {
    procesion: Procesion | null;
    visible: boolean;
    onClose: () => void;
}

export function ProcessionDetailModal({ procesion, visible, onClose }: ProcessionDetailModalProps) {
    if (!procesion) return null;

    const isTodayProcession = isToday(procesion.fecha);
    const hasRouteImage = procesion.imagenes_recorrido.length > 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={22} color="#9CA3AF" />
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Header with gradient */}
                        <LinearGradient
                            colors={['#581C87', '#6B21A8', '#1E1B2E']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <View style={styles.headerContent}>
                                {isTodayProcession && (
                                    <View style={styles.todayBadge}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.todayBadgeText}>HOY</Text>
                                    </View>
                                )}
                                <Text style={styles.processionName}>{procesion.nombre_procesion}</Text>
                                <View style={styles.dateRow}>
                                    <Ionicons name="calendar-outline" size={14} color="#C4B5FD" />
                                    <Text style={styles.dateText}>{procesion.fecha}</Text>
                                </View>
                                <View style={styles.scheduleChip}>
                                    <Ionicons name="time-outline" size={14} color="#A855F7" />
                                    <Text style={styles.scheduleChipText}>
                                        {procesion.horarios.salida !== 'N/A' &&
                                            procesion.horarios.salida !== 'Pendiente de confirmar' &&
                                            procesion.horarios.salida !== 'Por confirmar'
                                            ? `Salida ${procesion.horarios.salida} · Entrada ${procesion.horarios.entrada}`
                                            : 'Horario por confirmar'}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Route map image */}
                        {hasRouteImage && (
                            <View style={styles.mapSection}>
                                <View style={styles.mapHeader}>
                                    <Ionicons name="map-outline" size={16} color="#A855F7" />
                                    <Text style={styles.mapTitle}>Mapa del Recorrido</Text>
                                </View>
                                <Image
                                    source={{ uri: procesion.imagenes_recorrido[0].value }}
                                    style={styles.mapImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        {/* Reference points timeline */}
                        {procesion.puntos_referencia.length > 0 && (
                            <View style={styles.timelineSection}>
                                <View style={styles.timelineHeader}>
                                    <Ionicons name="navigate-outline" size={16} color="#A855F7" />
                                    <Text style={styles.timelineTitle}>Puntos de Referencia</Text>
                                </View>

                                <View style={styles.timeline}>
                                    {procesion.puntos_referencia.map((punto, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === procesion.puntos_referencia.length - 1;
                                        const hasTime = punto.hora !== 'N/A';

                                        return (
                                            <View key={idx} style={styles.timelineItem}>
                                                {/* Vertical line */}
                                                {!isFirst && <View style={styles.timelineLineTop} />}
                                                {!isLast && <View style={styles.timelineLineBottom} />}

                                                {/* Dot */}
                                                <View style={[
                                                    styles.timelineDot,
                                                    isFirst && styles.timelineDotStart,
                                                    isLast && styles.timelineDotEnd,
                                                ]} />

                                                {/* Content */}
                                                <View style={styles.timelineContent}>
                                                    <Text style={styles.timelineLugar}>{punto.lugar}</Text>
                                                    {hasTime && (
                                                        <Text style={styles.timelineHora}>{punto.hora}</Text>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Bottom spacing */}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1E1B2E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.88,
        minHeight: SCREEN_HEIGHT * 0.5,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4B5563',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },

    // Header gradient
    headerGradient: {
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerContent: {
        gap: 8,
    },
    todayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
        marginBottom: 4,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#34D399',
    },
    todayBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#34D399',
        letterSpacing: 0.8,
    },
    processionName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F5F3FF',
        lineHeight: 26,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#C4B5FD',
        fontWeight: '500',
    },
    scheduleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    scheduleChipText: {
        fontSize: 13,
        color: '#C4B5FD',
        fontWeight: '600',
    },

    // Map section
    mapSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    mapTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E5E7EB',
    },
    mapImage: {
        width: '100%',
        height: 280,
        borderRadius: 14,
        backgroundColor: '#2A1A3E',
    },

    // Timeline section
    timelineSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E5E7EB',
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 44,
        position: 'relative',
    },
    timelineLineTop: {
        position: 'absolute',
        left: 5,
        top: 0,
        width: 2,
        height: 10,
        backgroundColor: '#7C3AED',
        opacity: 0.4,
    },
    timelineLineBottom: {
        position: 'absolute',
        left: 5,
        top: 22,
        width: 2,
        bottom: 0,
        backgroundColor: '#7C3AED',
        opacity: 0.4,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4B5563',
        borderWidth: 2,
        borderColor: '#7C3AED',
        marginTop: 4,
        marginRight: 12,
        zIndex: 1,
    },
    timelineDotStart: {
        backgroundColor: '#34D399',
        borderColor: '#34D399',
    },
    timelineDotEnd: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 16,
    },
    timelineLugar: {
        fontSize: 14,
        color: '#E5E7EB',
        fontWeight: '500',
        lineHeight: 20,
    },
    timelineHora: {
        fontSize: 13,
        color: '#A855F7',
        fontWeight: '700',
        marginTop: 2,
    },
});

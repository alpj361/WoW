import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { procesionesEstaSemana, isToday } from '../data/cuaresma-data';

interface CuaresmaBannerProps {
    onPress: () => void;
    isActive: boolean;
}

export function CuaresmaBanner({ onPress, isActive }: CuaresmaBannerProps) {
    const hasProcessionToday = procesionesEstaSemana.some(p => isToday(p.fecha));
    const todayCount = procesionesEstaSemana.filter(p => isToday(p.fecha)).length;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.container, isActive && styles.containerActive]}
        >
            <LinearGradient
                colors={['#581C87', '#6B21A8', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative cross pattern */}
                <View style={styles.decorativePattern}>
                    <Ionicons name="add" size={120} color="rgba(255,255,255,0.04)" />
                </View>

                <View style={styles.content}>
                    <View style={styles.leftSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flower-outline" size={22} color="#E9D5FF" />
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>Cuaresma 2026</Text>
                                {hasProcessionToday && (
                                    <View style={styles.todayBadge}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.todayBadgeText}>HOY</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.subtitle}>
                                {hasProcessionToday
                                    ? `${todayCount} procesión${todayCount > 1 ? 'es' : ''} hoy · ${procesionesEstaSemana.length} esta semana`
                                    : `${procesionesEstaSemana.length} procesiones esta semana`
                                }
                            </Text>
                        </View>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#C4B5FD"
                        style={styles.chevron}
                    />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
    },
    containerActive: {
        borderColor: '#A855F7',
        borderWidth: 1.5,
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativePattern: {
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F5F3FF',
        letterSpacing: 0.3,
    },
    todayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34D399',
    },
    todayBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#E9D5FF',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        color: '#C4B5FD',
        marginTop: 2,
    },
    chevron: {
        marginLeft: 8,
    },
});

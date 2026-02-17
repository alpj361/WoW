import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export type FeedMode = 'eventos' | 'cuaresma';

interface FeedModeToggleProps {
    mode: FeedMode;
    onModeChange: (mode: FeedMode) => void;
}

export function FeedModeToggle({ mode, onModeChange }: FeedModeToggleProps) {
    const slideAnim = useRef(new Animated.Value(mode === 'eventos' ? 0 : 1)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: mode === 'eventos' ? 0 : 1,
            useNativeDriver: false,
            tension: 60,
            friction: 10,
        }).start();
    }, [mode]);

    const indicatorLeft = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['2%', '50%'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                {/* Sliding indicator */}
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            left: indicatorLeft,
                            backgroundColor: mode === 'cuaresma' ? '#7C3AED' : '#8B5CF6',
                        },
                    ]}
                />

                {/* Eventos tab */}
                <TouchableOpacity
                    style={styles.tab}
                    activeOpacity={0.8}
                    onPress={() => onModeChange('eventos')}
                >
                    <Ionicons
                        name="compass-outline"
                        size={16}
                        color={mode === 'eventos' ? '#FFF' : '#9CA3AF'}
                    />
                    <Text style={[styles.tabText, mode === 'eventos' && styles.activeTabText]}>
                        Eventos
                    </Text>
                </TouchableOpacity>

                {/* Cuaresma tab */}
                <TouchableOpacity
                    style={styles.tab}
                    activeOpacity={0.8}
                    onPress={() => onModeChange('cuaresma')}
                >
                    <Ionicons
                        name="flower-outline"
                        size={16}
                        color={mode === 'cuaresma' ? '#FFF' : '#9CA3AF'}
                    />
                    <Text style={[styles.tabText, mode === 'cuaresma' && styles.activeTabText]}>
                        Cuaresma
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    track: {
        flexDirection: 'row',
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        padding: 3,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: 3,
        bottom: 3,
        width: '48%',
        borderRadius: 14,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        zIndex: 1,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    activeTabText: {
        color: '#FFF',
        fontWeight: '700',
    },
    hoyBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 2,
    },
    hoyText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#E9D5FF',
        letterSpacing: 0.5,
    },
});

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    interpolateColor,
    Extrapolation,
    SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SwipeOverlayProps {
    translateX: SharedValue<number>;
    threshold: number;
}

export const SwipeOverlay: React.FC<SwipeOverlayProps> = ({ translateX, threshold }) => {
    // Like overlay (right swipe - green)
    const likeOverlayStyle = useAnimatedStyle(() => {
        const progress = interpolate(
            translateX.value,
            [0, threshold],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity: progress,
            transform: [{ scale: interpolate(progress, [0, 1], [0.5, 1]) }],
        };
    });

    // Skip overlay (left swipe - red)
    const skipOverlayStyle = useAnimatedStyle(() => {
        const progress = interpolate(
            translateX.value,
            [0, -threshold],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity: progress,
            transform: [{ scale: interpolate(progress, [0, 1], [0.5, 1]) }],
        };
    });

    // Card border glow based on swipe direction
    const cardGlowStyle = useAnimatedStyle(() => {
        const likeProgress = interpolate(
            translateX.value,
            [0, threshold],
            [0, 1],
            Extrapolation.CLAMP
        );
        const skipProgress = interpolate(
            translateX.value,
            [0, -threshold],
            [0, 1],
            Extrapolation.CLAMP
        );

        const glowColor = interpolateColor(
            translateX.value,
            [-threshold, 0, threshold],
            ['rgba(239, 68, 68, 0.4)', 'transparent', 'rgba(16, 185, 129, 0.4)']
        );

        return {
            borderColor: glowColor,
            borderWidth: Math.max(likeProgress, skipProgress) * 3,
        };
    });

    return (
        <>
            {/* Like indicator (right) */}
            <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
                <View style={styles.iconCircle}>
                    <Ionicons name="heart" size={32} color="#10B981" />
                </View>
                <Text style={[styles.overlayText, styles.likeText]}>GUARDAR</Text>
            </Animated.View>

            {/* Skip indicator (left) */}
            <Animated.View style={[styles.overlay, styles.skipOverlay, skipOverlayStyle]}>
                <View style={[styles.iconCircle, styles.skipCircle]}>
                    <Ionicons name="close" size={32} color="#EF4444" />
                </View>
                <Text style={[styles.overlayText, styles.skipText]}>PASAR</Text>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 20,
        zIndex: 10,
        alignItems: 'center',
        gap: 8,
    },
    likeOverlay: {
        left: 20,
    },
    skipOverlay: {
        right: 20,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
        borderColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipCircle: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444',
    },
    overlayText: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
    likeText: {
        color: '#10B981',
    },
    skipText: {
        color: '#EF4444',
    },
});

export default SwipeOverlay;

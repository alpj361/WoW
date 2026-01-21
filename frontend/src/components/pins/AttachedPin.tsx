import React, { useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
    withRepeat,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const PIN_IMAGE = require('../../../assets/images/pin-aesdi.png');

interface AttachedPinProps {
    index: number;
    isNew?: boolean;
}

// Card flip animation takes ~500ms, so we wait for that before snapping
const FLIP_DURATION = 600;

export const AttachedPin: React.FC<AttachedPinProps> = ({ index, isNew = false }) => {
    // Animation values
    const scale = useSharedValue(isNew ? 1.2 : 1);
    const translateX = useSharedValue(isNew ? 60 : 0);
    const translateY = useSharedValue(isNew ? -80 : 0);
    const rotation = useSharedValue(isNew ? 8 : 0);
    const opacity = useSharedValue(1);

    // Floating animation
    const floatY = useSharedValue(0);

    // Metallic sheen animation - subtle continuous tilt
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);

    useEffect(() => {
        if (isNew) {
            // Subtle floating animation
            floatY.value = withSequence(
                withTiming(-5, { duration: 300 }),
                withTiming(5, { duration: 300 }),
                withTiming(0, { duration: 200 })
            );

            // Magnetic snap after card flip
            translateX.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 5,
                stiffness: 500,
                mass: 0.2,
            }));

            translateY.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 5,
                stiffness: 500,
                mass: 0.2,
            }));

            scale.value = withDelay(FLIP_DURATION, withSequence(
                withSpring(0.9, { damping: 15, stiffness: 400 }),
                withSpring(1.1, { damping: 10, stiffness: 300 }),
                withSpring(1, { damping: 12, stiffness: 200 })
            ));

            rotation.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 6,
                stiffness: 300,
            }));
        }

        // Subtle continuous tilt for metallic sheen effect
        tiltX.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1, // Infinite
            true // Reverse
        );

        tiltY.value = withRepeat(
            withSequence(
                withTiming(-2, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
                withTiming(2, { duration: 2500, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, [isNew]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { perspective: 800 },
            { translateX: translateX.value },
            { translateY: translateY.value + floatY.value },
            { rotate: `${rotation.value}deg` },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${tiltY.value}deg` },
            { scale: scale.value },
        ],
    }));

    // Sheen gradient position responds opposite to tilt
    const sheenStyle = useAnimatedStyle(() => ({
        opacity: interpolate(Math.abs(tiltX.value + tiltY.value), [0, 5], [0.06, 0.12]),
        transform: [
            // Move opposite to tilt direction for reflective effect
            { translateX: -tiltY.value * 3 },
            { translateY: -tiltX.value * 3 },
        ],
    }));

    const positionStyle = {
        right: 8 + (index * 3),
        top: 8 + (index * 3),
    };

    return (
        <Animated.View style={[styles.pinContainer, positionStyle, animatedStyle]}>
            {/* Pin image */}
            <Image
                source={PIN_IMAGE}
                style={styles.pinImage}
                resizeMode="contain"
            />
            {/* Metallic sheen overlay - diagonal gradient */}
            <Animated.View style={[styles.sheenOverlay, sheenStyle]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.8)', 'transparent', 'rgba(255,255,255,0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sheenGradient}
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    pinContainer: {
        position: 'absolute',
        width: 45,
        height: 55,
        overflow: 'hidden',
        borderRadius: 4,
    },
    pinImage: {
        width: '100%',
        height: '100%',
    },
    sheenOverlay: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        pointerEvents: 'none',
    },
    sheenGradient: {
        flex: 1,
    },
});

export default AttachedPin;

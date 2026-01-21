import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    runOnJS,
    interpolate,
    Extrapolation,
    Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIN_SIZE = 100;

// Pin image
const PIN_IMAGE = require('../../../assets/images/pin-aesdi.png');

interface PinAwardOverlayProps {
    visible: boolean;
    pinName: string;
    onAttach: () => void;
    onDismiss: () => void;
    targetPosition: { x: number; y: number };
}

export const PinAwardOverlay: React.FC<PinAwardOverlayProps> = ({
    visible,
    pinName,
    onAttach,
    onDismiss,
    targetPosition,
}) => {
    // Animation values
    const showProgress = useSharedValue(0);
    const pinScale = useSharedValue(0);
    const pinTranslateX = useSharedValue(0);
    const pinTranslateY = useSharedValue(50);
    const textProgress = useSharedValue(0);
    const isAttaching = useSharedValue(false);

    const isVisible = useSharedValue(false);

    useEffect(() => {
        if (visible) {
            isVisible.value = true;
            isAttaching.value = false;
            pinTranslateX.value = 0;
            // Entrance animation
            showProgress.value = withTiming(1, { duration: 300 });
            pinScale.value = withDelay(100, withSpring(1.2, { damping: 10, stiffness: 100 }));
            pinTranslateY.value = withDelay(100, withSpring(0, { damping: 12, stiffness: 80 }));
            textProgress.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 80 }));
        } else {
            // Reset values
            showProgress.value = 0;
            pinScale.value = 0;
            pinTranslateX.value = 0;
            pinTranslateY.value = 50;
            textProgress.value = 0;
            isVisible.value = false;
            isAttaching.value = false;
        }
    }, [visible]);

    const triggerAttach = () => {
        onAttach();
    };

    const handleTap = () => {
        if (isAttaching.value) return;
        isAttaching.value = true;

        // Hide text immediately
        textProgress.value = withTiming(0, { duration: 150 });

        // Fly pin to card position with magnetic snap effect
        // Target: top-right area of the card (approximately)
        const flyToX = targetPosition.x; // Will move right
        const flyToY = targetPosition.y; // Will move up

        // Magnetic fly animation - fast with slight overshoot
        pinTranslateX.value = withSpring(flyToX, {
            damping: 12,
            stiffness: 150,
            mass: 0.5,
        });

        pinTranslateY.value = withSpring(flyToY, {
            damping: 12,
            stiffness: 150,
            mass: 0.5,
        });

        // Scale down as it flies
        pinScale.value = withTiming(0.4, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
        });

        // Fade backdrop
        showProgress.value = withDelay(200, withTiming(0, { duration: 300 }));

        // After animation completes, trigger attach
        setTimeout(() => {
            runOnJS(triggerAttach)();
        }, 450);
    };

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(handleTap)();
        });

    // Backdrop style
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(showProgress.value, [0, 1], [0, 0.9]),
        pointerEvents: isVisible.value ? 'auto' : 'none',
    }));

    // Pin container style - now with X translation for flying
    const pinContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: pinTranslateX.value },
            { translateY: pinTranslateY.value },
            { scale: pinScale.value },
        ],
        opacity: isVisible.value ? 1 : 0,
    }));

    // Text style
    const textStyle = useAnimatedStyle(() => ({
        opacity: textProgress.value,
        transform: [
            { translateY: interpolate(textProgress.value, [0, 1], [20, 0]) },
            { scale: interpolate(textProgress.value, [0, 1], [0.8, 1]) },
        ],
    }));

    // Glow style
    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pinScale.value, [0, 1.2], [0, 1]),
        transform: [{ scale: pinScale.value }],
    }));

    // Instruction text
    const instructionStyle = useAnimatedStyle(() => ({
        opacity: interpolate(textProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    }));

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]} />

            {/* Pin and content */}
            <GestureDetector gesture={tapGesture}>
                <View style={styles.content}>
                    <Animated.View style={[styles.pinWrapper, pinContainerStyle]}>
                        {/* Glow effect */}
                        <Animated.View style={[styles.glow, glowStyle]} />

                        {/* Metallic pin frame */}
                        <View style={styles.metallicFrame}>
                            {/* Inner metallic border */}
                            <View style={styles.metallicInner}>
                                {/* Pin image */}
                                <Image
                                    source={PIN_IMAGE}
                                    style={styles.pinImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Pin name */}
                    <Animated.View style={[styles.textContainer, textStyle]}>
                        <Text style={styles.congratsText}>¡Nuevo Pin!</Text>
                        <Text style={styles.pinName}>{pinName}</Text>
                        <View style={styles.nameLine} />
                    </Animated.View>

                    {/* Instruction */}
                    <Animated.Text style={[styles.instruction, instructionStyle]}>
                        Toca para agregar a tu tarjeta
                    </Animated.Text>
                </View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0a0a0a',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    pinWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: PIN_SIZE * 2,
        height: PIN_SIZE * 2,
        borderRadius: PIN_SIZE,
        backgroundColor: 'rgba(139, 92, 246, 0.4)',
    },
    metallicFrame: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#C0C0C0', // Silver base
        // Metallic effect with shadows
        shadowColor: '#FFFFFF',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 8,
        borderWidth: 2,
        borderTopColor: '#E8E8E8',
        borderLeftColor: '#E8E8E8',
        borderRightColor: '#808080',
        borderBottomColor: '#808080',
    },
    metallicInner: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#A8A8A8',
        borderWidth: 1,
        borderTopColor: '#707070',
        borderLeftColor: '#707070',
        borderRightColor: '#D0D0D0',
        borderBottomColor: '#D0D0D0',
        // Inner shadow effect
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    pinImage: {
        width: PIN_SIZE * 0.9,
        height: PIN_SIZE * 1.1,
        borderRadius: 6,
    },
    textContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    congratsText: {
        fontSize: 16,
        color: '#8B5CF6',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    pinName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(139, 92, 246, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    nameLine: {
        width: 80,
        height: 3,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
        marginTop: 12,
    },
    instruction: {
        position: 'absolute',
        bottom: 100,
        fontSize: 14,
        color: '#6B7280',
    },
});

export default PinAwardOverlay;

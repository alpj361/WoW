import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    runOnJS,
    interpolate,
    Extrapolation,
    Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIN_SIZE = 100;

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
    const showProgress = useSharedValue(0);
    const pinScale = useSharedValue(0);
    const pinTranslateX = useSharedValue(0);
    const pinTranslateY = useSharedValue(50);
    const textProgress = useSharedValue(0);
    const isAttaching = useSharedValue(false);
    const isVisible = useSharedValue(false);

    // Metallic sheen tilt
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            isVisible.value = true;
            isAttaching.value = false;
            pinTranslateX.value = 0;

            showProgress.value = withTiming(1, { duration: 300 });
            pinScale.value = withDelay(100, withSpring(1.2, { damping: 10, stiffness: 100 }));
            pinTranslateY.value = withDelay(100, withSpring(0, { damping: 12, stiffness: 80 }));
            textProgress.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 80 }));

            // Subtle tilt for sheen
            tiltX.value = withRepeat(
                withSequence(
                    withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );

            tiltY.value = withRepeat(
                withSequence(
                    withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                    withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
        } else {
            showProgress.value = 0;
            pinScale.value = 0;
            pinTranslateX.value = 0;
            pinTranslateY.value = 50;
            textProgress.value = 0;
            isVisible.value = false;
            isAttaching.value = false;
            tiltX.value = 0;
            tiltY.value = 0;
        }
    }, [visible]);

    const triggerAttach = () => {
        onAttach();
    };

    const handleTap = () => {
        if (isAttaching.value) return;
        isAttaching.value = true;

        textProgress.value = withTiming(0, { duration: 150 });

        pinTranslateX.value = withSpring(targetPosition.x, {
            damping: 12,
            stiffness: 150,
            mass: 0.5,
        });

        pinTranslateY.value = withSpring(targetPosition.y, {
            damping: 12,
            stiffness: 150,
            mass: 0.5,
        });

        pinScale.value = withTiming(0.4, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
        });

        showProgress.value = withDelay(200, withTiming(0, { duration: 300 }));

        setTimeout(() => {
            runOnJS(triggerAttach)();
        }, 450);
    };

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(handleTap)();
        });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(showProgress.value, [0, 1], [0, 0.9]),
        pointerEvents: isVisible.value ? 'auto' : 'none',
    }));

    const pinContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 800 },
            { translateX: pinTranslateX.value },
            { translateY: pinTranslateY.value },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${tiltY.value}deg` },
            { scale: pinScale.value },
        ],
        opacity: isVisible.value ? 1 : 0,
    }));

    // Sheen moves opposite to tilt
    const sheenStyle = useAnimatedStyle(() => ({
        opacity: interpolate(Math.abs(tiltX.value + tiltY.value), [0, 7], [0.08, 0.2]),
        transform: [
            { translateX: -tiltY.value * 6 },
            { translateY: -tiltX.value * 6 },
        ],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textProgress.value,
        transform: [
            { translateY: interpolate(textProgress.value, [0, 1], [20, 0]) },
            { scale: interpolate(textProgress.value, [0, 1], [0.8, 1]) },
        ],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pinScale.value, [0, 1.2], [0, 1]),
        transform: [{ scale: pinScale.value }],
    }));

    const instructionStyle = useAnimatedStyle(() => ({
        opacity: interpolate(textProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    }));

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />

            <GestureDetector gesture={tapGesture}>
                <View style={styles.content}>
                    <Animated.View style={[styles.pinWrapper, pinContainerStyle]}>
                        {/* Glow effect */}
                        <Animated.View style={[styles.glow, glowStyle]} />

                        {/* Pin with masked sheen */}
                        <View style={styles.pinFrame}>
                            {/* Base image */}
                            <Image
                                source={PIN_IMAGE}
                                style={styles.pinImage}
                                resizeMode="contain"
                            />

                            {/* Masked sheen - follows pin shape */}
                            <MaskedView
                                style={styles.maskedSheen}
                                maskElement={
                                    <Image
                                        source={PIN_IMAGE}
                                        style={styles.pinImage}
                                        resizeMode="contain"
                                    />
                                }
                            >
                                <Animated.View style={[styles.sheenContainer, sheenStyle]}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.95)', 'transparent', 'rgba(255,255,255,0.7)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.sheenGradient}
                                    />
                                </Animated.View>
                            </MaskedView>
                        </View>
                    </Animated.View>

                    <Animated.View style={[styles.textContainer, textStyle]}>
                        <Text style={styles.congratsText}>¡Nuevo Pin!</Text>
                        <Text style={styles.pinName}>{pinName}</Text>
                        <View style={styles.nameLine} />
                    </Animated.View>

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
    pinFrame: {
        width: PIN_SIZE,
        height: PIN_SIZE * 1.2,
    },
    pinImage: {
        width: '100%',
        height: '100%',
    },
    maskedSheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheenContainer: {
        flex: 1,
    },
    sheenGradient: {
        flex: 1,
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

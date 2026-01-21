import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    Extrapolation,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIN_SIZE = 120;
const SHOWCASE_SCALE = 1.8;

// Pin image
const PIN_IMAGE = require('../../../assets/images/pin-aesdi.png');

// Pin data
const PIN_NAME = "El Fundador";

export const PinMovementTest: React.FC = () => {
    // Position values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // 3D rotation values
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);

    // Scale for press feedback
    const scale = useSharedValue(1);

    // Z-index simulation via elevation
    const zIndex = useSharedValue(1);

    // Showcase mode (0 = normal, 1 = showcase)
    const showcaseProgress = useSharedValue(0);

    // Text animation progress
    const textProgress = useSharedValue(0);

    // Context for gesture continuity
    const context = useSharedValue({ x: 0, y: 0 });

    // Track if in showcase mode
    const isShowcasing = useSharedValue(false);

    // Double tap to enter showcase mode
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (!isShowcasing.value) {
                // Enter showcase mode
                isShowcasing.value = true;
                showcaseProgress.value = withSpring(1, { damping: 15, stiffness: 100 });
                scale.value = withSpring(SHOWCASE_SCALE, { damping: 12, stiffness: 150 });
                zIndex.value = 1000;

                // Animate text with delay
                textProgress.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 80 }));
            }
        });

    // Single tap to exit showcase mode
    const singleTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
            if (isShowcasing.value) {
                // Exit showcase mode with magnetic snap
                isShowcasing.value = false;
                textProgress.value = withTiming(0, { duration: 150 });
                showcaseProgress.value = withSpring(0, { damping: 10, stiffness: 200 });

                // Magnetic snap back
                translateX.value = withSpring(0, { damping: 8, stiffness: 300, mass: 0.5 });
                translateY.value = withSpring(0, { damping: 8, stiffness: 300, mass: 0.5 });
                scale.value = withSpring(1, { damping: 10, stiffness: 200 });
                zIndex.value = 1;
            }
        });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            if (isShowcasing.value) return; // Disable pan in showcase mode

            context.value = { x: translateX.value, y: translateY.value };
            // Grab effect - scale up and bring to front
            scale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
            zIndex.value = 100;
        })
        .onUpdate((event) => {
            if (isShowcasing.value) return;

            translateX.value = context.value.x + event.translationX;
            translateY.value = context.value.y + event.translationY;

            // Calculate 3D rotation based on velocity
            rotateY.value = Math.min(Math.max(event.velocityX / 40, -20), 20);
            rotateX.value = Math.min(Math.max(-event.velocityY / 40, -20), 20);
        })
        .onEnd(() => {
            if (isShowcasing.value) return;

            // MAGNETIC SNAP - Spring back to origin
            translateX.value = withSpring(0, { damping: 8, stiffness: 300, mass: 0.5 });
            translateY.value = withSpring(0, { damping: 8, stiffness: 300, mass: 0.5 });
            rotateX.value = withSpring(0, { damping: 12, stiffness: 150 });
            rotateY.value = withSpring(0, { damping: 12, stiffness: 150 });
            scale.value = withSpring(1, { damping: 10, stiffness: 200 });
            zIndex.value = 1;
        });

    // Combine gestures - double tap has priority, then pan, then single tap
    const composedGesture = Gesture.Exclusive(
        doubleTapGesture,
        Gesture.Simultaneous(panGesture, singleTapGesture)
    );

    const animatedPinStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { perspective: 1000 },
                { rotateX: `${rotateX.value}deg` },
                { rotateY: `${rotateY.value}deg` },
                { scale: scale.value },
            ],
            zIndex: zIndex.value,
        };
    });

    // Animated text style with character-by-character reveal
    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: textProgress.value,
            transform: [
                { translateY: interpolate(textProgress.value, [0, 1], [20, 0], Extrapolation.CLAMP) },
                { scale: interpolate(textProgress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) },
            ],
        };
    });

    // Backdrop style for showcase mode
    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(showcaseProgress.value, [0, 1], [0, 0.85]),
            pointerEvents: showcaseProgress.value > 0.5 ? 'auto' : 'none',
        };
    });

    // Glow effect around pin in showcase
    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: showcaseProgress.value,
            transform: [{ scale: interpolate(showcaseProgress.value, [0, 1], [0.5, 1]) }],
        };
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Test de Movimiento 3D</Text>
            <Text style={styles.subtitle}>Arrastra • Doble tap para ver</Text>

            <View style={styles.testArea}>
                {/* Backdrop for showcase mode */}
                <Animated.View style={[styles.backdrop, backdropStyle]} />

                <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[styles.pinWrapper, animatedPinStyle]}>
                        {/* Glow effect */}
                        <Animated.View style={[styles.glow, glowStyle]} />

                        {/* Pin image */}
                        <Animated.Image
                            source={PIN_IMAGE}
                            style={styles.pinImage}
                            resizeMode="contain"
                        />

                        {/* Pin name - appears in showcase mode */}
                        <Animated.View style={[styles.nameContainer, animatedTextStyle]}>
                            <Text style={styles.pinName}>{PIN_NAME}</Text>
                            <View style={styles.nameLine} />
                        </Animated.View>
                    </Animated.View>
                </GestureDetector>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    • Arrastra para mover con efecto magnético
                </Text>
                <Text style={styles.infoText}>
                    • Doble tap para ver el nombre del pin
                </Text>
                <Text style={styles.infoText}>
                    • Tap para cerrar y que se pegue
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        paddingTop: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    testArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderStyle: 'dashed',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0F0F0F',
        borderRadius: 16,
    },
    pinWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: PIN_SIZE * 1.5,
        height: PIN_SIZE * 1.5,
        borderRadius: PIN_SIZE * 0.75,
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
    },
    pinImage: {
        width: PIN_SIZE,
        height: PIN_SIZE * 1.3,
    },
    nameContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    pinName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(139, 92, 246, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    nameLine: {
        width: 60,
        height: 3,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
        marginTop: 8,
    },
    infoContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    infoText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
});

export default PinMovementTest;

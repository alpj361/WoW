import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIN_SIZE = 120;

// Pin image
const PIN_IMAGE = require('../../../assets/images/pin-fundador.png');

export const PinMovementTest: React.FC = () => {
    // Position values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // 3D rotation values
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);

    // Scale for press feedback
    const scale = useSharedValue(1);

    // Context for gesture continuity
    const context = useSharedValue({ x: 0, y: 0 });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
            scale.value = withSpring(1.1);
        })
        .onUpdate((event) => {
            translateX.value = context.value.x + event.translationX;
            translateY.value = context.value.y + event.translationY;

            // Calculate 3D rotation based on velocity
            // Tilt in the direction of movement
            rotateY.value = Math.min(Math.max(event.velocityX / 50, -15), 15);
            rotateX.value = Math.min(Math.max(-event.velocityY / 50, -15), 15);
        })
        .onEnd(() => {
            // Spring back rotation to 0
            rotateX.value = withSpring(0, { damping: 10, stiffness: 100 });
            rotateY.value = withSpring(0, { damping: 10, stiffness: 100 });
            scale.value = withSpring(1);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { perspective: 1000 },
                { rotateX: `${rotateX.value}deg` },
                { rotateY: `${rotateY.value}deg` },
                { scale: scale.value },
            ],
        };
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Test de Movimiento 3D</Text>
            <Text style={styles.subtitle}>Arrastra el pin para probarlo</Text>

            <View style={styles.testArea}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.pinContainer, animatedStyle]}>
                        <Animated.Image
                            source={PIN_IMAGE}
                            style={styles.pinImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </GestureDetector>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    • El pin se inclina en la dirección del movimiento
                </Text>
                <Text style={styles.infoText}>
                    • Se escala ligeramente al agarrar
                </Text>
                <Text style={styles.infoText}>
                    • Regresa suavemente a su orientación original
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
    pinContainer: {
        width: PIN_SIZE,
        height: PIN_SIZE * 1.3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    pinImage: {
        width: '100%',
        height: '100%',
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

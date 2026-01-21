import React, { useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

const PIN_IMAGE = require('../../../assets/images/pin-aesdi.png');

interface AttachedPinProps {
    index: number;
    isNew?: boolean;
}

// Card flip animation takes ~500ms, so we wait for that before snapping
const FLIP_DURATION = 600;

export const AttachedPin: React.FC<AttachedPinProps> = ({ index, isNew = false }) => {
    // Animation values
    // Start floating above and to the side
    const scale = useSharedValue(isNew ? 1.2 : 1);
    const translateX = useSharedValue(isNew ? 60 : 0);
    const translateY = useSharedValue(isNew ? -80 : 0);
    const rotation = useSharedValue(isNew ? 8 : 0);
    const opacity = useSharedValue(isNew ? 1 : 1);

    // Floating animation (subtle hover while card flips)
    const floatY = useSharedValue(0);

    useEffect(() => {
        if (isNew) {
            // Phase 1: Float/hover while card is flipping
            // Subtle floating animation
            floatY.value = withSequence(
                withTiming(-5, { duration: 300 }),
                withTiming(5, { duration: 300 }),
                withTiming(0, { duration: 200 })
            );

            // Phase 2: After card flip completes, SNAP magnetically
            translateX.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 5,       // Very low damping = strong bounce
                stiffness: 500,   // Very high stiffness = instant snap
                mass: 0.2,        // Very low mass = snappy
            }));

            translateY.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 5,
                stiffness: 500,
                mass: 0.2,
            }));

            // Scale: Shrink down with impact effect
            scale.value = withDelay(FLIP_DURATION, withSequence(
                withSpring(0.9, { damping: 15, stiffness: 400 }), // Impact compression
                withSpring(1.1, { damping: 10, stiffness: 300 }), // Bounce back
                withSpring(1, { damping: 12, stiffness: 200 })    // Settle
            ));

            // Rotation correction: Straighten out with snap
            rotation.value = withDelay(FLIP_DURATION, withSpring(0, {
                damping: 6,
                stiffness: 300,
            }));
        }
    }, [isNew]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value + floatY.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value },
        ],
    }));

    // Calculate position based on index (stack pins slightly)
    const positionStyle = {
        right: 8 + (index * 3),
        top: 8 + (index * 3),
    };

    return (
        <Animated.View style={[styles.pinContainer, positionStyle, animatedStyle]}>
            <View style={styles.metallicFrame}>
                <View style={styles.metallicInner}>
                    <Image
                        source={PIN_IMAGE}
                        style={styles.pinImage}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    pinContainer: {
        position: 'absolute',
        width: 50,
        height: 60,
    },
    metallicFrame: {
        flex: 1,
        padding: 3,
        borderRadius: 6,
        backgroundColor: '#C0C0C0',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: -1, height: -1 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
        elevation: 4,
        borderWidth: 1,
        borderTopColor: '#E8E8E8',
        borderLeftColor: '#E8E8E8',
        borderRightColor: '#808080',
        borderBottomColor: '#808080',
    },
    metallicInner: {
        flex: 1,
        padding: 2,
        borderRadius: 4,
        backgroundColor: '#A8A8A8',
        borderWidth: 0.5,
        borderTopColor: '#707070',
        borderLeftColor: '#707070',
        borderRightColor: '#D0D0D0',
        borderBottomColor: '#D0D0D0',
    },
    pinImage: {
        width: '100%',
        height: '100%',
        borderRadius: 3,
    },
});

export default AttachedPin;

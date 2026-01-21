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
import MaskedView from '@react-native-masked-view/masked-view';

const PIN_IMAGE = require('../../../assets/images/pin-aesdi.png');

interface AttachedPinProps {
    index: number;
    isNew?: boolean;
}

const FLIP_DURATION = 600;

export const AttachedPin: React.FC<AttachedPinProps> = ({ index, isNew = false }) => {
    const scale = useSharedValue(isNew ? 1.2 : 1);
    const translateX = useSharedValue(isNew ? 60 : 0);
    const translateY = useSharedValue(isNew ? -80 : 0);
    const rotation = useSharedValue(isNew ? 8 : 0);
    const opacity = useSharedValue(1);
    const floatY = useSharedValue(0);

    // Metallic sheen tilt
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);

    useEffect(() => {
        if (isNew) {
            floatY.value = withSequence(
                withTiming(-5, { duration: 300 }),
                withTiming(5, { duration: 300 }),
                withTiming(0, { duration: 200 })
            );

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

        // Continuous subtle tilt for sheen effect
        tiltX.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
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

    // Sheen gradient position - moves opposite to tilt
    const sheenStyle = useAnimatedStyle(() => ({
        opacity: interpolate(Math.abs(tiltX.value + tiltY.value), [0, 5], [0.08, 0.18]),
        transform: [
            { translateX: -tiltY.value * 4 },
            { translateY: -tiltX.value * 4 },
        ],
    }));

    const positionStyle = {
        right: 8 + (index * 3),
        top: 8 + (index * 3),
    };

    return (
        <Animated.View style={[styles.pinContainer, positionStyle, animatedStyle]}>
            {/* Base pin image */}
            <Image
                source={PIN_IMAGE}
                style={styles.pinImage}
                resizeMode="contain"
            />

            {/* Masked sheen overlay - follows pin shape */}
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
                        colors={['rgba(255,255,255,0.9)', 'transparent', 'rgba(255,255,255,0.6)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sheenGradient}
                    />
                </Animated.View>
            </MaskedView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    pinContainer: {
        position: 'absolute',
        width: 45,
        height: 55,
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
});

export default AttachedPin;

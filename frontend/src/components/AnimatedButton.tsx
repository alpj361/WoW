import React from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps {
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    children: React.ReactNode;
    hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'none';
    disabled?: boolean;
    activeScale?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    onPress,
    style,
    textStyle,
    children,
    hapticType = 'light',
    disabled = false,
    activeScale = 0.95,
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const triggerHaptic = async () => {
        if (Platform.OS === 'web' || hapticType === 'none') return;

        try {
            switch (hapticType) {
                case 'light':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'success':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'warning':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                case 'error':
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
            }
        } catch (e) {
            // Haptics not available
        }
    };

    const gesture = Gesture.Tap()
        .enabled(!disabled)
        .onBegin(() => {
            scale.value = withSpring(activeScale, { damping: 15, stiffness: 400 });
            opacity.value = withTiming(0.8, { duration: 100 });
        })
        .onFinalize((_, success) => {
            scale.value = withSpring(1, { damping: 15, stiffness: 400 });
            opacity.value = withTiming(1, { duration: 100 });

            if (success) {
                triggerHaptic();
                onPress();
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : opacity.value,
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.button, style, animatedStyle]}>
                {typeof children === 'string' ? (
                    <Text style={[styles.text, textStyle]}>{children}</Text>
                ) : (
                    children
                )}
            </Animated.View>
        </GestureDetector>
    );
};

// Circular action button (like/skip buttons)
interface ActionButtonProps {
    onPress: () => void;
    icon: React.ReactNode;
    variant: 'like' | 'skip' | 'primary' | 'secondary';
    size?: number;
    disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    onPress,
    icon,
    variant,
    size = 56,
    disabled = false,
}) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const getVariantStyles = () => {
        switch (variant) {
            case 'like':
                return {
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                };
            case 'skip':
                return {
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                };
            case 'primary':
                return {
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                };
            default:
                return {
                    borderColor: '#6B7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                };
        }
    };

    const triggerHaptic = async () => {
        if (Platform.OS === 'web') return;
        try {
            if (variant === 'like') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (variant === 'skip') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (e) { }
    };

    const gesture = Gesture.Tap()
        .enabled(!disabled)
        .onBegin(() => {
            scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
            // Add a little rotation wiggle for fun
            rotation.value = withSequence(
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        })
        .onFinalize((_, success) => {
            scale.value = withSpring(1, { damping: 10, stiffness: 300 });

            if (success) {
                triggerHaptic();
                onPress();
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
        opacity: disabled ? 0.5 : 1,
    }));

    const variantStyles = getVariantStyles();

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[
                    styles.actionButton,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: variantStyles.borderColor,
                        backgroundColor: variantStyles.backgroundColor,
                    },
                    animatedStyle,
                ]}
            >
                {icon}
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    actionButton: {
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default AnimatedButton;

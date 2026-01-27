import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'like' | 'skip' | 'success' | 'error' | 'info';

interface ToastConfig {
    icon: string;
    color: string;
    bgColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
    like: {
        icon: 'heart',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
    },
    skip: {
        icon: 'close-circle',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.15)',
    },
    success: {
        icon: 'checkmark-circle',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
    },
    error: {
        icon: 'alert-circle',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
    },
    info: {
        icon: 'information-circle',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
    },
};

interface AnimatedToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onHide?: () => void;
}

export const AnimatedToast: React.FC<AnimatedToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 2000,
    onHide,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    const config = toastConfigs[type];

    const hideToast = useCallback(() => {
        onHide?.();
    }, [onHide]);

    useEffect(() => {
        if (visible) {
            // Animate in
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });

            // Auto hide after duration
            const timer = setTimeout(() => {
                translateY.value = withTiming(-100, { duration: 300 });
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(hideToast)();
                });
                scale.value = withTiming(0.8, { duration: 300 });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    if (!visible && opacity.value === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { top: insets.top + 10 },
                animatedStyle,
            ]}
        >
            <View style={[styles.toast, { backgroundColor: config.bgColor }]}>
                <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon as any} size={18} color="#fff" />
                </View>
                <Text style={[styles.message, { color: config.color }]}>{message}</Text>
            </View>
        </Animated.View>
    );
};

// Toast Manager for global use
type ToastData = {
    message: string;
    type: ToastType;
};

let toastCallback: ((data: ToastData | null) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
    toastCallback?.({ message, type });
};

export const setToastCallback = (callback: (data: ToastData | null) => void) => {
    toastCallback = callback;
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 50,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
});

export default AnimatedToast;

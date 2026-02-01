import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(
                    shimmer.value,
                    [0, 1],
                    [-200, 200]
                ),
            },
        ],
    }));

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height,
                    borderRadius,
                },
                style,
            ]}
        >
            <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
};

// Event Card Skeleton
export const EventCardSkeleton: React.FC = () => {
    return (
        <View style={styles.cardSkeleton}>
            <View style={styles.cardGradientSkeleton}>
                <Skeleton width="100%" height={100} borderRadius={0} />
            </View>
            <View style={styles.cardContentSkeleton}>
                <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="70%" height={14} style={{ marginBottom: 12 }} />
                <View style={styles.cardActionsSkeleton}>
                    <Skeleton width={80} height={32} borderRadius={8} />
                    <Skeleton width={36} height={36} borderRadius={8} />
                </View>
            </View>
        </View>
    );
};

// Swipe Card Skeleton
export const SwipeCardSkeleton: React.FC = () => {
    return (
        <View style={styles.swipeCardSkeleton}>
            <Skeleton width="100%" height={400} borderRadius={16} />
            <View style={styles.swipeCardContent}>
                <Skeleton width={80} height={24} borderRadius={12} style={{ marginBottom: 12 }} />
                <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={16} style={{ marginBottom: 16 }} />
                <View style={styles.metaRow}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={60} height={14} />
                    <Skeleton width={120} height={14} />
                </View>
            </View>
            <View style={styles.swipeButtons}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <Skeleton width={56} height={56} borderRadius={28} />
            </View>
        </View>
    );
};

// List Skeleton (multiple cards)
interface ListSkeletonProps {
    count?: number;
}

export const EventListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => {
    return (
        <View style={styles.listContainer}>
            {Array.from({ length: count }).map((_, index) => (
                <EventCardSkeleton key={index} />
            ))}
        </View>
    );
};

// Profile Stats Skeleton
export const ProfileStatsSkeleton: React.FC = () => {
    return (
        <View style={styles.statsSkeleton}>
            <View style={styles.statItem}>
                <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
                <Skeleton width={60} height={14} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
                <Skeleton width={60} height={14} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
                <Skeleton width={60} height={14} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#2A2A2A',
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 200,
    },
    gradient: {
        flex: 1,
    },
    // Card skeleton styles
    cardSkeleton: {
        flexDirection: 'row',
        backgroundColor: '#1F1F1F',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    cardGradientSkeleton: {
        width: 100,
    },
    cardContentSkeleton: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    cardActionsSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Swipe card skeleton
    swipeCardSkeleton: {
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
    },
    swipeCardContent: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 12,
    },
    swipeButtons: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
    },
    // List skeleton
    listContainer: {
        padding: 20,
        gap: 16,
    },
    // Stats skeleton
    statsSkeleton: {
        flexDirection: 'row',
        backgroundColor: '#1F1F1F',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 4,
    },
});

export default Skeleton;

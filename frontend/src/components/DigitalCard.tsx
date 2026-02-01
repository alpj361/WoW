import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AttachedPin } from './pins/AttachedPin';

export type CardDesign = 'classic' | 'ticket' | 'pyramid';

export interface CollectedPin {
    id: string;
    name: string;
    image: any;
    isNew?: boolean;  // For triggering magnetic snap animation
}

export interface DigitalCardRef {
    flipToBack: () => void;
    flipToFront: () => void;
}

interface DigitalCardProps {
    userName?: string;
    memberId?: string;
    design?: CardDesign;
    pins?: CollectedPin[];
}

// Card images
const CARD_IMAGES = {
    classic: require('../../assets/images/wow-card.png'),
    ticket: require('../../assets/images/wow-card-alt.jpg'),
    pyramid: require('../../assets/images/wow-card-pyramid.png'),
};

const CARD_BACK = require('../../assets/images/wow-card-back.png');
const PIN_IMAGE = require('../../assets/images/pin-fundador.png');

export const DigitalCard = forwardRef<DigitalCardRef, DigitalCardProps>((
    {
        userName = 'Usuario',
        memberId = 'WOW-2024-001',
        design = 'classic',
        pins = [],
    },
    ref
) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnimation = useSharedValue(0);
    const glowOpacity = useSharedValue(0.15);

    // Expose flip methods to parent via ref
    useImperativeHandle(ref, () => ({
        flipToBack: () => {
            if (!isFlipped) {
                flipAnimation.value = withSpring(1, { damping: 15, stiffness: 80 });
                setIsFlipped(true);
            }
        },
        flipToFront: () => {
            if (isFlipped) {
                flipAnimation.value = withSpring(0, { damping: 15, stiffness: 80 });
                setIsFlipped(false);
            }
        },
    }));

    const flipCard = () => {
        const toValue = isFlipped ? 0 : 1;
        flipAnimation.value = withSpring(toValue, { damping: 15, stiffness: 80 });
        setIsFlipped(!isFlipped);
    };

    const handlePressIn = () => {
        glowOpacity.value = withTiming(0.35, { duration: 200 });
    };

    const handlePressOut = () => {
        glowOpacity.value = withTiming(0.15, { duration: 200 });
    };

    // Animated styles for glow
    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    // Front side animated style
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(
            flipAnimation.value,
            [0, 0.5, 1],
            [0, 90, 90]
        );
        const opacity = interpolate(
            flipAnimation.value,
            [0, 0.5, 0.51, 1],
            [1, 1, 0, 0]
        );
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            opacity,
        };
    });

    // Back side animated style
    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(
            flipAnimation.value,
            [0, 0.5, 1],
            [-90, -90, 0]
        );
        const opacity = interpolate(
            flipAnimation.value,
            [0, 0.49, 0.5, 1],
            [0, 0, 1, 1]
        );
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            opacity,
        };
    });

    // Different gradient colors based on design
    const glowColors: readonly [string, string, string] = design === 'ticket'
        ? ['#6366f1', '#a855f7', '#ec4899'] as const
        : ['#8b5cf6', '#f97316', '#3b82f6'] as const;

    return (
        <View style={styles.container}>
            {/* Subtle glow effect */}
            <Animated.View style={[styles.glowWrapper, glowAnimatedStyle]}>
                <LinearGradient
                    colors={glowColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.glow}
                />
            </Animated.View>

            {/* Card */}
            <Pressable
                onPress={flipCard}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.pressable}
            >
                <View style={styles.cardWrapper}>
                    {/* Front Side */}
                    <Animated.View
                        style={[
                            styles.cardContainer,
                            styles.cardFront,
                            frontAnimatedStyle,
                        ]}
                    >
                        {/* Card Image */}
                        <Image
                            source={CARD_IMAGES[design]}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />

                        {/* Gradient overlay for text readability */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                            locations={[0, 0.5, 1]}
                            style={styles.gradientOverlay}
                        />

                        {/* Card info overlay */}
                        <View style={styles.infoOverlay}>
                            <View style={styles.infoContainer}>
                                <View>
                                    <Text style={styles.label}>MIEMBRO</Text>
                                    <Text style={styles.userName}>{userName}</Text>
                                </View>
                                <View style={styles.idContainer}>
                                    <Text style={styles.label}>ID</Text>
                                    <Text style={[
                                        styles.memberId,
                                        design === 'ticket' && styles.ticketMemberId,
                                    ]}>{memberId}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Subtle border */}
                        <View style={[
                            styles.cardBorder,
                            design === 'ticket' && styles.ticketBorder,
                        ]} />

                        {/* Flip indicator */}
                        <View style={styles.flipHint}>
                            <Text style={styles.flipHintText}>Toca para voltear</Text>
                        </View>
                    </Animated.View>

                    {/* Back Side */}
                    <Animated.View
                        style={[
                            styles.cardContainer,
                            styles.cardBack,
                            backAnimatedStyle,
                        ]}
                    >
                        {/* Back Image */}
                        <Image
                            source={CARD_BACK}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />

                        {/* Collected Pins */}
                        {pins.length > 0 && (
                            <View style={styles.pinsContainer}>
                                {pins.map((pin, index) => (
                                    <AttachedPin
                                        key={pin.id}
                                        index={index}
                                        isNew={pin.isNew}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Subtle border */}
                        <View style={styles.cardBorder} />
                    </Animated.View>
                </View>
            </Pressable>

            {/* Reflection effect */}
            <Animated.View style={[styles.reflection, glowAnimatedStyle]}>
                <LinearGradient
                    colors={glowColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.reflectionGradient}
                />
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        marginBottom: 6,
    },
    glowWrapper: {
        position: 'absolute',
        top: -6,
        left: -6,
        right: -6,
        bottom: 6,
        borderRadius: 14,
    },
    glow: {
        flex: 1,
        borderRadius: 14,
    },
    pressable: {
        width: '100%',
    },
    cardWrapper: {
        width: '100%',
        height: 220,
    },
    cardContainer: {
        position: 'absolute',
        width: '100%',
        height: 220,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
        backfaceVisibility: 'hidden',
    },
    cardFront: {
        zIndex: 2,
    },
    cardBack: {
        zIndex: 1,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 8,
        color: '#D1D5DB',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontWeight: '500',
        marginBottom: 1,
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    idContainer: {
        alignItems: 'flex-end',
    },
    memberId: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#C4B5FD',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    ticketMemberId: {
        color: '#f0abfc',
    },
    cardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ticketBorder: {
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    flipHint: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    flipHintText: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    backContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    qrText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F1F1F',
    },
    backLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    backId: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#C4B5FD',
        fontWeight: '600',
    },
    reflection: {
        position: 'absolute',
        bottom: -12,
        left: '17%',
        width: '66%',
        height: 18,
    },
    reflectionGradient: {
        flex: 1,
        borderRadius: 100,
    },
    pinsContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    attachedPin: {
        position: 'absolute',
        width: 45,
        height: 55,
    },
});

export default DigitalCard;

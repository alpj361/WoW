import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type CardDesign = 'classic' | 'ticket' | 'pyramid';

interface DigitalCardProps {
    userName?: string;
    memberId?: string;
    design?: CardDesign;
}

// Card images
const CARD_IMAGES = {
    classic: require('../../assets/images/wow-card.png'),
    ticket: require('../../assets/images/wow-card-alt.jpg'),
    pyramid: require('../../assets/images/wow-card-pyramid.png'),
};

const CARD_BACK = require('../../assets/images/wow-card-back.png');

export const DigitalCard: React.FC<DigitalCardProps> = ({
    userName = 'Usuario',
    memberId = 'WOW-2024-001',
    design = 'classic',
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const [glowOpacity] = useState(new Animated.Value(0.15));

    const flipCard = () => {
        const toValue = isFlipped ? 0 : 1;

        Animated.spring(flipAnimation, {
            toValue,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();

        setIsFlipped(!isFlipped);
    };

    const handlePressIn = () => {
        Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    // Front side rotation (0 to 90 degrees, then hidden)
    const frontRotation = flipAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', '90deg', '90deg'],
    });

    // Back side rotation (hidden at -90, then -90 to 0)
    const backRotation = flipAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-90deg', '-90deg', '0deg'],
    });

    // Front opacity (visible then hidden at midpoint)
    const frontOpacity = flipAnimation.interpolate({
        inputRange: [0, 0.5, 0.51, 1],
        outputRange: [1, 1, 0, 0],
    });

    // Back opacity (hidden then visible at midpoint)
    const backOpacity = flipAnimation.interpolate({
        inputRange: [0, 0.49, 0.5, 1],
        outputRange: [0, 0, 1, 1],
    });

    // Different gradient colors based on design
    const glowColors: readonly [string, string, string] = design === 'ticket'
        ? ['#6366f1', '#a855f7', '#ec4899'] as const
        : ['#8b5cf6', '#f97316', '#3b82f6'] as const;

    return (
        <View style={styles.container}>
            {/* Subtle glow effect */}
            <Animated.View style={[styles.glowWrapper, { opacity: glowOpacity }]}>
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
                            {
                                transform: [{ rotateY: frontRotation }],
                                opacity: frontOpacity,
                            },
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
                            {
                                transform: [{ rotateY: backRotation }],
                                opacity: backOpacity,
                            },
                        ]}
                    >
                        {/* Back Image */}
                        <Image
                            source={CARD_BACK}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />

                        {/* Subtle border */}
                        <View style={styles.cardBorder} />
                    </Animated.View>
                </View>
            </Pressable>

            {/* Reflection effect */}
            <Animated.View style={[styles.reflection, { opacity: glowOpacity }]}>
                <LinearGradient
                    colors={glowColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.reflectionGradient}
                />
            </Animated.View>
        </View>
    );
};

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
});

export default DigitalCard;

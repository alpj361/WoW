import React, { useState } from 'react';
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

export const DigitalCard: React.FC<DigitalCardProps> = ({
    userName = 'Usuario',
    memberId = 'WOW-2024-001',
    design = 'classic',
}) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    const [glowOpacity] = useState(new Animated.Value(0.15));

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1.02,
                useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 0.35,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 0.15,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

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
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.pressable}
            >
                <Animated.View
                    style={[
                        styles.cardContainer,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Card Image */}
                    <Image
                        source={CARD_IMAGES[design]}
                        style={[
                            styles.cardImage,
                            design === 'ticket' && styles.ticketImage,
                        ]}
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
                </Animated.View>
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
    cardContainer: {
        position: 'relative',
        height: 220, // Fixed compact height
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    ticketImage: {
        // Same for ticket
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70, // Reduced from 80
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12, // Reduced from 14
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 8, // Reduced from 9
        color: '#D1D5DB',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontWeight: '500',
        marginBottom: 1,
    },
    userName: {
        fontSize: 12, // Reduced from 13
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
        fontSize: 10, // Reduced from 11
        fontFamily: 'monospace',
        color: '#C4B5FD',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    ticketMemberId: {
        color: '#f0abfc', // Pink tint for ticket design
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
    reflection: {
        position: 'absolute',
        bottom: -12, // Reduced from -16
        left: '17%',
        width: '66%',
        height: 18, // Reduced from 24
    },
    reflectionGradient: {
        flex: 1,
        borderRadius: 100,
    },
});

export default DigitalCard;

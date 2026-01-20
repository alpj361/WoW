import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // 20px padding on each side

interface DigitalCardProps {
    userName?: string;
    memberId?: string;
}

export const DigitalCard: React.FC<DigitalCardProps> = ({
    userName = 'Usuario',
    memberId = 'WOW-2024-001',
}) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    const [glowOpacity] = useState(new Animated.Value(0.15));
    const [shineOpacity] = useState(new Animated.Value(0));
    const [shinePosition] = useState(new Animated.Value(-100));

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1.03,
                useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
                toValue: 0.5,
                duration: 200,
                useNativeDriver: true,
            }),
            // Shine effect
            Animated.sequence([
                Animated.timing(shineOpacity, {
                    toValue: 1,
                    duration: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(shinePosition, {
                    toValue: 100,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
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
            // Reset shine
            Animated.sequence([
                Animated.delay(100),
                Animated.timing(shineOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            shinePosition.setValue(-100);
        });
    };

    return (
        <View style={styles.container}>
            {/* Subtle glow effect */}
            <Animated.View style={[styles.glowWrapper, { opacity: glowOpacity }]}>
                <LinearGradient
                    colors={['#8b5cf6', '#f97316', '#3b82f6']}
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
                        source={require('../../assets/images/wow-card.png')}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    {/* Gradient overlay for text readability */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
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
                                <Text style={styles.memberId}>{memberId}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Subtle border */}
                    <View style={styles.cardBorder} />

                    {/* Shine effect on press */}
                    <Animated.View
                        style={[
                            styles.shineWrapper,
                            {
                                opacity: shineOpacity,
                                transform: [
                                    {
                                        translateX: shinePosition.interpolate({
                                            inputRange: [-100, 100],
                                            outputRange: ['-100%', '100%'],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[
                                'transparent',
                                'rgba(139, 92, 246, 0.3)',
                                'rgba(255, 255, 255, 0.6)',
                                'rgba(249, 115, 22, 0.4)',
                                'rgba(59, 130, 246, 0.3)',
                                'transparent',
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.shine}
                        />
                    </Animated.View>
                </Animated.View>
            </Pressable>

            {/* Reflection effect */}
            <Animated.View style={[styles.reflection, { opacity: glowOpacity }]}>
                <LinearGradient
                    colors={['#8b5cf6', '#f97316', '#3b82f6']}
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
        marginBottom: 16,
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
        borderRadius: 16,
    },
    pressable: {
        width: '100%',
    },
    cardContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardImage: {
        width: '100%',
        height: 220,
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
        textShadowRadius: 3,
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
        textShadowRadius: 3,
    },
    cardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    shineWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        borderRadius: 12,
    },
    shine: {
        position: 'absolute',
        top: -50,
        left: -50,
        right: -50,
        bottom: -50,
        width: '200%',
        height: '200%',
        transform: [{ rotate: '25deg' }],
    },
    reflection: {
        position: 'absolute',
        bottom: -12,
        left: '15%',
        width: '70%',
        height: 20,
    },
    reflectionGradient: {
        flex: 1,
        borderRadius: 100,
    },
});

export default DigitalCard;

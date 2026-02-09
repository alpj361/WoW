import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedLoaderProps {
    text?: string;
    size?: number;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
    text = 'Generando',
    size = 200
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Pulse animation
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Subtle rotation for 3D effect
        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Glow animation
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.parallel([pulse, rotate, glow]).start();

        return () => {
            pulseAnim.stopAnimation();
            rotateAnim.stopAnimation();
            glowAnim.stopAnimation();
        };
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Outer glow */}
            <Animated.View
                style={[
                    styles.glowOuter,
                    {
                        width: size * 1.3,
                        height: size * 1.3,
                        borderRadius: size * 0.65,
                        opacity: glowAnim,
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            />

            {/* Main sphere */}
            <Animated.View
                style={[
                    styles.sphereContainer,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            >
                {/* Base gradient - dark purple */}
                <LinearGradient
                    colors={['#1a0a2e', '#16082a', '#0d0515']}
                    style={[styles.sphereBase, { borderRadius: size / 2 }]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                />

                {/* Highlight gradient - top left glow */}
                <Animated.View
                    style={[
                        styles.highlightContainer,
                        {
                            transform: [{ rotate: rotateInterpolate }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.3)', 'transparent']}
                        style={[styles.highlight, { borderRadius: size / 2 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </Animated.View>

                {/* Edge glow */}
                <View
                    style={[
                        styles.edgeGlow,
                        {
                            borderRadius: size / 2,
                            borderWidth: 1,
                            borderColor: 'rgba(139, 92, 246, 0.4)',
                        },
                    ]}
                />

                {/* Inner shadow for 3D depth */}
                <LinearGradient
                    colors={['transparent', 'transparent', 'rgba(0, 0, 0, 0.5)']}
                    style={[styles.innerShadow, { borderRadius: size / 2 }]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={[styles.text, { fontSize: size * 0.1 }]}>{text}</Text>
                </View>
            </Animated.View>
        </View>
    );
};

// Compact inline version for list items
export const InlineLoader: React.FC<{ color?: string }> = ({ color = '#8B5CF6' }) => {
    const dotAnims = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    useEffect(() => {
        const animations = dotAnims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 150),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay(450 - i * 150),
                ])
            )
        );

        Animated.parallel(animations).start();

        return () => {
            dotAnims.forEach(anim => anim.stopAnimation());
        };
    }, []);

    return (
        <View style={styles.inlineContainer}>
            {dotAnims.map((anim, i) => {
                const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                });
                const scale = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.inlineDot,
                            {
                                backgroundColor: color,
                                transform: [{ translateY }, { scale }],
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

// Mini sphere for thumbnails
export const MiniSphereLoader: React.FC = () => {
    const pulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View style={[styles.miniSphere, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
                colors={['#8B5CF6', '#6D28D9', '#4C1D95']}
                style={styles.miniSphereGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowOuter: {
        position: 'absolute',
        backgroundColor: '#8B5CF6',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
    },
    sphereContainer: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
    },
    sphereBase: {
        ...StyleSheet.absoluteFillObject,
    },
    highlightContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    highlight: {
        ...StyleSheet.absoluteFillObject,
    },
    edgeGlow: {
        ...StyleSheet.absoluteFillObject,
    },
    innerShadow: {
        ...StyleSheet.absoluteFillObject,
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '300',
        letterSpacing: 2,
    },
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
    },
    inlineDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginHorizontal: 2,
    },
    miniSphere: {
        width: 30,
        height: 30,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
    },
    miniSphereGradient: {
        flex: 1,
        borderRadius: 15,
    },
});

export default AnimatedLoader;

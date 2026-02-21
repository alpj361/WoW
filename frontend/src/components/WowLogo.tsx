import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';

interface WowLogoProps {
    width?: number;
    height?: number;
    glowIntensity?: 'low' | 'medium' | 'high';
    variant?: 'default' | 'cuaresma';
    animated?: boolean;
}

export const WowLogo: React.FC<WowLogoProps> = ({
    width = 120,
    height = 40,
    glowIntensity = 'medium',
    variant = 'default',
    animated = true,
}) => {
    // Animation values
    const glowPulse = useSharedValue(0);
    const colorShift = useSharedValue(0);

    useEffect(() => {
        if (animated) {
            // Glow pulse animation
            glowPulse.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            // Color shift animation for extra vibrancy
            colorShift.value = withRepeat(
                withTiming(1, { duration: 4000, easing: Easing.linear }),
                -1,
                false
            );
        }
    }, [animated]);

    // Glow opacity based on intensity
    const glowOpacity = {
        low: { outer: 0.2, middle: 0.35, inner: 0.5 },
        medium: { outer: 0.3, middle: 0.45, inner: 0.6 },
        high: { outer: 0.4, middle: 0.55, inner: 0.7 },
    }[glowIntensity];

    const isCuaresma = variant === 'cuaresma';

    // Animated glow style
    const animatedGlowStyle = useAnimatedStyle(() => {
        const pulse = interpolate(glowPulse.value, [0, 1], [0.85, 1.15]);
        return {
            opacity: interpolate(glowPulse.value, [0, 1], [0.7, 1]),
            transform: [{ scale: pulse }],
        };
    });

    // Main gradient colors - matching the neon image
    // Purple/Magenta -> Orange/Amber -> Blue/Cyan
    const mainGradientColors = isCuaresma
        ? {
            start: '#6D28D9',
            mid1: '#7C3AED',
            mid2: '#8B5CF6',
            mid3: '#A78BFA',
            end: '#C4B5FD',
        }
        : {
            start: '#8B5CF6',    // Purple
            mid1: '#A855F7',    // Magenta
            mid2: '#F97316',    // Orange
            mid3: '#F59E0B',    // Amber
            end: '#06B6D4',     // Cyan
        };

    // Glow gradient colors (more saturated)
    const glowGradientColors = isCuaresma
        ? {
            start: '#7C3AED',
            mid: '#8B5CF6',
            end: '#A78BFA',
        }
        : {
            start: '#A855F7',   // Magenta
            mid: '#FB923C',     // Orange
            end: '#22D3EE',     // Cyan
        };

    return (
        <View style={styles.container}>
            {/* Animated glow layer (behind main logo) */}
            {animated && (
                <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
                    <Svg width={width * 1.3} height={height * 1.3} viewBox="0 0 1400 450" style={styles.glowSvg}>
                        <Defs>
                            <LinearGradient id="outerGlow" x1="0%" y1="50%" x2="100%" y2="50%">
                                <Stop offset="0%" stopColor={glowGradientColors.start} stopOpacity="0.6" />
                                <Stop offset="50%" stopColor={glowGradientColors.mid} stopOpacity="0.4" />
                                <Stop offset="100%" stopColor={glowGradientColors.end} stopOpacity="0.6" />
                            </LinearGradient>
                        </Defs>
                        <SvgText
                            x="700"
                            y="320"
                            fontFamily="System"
                            fontSize="340"
                            fontWeight="900"
                            textAnchor="middle"
                            fill="url(#outerGlow)"
                            opacity={glowOpacity.outer}
                            letterSpacing="-15"
                        >
                            WOW!
                        </SvgText>
                    </Svg>
                </Animated.View>
            )}

            {/* Main SVG Logo */}
            <Svg width={width} height={height} viewBox="0 0 1400 450">
                <Defs>
                    {/* Main gradient - Purple to Orange to Cyan */}
                    <LinearGradient id="mainGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                        <Stop offset="0%" stopColor={mainGradientColors.start} stopOpacity="1" />
                        <Stop offset="25%" stopColor={mainGradientColors.mid1} stopOpacity="1" />
                        <Stop offset="50%" stopColor={mainGradientColors.mid2} stopOpacity="1" />
                        <Stop offset="75%" stopColor={mainGradientColors.mid3} stopOpacity="1" />
                        <Stop offset="100%" stopColor={mainGradientColors.end} stopOpacity="1" />
                    </LinearGradient>

                    {/* Inner glow gradient */}
                    <LinearGradient id="innerGlow" x1="0%" y1="50%" x2="100%" y2="50%">
                        <Stop offset="0%" stopColor={glowGradientColors.start} stopOpacity="1" />
                        <Stop offset="50%" stopColor={glowGradientColors.mid} stopOpacity="1" />
                        <Stop offset="100%" stopColor={glowGradientColors.end} stopOpacity="1" />
                    </LinearGradient>

                    {/* Stroke gradient for outline effect */}
                    <LinearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                        <Stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                        <Stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                    </LinearGradient>
                </Defs>

                {/* Layer 1: Outer diffuse glow */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="330"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#innerGlow)"
                    opacity={glowOpacity.outer * 0.6}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Layer 2: Middle glow */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="325"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#innerGlow)"
                    opacity={glowOpacity.middle}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Layer 3: Inner bright glow */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="322"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#innerGlow)"
                    opacity={glowOpacity.inner}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Layer 4: Main text with gradient */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#mainGradient)"
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Layer 5: Highlight stroke for 3D pop */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="none"
                    stroke="url(#strokeGradient)"
                    strokeWidth="3"
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Layer 6: Inner highlight for depth */}
                <SvgText
                    x="700"
                    y="308"
                    fontFamily="System"
                    fontSize="318"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>
            </Svg>

            {/* Extra glow effect using View shadows (iOS) */}
            {Platform.OS === 'ios' && (
                <View style={[styles.shadowOverlay, { shadowColor: isCuaresma ? '#8B5CF6' : '#F97316' }]} pointerEvents="none" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowSvg: {
        position: 'absolute',
    },
    shadowOverlay: {
        ...StyleSheet.absoluteFillObject,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
});

export default WowLogo;

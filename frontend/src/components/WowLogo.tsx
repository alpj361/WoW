import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface WowLogoProps {
    width?: number;
    height?: number;
    glowIntensity?: 'low' | 'medium' | 'high';
    variant?: 'default' | 'cuaresma';
}

export const WowLogo: React.FC<WowLogoProps> = ({
    width = 120,
    height = 40,
    glowIntensity = 'medium',
    variant = 'default',
}) => {
    // Glow opacity based on intensity
    const glowOpacity = {
        low: { outer: 0.15, middle: 0.25, inner: 0.4 },
        medium: { outer: 0.2, middle: 0.35, inner: 0.5 },
        high: { outer: 0.3, middle: 0.45, inner: 0.6 },
    }[glowIntensity];

    const isCuaresma = variant === 'cuaresma';

    return (
        <View style={styles.container}>
            <Svg width={width} height={height} viewBox="0 0 1400 450">
                <Defs>
                    {/* Main gradient */}
                    <LinearGradient id="mainGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                        <Stop offset="0%" stopColor={isCuaresma ? '#6D28D9' : '#8B5CF6'} stopOpacity="1" />
                        <Stop offset="25%" stopColor={isCuaresma ? '#7C3AED' : '#A855F7'} stopOpacity="1" />
                        <Stop offset="50%" stopColor={isCuaresma ? '#8B5CF6' : '#D946EF'} stopOpacity="1" />
                        <Stop offset="75%" stopColor={isCuaresma ? '#A78BFA' : '#EC4899'} stopOpacity="1" />
                        <Stop offset="100%" stopColor={isCuaresma ? '#C4B5FD' : '#F43F5E'} stopOpacity="1" />
                    </LinearGradient>

                    {/* Neon glow gradient */}
                    <LinearGradient id="glowGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                        <Stop offset="0%" stopColor={isCuaresma ? '#6D28D9' : '#8B5CF6'} stopOpacity="1" />
                        <Stop offset="50%" stopColor={isCuaresma ? '#7C3AED' : '#D946EF'} stopOpacity="1" />
                        <Stop offset="100%" stopColor={isCuaresma ? '#A78BFA' : '#F43F5E'} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Outer glow layer 1 - largest, most diffuse */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="330"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#glowGradient)"
                    opacity={glowOpacity.outer * 0.7}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Outer glow layer 2 */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="url(#glowGradient)"
                    opacity={glowOpacity.middle}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Middle glow layer - purple tint */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#8B5CF6"
                    opacity={glowOpacity.inner}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Inner glow - pink accent */}
                <SvgText
                    x="700"
                    y="312"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#D946EF"
                    opacity={0.3}
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>

                {/* Main text with gradient fill */}
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

                {/* Highlight stroke for extra pop */}
                <SvgText
                    x="700"
                    y="310"
                    fontFamily="System"
                    fontSize="320"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    letterSpacing="-15"
                >
                    WOW!
                </SvgText>
            </Svg>

            {/* Extra glow effect using View shadows (iOS) */}
            {Platform.OS === 'ios' && (
                <View style={styles.shadowOverlay} pointerEvents="none" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    shadowOverlay: {
        ...StyleSheet.absoluteFillObject,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
});

export default WowLogo;

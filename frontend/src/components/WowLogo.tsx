/**
 * WowLogo — neon gradient badge
 *
 * Specs from Pencil design (jNVWd / zEm0w):
 *  Container : 44×44 square, cornerRadius 14, fill #0A0A1AE6
 *              shadow purple blur=24 + magenta blur=48
 *              gradient stroke 1px (purple→pink→blue)
 *  Text      : "WOW!", Plus Jakarta Sans 800, fontSize 14 (scaled to size)
 *              gradient fill  orange→pink→purple→blue  at ~120°
 *              text-shadow purple blur=12 + magenta blur=24
 */

import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import Svg, {
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { useFonts, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';

// ─── Constants ────────────────────────────────────────────────────────────────

const isWeb = Platform.OS === 'web';
const FONT  = 'PlusJakartaSans-ExtraBold';

// Text gradient: orange → pink/magenta → purple → blue (matches Pencil ~120°)
const TEXT_GRAD_DEFAULT  = ['#F97316', '#E879F9', '#A855F7', '#60A5FA'] as const;
const TEXT_GRAD_CUARESMA = ['#7C3AED', '#9333EA', '#C4B5FD']           as const;

// Border gradient (top → bottom inside)
const BORDER_DEFAULT  = ['#A855F766', '#D946EF33', '#3B82F622'] as const;
const BORDER_CUARESMA = ['#7C3AED88', '#9333EA44', '#6D28D922'] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface WowLogoProps {
    /** Square size in px (default 44 — matches Pencil spec) */
    size?: number;
    variant?: 'default' | 'cuaresma';
    animated?: boolean;
    /** Hover glow boost on web */
    interactive?: boolean;
    // legacy compat
    badge?: boolean;
    width?: number;
    height?: number;
    glowIntensity?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const WowLogo: React.FC<WowLogoProps> = ({
    size: sizeProp,
    variant      = 'default',
    animated     = true,
    interactive  = false,
    badge        = false,
    width: legacyW,
}) => {
    const [fontsLoaded] = useFonts({ [FONT]: PlusJakartaSans_800ExtraBold });
    const [hovered, setHovered] = useState(false);

    // Resolve size: use size prop, or derive from legacy width, or default 44
    const size   = sizeProp ?? (legacyW ? Math.round(legacyW * (44 / 140)) : 44);
    const radius = Math.round(size * 0.318);          // 14 / 44 ≈ 0.318
    const fs     = Math.round(size * 0.318);          // fontSize scales with container
    const pad    = Math.max(2, Math.round(size * 0.09)); // inner padding

    const isCuaresma  = variant === 'cuaresma';
    const textGrad    = isCuaresma ? TEXT_GRAD_CUARESMA : TEXT_GRAD_DEFAULT;
    const borderGrad  = isCuaresma ? BORDER_CUARESMA    : BORDER_DEFAULT;

    // ── Animation ─────────────────────────────────────────────────────────────
    const pulse      = useSharedValue(0);
    const hoverScale = useSharedValue(1);

    useEffect(() => {
        if (!animated) return;
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
            ),
            -1, false,
        );
    }, [animated]);

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.78, 1.0]),
        transform: [{
            scale: hoverScale.value * interpolate(pulse.value, [0, 1], [0.98, 1.02]),
        }],
    }));

    // ── Hover (web) ───────────────────────────────────────────────────────────
    const onEnter = () => {
        if (!interactive || !isWeb) return;
        setHovered(true);
        hoverScale.value = withSpring(1.08, { damping: 10, stiffness: 240 });
    };
    const onLeave = () => {
        if (!interactive || !isWeb) return;
        setHovered(false);
        hoverScale.value = withSpring(1.0, { damping: 14, stiffness: 160 });
    };

    // CSS box-shadow that transitions on hover (web only)
    const webGlow: any = isWeb ? {
        boxShadow: hovered
            ? `0 0 ${size * 0.7}px rgba(168,85,247,0.95), 0 0 ${size * 1.2}px rgba(217,70,239,0.6), 0 0 ${size * 2}px rgba(96,165,250,0.3)`
            : `0 0 ${size * 0.55}px rgba(168,85,247,0.7), 0 0 ${size * 1.1}px rgba(217,70,239,0.4)`,
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        cursor: interactive ? 'default' : undefined,
    } : {};

    // ── SVG viewBox for gradient text ─────────────────────────────────────────
    // ViewBox is square matching the container, font sized to fill ~75% width.
    // "WOW!" with PlusJakartaSans≈2.65em wide. fontSize = vbSize * 0.28
    const vbSize  = 100;
    const svgFs   = vbSize * 0.30;    // 30 units in 100-unit viewBox
    const svgX    = vbSize / 2;
    const svgY    = vbSize * 0.68;    // baseline sits at 68% down

    const font = fontsLoaded ? FONT : 'System';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Animated.View
            style={[pulseStyle, webGlow, styles.shadow]}
            // @ts-ignore — web pointer events
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
        >
            {/* 1px gradient border via LinearGradient padding trick */}
            <LinearGradient
                colors={borderGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                    width:        size,
                    height:       size,
                    borderRadius: radius,
                    padding:      1,
                }}
            >
                {/* Dark inner container */}
                <View style={[
                    styles.inner,
                    {
                        borderRadius:    radius - 1,
                        padding:         pad,
                        backgroundColor: '#0A0A1AE6',
                    },
                ]}>
                    {/* Gradient text via SVG */}
                    <Svg
                        width={size - pad * 2 - 2}
                        height={size - pad * 2 - 2}
                        viewBox={`0 0 ${vbSize} ${vbSize}`}
                    >
                        <Defs>
                            {/* Text gradient: orange → pink → purple → blue at ~120° */}
                            <SvgLinearGradient
                                id="tg"
                                x1="13%" y1="87%"
                                x2="87%" y2="13%"
                            >
                                {textGrad.map((c, i) => (
                                    <Stop
                                        key={i}
                                        offset={`${Math.round((i / (textGrad.length - 1)) * 100)}%`}
                                        stopColor={c}
                                        stopOpacity="1"
                                    />
                                ))}
                            </SvgLinearGradient>
                        </Defs>

                        {/* Glow halo layer (slightly blurred via opacity stacking) */}
                        <SvgText
                            x={`${svgX}`}
                            y={`${svgY}`}
                            fontFamily={font}
                            fontSize={`${svgFs + 2}`}
                            fontWeight="800"
                            textAnchor="middle"
                            letterSpacing="-0.8"
                            fill="url(#tg)"
                            opacity={0.35}
                        >
                            WOW!
                        </SvgText>

                        {/* Sharp text */}
                        <SvgText
                            x={`${svgX}`}
                            y={`${svgY}`}
                            fontFamily={font}
                            fontSize={`${svgFs}`}
                            fontWeight="800"
                            textAnchor="middle"
                            letterSpacing="-0.8"
                            fill="url(#tg)"
                        >
                            WOW!
                        </SvgText>
                    </Svg>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    shadow: {
        // Native shadow (iOS) — matches Pencil effects
        shadowColor:   '#A855F7',
        shadowOffset:  { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius:  24,
        elevation:     12,
    },
    inner: {
        flex:            1,
        alignItems:      'center',
        justifyContent:  'center',
        overflow:        'hidden',
    },
});

export default WowLogo;

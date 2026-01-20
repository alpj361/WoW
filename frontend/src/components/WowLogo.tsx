import React from 'react';
import { Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface WowLogoProps {
    width?: number;
    height?: number;
}

export const WowLogo: React.FC<WowLogoProps> = ({ width = 120, height = 40 }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 1400 450">
            <Defs>
                <LinearGradient id="mainGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                    <Stop offset="0%" stopColor="#5a2d82" stopOpacity="1" />
                    <Stop offset="18%" stopColor="#6d2973" stopOpacity="1" />
                    <Stop offset="36%" stopColor="#8f2564" stopOpacity="1" />
                    <Stop offset="54%" stopColor="#b22d56" stopOpacity="1" />
                    <Stop offset="72%" stopColor="#d63848" stopOpacity="1" />
                    <Stop offset="90%" stopColor="#f24737" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#ff5733" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Sombra simulada (Soft Shadow) */}
            <SvgText
                x="700"
                y="328"
                fontFamily="System"
                fontSize="320"
                fontWeight="900"
                textAnchor="middle"
                fill="rgba(0,0,0,0.25)"
                letterSpacing="-15"
            >
                WOW!
            </SvgText>

            {/* Sombra secundaria (Inner Shadow simulada con offset menor) */}
            <SvgText
                x="700"
                y="320"
                fontFamily="System"
                fontSize="320"
                fontWeight="900"
                textAnchor="middle"
                fill="rgba(0,0,0,0.15)"
                letterSpacing="-15"
            >
                WOW!
            </SvgText>

            {/* Texto Principal */}
            <SvgText
                x="700"
                y="310"
                fontFamily="System"
                fontSize="320"
                fontWeight="900"
                textAnchor="middle"
                fill="url(#mainGradient)"
                stroke="url(#mainGradient)"
                strokeWidth="8"
                letterSpacing="-15"
            >
                WOW!
            </SvgText>
        </Svg>
    );
};

export default WowLogo;

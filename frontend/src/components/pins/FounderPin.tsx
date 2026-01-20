import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface FounderPinProps {
    size?: number;
}

export const FounderPin: React.FC<FounderPinProps> = ({ size = 120 }) => {
    const scale = size / 120;

    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 120 168">
            <Defs>
                {/* Metallic border gradient */}
                <LinearGradient id="metalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#E8E8E8" />
                    <Stop offset="50%" stopColor="#A0A0A0" />
                    <Stop offset="100%" stopColor="#C8C8C8" />
                </LinearGradient>

                {/* Suit gradient */}
                <LinearGradient id="suitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#5A5A5A" />
                    <Stop offset="100%" stopColor="#3D3D3D" />
                </LinearGradient>

                {/* Skin gradient */}
                <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#F5DCC8" />
                    <Stop offset="100%" stopColor="#E8CCAB" />
                </LinearGradient>

                {/* Hair gradient */}
                <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#6B6B6B" />
                    <Stop offset="100%" stopColor="#4A4A4A" />
                </LinearGradient>
            </Defs>

            <G>
                {/* Metallic outline/border */}
                <Path
                    d="M60 5 C25 5 10 25 10 55 C10 85 15 95 20 110 C25 125 30 140 35 150 C40 158 50 163 60 163 C70 163 80 158 85 150 C90 140 95 125 100 110 C105 95 110 85 110 55 C110 25 95 5 60 5"
                    fill="url(#metalBorder)"
                    stroke="#888"
                    strokeWidth="2"
                />

                {/* Inner pin area */}
                <Path
                    d="M60 10 C30 10 17 28 17 55 C17 82 21 92 26 105 C30 118 35 132 40 142 C44 150 52 155 60 155 C68 155 76 150 80 142 C85 132 90 118 94 105 C99 92 103 82 103 55 C103 28 90 10 60 10"
                    fill="#F8F8F8"
                />

                {/* Hair */}
                <Path
                    d="M35 45 C35 25 45 18 60 18 C75 18 85 25 85 45 C85 50 82 55 75 55 L45 55 C38 55 35 50 35 45"
                    fill="url(#hairGradient)"
                />

                {/* Face */}
                <Ellipse cx="60" cy="65" rx="23" ry="25" fill="url(#skinGradient)" />

                {/* Left ear */}
                <Ellipse cx="37" cy="62" rx="5" ry="7" fill="url(#skinGradient)" />
                <Path d="M35 60 Q33 62 35 64" stroke="#D4B69A" strokeWidth="1" fill="none" />

                {/* Glasses frame */}
                <Path
                    d="M42 58 L50 58 Q52 58 52 60 L52 66 Q52 68 50 68 L42 68 Q40 68 40 66 L40 60 Q40 58 42 58"
                    fill="none"
                    stroke="#2D2D2D"
                    strokeWidth="2.5"
                />
                <Path
                    d="M70 58 L78 58 Q80 58 80 60 L80 66 Q80 68 78 68 L70 68 Q68 68 68 66 L68 60 Q68 58 70 58"
                    fill="none"
                    stroke="#2D2D2D"
                    strokeWidth="2.5"
                />
                {/* Bridge */}
                <Path d="M52 62 L68 62" stroke="#2D2D2D" strokeWidth="2" />
                {/* Temple arms */}
                <Path d="M40 60 L36 58" stroke="#2D2D2D" strokeWidth="2" />
                <Path d="M80 60 L84 58" stroke="#2D2D2D" strokeWidth="2" />

                {/* Eyes */}
                <Circle cx="46" cy="63" r="2" fill="#2D2D2D" />
                <Circle cx="74" cy="63" r="2" fill="#2D2D2D" />

                {/* Eyebrows */}
                <Path d="M41 55 L51 54" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" />
                <Path d="M69 54 L79 55" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" />

                {/* Beard */}
                <Path
                    d="M40 72 Q40 90 60 92 Q80 90 80 72 L80 75 Q75 85 60 87 Q45 85 40 75 Z"
                    fill="url(#hairGradient)"
                />

                {/* Mouth (subtle smile) */}
                <Path d="M52 78 Q60 82 68 78" stroke="#8B7355" strokeWidth="1.5" fill="none" />

                {/* Nose */}
                <Path d="M60 65 L58 73 L60 75 L62 73" stroke="#D4B69A" strokeWidth="1" fill="none" />

                {/* Shirt collar */}
                <Path
                    d="M45 95 L55 105 L60 100 L65 105 L75 95"
                    fill="#FFFFFF"
                    stroke="#E0E0E0"
                    strokeWidth="1"
                />

                {/* Tie */}
                <Path
                    d="M58 100 L62 100 L64 115 L60 120 L56 115 Z"
                    fill="#2D2D2D"
                />
                <Path d="M58 100 L62 100 L61 104 L59 104 Z" fill="#3D3D3D" />

                {/* Suit jacket */}
                <Path
                    d="M30 95 L45 95 L55 105 L55 145 L30 145 C25 145 20 140 20 130 L20 110 C20 100 25 95 30 95"
                    fill="url(#suitGradient)"
                />
                <Path
                    d="M90 95 L75 95 L65 105 L65 145 L90 145 C95 145 100 140 100 130 L100 110 C100 100 95 95 90 95"
                    fill="url(#suitGradient)"
                />

                {/* Suit lapels */}
                <Path d="M45 95 L50 105 L48 110" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />
                <Path d="M75 95 L70 105 L72 110" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />

                {/* Arms crossed */}
                <Path
                    d="M25 115 C20 120 22 135 30 140 L55 140 L55 125 C50 120 40 115 25 115"
                    fill="url(#suitGradient)"
                />
                <Path
                    d="M95 115 C100 120 98 135 90 140 L65 140 L65 125 C70 120 80 115 95 115"
                    fill="url(#suitGradient)"
                />

                {/* Hands */}
                <Path
                    d="M30 130 C35 128 40 130 42 133 L40 138 L32 138 C28 136 28 132 30 130"
                    fill="url(#skinGradient)"
                />
                <Path
                    d="M90 130 C85 128 80 130 78 133 L80 138 L88 138 C92 136 92 132 90 130"
                    fill="url(#skinGradient)"
                />

                {/* Suit button */}
                <Circle cx="60" cy="125" r="3" fill="#3D3D3D" stroke="#2D2D2D" strokeWidth="0.5" />

                {/* Pin clasp/button at bottom */}
                <Circle cx="60" cy="150" r="4" fill="#888" stroke="#666" strokeWidth="1" />
                <Circle cx="60" cy="150" r="2" fill="#AAA" />
            </G>
        </Svg>
    );
};

export default FounderPin;

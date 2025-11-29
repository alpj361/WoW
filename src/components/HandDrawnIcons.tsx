import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Coffee Cup Icon - Hand-drawn style
export const HandDrawnCoffeeIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Cup body */}
    <Path
      d="M25 35 L30 75 C30 80 35 85 40 85 L60 85 C65 85 70 80 70 75 L75 35 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Cup rim */}
    <Path
      d="M20 35 L80 35"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Handle */}
    <Path
      d="M75 45 C85 45 90 50 90 60 C90 70 85 75 75 75"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Steam lines */}
    <Path
      d="M35 20 C35 15 40 15 40 20 C40 25 35 25 35 30"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    <Path
      d="M50 15 C50 10 55 10 55 15 C55 20 50 20 50 25"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    <Path
      d="M65 20 C65 15 70 15 70 20 C70 25 65 25 65 30"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
  </Svg>
);

// Restaurant/Food Icon - Hand-drawn style
export const HandDrawnFoodIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Plate */}
    <Circle
      cx="50"
      cy="50"
      r="35"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
    {/* Fork */}
    <Path
      d="M35 40 L35 60"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Path
      d="M30 35 L30 50"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M40 35 L40 50"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Knife */}
    <Path
      d="M65 40 L65 60"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Path
      d="M63 35 L67 35 L65 42 Z"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Bar/Cocktail Icon - Hand-drawn style
export const HandDrawnBarIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Glass */}
    <Path
      d="M35 30 L40 70 L60 70 L65 30 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Rim */}
    <Path
      d="M32 30 L68 30"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Straw */}
    <Path
      d="M55 25 L58 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Umbrella */}
    <Path
      d="M70 40 C70 35 80 35 80 40 L80 42 C80 42 70 42 70 40"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M75 42 L75 50"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Lemon slice */}
    <Circle
      cx="20"
      cy="45"
      r="8"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M20 37 L20 53 M14 45 L26 45"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Coworking Icon - Hand-drawn style
export const HandDrawnCoworkingIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Laptop */}
    <Path
      d="M25 55 L25 35 L75 35 L75 55 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Laptop base */}
    <Path
      d="M20 55 L80 55 L85 65 L15 65 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Screen elements */}
    <Circle cx="50" cy="45" r="3" fill={color} />
    <Path
      d="M35 42 L45 42"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M55 42 L65 42"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Gym Icon - Hand-drawn style
export const HandDrawnGymIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Dumbbell */}
    <Path
      d="M30 50 L70 50"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Left weight */}
    <Rect
      x="15"
      y="40"
      width="15"
      height="20"
      rx="2"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
    {/* Right weight */}
    <Rect
      x="70"
      y="40"
      width="15"
      height="20"
      rx="2"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
    {/* Details */}
    <Circle cx="22" cy="50" r="2" fill={color} />
    <Circle cx="78" cy="50" r="2" fill={color} />
  </Svg>
);

// Hotel Icon - Hand-drawn style
export const HandDrawnHotelIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Building */}
    <Path
      d="M25 75 L25 25 L75 25 L75 75"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Door */}
    <Rect
      x="42"
      y="55"
      width="16"
      height="20"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    {/* Windows */}
    <Rect x="32" y="32" width="10" height="10" stroke={color} strokeWidth="2" fill="none" />
    <Rect x="58" y="32" width="10" height="10" stroke={color} strokeWidth="2" fill="none" />
    <Rect x="32" y="45" width="10" height="10" stroke={color} strokeWidth="2" fill="none" />
    <Rect x="58" y="45" width="10" height="10" stroke={color} strokeWidth="2" fill="none" />
    {/* Base line */}
    <Path d="M20 75 L80 75" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

// Shopping Icon - Hand-drawn style
export const HandDrawnShoppingIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shopping bag */}
    <Path
      d="M30 35 L25 75 C25 80 28 85 33 85 L67 85 C72 85 75 80 75 75 L70 35 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Handle */}
    <Path
      d="M35 35 C35 25 40 20 50 20 C60 20 65 25 65 35"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Tag */}
    <Circle cx="50" cy="55" r="8" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M46 55 L54 55" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Map Pin Icon - Hand-drawn style
export const HandDrawnPinIcon = ({ size = 60, color = 'white' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 120" fill="none">
    <Path
      d="M50 10 C30 10 15 25 15 45 C15 70 50 110 50 110 C50 110 85 70 85 45 C85 25 70 10 50 10 Z"
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="50"
      cy="43"
      r="12"
      stroke={color}
      strokeWidth="3"
      fill="none"
    />
  </Svg>
);

import React, { useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const progress = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Scale pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress animation
    Animated.timing(progress, {
      toValue: 100,
      duration: 2500,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      // Fade out before finishing
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(onFinish, 100);
      });
    });
  }, []);

  const progressText = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0', '100'],
  });

  return (
    <Animated.View 
      style={{ flex: 1, opacity: opacityAnim }}
      className="flex-1"
    >
      <LinearGradient
        colors={['#0A2472', '#1E3A8A', '#0A2472']}
        style={{ flex: 1 }}
        className="items-center justify-center"
      >
        {/* Hand-drawn Map Pin Illustration */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center mb-8"
        >
          <Svg width="120" height="140" viewBox="0 0 120 140" fill="none">
            {/* Map pin shape - hand-drawn style */}
            <Path
              d="M60 10 C35 10 15 30 15 55 C15 85 60 130 60 130 C60 130 105 85 105 55 C105 30 85 10 60 10 Z"
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner circle */}
            <Circle
              cx="60"
              cy="52"
              r="18"
              stroke="white"
              strokeWidth="3"
              fill="none"
            />
            {/* Decorative dots around */}
            <Circle cx="45" cy="35" r="2" fill="white" opacity="0.6" />
            <Circle cx="75" cy="35" r="2" fill="white" opacity="0.6" />
            <Circle cx="35" cy="60" r="2" fill="white" opacity="0.6" />
            <Circle cx="85" cy="60" r="2" fill="white" opacity="0.6" />
          </Svg>
        </Animated.View>

        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-2" style={{ fontFamily: 'System' }}>
          Collaborative
        </Text>
        <Text className="text-white text-4xl font-bold mb-12" style={{ fontFamily: 'System' }}>
          Map Space
        </Text>

        {/* Progress indicator */}
        <View className="items-center">
          <Animated.Text 
            className="text-white text-2xl font-light"
            style={{
              opacity: progress.interpolate({
                inputRange: [0, 100],
                outputRange: [0.5, 1],
              })
            }}
          >
            {/* @ts-ignore */}
            <Animated.Text>{progressText}</Animated.Text>%
          </Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

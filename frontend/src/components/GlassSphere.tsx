import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type SphereSize = 'sm' | 'md' | 'lg';

interface GlassSphereProps {
  imageUrl: string;
  alt?: string;
  placeName: string;
  index?: number;
  delay?: number;
  size?: SphereSize;
  onPress?: () => void;
}

const getSizeMultiplier = (size: SphereSize): number => {
  switch (size) {
    case 'sm': return 0.5;
    case 'md': return 0.65;
    case 'lg': return 0.8;
    default: return 0.8;
  }
};

// Custom easing to match cubic-bezier(0.2, 0.8, 0.2, 1)
const customEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

export const GlassSphere: React.FC<GlassSphereProps> = ({
  imageUrl,
  alt,
  placeName,
  index = 0,
  delay = 0,
  size = 'lg',
  onPress,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const blurIntensity = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);

  // Calculate size based on screen width and size prop
  const baseSize = (SCREEN_WIDTH - 48) / 2 - 8;
  const sphereSize = baseSize * getSizeMultiplier(size);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 100, easing: customEasing });
    imageScale.value = withTiming(1.1, { duration: 300, easing: Easing.inOut(Easing.ease) });
    labelOpacity.value = withTiming(1, { duration: 200 });
    setShowLabel(true);
  }, []);

  const handlePressOut = useCallback(() => {
    if (!isAnimating) {
      scale.value = withTiming(1, { duration: 300, easing: customEasing });
      imageScale.value = withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) });
    }
    labelOpacity.value = withTiming(0, { duration: 400 });
    setTimeout(() => setShowLabel(false), 400);
  }, [isAnimating]);

  const handlePress = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    triggerHaptic();

    // Blur-jump animation matching the original CSS keyframes
    scale.value = withSequence(
      withTiming(0.90, { duration: 120, easing: customEasing }),
      withTiming(1.05, { duration: 200, easing: customEasing }),
      withTiming(0.99, { duration: 240, easing: customEasing }),
      withTiming(1, { duration: 240, easing: customEasing }),
    );

    rotation.value = withSequence(
      withTiming(1.5, { duration: 120, easing: customEasing }),
      withTiming(-0.5, { duration: 200, easing: customEasing }),
      withTiming(0, { duration: 240, easing: customEasing }),
      withTiming(0, { duration: 240, easing: customEasing }),
    );

    blurIntensity.value = withSequence(
      withTiming(1, { duration: 120, easing: customEasing }),
      withTiming(0.5, { duration: 200, easing: customEasing }),
      withTiming(0.15, { duration: 240, easing: customEasing }),
      withTiming(0, { duration: 240, easing: customEasing }),
    );

    setTimeout(() => {
      runOnJS(setIsAnimating)(false);
    }, 800);

    onPress?.();
  }, [isAnimating, onPress, triggerHaptic]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurIntensity.value,
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  // Platform-specific glass overlay
  const renderGlassOverlay = () => {
    if (Platform.OS === 'web') {
      // Web: CSS backdrop-filter glassmorphism
      return (
        <View style={styles.webGlassOverlay}>
          <View style={styles.webGlassInner} />
        </View>
      );
    }

    // iOS: Silicon glass effect with BlurView
    return (
      <View style={styles.iosGlassContainer}>
        <BlurView
          intensity={25}
          tint="light"
          style={styles.iosGlassBlur}
        />
        {/* Subtle gradient for depth */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.25)',
            'rgba(255, 255, 255, 0.08)',
            'rgba(255, 255, 255, 0.02)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.iosGlassGradient}
        />
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.container,
          { width: sphereSize, height: sphereSize },
          animatedContainerStyle,
        ]}
      >
        {/* Outer shadow/glow */}
        <View style={[styles.outerShadow, { width: sphereSize, height: sphereSize }]} />

        {/* Main sphere container */}
        <View style={styles.sphere}>
          {/* Background image with zoom animation */}
          <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Glassmorphic overlay - platform specific */}
          {renderGlassOverlay()}

          {/* Subtle edge highlight for 3D effect */}
          <View style={styles.edgeHighlight} />

          {/* Rim/border with glass effect */}
          <View style={styles.glassRim} />

          {/* Blur overlay for tap animation */}
          <Animated.View style={[styles.blurOverlay, animatedBlurStyle]} pointerEvents="none">
            {Platform.OS === 'web' ? (
              <View style={styles.webAnimationBlur} />
            ) : (
              <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
            )}
          </Animated.View>

          {/* Place label */}
          <Animated.View style={[styles.labelContainer, animatedLabelStyle]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.labelGradient}
            >
              <Text style={styles.labelText}>{placeName}</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerShadow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25), 0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  sphere: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // ===== iOS Silicon Glass Effect =====
  iosGlassContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  iosGlassBlur: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  iosGlassGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ===== Web Glassmorphism =====
  webGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  webGlassInner: {
    ...StyleSheet.absoluteFillObject,
    // Subtle glass effect - no heavy blur that obscures the image
    backgroundColor: 'transparent',
    // Light gradient for glass reflection effect only
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 35%, transparent 60%)',
  } as any,

  // ===== Shared Glass Elements =====
  edgeHighlight: {
    position: 'absolute',
    top: '3%',
    left: '8%',
    right: '8%',
    height: '15%',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.6,
  },
  glassRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      web: {
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 0 20px rgba(139, 92, 246, 0.1)',
      },
    }),
  },

  // ===== Animation Blur Overlay =====
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  webAnimationBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as any,

  // ===== Label =====
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 9999,
    borderBottomRightRadius: 9999,
    overflow: 'hidden',
  },
  labelGradient: {
    width: '100%',
    paddingBottom: '20%',
    paddingTop: '18%',
    alignItems: 'center',
    borderBottomLeftRadius: 9999,
    borderBottomRightRadius: 9999,
  },
  labelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
    }),
  },
});

export default GlassSphere;

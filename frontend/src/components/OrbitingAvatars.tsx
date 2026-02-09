import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface Member {
  name: string;
  image: string;
}

interface OrbitingAvatarsProps {
  members: Member[];
  children: React.ReactNode;  // Center content (event card)
  orbitWidth?: number;        // Horizontal radius (default: 160)
  orbitHeight?: number;       // Vertical radius for ellipse (default: 200)
  avatarSize?: number;        // Avatar size (default: 50)
  orbitSpeed?: number;        // Seconds per rotation (default: 12)
  showTrail?: boolean;        // Show orbit trail (default: true)
}

export function OrbitingAvatars({
  members,
  children,
  orbitWidth = 160,
  orbitHeight = 200,
  avatarSize = 50,
  orbitSpeed = 12,
  showTrail = true,
}: OrbitingAvatarsProps) {
  // Orbit rotation
  const orbitRotation = useSharedValue(0);

  // Entry animations
  const entryProgress = members.map(() => useSharedValue(0));

  useEffect(() => {
    // Entry animation
    members.forEach((_, index) => {
      const delay = index * 150;
      entryProgress[index].value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 80 })
      );
    });

    // Start orbit after entry
    const startDelay = members.length * 150 + 300;
    setTimeout(() => {
      orbitRotation.value = withRepeat(
        withTiming(360, {
          duration: orbitSpeed * 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, startDelay);

    return () => {
      cancelAnimation(orbitRotation);
    };
  }, []);

  // Calculate container size
  const containerWidth = orbitWidth * 2 + avatarSize;
  const containerHeight = orbitHeight * 2 + avatarSize;

  // Generate animated styles for each avatar
  const avatarAnimatedStyles = members.map((_, index) => {
    const angleOffset = (360 / members.length) * index;

    return useAnimatedStyle(() => {
      const currentAngle = orbitRotation.value + angleOffset;
      const angleRad = (currentAngle * Math.PI) / 180;

      // Elliptical orbit
      const x = Math.cos(angleRad) * orbitWidth * entryProgress[index].value;
      const y = Math.sin(angleRad) * orbitHeight * entryProgress[index].value;

      // Z-depth simulation (scale based on Y position)
      const depthScale = 0.7 + 0.3 * ((Math.sin(angleRad) + 1) / 2);
      const zIndex = Math.sin(angleRad) > 0 ? 20 : 5;

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: depthScale * entryProgress[index].value },
        ],
        zIndex,
        opacity: entryProgress[index].value,
      };
    });
  });

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {/* Orbit trail */}
      {showTrail && (
        <View
          style={[
            styles.orbitTrail,
            {
              width: orbitWidth * 2,
              height: orbitHeight * 2,
              borderRadius: orbitWidth,
            },
          ]}
        />
      )}

      {/* Center content */}
      <View style={styles.centerContent}>
        {children}
      </View>

      {/* Orbiting avatars */}
      {members.map((member, index) => (
        <Animated.View
          key={index}
          style={[
            styles.avatarContainer,
            avatarAnimatedStyles[index],
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Image
              source={{ uri: member.image }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitTrail: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderStyle: 'dashed',
  },
  centerContent: {
    zIndex: 10,
  },
  avatarContainer: {
    position: 'absolute',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

export default OrbitingAvatars;

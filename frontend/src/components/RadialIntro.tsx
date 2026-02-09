import React, { useEffect, useState } from 'react';
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
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface Member {
  name: string;
  image: string;
}

interface RadialIntroProps {
  members: Member[];
  avatarSize?: number;      // avatar size in pixels (default: 100)
  gap?: number;             // gap between avatars (default: 20)
  showShadow?: boolean;     // show avatar shadow (default: true)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RadialIntro({
  members,
  avatarSize = 100,
  gap = 20,
  showShadow = true,
}: RadialIntroProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Entry animations for each avatar
  const entryScale = members.map(() => useSharedValue(0));
  const entryOpacity = members.map(() => useSharedValue(0));

  // Active state for blur effect
  const activeProgress = members.map(() => useSharedValue(0));

  // Start entry animations on mount
  useEffect(() => {
    members.forEach((_, index) => {
      const delay = index * 100;

      entryScale[index].value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 100 })
      );

      entryOpacity[index].value = withDelay(
        delay,
        withTiming(1, { duration: 300 })
      );
    });
  }, []);

  const handlePressIn = (index: number) => {
    setActiveIndex(index);
    activeProgress[index].value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = (index: number) => {
    setActiveIndex(null);
    activeProgress[index].value = withTiming(0, { duration: 200 });
  };

  // Generate avatar styles
  const avatarStyles = members.map((_, index) => {
    return useAnimatedStyle(() => {
      const scale = interpolate(
        activeProgress[index].value,
        [0, 1],
        [1, 1.05]
      );

      return {
        transform: [
          { scale: entryScale[index].value * scale },
        ],
        opacity: entryOpacity[index].value,
      };
    });
  });

  // Calculate grid dimensions
  const cols = 2;
  const gridWidth = cols * avatarSize + (cols - 1) * gap;
  const rows = Math.ceil(members.length / cols);
  const gridHeight = rows * avatarSize + (rows - 1) * gap;

  return (
    <View style={[styles.container, { width: gridWidth, height: gridHeight }]}>
      <View style={[styles.grid, { gap }]}>
        {members.map((member, index) => (
          <AnimatedPressable
            key={index}
            style={[
              styles.avatarWrapper,
              avatarStyles[index],
              showShadow && styles.avatarShadow,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
            onPressIn={() => handlePressIn(index)}
            onPressOut={() => handlePressOut(index)}
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
                blurRadius={activeIndex === index ? 15 : 0}
              />

              {/* Name overlay when active */}
              {activeIndex === index && (
                <View style={styles.nameOverlay}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {member.name}
                  </Text>
                </View>
              )}
            </View>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  nameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RadialIntro;

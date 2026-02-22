import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  { id: 'all', label: 'Todos', icon: 'grid', color: '#8B5CF6' },
  { id: 'music', label: 'Entretenimiento', icon: 'musical-notes', color: '#A855F7' },
  { id: 'volunteer', label: 'Voluntariado', icon: 'heart', color: '#EC4899' },
  { id: 'general', label: 'General', icon: 'cafe', color: '#F59E0B' },
];

// ─── Animated item ────────────────────────────────────────────────────────────

interface AnimatedItemProps {
  category: Category;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const AnimatedCategoryItem: React.FC<AnimatedItemProps> = ({ category, isSelected, onPress }) => {
  const scale = useSharedValue(isSelected ? 1 : 0.88);
  const glow = useSharedValue(isSelected ? 1 : 0);
  const labelOp = useSharedValue(isSelected ? 1 : 0.55);

  const isHovered = useSharedValue(false);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1 : 0.88, { damping: 14, stiffness: 280 });
    glow.value = withTiming(isSelected ? 1 : 0, { duration: 220 });
    labelOp.value = withTiming(isSelected ? 1 : 0.65, { duration: 200 });
  }, [isSelected]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const circleStyle = useAnimatedStyle(() => {
    const defaultBg = isWeb ? 'rgba(255,255,255,0.06)' : '#1A1A2E';
    const defaultBorder = isWeb ? 'rgba(255,255,255,0.1)' : '#2A2A3E';
    return {
      backgroundColor: isSelected ? category.color : defaultBg,
      borderColor: isSelected ? category.color : defaultBorder,
      shadowColor: category.color,
      shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.75]),
      shadowRadius: interpolate(glow.value, [0, 1], [0, 14]),
      shadowOffset: { width: 0, height: 0 },
      elevation: interpolate(glow.value, [0, 1], [0, 8]),
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOp.value,
  }));

  const handlePress = () => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    }
    onPress(category.id);
  };

  const handlePointerEnter = () => {
    if (isWeb && !isSelected) {
      isHovered.value = true;
      scale.value = withSpring(0.95, { damping: 14, stiffness: 280 });
      labelOp.value = withTiming(0.85, { duration: 150 });
    }
  };

  const handlePointerLeave = () => {
    if (isWeb && !isSelected) {
      isHovered.value = false;
      scale.value = withSpring(0.88, { damping: 14, stiffness: 280 });
      labelOp.value = withTiming(0.65, { duration: 150 });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={styles.categoryItem}
      // @ts-ignore
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <Animated.View style={[styles.itemInner, wrapStyle]}>
        <Animated.View style={[styles.iconCircle, circleStyle]}>
          <Ionicons
            name={category.icon as any}
            size={20}
            color={isSelected ? '#fff' : '#6B7280'}
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.label,
            isSelected && { color: category.color, fontWeight: '600' },
            labelStyle,
          ]}
        >
          {category.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── CategoryFilter ───────────────────────────────────────────────────────────

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {categories.map((cat) => (
          <AnimatedCategoryItem
            key={cat.id}
            category={cat}
            isSelected={selectedCategory === cat.id}
            onPress={onSelectCategory}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginVertical: 10,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoryFilter;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  { id: 'all', label: 'Todos', icon: 'apps', color: '#6B7280' },
  { id: 'music', label: 'Música', icon: 'musical-notes', color: '#8B5CF6' },
  { id: 'volunteer', label: 'Voluntariado', icon: 'heart', color: '#EC4899' },
  { id: 'general', label: 'General', icon: 'fast-food', color: '#F59E0B' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.chip,
              isSelected && { backgroundColor: category.color },
            ]}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon as any}
              size={18}
              color={isSelected ? '#fff' : category.color}
            />
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    gap: 6,
    marginRight: 8,
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});

export default CategoryFilter;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  { id: 'all', label: 'Todos', icon: 'grid', color: '#6B7280' },
  { id: 'entertainment', label: 'Entretenimiento', icon: 'musical-notes', color: '#8B5CF6' },
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
    <View style={styles.container}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isSelected ? '#8B5CF6' : '#1E1E1E',
                  borderColor: isSelected ? '#8B5CF6' : '#333',
                },
              ]}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={isSelected ? '#fff' : '#9CA3AF'}
              />
            </View>
            <Text
              style={[
                styles.label,
                isSelected && { color: '#8B5CF6', fontWeight: '600' },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default CategoryFilter;

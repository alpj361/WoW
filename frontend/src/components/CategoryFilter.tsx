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
  { id: 'all', label: 'Todos', icon: 'grid', color: '#6B7280' },
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
            style={styles.categoryItem}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { 
                  backgroundColor: isSelected ? category.color : '#2A2A2A',
                  borderColor: isSelected ? category.color : '#3A3A3A',
                },
              ]}
            >
              <Ionicons
                name={category.icon as any}
                size={22}
                color={isSelected ? '#fff' : category.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                isSelected && { color: category.color, fontWeight: '700' },
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
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 6,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CategoryFilter;

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SUGGESTED_TAGS: Record<string, string[]> = {
  music: ['outdoor', 'indoor', '18+', 'todo-público', 'bar', 'gratis', 'boletos', 'VIP', 'acústico', 'festival', 'noche', 'tarde'],
  volunteer: ['fin-de-semana', 'presencial', 'familias', 'estudiantes', 'sin-experiencia', 'certificado', 'transporte', 'comida-incluida'],
  general: ['outdoor', 'indoor', '18+', 'todo-público', 'gratis', 'networking', 'noche', 'tarde', 'fin-de-semana', 'familias', 'pets-ok'],
};

interface TagSelectorProps {
  category: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ category, value, onChange }: TagSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const suggested = SUGGESTED_TAGS[category] || SUGGESTED_TAGS['general'];

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || value.includes(tag)) {
      setCustomInput('');
      return;
    }
    onChange([...value, tag]);
    setCustomInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <Text style={styles.hint}>Agrega descriptores para ayudar a los usuarios a encontrar el evento</Text>

      {/* Suggested tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggested.map((tag) => {
          const isSelected = value.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.7}
            >
              {isSelected && <Ionicons name="checkmark" size={12} color="#8B5CF6" />}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                #{tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected custom tags (not in suggestions) */}
      {value.filter(t => !suggested.includes(t)).length > 0 && (
        <View style={styles.customTagsRow}>
          {value.filter(t => !suggested.includes(t)).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.customChip}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.customChipText}>#{tag}</Text>
              <Ionicons name="close" size={12} color="#8B5CF6" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Custom tag input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Tag personalizado..."
          placeholderTextColor="#4B5563"
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustomTag}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, !customInput.trim() && styles.addButtonDisabled]}
          onPress={addCustomTag}
          disabled={!customInput.trim()}
        >
          <Ionicons name="add" size={20} color={customInput.trim() ? '#8B5CF6' : '#374151'} />
        </TouchableOpacity>
      </View>

      {value.length > 0 && (
        <TouchableOpacity style={styles.clearAll} onPress={() => onChange([])}>
          <Text style={styles.clearAllText}>Quitar todos los tags</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#8B5CF6',
  },
  customTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  customChipText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  clearAll: {
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EventForm from '../src/components/EventForm';
import ExtractionsScreen from './extractions';

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'crear' | 'extracciones'>('crear');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, activeTab === 'crear' && styles.subTabActive]}
          onPress={() => setActiveTab('crear')}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={activeTab === 'crear' ? '#fff' : '#6B7280'}
          />
          <Text style={[styles.subTabText, activeTab === 'crear' && styles.subTabTextActive]}>
            Crear
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, activeTab === 'extracciones' && styles.subTabActive]}
          onPress={() => setActiveTab('extracciones')}
        >
          <Ionicons
            name="cloud-download-outline"
            size={18}
            color={activeTab === 'extracciones' ? '#fff' : '#6B7280'}
          />
          <Text style={[styles.subTabText, activeTab === 'extracciones' && styles.subTabTextActive]}>
            Extracciones
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'crear' ? (
          <EventForm />
        ) : (
          <ExtractionsScreen embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  subTabTextActive: {
    color: '#fff',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AUDIENCE_TYPES,
  GUATEMALA_UNIVERSITIES,
  ANY_UNIVERSITY,
  parseAudience,
  formatAudienceDisplay,
  countAudienceSelections,
} from '../constants/audiences';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AudienceSelectorProps {
  value: string[];
  onChange: (audiences: string[]) => void;
  label?: string;
}

type SectionType = 'audiencia' | 'universidades' | 'miembros';

export default function AudienceSelector({
  value,
  onChange,
  label = 'Organizado para',
}: AudienceSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [localValue, setLocalValue] = useState<string[]>(value);
  const [expandedSections, setExpandedSections] = useState<Set<SectionType>>(new Set(['audiencia']));
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(new Set());
  const [membersOrg, setMembersOrg] = useState('');
  const [membersEnabled, setMembersEnabled] = useState(false);

  // Sync local state when modal opens
  useEffect(() => {
    if (modalVisible) {
      console.log('AudienceSelector: Model opened. Syncing localValue with value prop:', value);
      setLocalValue(value);
      // Parse existing members value
      const memberValue = value.find(v => v.startsWith('miembros:'));
      if (memberValue) {
        setMembersEnabled(true);
        setMembersOrg(memberValue.replace('miembros:', ''));
      } else {
        setMembersEnabled(false);
        setMembersOrg('');
      }
    }
  }, [modalVisible, value]);

  const toggleSection = (section: SectionType) => {
    console.log('AudienceSelector: toggling section', section);
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleUniversity = (uniId: string) => {
    console.log('AudienceSelector: toggling university', uniId);
    setExpandedUniversities(prev => {
      const next = new Set(prev);
      if (next.has(uniId)) {
        next.delete(uniId);
      } else {
        next.add(uniId);
      }
      return next;
    });
  };

  const toggleAudience = (audienceId: string) => {
    console.log('AudienceSelector: toggling audience', audienceId);
    const key = `audiencia:${audienceId}`;
    setLocalValue(prev => {
      if (prev.includes(key)) {
        return prev.filter(v => v !== key);
      }
      return [...prev, key];
    });
  };

  const toggleAnyUniversity = () => {
    console.log('AudienceSelector: toggling any university');
    const key = 'universidad:cualquier';
    setLocalValue(prev => {
      if (prev.includes(key)) {
        return prev.filter(v => v !== key);
      }
      // Remove all specific universities when selecting "any"
      const filtered = prev.filter(v => !v.startsWith('universidad:'));
      return [...filtered, key];
    });
  };

  const toggleUniversityAll = (uniId: string) => {
    console.log('AudienceSelector: toggling university all', uniId);
    const key = `universidad:${uniId}`;
    setLocalValue(prev => {
      // Remove "cualquier" if selecting specific university
      let filtered = prev.filter(v => v !== 'universidad:cualquier');

      // Check if university is already selected (all faculties)
      if (filtered.includes(key)) {
        // Deselect university and all its faculties
        return filtered.filter(v => !v.startsWith(`universidad:${uniId}`));
      }
      // Remove any specific faculty selections for this university
      filtered = filtered.filter(v => !v.startsWith(`universidad:${uniId}:`));
      return [...filtered, key];
    });
  };

  const toggleFaculty = (uniId: string, facultyId: string) => {
    console.log('AudienceSelector: toggling faculty', uniId, facultyId);
    const key = `universidad:${uniId}:${facultyId}`;
    const uniKey = `universidad:${uniId}`;

    setLocalValue(prev => {
      // Remove "cualquier" if selecting specific university
      let filtered = prev.filter(v => v !== 'universidad:cualquier');

      // If university "all" is selected, remove it
      if (filtered.includes(uniKey)) {
        filtered = filtered.filter(v => v !== uniKey);
      }

      if (filtered.includes(key)) {
        return filtered.filter(v => v !== key);
      }
      return [...filtered, key];
    });
  };

  const handleMembersToggle = () => {
    setMembersEnabled(!membersEnabled);
    if (membersEnabled) {
      // Removing members
      setLocalValue(prev => prev.filter(v => !v.startsWith('miembros:')));
    }
  };

  const handleConfirm = () => {
    let finalValue = [...localValue];

    // Handle members
    finalValue = finalValue.filter(v => !v.startsWith('miembros:'));
    if (membersEnabled && membersOrg.trim()) {
      finalValue.push(`miembros:${membersOrg.trim()}`);
    }

    console.log('AudienceSelector: Confirming with finalValue:', finalValue);
    onChange(finalValue);
    setModalVisible(false);
  };

  const isAudienceSelected = (audienceId: string) => {
    return localValue.includes(`audiencia:${audienceId}`);
  };

  const isAnyUniversitySelected = () => {
    return localValue.includes('universidad:cualquier');
  };

  const isUniversityAllSelected = (uniId: string) => {
    return localValue.includes(`universidad:${uniId}`);
  };

  const isFacultySelected = (uniId: string, facultyId: string) => {
    return localValue.includes(`universidad:${uniId}:${facultyId}`) ||
      localValue.includes(`universidad:${uniId}`);
  };

  const getUniversityFacultyCount = (uniId: string) => {
    const count = localValue.filter(v =>
      v.startsWith(`universidad:${uniId}:`) || v === `universidad:${uniId}`
    ).length;
    if (localValue.includes(`universidad:${uniId}`)) {
      const uni = GUATEMALA_UNIVERSITIES.find(u => u.id === uniId);
      return uni?.faculties.length || 0;
    }
    return count;
  };

  const counts = countAudienceSelections(localValue);
  const displayText = formatAudienceDisplay(value);

  console.log('AudienceSelector: Render, value:', value);

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => {
          console.log('AudienceSelector: Button Pressed');
          setModalVisible(true);
        }}
      >
        <View style={styles.triggerContent}>
          <Ionicons name="people-outline" size={20} color="#9CA3AF" />
          <View style={styles.triggerTextContainer}>
            <Text style={styles.triggerLabel}>{label}</Text>
            <Text style={styles.triggerValue} numberOfLines={1}>
              {displayText}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={() => setModalVisible(false)} />
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('AudienceSelector: Closing modal via X button');
                  setModalVisible(false);
                }}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {/* Audiencia Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('audiencia')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name={expandedSections.has('audiencia') ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#8B5CF6"
                  />
                  <Text style={styles.sectionTitle}>Audiencia</Text>
                </View>
                <Text style={styles.sectionCount}>
                  {counts.audiencia > 0 ? `${counts.audiencia} seleccionados` : ''}
                </Text>
              </TouchableOpacity>

              {expandedSections.has('audiencia') && (
                <View style={styles.sectionContent}>
                  <View style={styles.chipsContainer}>
                    {AUDIENCE_TYPES.map(audience => (
                      <TouchableOpacity
                        key={audience.id}
                        style={[
                          styles.chip,
                          isAudienceSelected(audience.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleAudience(audience.id)}
                      >
                        <Text style={styles.chipIcon}>{audience.icon}</Text>
                        <Text
                          style={[
                            styles.chipLabel,
                            isAudienceSelected(audience.id) && styles.chipLabelSelected,
                          ]}
                        >
                          {audience.label}
                        </Text>
                        {isAudienceSelected(audience.id) && (
                          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Universidades Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('universidades')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name={expandedSections.has('universidades') ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#8B5CF6"
                  />
                  <Text style={styles.sectionTitle}>Universidades</Text>
                </View>
                <Text style={styles.sectionCount}>
                  {counts.universidades > 0 ? `${counts.universidades} seleccionados` : ''}
                </Text>
              </TouchableOpacity>

              {expandedSections.has('universidades') && (
                <View style={styles.sectionContent}>
                  {/* Any University Option */}
                  <TouchableOpacity
                    style={styles.universityItem}
                    onPress={toggleAnyUniversity}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[styles.checkbox, isAnyUniversitySelected() && styles.checkboxSelected]}>
                        {isAnyUniversitySelected() && (
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        )}
                      </View>
                    </View>
                    <Text style={styles.universityName}>{ANY_UNIVERSITY.name}</Text>
                  </TouchableOpacity>

                  {/* University List */}
                  {GUATEMALA_UNIVERSITIES.map(university => (
                    <View key={university.id}>
                      <TouchableOpacity
                        style={[
                          styles.universityItem,
                          isAnyUniversitySelected() && styles.universityItemDisabled,
                        ]}
                        onPress={() => toggleUniversity(university.id)}
                        disabled={isAnyUniversitySelected()}
                      >
                        <View style={styles.universityLeft}>
                          <Ionicons
                            name={expandedUniversities.has(university.id) ? 'chevron-down' : 'chevron-forward'}
                            size={18}
                            color={isAnyUniversitySelected() ? '#4B5563' : '#8B5CF6'}
                          />
                          <Text style={[
                            styles.universityName,
                            isAnyUniversitySelected() && styles.universityNameDisabled,
                          ]}>
                            {university.shortName}
                          </Text>
                        </View>
                        <Text style={styles.facultyCount}>
                          {getUniversityFacultyCount(university.id) > 0
                            ? `${getUniversityFacultyCount(university.id)} fac.`
                            : ''}
                        </Text>
                      </TouchableOpacity>

                      {expandedUniversities.has(university.id) && !isAnyUniversitySelected() && (
                        <View style={styles.facultiesContainer}>
                          {/* All Faculties Option */}
                          <TouchableOpacity
                            style={styles.facultyItem}
                            onPress={() => toggleUniversityAll(university.id)}
                          >
                            <View style={styles.checkboxContainer}>
                              <View style={[
                                styles.checkbox,
                                isUniversityAllSelected(university.id) && styles.checkboxSelected
                              ]}>
                                {isUniversityAllSelected(university.id) && (
                                  <Ionicons name="checkmark" size={14} color="#FFF" />
                                )}
                              </View>
                            </View>
                            <Text style={styles.facultyName}>Todas las facultades</Text>
                          </TouchableOpacity>

                          {/* Individual Faculties */}
                          {university.faculties.map(faculty => (
                            <TouchableOpacity
                              key={faculty.id}
                              style={styles.facultyItem}
                              onPress={() => toggleFaculty(university.id, faculty.id)}
                            >
                              <View style={styles.checkboxContainer}>
                                <View style={[
                                  styles.checkbox,
                                  isFacultySelected(university.id, faculty.id) && styles.checkboxSelected
                                ]}>
                                  {isFacultySelected(university.id, faculty.id) && (
                                    <Ionicons name="checkmark" size={14} color="#FFF" />
                                  )}
                                </View>
                              </View>
                              <Text style={styles.facultyName}>{faculty.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Miembros Section */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('miembros')}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name={expandedSections.has('miembros') ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color="#8B5CF6"
                  />
                  <Text style={styles.sectionTitle}>Miembros</Text>
                </View>
                <Text style={styles.sectionCount}>
                  {counts.miembros ? 'Si' : 'No'}
                </Text>
              </TouchableOpacity>

              {expandedSections.has('miembros') && (
                <View style={styles.sectionContent}>
                  <TouchableOpacity
                    style={styles.membersToggle}
                    onPress={handleMembersToggle}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[styles.checkbox, membersEnabled && styles.checkboxSelected]}>
                        {membersEnabled && (
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        )}
                      </View>
                    </View>
                    <Text style={styles.membersLabel}>Solo para miembros de:</Text>
                  </TouchableOpacity>

                  {membersEnabled && (
                    <TextInput
                      style={styles.membersInput}
                      placeholder="Nombre de la organizacion..."
                      placeholderTextColor="#6B7280"
                      value={membersOrg}
                      onChangeText={setMembersOrg}
                    />
                  )}
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger Button
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  triggerValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%', // Fixed height to ensure children with flex: 1 work correctly
    zIndex: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCount: {
    color: '#8B5CF6',
    fontSize: 13,
  },

  // Section Content
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0A0A',
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: '#FFF',
  },

  // University
  universityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  universityItemDisabled: {
    opacity: 0.4,
  },
  universityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  universityName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  universityNameDisabled: {
    color: '#6B7280',
  },
  facultyCount: {
    color: '#8B5CF6',
    fontSize: 12,
  },

  // Faculties
  facultiesContainer: {
    paddingLeft: 28,
    paddingTop: 4,
  },
  facultyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  facultyName: {
    color: '#E5E7EB',
    fontSize: 13,
  },

  // Checkbox
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },

  // Members
  membersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  membersLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  membersInput: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    paddingBottom: 32,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

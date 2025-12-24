import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface InspectionDetailModalProps {
  visible: boolean;
  inspection: any;
  onClose: () => void;
  onSave: (inspection: any) => void;
  statusOptions: string[];
  onAddCustomStatus: (status: string) => void;
  onDeleteStatus: (status: string) => void;
}

export default function InspectionDetailModal({
  visible,
  inspection,
  onClose,
  onSave,
  statusOptions,
  onAddCustomStatus,
  onDeleteStatus
}: InspectionDetailModalProps) {
  const [editedInspection, setEditedInspection] = useState(inspection);
  const [activeSection, setActiveSection] = useState('details'); // 'details', 'checklist', 'notes', 'photos'
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showPassFailDropdown, setShowPassFailDropdown] = useState(false);
  const [showInspectionTypeDropdown, setShowInspectionTypeDropdown] = useState(false);
  const [showAssignedTeamDropdown, setShowAssignedTeamDropdown] = useState(false);
  const [showCustomStatusInput, setShowCustomStatusInput] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');
  const [longPressedStatus, setLongPressedStatus] = useState<string | null>(null);

  // Update editedInspection when inspection prop changes
  React.useEffect(() => {
    if (inspection) {
      setEditedInspection(inspection);
    }
  }, [inspection]);

  if (!inspection || !editedInspection) return null;

  const handleSave = () => {
    onSave(editedInspection);
    onClose();
  };

  const handlePassFailToggle = (value: 'pass' | 'fail' | null) => {
    setEditedInspection({
      ...editedInspection,
      passFailStatus: value
    });
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setEditedInspection({
        ...editedInspection,
        checklist: [
          ...editedInspection.checklist,
          { id: `check-${Date.now()}`, text: newChecklistItem, checked: false }
        ]
      });
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setEditedInspection({
      ...editedInspection,
      checklist: editedInspection.checklist.map((item: any) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    });
  };

  const deleteChecklistItem = (itemId: string) => {
    setEditedInspection({
      ...editedInspection,
      checklist: editedInspection.checklist.filter((item: any) => item.id !== itemId)
    });
  };

  const pickImage = async (photoType: 'before' | 'after' | 'correction') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setEditedInspection({
        ...editedInspection,
        photos: {
          ...editedInspection.photos,
          [photoType]: [...editedInspection.photos[photoType], ...newPhotos]
        }
      });
    }
  };

  const takePhoto = async (photoType: 'before' | 'after' | 'correction') => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhoto = result.assets[0].uri;
      setEditedInspection({
        ...editedInspection,
        photos: {
          ...editedInspection.photos,
          [photoType]: [...editedInspection.photos[photoType], newPhoto]
        }
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspection Details</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          {['details', 'checklist', 'notes', 'photos'].map((section) => (
            <TouchableOpacity
              key={section}
              style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
              onPress={() => setActiveSection(section)}
            >
              <Text style={[styles.sectionTabText, activeSection === section && styles.sectionTabTextActive]}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>
          {/* Details Section */}
          {activeSection === 'details' && (
            <View style={styles.section}>
              {/* Project Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Project Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInspection.projectName}
                  onChangeText={(text) => setEditedInspection({ ...editedInspection, projectName: text })}
                  placeholder="Enter project name"
                />
              </View>

              {/* Date Created */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date Created</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInspection.createdDate || editedInspection.inspectionDate}
                  onChangeText={(text) => setEditedInspection({ ...editedInspection, createdDate: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* Scheduled Date */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Scheduled Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInspection.scheduledDate || editedInspection.inspectionDate}
                  onChangeText={(text) => setEditedInspection({ ...editedInspection, scheduledDate: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* Stage From/To */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Stage Transition</Text>
                <View style={styles.stageContainer}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={editedInspection.stageFrom || ''}
                    onChangeText={(text) => setEditedInspection({ ...editedInspection, stageFrom: text })}
                    placeholder="From"
                  />
                  <Ionicons name="arrow-forward" size={20} color="#64748B" style={{ marginHorizontal: 8 }} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={editedInspection.stageTo || 'Inspection'}
                    onChangeText={(text) => setEditedInspection({ ...editedInspection, stageTo: text })}
                    placeholder="To"
                  />
                </View>
              </View>

              {/* Assigned Team */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Assigned Team</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowAssignedTeamDropdown(!showAssignedTeamDropdown)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="person" size={20} color="#4F46E5" />
                    <Text style={[styles.dropdownButtonText, !editedInspection.assignedTo && { color: '#94A3B8' }]}>
                      {editedInspection.assignedTo || 'Select team member'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>

                {showAssignedTeamDropdown && (
                  <View style={styles.dropdownMenu}>
                    {['Azis K', 'Oumayama M', 'Sarah Williams', 'Emely Davis'].map((member) => (
                      <TouchableOpacity
                        key={member}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditedInspection({ ...editedInspection, assignedTo: member });
                          setShowAssignedTeamDropdown(false);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                              {member.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>
                          <Text style={styles.dropdownItemText}>{member}</Text>
                        </View>
                        {editedInspection.assignedTo === member && (
                          <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Pass/Fail/In Progress Dropdown */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    { borderColor: 
                      editedInspection.passFailStatus === 'Pass' ? '#10B981' : 
                      editedInspection.passFailStatus === 'Fail' ? '#EF4444' : 
                      '#D97706' 
                    }
                  ]}
                  onPress={() => setShowPassFailDropdown(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: 
                        editedInspection.passFailStatus === 'Pass' ? '#10B981' : 
                        editedInspection.passFailStatus === 'Fail' ? '#EF4444' : 
                        '#D97706' 
                      }
                    ]} />
                    <Text style={[
                      styles.dropdownButtonText,
                      { color: 
                        editedInspection.passFailStatus === 'Pass' ? '#10B981' : 
                        editedInspection.passFailStatus === 'Fail' ? '#EF4444' : 
                        '#D97706' 
                      }
                    ]}>
                      {editedInspection.passFailStatus || 'In Progress'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>

                {showPassFailDropdown && (
                  <View style={styles.dropdownMenu}>
                    {['Pass', 'Fail', 'In Progress'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditedInspection({ ...editedInspection, passFailStatus: option });
                          setShowPassFailDropdown(false);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[
                            styles.statusDot,
                            { backgroundColor: 
                              option === 'Pass' ? '#10B981' : 
                              option === 'Fail' ? '#EF4444' : 
                              '#D97706' 
                            }
                          ]} />
                          <Text style={styles.dropdownItemText}>{option}</Text>
                        </View>
                        {editedInspection.passFailStatus === option && (
                          <Ionicons name="checkmark" size={20} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Fail Notes (required if failed) */}
              {editedInspection.passFailStatus === 'Fail' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, styles.required]}>Failure Notes *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editedInspection.failNotes}
                    onChangeText={(text) => setEditedInspection({ ...editedInspection, failNotes: text })}
                    placeholder="Required: Explain why inspection failed"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* Inspection Type Dropdown */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Inspection Type</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowInspectionTypeDropdown(!showInspectionTypeDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>{editedInspection.status}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>

                {showInspectionTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {statusOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEditedInspection({ ...editedInspection, status: option });
                          setShowInspectionTypeDropdown(false);
                        }}
                        onLongPress={() => {
                          if (!['Rough-In', 'Pre-Final', 'Final', 'Specialty'].includes(option)) {
                            setLongPressedStatus(option);
                          }
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{option}</Text>
                        {editedInspection.status === option && (
                          <Ionicons name="checkmark" size={20} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.addCustomItem]}
                      onPress={() => {
                        setShowCustomStatusInput(true);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#4F46E5" />
                      <Text style={[styles.dropdownItemText, { color: '#4F46E5' }]}>Add Custom</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Custom Status Input */}
              {showCustomStatusInput && (
                <View style={styles.customStatusInput}>
                  <TextInput
                    style={styles.textInput}
                    value={customStatusText}
                    onChangeText={setCustomStatusText}
                    placeholder="Enter custom status"
                    autoFocus
                  />
                  <View style={styles.customStatusButtons}>
                    <TouchableOpacity
                      style={styles.customStatusCancel}
                      onPress={() => {
                        setShowCustomStatusInput(false);
                        setCustomStatusText('');
                      }}
                    >
                      <Text style={styles.customStatusCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.customStatusSave}
                      onPress={() => {
                        if (customStatusText.trim()) {
                          onAddCustomStatus(customStatusText.trim());
                          setEditedInspection({ ...editedInspection, status: customStatusText.trim() });
                          setCustomStatusText('');
                          setShowCustomStatusInput(false);
                        }
                      }}
                    >
                      <Text style={styles.customStatusSaveText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Checklist Section */}
          {activeSection === 'checklist' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspection Checklist</Text>
              
              {/* Add New Item */}
              <View style={styles.addChecklistContainer}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newChecklistItem}
                  onChangeText={setNewChecklistItem}
                  placeholder="Add checklist item..."
                  onSubmitEditing={addChecklistItem}
                />
                <TouchableOpacity style={styles.addChecklistButton} onPress={addChecklistItem}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Checklist Items */}
              {editedInspection.checklist.map((item: any) => (
                <View key={item.id} style={styles.checklistItem}>
                  <TouchableOpacity
                    style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                    onPress={() => toggleChecklistItem(item.id)}
                  >
                    {item.checked && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                  <Text style={[styles.checklistText, item.checked && styles.checklistTextChecked]}>
                    {item.text}
                  </Text>
                  <TouchableOpacity onPress={() => deleteChecklistItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {editedInspection.checklist.length === 0 && (
                <Text style={styles.emptyText}>No checklist items yet</Text>
              )}
            </View>
          )}

          {/* Inspector Notes Section */}
          {activeSection === 'notes' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspector Notes</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Deficiencies Found</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editedInspection.inspectorNotes.deficiencies}
                  onChangeText={(text) => setEditedInspection({
                    ...editedInspection,
                    inspectorNotes: { ...editedInspection.inspectorNotes, deficiencies: text }
                  })}
                  placeholder="List any deficiencies found..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Corrections Needed</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editedInspection.inspectorNotes.corrections}
                  onChangeText={(text) => setEditedInspection({
                    ...editedInspection,
                    inspectorNotes: { ...editedInspection.inspectorNotes, corrections: text }
                  })}
                  placeholder="Describe required corrections..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Re-inspection Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInspection.inspectorNotes.reInspectionDate || ''}
                  onChangeText={(text) => setEditedInspection({
                    ...editedInspection,
                    inspectorNotes: { ...editedInspection.inspectorNotes, reInspectionDate: text }
                  })}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          )}

          {/* Photos Section */}
          {activeSection === 'photos' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attach Photos</Text>

              {/* Before Photos */}
              <View style={styles.photoCategory}>
                <Text style={styles.photoCategoryTitle}>Before Photos</Text>
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => takePhoto('before')}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.photoButtonSecondary]}
                    onPress={() => pickImage('before')}
                  >
                    <Ionicons name="images" size={20} color="#4F46E5" />
                    <Text style={[styles.photoButtonText, { color: '#4F46E5' }]}>Upload</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.photoCount}>{editedInspection.photos.before.length} photos</Text>
              </View>

              {/* After Photos */}
              <View style={styles.photoCategory}>
                <Text style={styles.photoCategoryTitle}>After Photos</Text>
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => takePhoto('after')}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.photoButtonSecondary]}
                    onPress={() => pickImage('after')}
                  >
                    <Ionicons name="images" size={20} color="#4F46E5" />
                    <Text style={[styles.photoButtonText, { color: '#4F46E5' }]}>Upload</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.photoCount}>{editedInspection.photos.after.length} photos</Text>
              </View>

              {/* Correction Proof Photos */}
              <View style={styles.photoCategory}>
                <Text style={styles.photoCategoryTitle}>Correction Proof</Text>
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => takePhoto('correction')}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, styles.photoButtonSecondary]}
                    onPress={() => pickImage('correction')}
                  >
                    <Ionicons name="images" size={20} color="#4F46E5" />
                    <Text style={[styles.photoButtonText, { color: '#4F46E5' }]}>Upload</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.photoCount}>{editedInspection.photos.correction.length} photos</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Delete Status Warning Modal */}
        {longPressedStatus && (
          <Modal
            visible={!!longPressedStatus}
            transparent
            animationType="fade"
            onRequestClose={() => setLongPressedStatus(null)}
          >
            <View style={styles.warningOverlay}>
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={48} color="#EF4444" />
                <Text style={styles.warningTitle}>Delete Status?</Text>
                <Text style={styles.warningMessage}>
                  Do you want to delete "{longPressedStatus}"?
                </Text>
                <View style={styles.warningButtons}>
                  <TouchableOpacity
                    style={styles.warningCancelButton}
                    onPress={() => setLongPressedStatus(null)}
                  >
                    <Text style={styles.warningCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.warningDeleteButton}
                    onPress={() => {
                      onDeleteStatus(longPressedStatus);
                      setLongPressedStatus(null);
                    }}
                  >
                    <Text style={styles.warningDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  sectionTabActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectionTabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  passFailContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  passFailButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  failButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  passFailButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  passButtonText: {
    color: '#059669',
  },
  failButtonText: {
    color: '#DC2626',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#0F172A',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#0F172A',
  },
  addCustomItem: {
    borderBottomWidth: 0,
  },
  customStatusInput: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customStatusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  customStatusCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  customStatusCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  customStatusSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  customStatusSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  addChecklistContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addChecklistButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  checklistTextChecked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 20,
  },
  photoCategory: {
    marginBottom: 24,
  },
  photoCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  photoButtonSecondary: {
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  warningMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  warningCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  warningCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  warningDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  warningDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

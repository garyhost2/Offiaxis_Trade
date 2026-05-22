import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getProjectById, updateProjectGalleryDescription, getProjectPhotosCounts } from '../utils/projectsData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FolderType = 'before' | 'during' | 'final' | 'issues';

interface PhotoFolder {
  id: FolderType;
  name: string;
  emoji: string;
  description: string;
  count: number;
  color: string;
  gradientColors: [string, string];
}

export default function ProjectGalleryPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.id as string;
  const projectName = params.name as string || 'Project Gallery';

  const [projectDescription, setProjectDescription] = useState('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [photoCounts, setPhotoCounts] = useState({ before: 0, during: 0, final: 0, issues: 0 });

  // Load project description on mount
  useEffect(() => {
    if (projectId) {
      const project = getProjectById(parseInt(projectId));
      if (project && project.galleryDescription) {
        setProjectDescription(project.galleryDescription);
      }
    }
  }, [projectId]);

  // Load photo counts when screen comes into focus (so counts update after adding photos)
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        const counts = getProjectPhotosCounts(parseInt(projectId));
        setPhotoCounts(counts);
      }
    }, [projectId])
  );

  const folders: PhotoFolder[] = [
    {
      id: 'before',
      name: 'Before',
      emoji: '📷',
      description: 'Photos of site conditions before work begins.',
      count: photoCounts.before,
      color: '#3B82F6',
      gradientColors: ['#3B82F6', '#2563EB'],
    },
    {
      id: 'during',
      name: 'During / Progress',
      emoji: '🔨',
      description: 'Daily or weekly progress shots.',
      count: photoCounts.during,
      color: '#8B5CF6',
      gradientColors: ['#8B5CF6', '#7C3AED'],
    },
    {
      id: 'final',
      name: 'Final / Completion',
      emoji: '✅',
      description: 'Photos after work is completed.',
      count: photoCounts.final,
      color: '#10B981',
      gradientColors: ['#10B981', '#059669'],
    },
    {
      id: 'issues',
      name: 'Issues / Punchlist',
      emoji: '⚠️',
      description: 'Anything broken, missing, or needing a repair.',
      count: photoCounts.issues,
      color: '#EF4444',
      gradientColors: ['#EF4444', '#DC2626'],
    },
  ];

  const handleFolderPress = (folder: PhotoFolder) => {
    // Navigate to folder photos view
    router.push({
      pathname: '/folder-photos',
      params: {
        projectId,
        projectName,
        folderId: folder.id,
        folderName: folder.name,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{projectName}</Text>
            <Text style={styles.headerSubtitle}>Photo Folders</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Description Card */}
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => {
            setTempDescription(projectDescription);
            setShowDescriptionModal(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text" size={20} color="#4F46E5" />
          <View style={styles.infoTextContainer}>
            {projectDescription ? (
              <>
                <Text style={styles.infoLabel}>Project Description</Text>
                <Text style={styles.infoDescription}>{projectDescription}</Text>
              </>
            ) : (
              <Text style={styles.infoText}>Add Project Description</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
        </TouchableOpacity>

        {/* Folders Grid */}
        <View style={styles.foldersContainer}>
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={styles.folderCard}
              onPress={() => handleFolderPress(folder)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={folder.gradientColors}
                style={styles.folderGradient}
              >
                {/* Folder Header */}
                <View style={styles.folderHeader}>
                  <Text style={styles.folderEmoji}>{folder.emoji}</Text>
                  <View style={styles.folderBadge}>
                    <Text style={styles.folderCount}>{folder.count}</Text>
                  </View>
                </View>

                {/* Folder Content */}
                <View style={styles.folderContent}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.folderDescription} numberOfLines={2}>
                    {folder.description}
                  </Text>
                </View>

                {/* Folder Footer */}
                <View style={styles.folderFooter}>
                  <Text style={styles.folderAction}>
                    {folder.count === 0 
                      ? 'Add Photos' 
                      : `View ${folder.count} Photo${folder.count === 1 ? '' : 's'}`}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How to use folders:</Text>
          <View style={styles.helpItem}>
            <Ionicons name="camera" size={16} color="#64748B" />
            <Text style={styles.helpText}>
              Tap any folder to add or view photos
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="images" size={16} color="#64748B" />
            <Text style={styles.helpText}>
              Keep your project photos organized by stage
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="share-social" size={16} color="#64748B" />
            <Text style={styles.helpText}>
              Easy to share specific sets with clients
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Description Edit Modal */}
      <Modal
        visible={showDescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDescriptionModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Project Description</Text>
              <TouchableOpacity
                onPress={() => setShowDescriptionModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Describe this project</Text>
            <Text style={styles.modalHint}>
              e.g., Full Kitchen Remodel, Basement Remodel, Master Room Addition
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempDescription}
              onChangeText={setTempDescription}
              placeholder="Enter project description..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              maxLength={200}
              autoFocus
            />

            <Text style={styles.characterCount}>
              {tempDescription.length}/200 characters
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  setProjectDescription(tempDescription);
                  // Save to project data
                  updateProjectGalleryDescription(parseInt(projectId), tempDescription);
                  setShowDescriptionModal(false);
                }}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 15,
    color: '#312E81',
    fontWeight: '600',
    lineHeight: 20,
  },
  foldersContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  folderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  folderGradient: {
    padding: 20,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  folderEmoji: {
    fontSize: 36,
  },
  folderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  folderCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  folderContent: {
    marginBottom: 16,
  },
  folderName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  folderDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  folderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  folderAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalSaveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

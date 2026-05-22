import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Image, Dimensions, Alert, ActivityIndicator,
  Modal, TextInput, Pressable, Animated, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import GalleryImageViewer from '../components/modals/GalleryImageViewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getProjectFolderPhotos, 
  addPhotosToProjectFolder, 
  updatePhotoInProjectFolder,
  updateProjectProfileImage,
  deletePhotoFromProjectFolder,
  GalleryPhoto,
  getAllPortfolios,
  addPhotosToPortfolio,
  createPortfolio,
  PortfolioPhoto
} from '../utils/projectsData';

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3;

interface Photo {
  id: string;
  url: string;
  timestamp: string;
  folderId?: string;
  projectId?: string;
  title?: string;
  description?: string;
  location?: string;
  tags?: string[];
}

const MAX_SELECTION = 20;

const FOLDER_OPTIONS = [
  { id: 'before', name: 'Before', icon: '📷', color: '#3B82F6' },
  { id: 'during', name: 'During / Progress', icon: '🔨', color: '#8B5CF6' },
  { id: 'final', name: 'Final / Completion', icon: '✅', color: '#10B981' },
  { id: 'issues', name: 'Issues / Punchlist', icon: '⚠️', color: '#EF4444' },
];

export default function FolderPhotosPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const projectName = params.projectName as string || 'Project';
  const folderId = params.folderId as string;
  const folderName = params.folderName as string || 'Photos';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Full screen gallery viewer state
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  
  // Long press timer
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load photos from project data store on mount
  useEffect(() => {
    if (projectId && folderId) {
      const projectPhotos = getProjectFolderPhotos(parseInt(projectId), folderId);
      setPhotos(projectPhotos);
    }
  }, [projectId, folderId]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are needed to add photos.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Take photo with camera
  const handleTakePhoto = async () => {
    setShowPhotoMenu(false);
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const asset = result.assets[0];
        const imageUri = asset.uri;
        
        const newPhoto: GalleryPhoto = {
          id: `photo-${Date.now()}`,
          url: imageUri,
          timestamp: new Date().toISOString(),
          folderId,
          projectId,
        };
        
        const updatedPhotos = addPhotosToProjectFolder(parseInt(projectId), folderId, [newPhoto]);
        setPhotos(updatedPhotos);
        setIsUploading(false);
        
        Alert.alert('Success', 'Photo added successfully!');
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  // Upload photos from gallery
  const handleUploadPhotos = async () => {
    setShowPhotoMenu(false);
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        
        const selectedCount = result.assets.length;
        if (selectedCount > 10) {
          Alert.alert('Limit Exceeded', 'You can only upload up to 10 photos at a time.');
          setIsUploading(false);
          return;
        }

        const newPhotos: GalleryPhoto[] = result.assets.map((asset, index) => {
          return {
            id: `photo-${Date.now()}-${index}`,
            url: asset.uri,
            timestamp: new Date().toISOString(),
            folderId,
            projectId,
          };
        });
        
        const updatedPhotos = addPhotosToProjectFolder(parseInt(projectId), folderId, newPhotos);
        setPhotos(updatedPhotos);
        setIsUploading(false);
        
        Alert.alert('Success', `${selectedCount} photo${selectedCount > 1 ? 's' : ''} added successfully!`);
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    }
  };

  // Handle opening full screen gallery
  const handlePhotoPress = (index: number) => {
    if (isSelectionMode) {
      togglePhotoSelection(photos[index].id);
    } else {
      setSelectedPhotoIndex(index);
      setShowGalleryViewer(true);
    }
  };

  // Handle long press to start selection mode
  const handleLongPress = (photoId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedPhotos(new Set([photoId]));
      setShowActionSheet(true);
    }
  };

  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
      if (newSelection.size === 0) {
        exitSelectionMode();
        return;
      }
    } else {
      if (newSelection.size >= MAX_SELECTION) {
        Alert.alert('Limit Reached', `You can only select up to ${MAX_SELECTION} photos.`);
        return;
      }
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedPhotos(new Set());
    setShowActionSheet(false);
    setShowMoveOptions(false);
  };

  // Permanently delete selected photos
  const handleDeleteSelectedPhotos = () => {
    if (selectedPhotos.size === 0) return;
    
    const photoCount = selectedPhotos.size;
    const message = `Are you sure you want to permanently delete ${photoCount} photo${photoCount !== 1 ? 's' : ''}?\n\n⚠️ WARNING: This action cannot be undone. There is no backup and deleted photos cannot be recovered.`;
    
    // Use confirm for web, Alert for native
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`⚠️ Permanent Deletion\n\n${message}`);
      if (confirmed) {
        performDeletion();
      }
    } else {
      Alert.alert(
        '⚠️ Permanent Deletion',
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: performDeletion
          }
        ]
      );
    }
  };
  
  // Actual deletion logic
  const performDeletion = () => {
    const photoCount = selectedPhotos.size;
    
    // Delete each selected photo
    selectedPhotos.forEach(photoId => {
      deletePhotoFromProjectFolder(parseInt(projectId), folderId, photoId);
    });
    
    // Update local state
    const remainingPhotos = photos.filter(p => !selectedPhotos.has(p.id));
    setPhotos(remainingPhotos);
    
    if (Platform.OS === 'web') {
      window.alert(`${photoCount} photo${photoCount !== 1 ? 's' : ''} permanently deleted.`);
    } else {
      Alert.alert(
        'Deleted',
        `${photoCount} photo${photoCount !== 1 ? 's' : ''} permanently deleted.`
      );
    }
    
    exitSelectionMode();
  };

  // Move photos to another folder
  const handleMoveToFolder = (targetFolderId: string) => {
    if (targetFolderId === folderId) {
      Alert.alert('Same Folder', 'Photos are already in this folder.');
      return;
    }

    const photosToMove = photos.filter(p => selectedPhotos.has(p.id));
    
    // Add to target folder
    const photosWithNewFolder = photosToMove.map(p => ({
      ...p,
      folderId: targetFolderId,
    }));
    addPhotosToProjectFolder(parseInt(projectId), targetFolderId, photosWithNewFolder as GalleryPhoto[]);
    
    // Remove from current folder
    photosToMove.forEach(p => {
      deletePhotoFromProjectFolder(parseInt(projectId), folderId, p.id);
    });
    
    // Update local state
    const remainingPhotos = photos.filter(p => !selectedPhotos.has(p.id));
    setPhotos(remainingPhotos);
    
    const targetFolder = FOLDER_OPTIONS.find(f => f.id === targetFolderId);
    Alert.alert('Success', `${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} moved to ${targetFolder?.name || targetFolderId}.`);
    
    exitSelectionMode();
    setShowMoveOptions(false);
    setShowActionSheet(false);
  };

  // Copy photos to portfolio
  const handleCopyToPortfolio = (portfolioId: string) => {
    const photosToAdd = photos.filter(p => selectedPhotos.has(p.id));
    
    // Convert to PortfolioPhoto format and add to portfolio using shared function
    const portfolioPhotos: PortfolioPhoto[] = photosToAdd.map(p => ({
      id: `portfolio-copy-${Date.now()}-${p.id}`,
      url: p.url,
      timestamp: p.timestamp,
      title: p.title,
      description: p.description,
      location: p.location,
      sourceProjectId: projectId,
      sourceFolderId: folderId,
    }));
    
    const updatedPortfolio = addPhotosToPortfolio(portfolioId, portfolioPhotos);
    
    if (updatedPortfolio) {
      Alert.alert('Success', `${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} copied to "${updatedPortfolio.title}".`);
    } else {
      Alert.alert('Error', 'Failed to copy photos. Please try again.');
    }
    
    exitSelectionMode();
    setShowPortfolioModal(false);
    setShowActionSheet(false);
  };

  // Create new portfolio
  const handleCreatePortfolio = () => {
    if (!newPortfolioTitle.trim()) {
      Alert.alert('Required', 'Please enter a portfolio title.');
      return;
    }
    
    const photosToAdd = photos.filter(p => selectedPhotos.has(p.id));
    
    // Convert to PortfolioPhoto format
    const portfolioPhotos: PortfolioPhoto[] = photosToAdd.map(p => ({
      id: `portfolio-copy-${Date.now()}-${p.id}`,
      url: p.url,
      timestamp: p.timestamp,
      title: p.title,
      description: p.description,
      location: p.location,
      sourceProjectId: projectId,
      sourceFolderId: folderId,
    }));
    
    // Use the shared createPortfolio function
    const newPortfolio = createPortfolio(
      newPortfolioTitle.trim(),
      newPortfolioDescription.trim() || undefined,
      portfolioPhotos
    );
    
    Alert.alert('Success', `Portfolio "${newPortfolio.title}" created with ${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''}.`);
    
    setNewPortfolioTitle('');
    setNewPortfolioDescription('');
    setShowCreatePortfolio(false);
    setShowPortfolioModal(false);
    exitSelectionMode();
    setShowActionSheet(false);
  };

  // Handle photo update from gallery viewer
  const handleUpdatePhoto = (updatedPhoto: Photo) => {
    const updatedPhotos = updatePhotoInProjectFolder(
      parseInt(projectId), 
      folderId, 
      updatedPhoto as GalleryPhoto
    );
    setPhotos(updatedPhotos);
  };

  // Handle setting a photo as project profile picture
  const handleSetAsProfilePicture = (photo: Photo) => {
    updateProjectProfileImage(parseInt(projectId), photo.url);
  };

  const getFolderColor = (): [string, string] => {
    switch (folderId) {
      case 'before': return ['#3B82F6', '#2563EB'];
      case 'during': return ['#8B5CF6', '#7C3AED'];
      case 'final': return ['#10B981', '#059669'];
      case 'issues': return ['#EF4444', '#DC2626'];
      default: return ['#4F46E5', '#6366F1'];
    }
  };

  const gradientColors = getFolderColor();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={gradientColors} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (isSelectionMode) {
                exitSelectionMode();
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name={isSelectionMode ? "close" : "arrow-back"} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            {isSelectionMode ? (
              <Text style={styles.headerTitle}>{selectedPhotos.size}/{MAX_SELECTION} Selected</Text>
            ) : (
              <>
                <Text style={styles.headerTitle}>{folderName}</Text>
                <Text style={styles.headerSubtitle}>{projectName}</Text>
              </>
            )}
          </View>
          
          {isSelectionMode ? (
            <View style={styles.selectionActions}>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={() => {
                  if (selectedPhotos.size === photos.length || selectedPhotos.size >= MAX_SELECTION) {
                    setSelectedPhotos(new Set());
                  } else {
                    const allIds = photos.slice(0, MAX_SELECTION).map(p => p.id);
                    setSelectedPhotos(new Set(allIds));
                  }
                }}
              >
                <Text style={styles.selectAllText}>
                  {selectedPhotos.size === photos.length ? 'Deselect' : 'Select All'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteHeaderButton}
                onPress={handleDeleteSelectedPhotos}
              >
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCount}>{photos.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Photos Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="images-outline" size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyDescription}>
              Tap the + button to add photos to this folder
            </Text>
            
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Quick Tips:</Text>
              <View style={styles.tipItem}>
                <Ionicons name="camera" size={18} color="#4F46E5" />
                <Text style={styles.tipText}>Take photos directly with your camera</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="image" size={18} color="#4F46E5" />
                <Text style={styles.tipText}>Upload from your gallery</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="hand-left" size={18} color="#4F46E5" />
                <Text style={styles.tipText}>Long press to select multiple photos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <Pressable
                key={photo.id}
                style={[
                  styles.photoItem, 
                  { width: imageSize, height: imageSize },
                  isSelectionMode && selectedPhotos.has(photo.id) && styles.photoItemSelected
                ]}
                onPress={() => handlePhotoPress(index)}
                onLongPress={() => handleLongPress(photo.id)}
                delayLongPress={500}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                {/* Selection overlay */}
                {isSelectionMode && (
                  <View style={[
                    styles.selectionOverlay,
                    selectedPhotos.has(photo.id) && styles.selectionOverlaySelected
                  ]}>
                    <View style={[
                      styles.checkbox,
                      selectedPhotos.has(photo.id) && styles.checkboxSelected
                    ]}>
                      {selectedPhotos.has(photo.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                )}
                {/* Info badge */}
                {!isSelectionMode && (photo.title || photo.description) && (
                  <View style={styles.photoInfoBadge}>
                    <Ionicons name="information-circle" size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
        
        <View style={{ height: isSelectionMode ? 180 : 100 }} />
      </ScrollView>

      {/* Photo Menu Overlay */}
      {showPhotoMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoMenu(false)}
        >
          <View style={styles.photoMenuContainer}>
            <TouchableOpacity style={styles.photoMenuItem} onPress={handleTakePhoto}>
              <View style={[styles.photoMenuIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="camera" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.photoMenuText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.photoMenuItem} onPress={handleUploadPhotos}>
              <View style={[styles.photoMenuIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images" size={24} color="#16A34A" />
              </View>
              <Text style={styles.photoMenuText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* FAB - only show when not in selection mode */}
      {!isSelectionMode && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => setShowPhotoMenu(!showPhotoMenu)}
          disabled={isUploading}
        >
          <LinearGradient colors={gradientColors} style={styles.fabGradient}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name={showPhotoMenu ? "close" : "add"} size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Selection Action Sheet */}
      {isSelectionMode && showActionSheet && (
        <View style={styles.actionSheet}>
          <View style={styles.actionSheetHandle} />
          <Text style={styles.actionSheetTitle}>
            {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''} Selected
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowPortfolioModal(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="folder-outline" size={24} color="#16A34A" />
              </View>
              <Text style={styles.actionText}>Copy to Portfolio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowMoveOptions(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="arrow-forward-outline" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.actionText}>Move to...</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Move Options Modal */}
      <Modal visible={showMoveOptions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move to Folder</Text>
              <TouchableOpacity onPress={() => setShowMoveOptions(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Select destination folder:</Text>
            
            <ScrollView style={styles.folderList}>
              {FOLDER_OPTIONS.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderOption,
                    folder.id === folderId && styles.folderOptionDisabled
                  ]}
                  onPress={() => handleMoveToFolder(folder.id)}
                  disabled={folder.id === folderId}
                >
                  <View style={[styles.folderIcon, { backgroundColor: folder.color + '20' }]}>
                    <Text style={styles.folderEmoji}>{folder.icon}</Text>
                  </View>
                  <Text style={[
                    styles.folderName,
                    folder.id === folderId && styles.folderNameDisabled
                  ]}>
                    {folder.name}
                  </Text>
                  {folder.id === folderId && (
                    <Text style={styles.currentLabel}>Current</Text>
                  )}
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={folder.id === folderId ? '#CBD5E1' : '#64748B'} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Portfolio Selection Modal */}
      <Modal visible={showPortfolioModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Copy to Portfolio</Text>
              <TouchableOpacity onPress={() => setShowPortfolioModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Select portfolio or create new:</Text>
            
            <ScrollView style={styles.folderList}>
              {/* Create New Option */}
              <TouchableOpacity
                style={styles.createNewOption}
                onPress={() => setShowCreatePortfolio(true)}
              >
                <View style={[styles.folderIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="add" size={24} color="#4F46E5" />
                </View>
                <Text style={styles.createNewText}>Create New Portfolio</Text>
                <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
              </TouchableOpacity>
              
              {/* Existing Portfolios - using shared getAllPortfolios */}
              {getAllPortfolios().map((portfolio) => (
                <TouchableOpacity
                  key={portfolio.id}
                  style={styles.folderOption}
                  onPress={() => handleCopyToPortfolio(portfolio.id)}
                >
                  <View style={[styles.folderIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="images" size={20} color="#16A34A" />
                  </View>
                  <View style={styles.portfolioInfo}>
                    <Text style={styles.folderName}>{portfolio.title}</Text>
                    {portfolio.description && (
                      <Text style={styles.portfolioDescription} numberOfLines={1}>
                        {portfolio.description}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.photoCountLabel}>{portfolio.photos.length} photos</Text>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Portfolio Modal */}
      <Modal visible={showCreatePortfolio} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Portfolio</Text>
              <TouchableOpacity onPress={() => setShowCreatePortfolio(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={newPortfolioTitle}
                onChangeText={setNewPortfolioTitle}
                placeholder="Enter portfolio title..."
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newPortfolioDescription}
                onChangeText={setNewPortfolioDescription}
                placeholder="Enter description..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.selectedInfo}>
              <Ionicons name="images-outline" size={20} color="#64748B" />
              <Text style={styles.selectedInfoText}>
                {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} will be added
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.createButton, !newPortfolioTitle.trim() && styles.createButtonDisabled]}
              onPress={handleCreatePortfolio}
              disabled={!newPortfolioTitle.trim()}
            >
              <LinearGradient 
                colors={newPortfolioTitle.trim() ? ['#4F46E5', '#6366F1'] : ['#CBD5E1', '#E2E8F0']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Portfolio</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Screen Gallery Viewer */}
      <GalleryImageViewer
        visible={showGalleryViewer}
        onClose={() => setShowGalleryViewer(false)}
        photos={photos}
        initialIndex={selectedPhotoIndex}
        onUpdatePhoto={handleUpdatePhoto}
        onSetAsProfilePicture={handleSetAsProfilePicture}
        folderColor={gradientColors}
        projectName={projectName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  selectAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  photoItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  photoItemSelected: {
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  selectionOverlaySelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  photoInfoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1001,
  },
  photoMenuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  photoMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    gap: 16,
  },
  photoMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1002,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  folderList: {
    maxHeight: 400,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  folderOptionDisabled: {
    opacity: 0.5,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderEmoji: {
    fontSize: 20,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  folderNameDisabled: {
    color: '#94A3B8',
  },
  currentLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 8,
  },
  createNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  createNewText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  photoCountLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedInfoText: {
    fontSize: 14,
    color: '#64748B',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

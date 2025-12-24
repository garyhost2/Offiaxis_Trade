import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Image, Dimensions, Alert, Modal, TextInput,
  Pressable, KeyboardAvoidingView, Platform, Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import GalleryImageViewer from '../components/modals/GalleryImageViewer';
import { 
  getPortfolioById, 
  updatePhotoInPortfolio,
  deletePhotoFromPortfolio,
  setPortfolioCoverImage,
  updatePortfolio,
  addPhotosToPortfolio,
  Portfolio,
  PortfolioPhoto
} from '../utils/projectsData';

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3;

const MAX_SELECTION = 20;
const MAX_UPLOAD = 10;

export default function PortfolioPhotosPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Accept both 'id' and 'portfolioId' parameters for compatibility
  const portfolioId = (params.portfolioId || params.id) as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  
  // Full screen gallery viewer state
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showActionSheet, setShowActionSheet] = useState(false);
  
  // Edit portfolio modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Add photos modal and camera state
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [cameraPhotos, setCameraPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  // Load portfolio data
  useEffect(() => {
    if (portfolioId) {
      const portfolioData = getPortfolioById(portfolioId);
      if (portfolioData) {
        setPortfolio(portfolioData);
        setPhotos(portfolioData.photos);
        setEditTitle(portfolioData.title);
        setEditDescription(portfolioData.description || '');
      }
    }
  }, [portfolioId]);

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
  };

  // Delete selected photos
  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to remove ${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''} from this portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedPhotos.forEach(photoId => {
              deletePhotoFromPortfolio(portfolioId, photoId);
            });
            const updatedPortfolio = getPortfolioById(portfolioId);
            if (updatedPortfolio) {
              setPhotos(updatedPortfolio.photos);
              setPortfolio(updatedPortfolio);
            }
            Alert.alert('Success', `${selectedPhotos.size} photo${selectedPhotos.size !== 1 ? 's' : ''} removed.`);
            exitSelectionMode();
          }
        }
      ]
    );
  };

  // Set as cover image
  const handleSetAsCover = () => {
    if (selectedPhotos.size !== 1) {
      Alert.alert('Select One', 'Please select exactly one photo to set as cover.');
      return;
    }
    const photoId = Array.from(selectedPhotos)[0];
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      setPortfolioCoverImage(portfolioId, photo.url);
      const updatedPortfolio = getPortfolioById(portfolioId);
      if (updatedPortfolio) {
        setPortfolio(updatedPortfolio);
      }
      Alert.alert('Success', 'Cover image updated!');
      exitSelectionMode();
    }
  };

  // Share selected photos
  const handleSharePhotos = async () => {
    try {
      const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
      
      if (selectedPhotosList.length === 0) {
        Alert.alert('Error', 'No photos selected.');
        return;
      }
      
      // Create share message with photo URLs
      const photoCount = selectedPhotosList.length;
      const portfolioName = portfolio?.title || 'Portfolio';
      
      const shareMessage = `Check out ${photoCount} photo${photoCount !== 1 ? 's' : ''} from my "${portfolioName}" portfolio!`;
      
      // For single photo, we can share the URL directly
      // For multiple photos, we share a message
      const result = await Share.share({
        message: shareMessage,
        title: `${portfolioName} Photos`,
      });
      
      if (result.action === Share.sharedAction) {
        exitSelectionMode();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share photos. Please try again.');
    }
  };

  // Handle photo update from gallery viewer
  const handleUpdatePhoto = (updatedPhoto: any) => {
    const portfolioPhoto: PortfolioPhoto = {
      id: updatedPhoto.id,
      url: updatedPhoto.url,
      timestamp: updatedPhoto.timestamp,
      title: updatedPhoto.title,
      description: updatedPhoto.description,
      location: updatedPhoto.location,
    };
    updatePhotoInPortfolio(portfolioId, portfolioPhoto);
    const updatedPortfolio = getPortfolioById(portfolioId);
    if (updatedPortfolio) {
      setPhotos(updatedPortfolio.photos);
    }
  };

  // Handle setting a photo as cover from gallery viewer
  const handleSetAsProfilePicture = (photo: any) => {
    setPortfolioCoverImage(portfolioId, photo.url);
    const updatedPortfolio = getPortfolioById(portfolioId);
    if (updatedPortfolio) {
      setPortfolio(updatedPortfolio);
    }
  };

  // Save portfolio edits
  const handleSaveEdits = () => {
    if (!editTitle.trim()) {
      Alert.alert('Required', 'Please enter a portfolio title.');
      return;
    }
    updatePortfolio(portfolioId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });
    const updatedPortfolio = getPortfolioById(portfolioId);
    if (updatedPortfolio) {
      setPortfolio(updatedPortfolio);
    }
    setShowEditModal(false);
    Alert.alert('Success', 'Portfolio updated!');
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }
      
      setShowAddPhotosModal(false);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add the photo to camera photos array for preview
        setCameraPhotos(prev => [...prev, ...result.assets]);
        setShowCameraPreview(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Take another photo
  const handleTakeAnotherPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCameraPhotos(prev => [...prev, ...result.assets].slice(0, MAX_UPLOAD));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Remove a camera photo
  const handleRemoveCameraPhoto = (index: number) => {
    setCameraPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Confirm and add camera photos to portfolio
  const handleConfirmCameraPhotos = () => {
    if (cameraPhotos.length === 0) return;
    
    const newPhotos: PortfolioPhoto[] = cameraPhotos.map((img, index) => ({
      id: `camera-${Date.now()}-${index}`,
      url: img.uri,
      timestamp: new Date().toISOString(),
      title: `Photo ${photos.length + index + 1}`,
    }));
    
    const updatedPortfolio = addPhotosToPortfolio(portfolioId, newPhotos);
    if (updatedPortfolio) {
      setPortfolio(updatedPortfolio);
      setPhotos(updatedPortfolio.photos);
      Alert.alert('Success', `${cameraPhotos.length} photo${cameraPhotos.length !== 1 ? 's' : ''} added to portfolio!`);
    }
    
    setCameraPhotos([]);
    setShowCameraPreview(false);
  };

  // Cancel camera photos
  const handleCancelCameraPhotos = () => {
    setCameraPhotos([]);
    setShowCameraPreview(false);
  };

  // Upload from gallery
  const handleUploadFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }
      
      setShowAddPhotosModal(false);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_UPLOAD,
        quality: 0.8,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos: PortfolioPhoto[] = result.assets.map((img, index) => ({
          id: `gallery-${Date.now()}-${index}`,
          url: img.uri,
          timestamp: new Date().toISOString(),
          title: `Photo ${photos.length + index + 1}`,
        }));
        
        const updatedPortfolio = addPhotosToPortfolio(portfolioId, newPhotos);
        if (updatedPortfolio) {
          setPortfolio(updatedPortfolio);
          setPhotos(updatedPortfolio.photos);
          Alert.alert('Success', `${result.assets.length} photo${result.assets.length !== 1 ? 's' : ''} added to portfolio!`);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  // Convert portfolio photos to gallery viewer format
  const galleryPhotos = photos.map(p => ({
    id: p.id,
    url: p.url,
    timestamp: p.timestamp,
    title: p.title,
    description: p.description,
    location: p.location,
  }));

  if (!portfolio) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header - Blue Metallic Theme */}
      <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.header}>
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
                <Text style={styles.headerTitle} numberOfLines={1}>{portfolio.title}</Text>
                {portfolio.description && (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>{portfolio.description}</Text>
                )}
              </>
            )}
          </View>
          
          {isSelectionMode ? (
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
          ) : (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Photo count */}
        {!isSelectionMode && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="images-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>{photos.length} photos</Text>
            </View>
          </View>
        )}
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
              Add photos to this portfolio from your project folders
            </Text>
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
                {/* Cover badge */}
                {!isSelectionMode && photo.url === portfolio.coverImageUrl && (
                  <View style={styles.coverBadge}>
                    <Ionicons name="star" size={12} color="#FFFFFF" />
                  </View>
                )}
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
        
        <View style={{ height: isSelectionMode ? 180 : 40 }} />
      </ScrollView>

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
              onPress={handleSetAsCover}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="star" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Set as Cover</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSharePhotos}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="share-outline" size={24} color="#16A34A" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDeleteSelected}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Portfolio Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Portfolio</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter portfolio title..."
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter description..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, !editTitle.trim() && styles.saveButtonDisabled]}
              onPress={handleSaveEdits}
              disabled={!editTitle.trim()}
            >
              <LinearGradient 
                colors={editTitle.trim() ? ['#1E3A8A', '#3B82F6'] : ['#CBD5E1', '#E2E8F0']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Photos FAB */}
      {!isSelectionMode && (
        <View style={[styles.fabContainer, Platform.OS === 'web' && { position: 'fixed' as any }]}>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.8}
            onPress={() => setShowAddPhotosModal(true)}
          >
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6']}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Photos Options Modal */}
      <Modal visible={showAddPhotosModal} transparent animationType="fade">
        <Pressable 
          style={styles.addPhotosOverlay}
          onPress={() => setShowAddPhotosModal(false)}
        >
          <View style={styles.addPhotosContent}>
            <View style={styles.addPhotosHeader}>
              <Text style={styles.addPhotosTitle}>Add Photos</Text>
              <TouchableOpacity onPress={() => setShowAddPhotosModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addPhotosOption}
              onPress={handleTakePhoto}
            >
              <View style={[styles.addPhotosIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="camera" size={28} color="#3B82F6" />
              </View>
              <View style={styles.addPhotosInfo}>
                <Text style={styles.addPhotosOptionTitle}>Take Photo</Text>
                <Text style={styles.addPhotosOptionDesc}>
                  Take multiple photos with your camera
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addPhotosOption}
              onPress={handleUploadFromGallery}
            >
              <View style={[styles.addPhotosIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images" size={28} color="#16A34A" />
              </View>
              <View style={styles.addPhotosInfo}>
                <Text style={styles.addPhotosOptionTitle}>Upload from Gallery</Text>
                <Text style={styles.addPhotosOptionDesc}>
                  Select up to {MAX_UPLOAD} images from your library
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Camera Photos Preview Modal */}
      <Modal visible={showCameraPreview} transparent animationType="slide">
        <View style={styles.cameraPreviewOverlay}>
          <View style={styles.cameraPreviewContent}>
            <View style={styles.cameraPreviewHeader}>
              <Text style={styles.cameraPreviewTitle}>
                {cameraPhotos.length} Photo{cameraPhotos.length !== 1 ? 's' : ''} Taken
              </Text>
              <TouchableOpacity onPress={handleCancelCameraPhotos}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {/* Photo Thumbnails */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cameraPhotosScroll}
            >
              {cameraPhotos.map((photo, index) => (
                <View key={`camera-${index}`} style={styles.cameraPhotoWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.cameraPhotoThumb} />
                  <TouchableOpacity 
                    style={styles.removeCameraPhotoBtn}
                    onPress={() => handleRemoveCameraPhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.cameraPreviewActions}>
              <TouchableOpacity 
                style={styles.takeAnotherBtn}
                onPress={handleTakeAnotherPhoto}
                disabled={cameraPhotos.length >= MAX_UPLOAD}
              >
                <Ionicons name="camera" size={20} color={cameraPhotos.length >= MAX_UPLOAD ? '#94A3B8' : '#3B82F6'} />
                <Text style={[
                  styles.takeAnotherText,
                  cameraPhotos.length >= MAX_UPLOAD && styles.takeAnotherTextDisabled
                ]}>
                  Take Another ({cameraPhotos.length}/{MAX_UPLOAD})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmPhotosBtn}
                onPress={handleConfirmCameraPhotos}
              >
                <LinearGradient
                  colors={['#1E3A8A', '#3B82F6']}
                  style={styles.confirmPhotosGradient}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmPhotosText}>Add to Portfolio</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Gallery Viewer */}
      <GalleryImageViewer
        visible={showGalleryViewer}
        onClose={() => setShowGalleryViewer(false)}
        photos={galleryPhotos}
        initialIndex={selectedPhotoIndex}
        onUpdatePhoto={handleUpdatePhoto}
        onSetAsProfilePicture={handleSetAsProfilePicture}
        folderColor={['#1E3A8A', '#3B82F6']}
        projectName={portfolio.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
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
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  photoItemSelected: {
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
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
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  photoInfoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Add Photos Modal Styles
  addPhotosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addPhotosContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  addPhotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addPhotosTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  addPhotosOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 12,
  },
  addPhotosIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addPhotosInfo: {
    flex: 1,
  },
  addPhotosOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  addPhotosOptionDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  // Camera Preview Modal Styles
  cameraPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cameraPreviewContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  cameraPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraPreviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  cameraPhotosScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  cameraPhotoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  cameraPhotoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  removeCameraPhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cameraPreviewActions: {
    marginTop: 20,
    gap: 12,
  },
  takeAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  takeAnotherText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  takeAnotherTextDisabled: {
    color: '#94A3B8',
  },
  confirmPhotosBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmPhotosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmPhotosText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

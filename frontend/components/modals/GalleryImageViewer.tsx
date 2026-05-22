import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INFO_PANEL_HEIGHT = 380;

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

interface GalleryImageViewerProps {
  visible: boolean;
  onClose: () => void;
  photos: Photo[];
  initialIndex: number;
  onUpdatePhoto?: (photo: Photo) => void;
  onSetAsProfilePicture?: (photo: Photo) => void;
  folderColor?: [string, string];
  projectName?: string;
}

const GalleryImageViewer: React.FC<GalleryImageViewerProps> = ({
  visible,
  onClose,
  photos,
  initialIndex,
  onUpdatePhoto,
  onSetAsProfilePicture,
  folderColor = ['#4F46E5', '#6366F1'],
  projectName = 'Project',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  
  // Edit state for current photo
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const infoPanelY = useRef(new Animated.Value(INFO_PANEL_HEIGHT)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const swipeDownY = useRef(new Animated.Value(0)).current;
  const uiOpacity = useRef(new Animated.Value(1)).current;
  
  // Zoom animation values
  const scale = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  // Refs for tracking
  const scaleValue = useRef(1);
  const panXValue = useRef(0);
  const panYValue = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapX = useRef(0);
  const lastTapY = useRef(0);
  const isPinching = useRef(false);
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setShowInfoPanel(false);
      setIsEditing(false);
      setShowUI(true);
      setCurrentScale(1);
      translateX.setValue(-initialIndex * SCREEN_WIDTH);
      infoPanelY.setValue(INFO_PANEL_HEIGHT);
      swipeDownY.setValue(0);
      backgroundOpacity.setValue(1);
      uiOpacity.setValue(1);
      resetZoom();
    }
  }, [visible, initialIndex]);

  // Update edit fields when current photo changes
  useEffect(() => {
    if (photos[currentIndex]) {
      const photo = photos[currentIndex];
      setEditTitle(photo.title || '');
      setEditDescription(photo.description || '');
      setEditLocation(photo.location || '');
    }
  }, [currentIndex, photos]);

  // Reset zoom when changing photos
  useEffect(() => {
    resetZoom();
  }, [currentIndex]);

  const currentPhoto = photos[currentIndex];

  const resetZoom = () => {
    scale.setValue(1);
    panX.setValue(0);
    panY.setValue(0);
    scaleValue.current = 1;
    panXValue.current = 0;
    panYValue.current = 0;
    setCurrentScale(1);
  };

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Double tap to zoom
  const handleDoubleTap = (x: number, y: number) => {
    if (showInfoPanel) return;
    
    if (scaleValue.current > 1.1) {
      // Zoom out
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, friction: 5 }),
        Animated.spring(panY, { toValue: 0, useNativeDriver: true, friction: 5 }),
      ]).start();
      scaleValue.current = 1;
      panXValue.current = 0;
      panYValue.current = 0;
      setCurrentScale(1);
    } else {
      // Zoom in to tapped point
      const zoomScale = 2.5;
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      const offsetX = (centerX - x) * (zoomScale - 1);
      const offsetY = (centerY - y) * (zoomScale - 1);
      
      Animated.parallel([
        Animated.spring(scale, { toValue: zoomScale, useNativeDriver: true, friction: 5 }),
        Animated.spring(panX, { toValue: offsetX, useNativeDriver: true, friction: 5 }),
        Animated.spring(panY, { toValue: offsetY, useNativeDriver: true, friction: 5 }),
      ]).start();
      scaleValue.current = zoomScale;
      panXValue.current = offsetX;
      panYValue.current = offsetY;
      setCurrentScale(zoomScale);
    }
  };

  // Toggle UI visibility
  const toggleUI = () => {
    if (showInfoPanel) return;
    const newShowUI = !showUI;
    setShowUI(newShowUI);
    Animated.timing(uiOpacity, {
      toValue: newShowUI ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Download image
  const handleDownload = async () => {
    if (!currentPhoto?.url) return;
    try {
      setIsDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save photos.');
        setIsDownloading(false);
        return;
      }
      if (currentPhoto.url.startsWith('http')) {
        const filename = `photo_${currentPhoto.id}_${Date.now()}.jpg`;
        const fileUri = FileSystem.documentDirectory + filename;
        const downloadResult = await FileSystem.downloadAsync(currentPhoto.url, fileUri);
        if (downloadResult.status === 200) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          await MediaLibrary.createAlbumAsync('Project Photos', asset, false);
          Alert.alert('Success', 'Photo saved to your gallery!');
        }
      } else {
        const asset = await MediaLibrary.createAssetAsync(currentPhoto.url);
        await MediaLibrary.createAlbumAsync('Project Photos', asset, false);
        Alert.alert('Success', 'Photo saved to your gallery!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Set as profile picture
  const handleSetAsProfile = () => {
    if (onSetAsProfilePicture && currentPhoto) {
      Alert.alert(
        'Set as Project Profile Picture',
        `Do you want to replace and make this your "${projectName}" Card profile picture?\n\nThis image will be shown on the project card in All Projects Gallery.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Set as Profile', onPress: () => {
            onSetAsProfilePicture(currentPhoto);
            Alert.alert('Success', `Profile picture for "${projectName}" has been updated!`);
          }}
        ]
      );
    }
  };

  // Image pan responder - handles zoom pan, pinch, and navigation
  const createImagePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gs) => {
      if (evt.nativeEvent.touches.length >= 2) return true;
      if (scaleValue.current > 1.1) return Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5;
      return Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10;
    },
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialPinchDistance.current = getDistance(touches);
        initialPinchScale.current = scaleValue.current;
      }
    },
    onPanResponderMove: (evt, gs) => {
      const touches = evt.nativeEvent.touches;
      
      // Pinch zoom
      if (touches.length >= 2 && initialPinchDistance.current > 0) {
        isPinching.current = true;
        const dist = getDistance(touches);
        const newScale = Math.max(1, Math.min(4, (dist / initialPinchDistance.current) * initialPinchScale.current));
        scale.setValue(newScale);
        scaleValue.current = newScale;
        setCurrentScale(newScale);
      }
      // Pan when zoomed
      else if (scaleValue.current > 1.1 && touches.length === 1 && !isPinching.current) {
        const maxPanX = (SCREEN_WIDTH * (scaleValue.current - 1)) / 2;
        const maxPanY = (SCREEN_HEIGHT * (scaleValue.current - 1)) / 2;
        const newPanX = Math.max(-maxPanX, Math.min(maxPanX, panXValue.current + gs.dx));
        const newPanY = Math.max(-maxPanY, Math.min(maxPanY, panYValue.current + gs.dy));
        panX.setValue(newPanX);
        panY.setValue(newPanY);
      }
      // Swipe navigation when not zoomed
      else if (scaleValue.current <= 1.1 && touches.length === 1 && !showInfoPanel && !isPinching.current) {
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
          translateX.setValue(-currentIndex * SCREEN_WIDTH + gs.dx);
        } else {
          if (gs.dy < 0) {
            infoPanelY.setValue(Math.max(0, INFO_PANEL_HEIGHT + gs.dy));
          } else if (gs.dy > 0) {
            swipeDownY.setValue(gs.dy);
            backgroundOpacity.setValue(1 - gs.dy / 400);
          }
        }
      }
    },
    onPanResponderRelease: (evt, gs) => {
      // End pinch
      if (isPinching.current) {
        isPinching.current = false;
        initialPinchDistance.current = 0;
        if (scaleValue.current < 1.1) {
          resetZoom();
        }
        return;
      }
      
      // Save pan position when zoomed
      if (scaleValue.current > 1.1) {
        panXValue.current = (panX as any)._value || panXValue.current;
        panYValue.current = (panY as any)._value || panYValue.current;
        return;
      }
      
      // Handle swipe release for navigation
      if (!showInfoPanel && scaleValue.current <= 1.1) {
        const threshold = SCREEN_WIDTH * 0.2;
        
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
          // Horizontal swipe
          if (gs.dx < -threshold && currentIndex < photos.length - 1) {
            goToPhoto(currentIndex + 1);
          } else if (gs.dx > threshold && currentIndex > 0) {
            goToPhoto(currentIndex - 1);
          } else {
            Animated.spring(translateX, {
              toValue: -currentIndex * SCREEN_WIDTH,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }
        } else {
          // Vertical swipe
          if (gs.dy < -80) {
            showInfoPanelAnim();
          } else if (gs.dy > 150) {
            Animated.parallel([
              Animated.timing(swipeDownY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
              Animated.timing(backgroundOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => {
              swipeDownY.setValue(0);
              backgroundOpacity.setValue(1);
              onClose();
            });
          } else {
            Animated.parallel([
              Animated.spring(infoPanelY, { toValue: INFO_PANEL_HEIGHT, useNativeDriver: true }),
              Animated.spring(swipeDownY, { toValue: 0, useNativeDriver: true }),
              Animated.spring(backgroundOpacity, { toValue: 1, useNativeDriver: true }),
            ]).start();
          }
        }
      }
    },
  });

  const imagePanResponder = useRef(createImagePanResponder()).current;

  // Handle tap for UI toggle and double-tap for zoom
  const handleImagePress = (evt: any) => {
    if (isPinching.current) return;
    
    const now = Date.now();
    const { pageX, pageY } = evt.nativeEvent;
    
    if (now - lastTapTime.current < 300 && 
        Math.abs(pageX - lastTapX.current) < 30 && 
        Math.abs(pageY - lastTapY.current) < 30) {
      // Double tap - zoom
      handleDoubleTap(pageX, pageY);
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      lastTapX.current = pageX;
      lastTapY.current = pageY;
      
      // Wait to see if it's a double tap
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 280) {
          // Single tap - toggle UI only when not zoomed
          if (!showInfoPanel && scaleValue.current <= 1.1) {
            toggleUI();
          }
        }
      }, 300);
    }
  };

  const goToPhoto = (index: number) => {
    resetZoom();
    setCurrentIndex(index);
    Animated.spring(translateX, {
      toValue: -index * SCREEN_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const showInfoPanelAnim = () => {
    setShowInfoPanel(true);
    setShowUI(true);
    uiOpacity.setValue(1);
    Animated.spring(infoPanelY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  };

  const hideInfoPanel = () => {
    Animated.spring(infoPanelY, { toValue: INFO_PANEL_HEIGHT, useNativeDriver: true, friction: 8 }).start(() => {
      setShowInfoPanel(false);
      setIsEditing(false);
    });
  };

  const handleSave = () => {
    if (onUpdatePhoto && currentPhoto) {
      onUpdatePhoto({
        ...currentPhoto,
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
      });
    }
    setIsEditing(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  if (!visible || photos.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: uiOpacity }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.photoCounter}>{currentIndex + 1} / {photos.length}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleDownload} disabled={isDownloading}>
              <Ionicons name={isDownloading ? "hourglass" : "download-outline"} size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => showInfoPanel ? hideInfoPanel() : showInfoPanelAnim()} testID="info-button">
              <Ionicons name={showInfoPanel ? "chevron-down" : "information-circle-outline"} size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Image Carousel */}
        <Animated.View 
          style={[styles.carouselContainer, { transform: [{ translateX }, { translateY: swipeDownY }] }]}
        >
          {photos.map((photo, index) => (
            <View 
              key={photo.id} 
              style={styles.imageContainer}
              {...(index === currentIndex ? imagePanResponder.panHandlers : {})}
              onStartShouldSetResponder={() => true}
              onResponderRelease={index === currentIndex ? handleImagePress : undefined}
            >
              <Animated.Image
                source={{ uri: photo.url }}
                style={[
                  styles.image,
                  index === currentIndex && {
                    transform: [
                      { scale },
                      { translateX: Animated.divide(panX, scale) },
                      { translateY: Animated.divide(panY, scale) },
                    ]
                  }
                ]}
                resizeMode="contain"
              />
            </View>
          ))}
        </Animated.View>

        {/* Zoom indicator */}
        {currentScale > 1.1 && showUI && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>Pinch or double-tap to zoom out</Text>
          </View>
        )}

        {/* Navigation Dots */}
        {photos.length > 1 && currentScale <= 1.1 && (
          <Animated.View style={[styles.dotsContainer, { opacity: uiOpacity }]}>
            {photos.map((_, index) => (
              <TouchableOpacity key={index} style={[styles.dot, index === currentIndex && styles.dotActive]} onPress={() => goToPhoto(index)} />
            ))}
          </Animated.View>
        )}

        {/* Swipe Hint */}
        {!showInfoPanel && currentScale <= 1.1 && (
          <Animated.View style={[styles.swipeHint, { opacity: uiOpacity }]}>
            <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.swipeHintText}>Swipe up for details</Text>
          </Animated.View>
        )}

        {/* Info Panel */}
        <Animated.View style={[styles.infoPanel, { transform: [{ translateY: infoPanelY }] }]}>
          <View style={styles.handleBar} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.infoPanelContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {isEditing ? (
                <View style={styles.editContainer}>
                  <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>Edit Photo Details</Text>
                    <TouchableOpacity onPress={() => setIsEditing(false)}>
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput style={styles.textInput} value={editTitle} onChangeText={setEditTitle} placeholder="Add a title..." placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput style={[styles.textInput, styles.textArea]} value={editDescription} onChangeText={setEditDescription} placeholder="Add a description..." placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput style={styles.textInput} value={editLocation} onChangeText={setEditLocation} placeholder="Add location..." placeholderTextColor="#94A3B8" />
                  </View>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <LinearGradient colors={folderColor} style={styles.saveButtonGradient}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.viewContainer}>
                  <Text style={styles.photoTitle}>{currentPhoto?.title || 'Untitled Photo'}</Text>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}><Ionicons name="calendar-outline" size={18} color="#4F46E5" /></View>
                    <Text style={styles.infoText}>{currentPhoto?.timestamp ? formatDate(currentPhoto.timestamp) : 'Unknown date'}</Text>
                  </View>
                  {currentPhoto?.location && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconContainer}><Ionicons name="location-outline" size={18} color="#4F46E5" /></View>
                      <Text style={styles.infoText}>{currentPhoto.location}</Text>
                    </View>
                  )}
                  {currentPhoto?.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Description</Text>
                      <Text style={styles.descriptionText}>{currentPhoto.description}</Text>
                    </View>
                  )}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => setIsEditing(true)}>
                      <LinearGradient colors={folderColor} style={styles.actionButtonGradient}>
                        <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Edit Details</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {onSetAsProfilePicture && (
                      <TouchableOpacity style={[styles.actionButton, styles.profileButton]} onPress={handleSetAsProfile}>
                        <View style={styles.profileButtonInner}>
                          <Ionicons name="image-outline" size={18} color="#4F46E5" />
                          <Text style={styles.profileButtonText}>Set as Profile</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Web Navigation Arrows */}
        {photos.length > 1 && Platform.OS === 'web' && currentScale <= 1.1 && (
          <Animated.View style={[styles.navArrowsContainer, { opacity: uiOpacity }]}>
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.navArrow, styles.navArrowLeft]} onPress={() => goToPhoto(currentIndex - 1)}>
                <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {currentIndex < photos.length - 1 && (
              <TouchableOpacity style={[styles.navArrow, styles.navArrowRight]} onPress={() => goToPhoto(currentIndex + 1)}>
                <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, paddingBottom: 16,
    zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  photoCounter: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  carouselContainer: { flex: 1, flexDirection: 'row' },
  imageContainer: {
    width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  zoomIndicator: {
    position: 'absolute', top: Platform.OS === 'ios' ? 120 : 100,
    left: 0, right: 0, alignItems: 'center', zIndex: 50,
  },
  zoomText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  dotsContainer: {
    position: 'absolute', bottom: 100, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 50,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 24, backgroundColor: '#FFFFFF' },
  swipeHint: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  swipeHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  infoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: INFO_PANEL_HEIGHT,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
  },
  handleBar: { width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  infoPanelContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  viewContainer: { flex: 1 },
  photoTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 16, marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },
  descriptionContainer: { marginTop: 8, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  descriptionLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  descriptionText: { fontSize: 15, color: '#0F172A', lineHeight: 22 },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  editButton: {},
  actionButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  profileButton: { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D2FE' },
  profileButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  profileButtonText: { fontSize: 15, fontWeight: '600', color: '#4F46E5' },
  editContainer: { flex: 1 },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  editTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#0F172A' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  navArrowsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' },
  navArrow: {
    position: 'absolute', top: '50%', transform: [{ translateY: -25 }],
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  navArrowLeft: { left: 16 },
  navArrowRight: { right: 16 },
});

export default GalleryImageViewer;

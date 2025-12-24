import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { getAllProjects } from '../utils/projectsData';

const { width, height } = Dimensions.get('window');

interface Project {
  id: number;
  name: string;
  galleryDescription: string;
  street: string;
  city: string;
  status: string;
}

interface PunchListItem {
  id: string;
  description: string;
  location?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  linkedPhotos?: string[]; // Photo IDs linked to this item
}

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  checked: boolean;
  linkedPhotos?: string[];
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  notes?: string;
  linkedPhotos?: string[];
}

interface CapturedPhoto {
  id: string;
  uri: string;
  base64?: string;
  capturedAt: Date;
  voiceNoteId?: string; // Link to voice note being recorded when photo was taken
}

interface VoiceNote {
  id: string;
  text: string;
  timestamp: Date;
  duration?: number;
  linkedPhotos?: string[]; // Photos captured during this voice note
}

// AI Recording Session - stores complete capture session with results
interface AIRecordingSession {
  id: string;
  createdAt: Date;
  projectId?: number;
  projectName?: string;
  projectAddress?: string;
  duration: number;
  photoCount: number;
  photos: CapturedPhoto[];
  voiceNotes: VoiceNote[];
  aiResults: {
    punchList: PunchListItem[];
    checklist: ChecklistItem[];
    materialList: MaterialItem[];
  };
}

type ViewMode = 'capture' | 'results';
type ResultTab = 'punch' | 'checklist' | 'materials';

export default function SiteNotesAIPage() {
  const router = useRouter();
  
  // Camera Permission
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  
  // Capture State
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [currentVoiceInput, setCurrentVoiceInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVoiceNoteIdRef = useRef<string | null>(null);
  const sessionPhotosRef = useRef<string[]>([]); // Photos captured during current session
  
  // Full-screen Camera Mode
  const [showFullScreenCamera, setShowFullScreenCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photoFlash, setPhotoFlash] = useState(false);
  
  // AI Listening Animation
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  // Voice Waveform Animation (8 bars)
  const waveformBars = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('capture');
  
  // Results State
  const [punchList, setPunchList] = useState<PunchListItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('punch');
  
  // Saved AI Recording Sessions
  const [savedSessions, setSavedSessions] = useState<AIRecordingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AIRecordingSession | null>(null);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [sessionDetailTab, setSessionDetailTab] = useState<ResultTab>('punch');
  
  // Modal State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  // Load projects on mount
  useEffect(() => {
    const allProjects = getAllProjects();
    setProjects(allProjects);
  }, []);

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // AI Listening Animation Effect
  useEffect(() => {
    if (isRecording && showFullScreenCamera) {
      // Pulse animations for the AI orbs
      const createPulse = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1.3,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const pulse1 = createPulse(pulseAnim1, 0);
      const pulse2 = createPulse(pulseAnim2, 200);
      const pulse3 = createPulse(pulseAnim3, 400);

      // Wave animation
      const wave = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Waveform bar animations - each bar animates at different speeds
      const waveformAnimations = waveformBars.map((bar, index) => {
        const randomDuration = 300 + Math.random() * 400; // 300-700ms
        const randomDelay = index * 50;
        return Animated.loop(
          Animated.sequence([
            Animated.delay(randomDelay),
            Animated.timing(bar, {
              toValue: 0.3 + Math.random() * 0.7, // Random height 0.3-1.0
              duration: randomDuration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.2 + Math.random() * 0.3, // Random low 0.2-0.5
              duration: randomDuration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      });

      pulse1.start();
      pulse2.start();
      pulse3.start();
      wave.start();
      waveformAnimations.forEach(anim => anim.start());

      return () => {
        pulse1.stop();
        pulse2.stop();
        pulse3.stop();
        wave.stop();
        waveformAnimations.forEach(anim => anim.stop());
        pulseAnim1.setValue(1);
        pulseAnim2.setValue(1);
        pulseAnim3.setValue(1);
        waveAnim.setValue(0);
        waveformBars.forEach(bar => bar.setValue(0.3));
      };
    }
  }, [isRecording, showFullScreenCamera]);

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    const searchLower = projectSearchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.galleryDescription?.toLowerCase().includes(searchLower) ||
      project.street?.toLowerCase().includes(searchLower) ||
      project.city?.toLowerCase().includes(searchLower)
    );
  });

  // Get API URL
  const getApiUrl = () => {
    const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';
    if (backendUrl) return backendUrl;
    return '/api';
  };

  // Open Full-Screen Camera with AI Listening
  const handleOpenFullScreenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed for this feature.');
        return;
      }
    }
    
    // Generate voice note ID for this session
    currentVoiceNoteIdRef.current = `voice-${Date.now()}`;
    sessionPhotosRef.current = [];
    setShowFullScreenCamera(true);
    
    // Start recording immediately
    setIsRecording(true);
    setRecordingDuration(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  // Capture photo in full-screen camera mode
  const handleCaptureInFullScreen = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    
    try {
      // Flash effect
      setPhotoFlash(true);
      setTimeout(() => setPhotoFlash(false), 150);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: true,
      });
      
      if (photo) {
        const photoId = `photo-${Date.now()}`;
        const newPhoto: CapturedPhoto = {
          id: photoId,
          uri: photo.uri,
          base64: photo.base64,
          capturedAt: new Date(),
          voiceNoteId: currentVoiceNoteIdRef.current || undefined,
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        sessionPhotosRef.current.push(photoId);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  // Close full-screen camera without processing (X button)
  const handleCloseFullScreenCamera = () => {
    // Stop recording
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setShowFullScreenCamera(false);
    setIsCameraReady(false);
    
    // Reset session refs
    currentVoiceNoteIdRef.current = null;
    sessionPhotosRef.current = [];
  };

  // Done button handler - close camera and process with AI
  const handleDoneAndProcess = async () => {
    // Stop recording
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setShowFullScreenCamera(false);
    setIsCameraReady(false);
    
    // If we captured photos, process with AI
    if (photos.length > 0 || sessionPhotosRef.current.length > 0) {
      // Small delay to let the modal close smoothly
      setTimeout(() => {
        processWithAI();
      }, 300);
    } else {
      Alert.alert('No Data', 'Please capture at least one photo before processing.');
    }
    
    // Reset session refs
    currentVoiceNoteIdRef.current = null;
    sessionPhotosRef.current = [];
  };

  // Process with AI function (extracted for reuse)
  const processWithAI = async () => {
    if (photos.length === 0 && voiceNotes.length === 0) {
      Alert.alert('No Data', 'Please capture at least one photo or add a voice note.');
      return;
    }

    setIsProcessing(true);

    try {
      const apiUrl = getApiUrl();
      
      // Build project context from selected project
      let projectContextText = '';
      if (selectedProject) {
        projectContextText = `Project: ${selectedProject.name} - ${selectedProject.galleryDescription || 'General Work'}. Location: ${selectedProject.street}, ${selectedProject.city}. Status: ${selectedProject.status}`;
      }
      
      // Prepare request data
      const requestData = {
        images: photos.map(p => p.base64 || '').filter(b => b !== ''),
        voiceNotes: voiceNotes.map(n => n.text),
        projectContext: projectContextText || undefined,
      };

      const response = await fetch(`${apiUrl}/site-notes/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newPunchList = result.punchList || [];
        const newChecklist = result.checklist || [];
        const newMaterialList = result.materialList || [];
        
        setPunchList(newPunchList);
        setChecklist(newChecklist);
        setMaterialList(newMaterialList);
        
        // Save the session
        const newSession: AIRecordingSession = {
          id: `session-${Date.now()}`,
          createdAt: new Date(),
          projectId: selectedProject?.id,
          projectName: selectedProject?.name,
          projectAddress: selectedProject ? `${selectedProject.street}, ${selectedProject.city}` : undefined,
          duration: recordingDuration,
          photoCount: photos.length,
          photos: [...photos],
          voiceNotes: [...voiceNotes],
          aiResults: {
            punchList: newPunchList,
            checklist: newChecklist,
            materialList: newMaterialList,
          },
        };
        setSavedSessions(prev => [newSession, ...prev]);
        
        setViewMode('results');
      } else {
        Alert.alert('Processing Error', result.error || 'Failed to process site notes.');
      }
    } catch (error) {
      console.error('Error processing site notes:', error);
      Alert.alert('Error', 'Failed to connect to AI service. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Take Photo (original method for non-fullscreen)
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: CapturedPhoto = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          capturedAt: new Date(),
          voiceNoteId: isRecording ? currentVoiceNoteIdRef.current || undefined : undefined,
        };
        setPhotos(prev => [...prev, newPhoto]);
        
        if (isRecording && currentVoiceNoteIdRef.current) {
          sessionPhotosRef.current.push(newPhoto.id);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  // Pick from Gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        base64: true,
        selectionLimit: 10,
        exif: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos: CapturedPhoto[] = result.assets.map((asset, index) => ({
          id: `photo-${Date.now()}-${index}`,
          uri: asset.uri,
          base64: asset.base64,
          capturedAt: new Date(),
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to pick photos.');
    }
  };

  // Remove Photo
  const handleRemovePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setShowPhotoPreview(false);
    setSelectedPhoto(null);
  };

  // Add Voice Note (from text input or after full-screen recording)
  const handleAddVoiceNote = () => {
    if (!currentVoiceInput.trim()) {
      Alert.alert('Empty Note', 'Please enter or speak a note.');
      return;
    }

    const newNote: VoiceNote = {
      id: currentVoiceNoteIdRef.current || `voice-${Date.now()}`,
      text: currentVoiceInput.trim(),
      timestamp: new Date(),
      duration: recordingDuration > 0 ? recordingDuration : undefined,
      linkedPhotos: sessionPhotosRef.current.length > 0 ? [...sessionPhotosRef.current] : undefined,
    };
    setVoiceNotes(prev => [...prev, newNote]);
    setCurrentVoiceInput('');
    setRecordingDuration(0);
    setShowVoiceModal(false);
    
    // Reset session refs
    currentVoiceNoteIdRef.current = null;
    sessionPhotosRef.current = [];
  };

  // Save voice note from inline recording
  const handleSaveInlineVoiceNote = () => {
    if (!currentVoiceInput.trim()) {
      Alert.alert('Empty Note', 'Please speak or type a note before saving.');
      return;
    }

    const newNote: VoiceNote = {
      id: currentVoiceNoteIdRef.current || `voice-${Date.now()}`,
      text: currentVoiceInput.trim(),
      timestamp: new Date(),
      duration: recordingDuration,
      linkedPhotos: sessionPhotosRef.current.length > 0 ? [...sessionPhotosRef.current] : undefined,
    };
    setVoiceNotes(prev => [...prev, newNote]);
    setCurrentVoiceInput('');
    setRecordingDuration(0);
    Alert.alert('Saved!', 'Voice note added successfully.');
  };

  // Remove Voice Note
  const handleRemoveVoiceNote = (noteId: string) => {
    setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Toggle recording (start/stop)
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Process with AI (button handler)
  const handleProcessWithAI = async () => {
    // Stop any active recording first
    if (isRecording) {
      handleToggleRecording();
    }
    await processWithAI();
  };

  // Toggle Checklist Item
  const handleToggleChecklistItem = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Reset and Start Over
  const handleStartOver = () => {
    Alert.alert(
      'Start Over',
      'This will clear all captured data and results. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Over',
          style: 'destructive',
          onPress: () => {
            setPhotos([]);
            setVoiceNotes([]);
            setPunchList([]);
            setChecklist([]);
            setMaterialList([]);
            setSelectedProject(null);
            setViewMode('capture');
          },
        },
      ]
    );
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  // Render Capture View
  const renderCaptureView = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Pick a Project */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pick a Project</Text>
        <TouchableOpacity
          style={styles.projectPickerButton}
          onPress={() => setShowProjectPicker(true)}
          activeOpacity={0.7}
        >
          {selectedProject ? (
            <View style={styles.selectedProjectContent}>
              <View style={styles.selectedProjectInfo}>
                <Text style={styles.selectedProjectName}>{selectedProject.name}</Text>
                <Text style={styles.selectedProjectDescription}>
                  {selectedProject.galleryDescription || 'General Work'}
                </Text>
                <Text style={styles.selectedProjectAddress}>
                  {selectedProject.street}, {selectedProject.city}
                </Text>
              </View>
              <View style={styles.selectedProjectStatus}>
                <View style={[
                  styles.statusBadge,
                  selectedProject.status === 'Completed' && styles.statusCompleted,
                  selectedProject.status === 'Rough-In' && styles.statusRoughIn,
                  selectedProject.status === 'Inspection' && styles.statusInspection,
                  selectedProject.status === 'Final Trim' && styles.statusFinalTrim,
                ]}>
                  <Text style={styles.statusBadgeText}>{selectedProject.status}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.projectPickerPlaceholder}>
              <Ionicons name="business-outline" size={24} color="#94A3B8" />
              <Text style={styles.projectPickerPlaceholderText}>Select a project...</Text>
            </View>
          )}
          <Ionicons name="chevron-down" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* AI Capture Mode - Opens Full Screen Camera */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Capture Mode</Text>
          {photos.length > 0 && (
            <Text style={styles.sectionCount}>{photos.length} photos captured</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.aiCaptureButton}
          onPress={handleOpenFullScreenCamera}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0EA5E9', '#06B6D4', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCaptureGradient}
          >
            <View style={styles.aiCaptureContent}>
              <View style={styles.aiCaptureIconContainer}>
                <Ionicons name="mic" size={28} color="#FFFFFF" />
                <View style={styles.aiCaptureCameraIcon}>
                  <Ionicons name="camera" size={16} color="#0EA5E9" />
                </View>
              </View>
              <View style={styles.aiCaptureTextContainer}>
                <Text style={styles.aiCaptureTitle}>Tap to Start AI Capture</Text>
                <Text style={styles.aiCaptureSubtitle}>
                  Speak & snap photos simultaneously
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Capture Buttons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Capture</Text>
        </View>
        <View style={styles.quickCaptureRow}>
          <TouchableOpacity style={styles.quickCaptureBtn} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={24} color="#0EA5E9" />
            <Text style={styles.quickCaptureBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCaptureBtn} onPress={handlePickFromGallery}>
            <Ionicons name="images" size={24} color="#0EA5E9" />
            <Text style={styles.quickCaptureBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCaptureBtn} onPress={() => setShowVoiceModal(true)}>
            <Ionicons name="mic" size={24} color="#0EA5E9" />
            <Text style={styles.quickCaptureBtnText}>Voice Note</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Captured Photos Grid */}
      {photos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Captured Photos</Text>
            <Text style={styles.sectionCount}>{photos.length} photos</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosHorizontalGrid}>
              {photos.map(photo => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoThumbHorizontal}
                  onPress={() => {
                    setSelectedPhoto(photo);
                    setShowPhotoPreview(true);
                  }}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemovePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                  {photo.voiceNoteId && (
                    <View style={styles.photoLinkedBadge}>
                      <Ionicons name="mic" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Voice Notes List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voice Notes</Text>
          <Text style={styles.sectionCount}>{voiceNotes.length} notes</Text>
        </View>

        {voiceNotes.length === 0 ? (
          <View style={styles.noVoiceNotes}>
            <Ionicons name="mic-outline" size={32} color="#CBD5E1" />
            <Text style={styles.noVoiceNotesText}>No voice notes yet</Text>
          </View>
        ) : (
          voiceNotes.map(note => (
            <View key={note.id} style={styles.voiceNoteCard}>
              <View style={styles.voiceNoteIcon}>
                <Ionicons name="mic" size={20} color="#0EA5E9" />
              </View>
              <View style={styles.voiceNoteContent}>
                <Text style={styles.voiceNoteText}>{note.text}</Text>
                <View style={styles.voiceNoteMeta}>
                  {note.duration && (
                    <Text style={styles.voiceNoteDuration}>{formatDuration(note.duration)}</Text>
                  )}
                  {note.linkedPhotos && note.linkedPhotos.length > 0 && (
                    <View style={styles.linkedPhotosIndicator}>
                      <Ionicons name="images" size={12} color="#0EA5E9" />
                      <Text style={styles.linkedPhotosText}>{note.linkedPhotos.length} photos</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveVoiceNote(note.id)}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Process Button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          (photos.length === 0 && voiceNotes.length === 0) && styles.processButtonDisabled,
        ]}
        onPress={handleProcessWithAI}
        disabled={photos.length === 0 && voiceNotes.length === 0}
      >
        <LinearGradient
          colors={
            photos.length === 0 && voiceNotes.length === 0
              ? ['#94A3B8', '#94A3B8']
              : ['#0EA5E9', '#06B6D4']
          }
          style={styles.processButtonGradient}
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          <Text style={styles.processButtonText}>Generate Documentation with AI</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Saved AI Recording Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Recording History</Text>
          <Text style={styles.sectionCount}>{savedSessions.length} sessions</Text>
        </View>

        {savedSessions.length === 0 ? (
          <View style={styles.noSessionsContainer}>
            <Ionicons name="recording-outline" size={40} color="#CBD5E1" />
            <Text style={styles.noSessionsText}>No AI recordings yet</Text>
            <Text style={styles.noSessionsSubtext}>
              Your capture sessions will appear here
            </Text>
          </View>
        ) : (
          savedSessions.map(session => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => {
                setSelectedSession(session);
                setSessionDetailTab('punch');
                setShowSessionDetail(true);
              }}
              activeOpacity={0.7}
            >
              {/* Session Header */}
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionIconContainer}>
                  <LinearGradient
                    colors={['#0EA5E9', '#06B6D4']}
                    style={styles.sessionIconGradient}
                  >
                    <Ionicons name="mic" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {session.projectName && (
                    <View style={styles.sessionProjectBadge}>
                      <Ionicons name="business" size={12} color="#0EA5E9" />
                      <Text style={styles.sessionProjectName}>{session.projectName}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>

              {/* Session Stats */}
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Ionicons name="images-outline" size={16} color="#64748B" />
                  <Text style={styles.sessionStatText}>{session.photoCount} photos</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.sessionStatText}>{formatDuration(session.duration)}</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Ionicons name="clipboard-outline" size={16} color="#64748B" />
                  <Text style={styles.sessionStatText}>
                    {session.aiResults.punchList.length + session.aiResults.checklist.length + session.aiResults.materialList.length} items
                  </Text>
                </View>
              </View>

              {/* AI Results Preview */}
              <View style={styles.sessionResultsPreview}>
                <View style={[styles.sessionResultBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.sessionResultBadgeText, { color: '#EF4444' }]}>
                    {session.aiResults.punchList.length} Punch
                  </Text>
                </View>
                <View style={[styles.sessionResultBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.sessionResultBadgeText, { color: '#3B82F6' }]}>
                    {session.aiResults.checklist.length} Checklist
                  </Text>
                </View>
                <View style={[styles.sessionResultBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.sessionResultBadgeText, { color: '#10B981' }]}>
                    {session.aiResults.materialList.length} Materials
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render Results View
  const renderResultsView = () => (
    <View style={styles.resultsContainer}>
      {/* Results Tabs */}
      <View style={styles.resultsTabs}>
        <TouchableOpacity
          style={[styles.resultsTab, activeResultTab === 'punch' && styles.resultsTabActive]}
          onPress={() => setActiveResultTab('punch')}
        >
          <Ionicons
            name="clipboard-outline"
            size={18}
            color={activeResultTab === 'punch' ? '#0EA5E9' : '#64748B'}
          />
          <Text
            style={[styles.resultsTabText, activeResultTab === 'punch' && styles.resultsTabTextActive]}
          >
            Punch List ({punchList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resultsTab, activeResultTab === 'checklist' && styles.resultsTabActive]}
          onPress={() => setActiveResultTab('checklist')}
        >
          <Ionicons
            name="checkbox-outline"
            size={18}
            color={activeResultTab === 'checklist' ? '#0EA5E9' : '#64748B'}
          />
          <Text
            style={[
              styles.resultsTabText,
              activeResultTab === 'checklist' && styles.resultsTabTextActive,
            ]}
          >
            Checklist ({checklist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resultsTab, activeResultTab === 'materials' && styles.resultsTabActive]}
          onPress={() => setActiveResultTab('materials')}
        >
          <Ionicons
            name="cube-outline"
            size={18}
            color={activeResultTab === 'materials' ? '#0EA5E9' : '#64748B'}
          />
          <Text
            style={[
              styles.resultsTabText,
              activeResultTab === 'materials' && styles.resultsTabTextActive,
            ]}
          >
            Materials ({materialList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Content */}
      <ScrollView style={styles.resultsContent} showsVerticalScrollIndicator={false}>
        {/* Punch List */}
        {activeResultTab === 'punch' && (
          <View>
            {punchList.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyResultsText}>No punch list items generated</Text>
              </View>
            ) : (
              punchList.map(item => (
                <View key={item.id} style={styles.punchItem}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                  <View style={styles.punchItemContent}>
                    <Text style={styles.punchItemDescription}>{item.description}</Text>
                    {item.location && (
                      <View style={styles.punchItemLocation}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.punchItemLocationText}>{item.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Checklist */}
        {activeResultTab === 'checklist' && (
          <View>
            {checklist.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons name="checkbox-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyResultsText}>No checklist items generated</Text>
              </View>
            ) : (
              checklist.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => handleToggleChecklistItem(item.id)}
                >
                  <Ionicons
                    name={item.checked ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={item.checked ? '#10B981' : '#CBD5E1'}
                  />
                  <View style={styles.checklistItemContent}>
                    <Text
                      style={[
                        styles.checklistItemTask,
                        item.checked && styles.checklistItemTaskChecked,
                      ]}
                    >
                      {item.task}
                    </Text>
                    <View style={styles.checklistItemCategory}>
                      <Text style={styles.checklistItemCategoryText}>{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Materials */}
        {activeResultTab === 'materials' && (
          <View>
            {materialList.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyResultsText}>No materials identified</Text>
              </View>
            ) : (
              materialList.map(item => (
                <View key={item.id} style={styles.materialItem}>
                  <View style={styles.materialItemHeader}>
                    <Text style={styles.materialItemName}>{item.name}</Text>
                    <View style={styles.materialItemQty}>
                      <Text style={styles.materialItemQtyText}>{item.quantity}</Text>
                    </View>
                  </View>
                  <View style={styles.materialItemMeta}>
                    <View style={styles.materialItemCategory}>
                      <Ionicons name="pricetag-outline" size={12} color="#64748B" />
                      <Text style={styles.materialItemCategoryText}>{item.category}</Text>
                    </View>
                    {item.notes && (
                      <Text style={styles.materialItemNotes}>{item.notes}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.resultsActions}>
        <TouchableOpacity style={styles.startOverBtn} onPress={handleStartOver}>
          <Ionicons name="refresh-outline" size={20} color="#64748B" />
          <Text style={styles.startOverBtnText}>Start Over</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveResultsBtn}>
          <LinearGradient colors={['#0EA5E9', '#06B6D4']} style={styles.saveResultsBtnGradient}>
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveResultsBtnText}>Save to Project</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0EA5E9', '#06B6D4']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Site Notes AI</Text>
            <Text style={styles.headerSubtitle}>
              {viewMode === 'capture'
                ? 'Capture photos & voice notes'
                : 'AI-Generated Documentation'}
            </Text>
          </View>
          {viewMode === 'results' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setViewMode('capture')}
            >
              <Ionicons name="pencil-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      {viewMode === 'capture' ? renderCaptureView() : renderResultsView()}

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingModal}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.processingText}>Analyzing site photos...</Text>
            <Text style={styles.processingSubtext}>
              AI is generating your punch list, checklist, and material list
            </Text>
          </View>
        </View>
      )}

      {/* Voice Note Modal */}
      <Modal visible={showVoiceModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.voiceModalContent}>
            <View style={styles.voiceModalHeader}>
              <Text style={styles.voiceModalTitle}>Add Voice Note</Text>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Recording Button in Modal */}
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={handleToggleRecording}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color={isRecording ? '#FFFFFF' : '#0EA5E9'}
              />
              <Text style={[styles.recordButtonText, isRecording && { color: '#FFFFFF' }]}>
                {isRecording ? `Recording ${formatDuration(recordingDuration)}` : 'Tap to Start Recording'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Or type your note:</Text>

            <TextInput
              style={styles.voiceNoteInput}
              value={currentVoiceInput}
              onChangeText={setCurrentVoiceInput}
              placeholder="e.g., Need to fix the outlet in the kitchen, missing cover plate..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.addNoteBtn} onPress={handleAddVoiceNote}>
              <LinearGradient colors={['#0EA5E9', '#06B6D4']} style={styles.addNoteBtnGradient}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addNoteBtnText}>Add Note</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-Screen Camera Modal with AI Listening */}
      <Modal visible={showFullScreenCamera} animationType="slide" statusBarTranslucent>
        <View style={styles.fullScreenCameraContainer}>
          {/* Camera View */}
          {permission?.granted && (
            <CameraView
              ref={cameraRef}
              style={styles.fullScreenCamera}
              facing="back"
              onCameraReady={() => setIsCameraReady(true)}
            />
          )}

          {/* Photo Flash Effect */}
          {photoFlash && <View style={styles.photoFlashOverlay} />}

          {/* Top Bar */}
          <View style={styles.cameraTopBar}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={handleCloseFullScreenCamera}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.cameraRecordingIndicator}>
              <View style={styles.cameraRecordingDot} />
              <Text style={styles.cameraRecordingTime}>{formatDuration(recordingDuration)}</Text>
            </View>
            <View style={styles.cameraPhotoCount}>
              <Ionicons name="images" size={18} color="#FFFFFF" />
              <Text style={styles.cameraPhotoCountText}>{sessionPhotosRef.current.length}</Text>
            </View>
          </View>

          {/* AI Listening Visualization at Bottom */}
          <View style={styles.aiListeningContainer}>
            {/* Wave Animation Background */}
            <Animated.View
              style={[
                styles.aiWaveBackground,
                {
                  transform: [{
                    translateX: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-200, 200],
                    }),
                  }],
                },
              ]}
            />

            {/* Voice Waveform Visualization */}
            <View style={styles.waveformContainer}>
              {waveformBars.map((bar, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      transform: [{ scaleY: bar }],
                      backgroundColor: index % 2 === 0 ? '#0EA5E9' : '#06B6D4',
                    },
                  ]}
                />
              ))}
            </View>

            {/* AI Status Text */}
            <Text style={styles.aiListeningText}>AI is listening...</Text>
            <Text style={styles.aiListeningHint}>Describe what you see while taking photos</Text>

            {/* Captured Photos Mini Preview */}
            {sessionPhotosRef.current.length > 0 && (
              <View style={styles.miniPhotosContainer}>
                {photos.slice(-3).map((photo, index) => (
                  <View key={photo.id} style={[styles.miniPhotoThumb, { zIndex: 3 - index, marginLeft: index > 0 ? -15 : 0 }]}>
                    <Image source={{ uri: photo.uri }} style={styles.miniPhotoImage} resizeMode="cover" />
                  </View>
                ))}
              </View>
            )}

            {/* Shutter Button */}
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={handleCaptureInFullScreen}
              activeOpacity={0.7}
              disabled={!isCameraReady}
            >
              <View style={styles.shutterButtonOuter}>
                <View style={styles.shutterButtonInner}>
                  <Ionicons name="camera" size={32} color="#0EA5E9" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Done Button - Process with AI */}
            <TouchableOpacity
              style={styles.cameraDoneBtn}
              onPress={handleDoneAndProcess}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.cameraDoneBtnText}>Done - Analyze with AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={showPhotoPreview} transparent animationType="fade">
        <View style={styles.photoPreviewOverlay}>
          <TouchableOpacity
            style={styles.photoPreviewClose}
            onPress={() => {
              setShowPhotoPreview(false);
              setSelectedPhoto(null);
            }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.uri }}
              style={styles.photoPreviewImage}
              resizeMode="contain"
            />
          )}
          {selectedPhoto && (
            <TouchableOpacity
              style={styles.photoPreviewDelete}
              onPress={() => handleRemovePhoto(selectedPhoto.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.photoPreviewDeleteText}>Delete Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Project Picker Modal */}
      <Modal visible={showProjectPicker} transparent animationType="slide">
        <View style={styles.projectPickerOverlay}>
          <View style={styles.projectPickerModal}>
            <View style={styles.projectPickerHeader}>
              <Text style={styles.projectPickerTitle}>Pick a Project</Text>
              <TouchableOpacity onPress={() => {
                setShowProjectPicker(false);
                setProjectSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.projectSearchContainer}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.projectSearchInput}
                value={projectSearchQuery}
                onChangeText={setProjectSearchQuery}
                placeholder="Search by name, description, or address..."
                placeholderTextColor="#94A3B8"
              />
              {projectSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setProjectSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Project List */}
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.projectListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.projectListItem,
                    selectedProject?.id === item.id && styles.projectListItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedProject(item);
                    setShowProjectPicker(false);
                    setProjectSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.projectListItemInitials}>
                    <LinearGradient
                      colors={['#0EA5E9', '#06B6D4']}
                      style={styles.projectInitialsGradient}
                    >
                      <Text style={styles.projectInitialsText}>
                        {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.projectListItemInfo}>
                    <Text style={styles.projectListItemName}>{item.name}</Text>
                    <Text style={styles.projectListItemDescription}>
                      {item.galleryDescription || 'General Work'}
                    </Text>
                    <Text style={styles.projectListItemAddress} numberOfLines={1}>
                      {item.street}, {item.city}
                    </Text>
                  </View>
                  <View style={[
                    styles.projectListItemStatus,
                    item.status === 'Completed' && styles.statusCompleted,
                    item.status === 'Rough-In' && styles.statusRoughIn,
                    item.status === 'Inspection' && styles.statusInspection,
                    item.status === 'Final Trim' && styles.statusFinalTrim,
                  ]}>
                    <Text style={styles.projectListItemStatusText}>{item.status}</Text>
                  </View>
                  {selectedProject?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" style={styles.projectSelectedIcon} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.projectListEmpty}>
                  <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.projectListEmptyText}>No projects found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Session Detail Modal */}
      <Modal visible={showSessionDetail} transparent animationType="slide">
        <View style={styles.sessionDetailOverlay}>
          <View style={styles.sessionDetailModal}>
            {/* Header */}
            <View style={styles.sessionDetailHeader}>
              <TouchableOpacity
                onPress={() => setShowSessionDetail(false)}
                style={styles.sessionDetailBackBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <View style={styles.sessionDetailHeaderInfo}>
                <Text style={styles.sessionDetailTitle}>AI Recording</Text>
                {selectedSession && (
                  <Text style={styles.sessionDetailDate}>
                    {new Date(selectedSession.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (selectedSession) {
                    Alert.alert(
                      'Delete Session',
                      'Are you sure you want to delete this recording session?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            setSavedSessions(prev =>
                              prev.filter(s => s.id !== selectedSession.id)
                            );
                            setShowSessionDetail(false);
                          },
                        },
                      ]
                    );
                  }
                }}
                style={styles.sessionDetailDeleteBtn}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <ScrollView style={styles.sessionDetailContent} showsVerticalScrollIndicator={false}>
                {/* Project Info */}
                {selectedSession.projectName && (
                  <View style={styles.sessionDetailProject}>
                    <LinearGradient
                      colors={['#EFF6FF', '#DBEAFE']}
                      style={styles.sessionDetailProjectCard}
                    >
                      <Ionicons name="business" size={24} color="#0EA5E9" />
                      <View style={styles.sessionDetailProjectInfo}>
                        <Text style={styles.sessionDetailProjectName}>{selectedSession.projectName}</Text>
                        {selectedSession.projectAddress && (
                          <Text style={styles.sessionDetailProjectAddress}>{selectedSession.projectAddress}</Text>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* Session Stats */}
                <View style={styles.sessionDetailStats}>
                  <View style={styles.sessionDetailStatCard}>
                    <Ionicons name="images-outline" size={24} color="#0EA5E9" />
                    <Text style={styles.sessionDetailStatValue}>{selectedSession.photoCount}</Text>
                    <Text style={styles.sessionDetailStatLabel}>Photos</Text>
                  </View>
                  <View style={styles.sessionDetailStatCard}>
                    <Ionicons name="time-outline" size={24} color="#10B981" />
                    <Text style={styles.sessionDetailStatValue}>{formatDuration(selectedSession.duration)}</Text>
                    <Text style={styles.sessionDetailStatLabel}>Duration</Text>
                  </View>
                  <View style={styles.sessionDetailStatCard}>
                    <Ionicons name="list-outline" size={24} color="#8B5CF6" />
                    <Text style={styles.sessionDetailStatValue}>
                      {selectedSession.aiResults.punchList.length +
                        selectedSession.aiResults.checklist.length +
                        selectedSession.aiResults.materialList.length}
                    </Text>
                    <Text style={styles.sessionDetailStatLabel}>Items</Text>
                  </View>
                </View>

                {/* Photos Gallery */}
                {selectedSession.photos.length > 0 && (
                  <View style={styles.sessionDetailSection}>
                    <Text style={styles.sessionDetailSectionTitle}>
                      <Ionicons name="images" size={16} color="#64748B" /> Captured Photos
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionPhotoScroll}>
                      {selectedSession.photos.map((photo, idx) => (
                        <TouchableOpacity
                          key={photo.id || idx}
                          onPress={() => {
                            setSelectedPhoto(photo);
                            setShowPhotoPreview(true);
                          }}
                        >
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.sessionPhotoThumb}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* AI Results Tabs */}
                <View style={styles.sessionDetailSection}>
                  <Text style={styles.sessionDetailSectionTitle}>
                    <Ionicons name="sparkles" size={16} color="#64748B" /> AI Analysis Results
                  </Text>

                  <View style={styles.sessionResultTabs}>
                    <TouchableOpacity
                      style={[
                        styles.sessionResultTab,
                        sessionDetailTab === 'punch' && styles.sessionResultTabActive,
                      ]}
                      onPress={() => setSessionDetailTab('punch')}
                    >
                      <Ionicons
                        name="clipboard-outline"
                        size={16}
                        color={sessionDetailTab === 'punch' ? '#EF4444' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.sessionResultTabText,
                          sessionDetailTab === 'punch' && { color: '#EF4444' },
                        ]}
                      >
                        Punch ({selectedSession.aiResults.punchList.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sessionResultTab,
                        sessionDetailTab === 'checklist' && styles.sessionResultTabActive,
                      ]}
                      onPress={() => setSessionDetailTab('checklist')}
                    >
                      <Ionicons
                        name="checkbox-outline"
                        size={16}
                        color={sessionDetailTab === 'checklist' ? '#3B82F6' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.sessionResultTabText,
                          sessionDetailTab === 'checklist' && { color: '#3B82F6' },
                        ]}
                      >
                        Checklist ({selectedSession.aiResults.checklist.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sessionResultTab,
                        sessionDetailTab === 'materials' && styles.sessionResultTabActive,
                      ]}
                      onPress={() => setSessionDetailTab('materials')}
                    >
                      <Ionicons
                        name="construct-outline"
                        size={16}
                        color={sessionDetailTab === 'materials' ? '#10B981' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.sessionResultTabText,
                          sessionDetailTab === 'materials' && { color: '#10B981' },
                        ]}
                      >
                        Materials ({selectedSession.aiResults.materialList.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Results Content */}
                  <View style={styles.sessionResultContent}>
                    {sessionDetailTab === 'punch' && (
                      selectedSession.aiResults.punchList.length === 0 ? (
                        <View style={styles.sessionResultEmpty}>
                          <Text style={styles.sessionResultEmptyText}>No punch list items</Text>
                        </View>
                      ) : (
                        selectedSession.aiResults.punchList.map((item, idx) => (
                          <View key={item.id || idx} style={styles.sessionResultItem}>
                            <View style={[styles.sessionResultPriority, {
                              backgroundColor: item.priority === 'High' ? '#FEE2E2' :
                                item.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5'
                            }]}>
                              <Text style={[styles.sessionResultPriorityText, {
                                color: item.priority === 'High' ? '#EF4444' :
                                  item.priority === 'Medium' ? '#F59E0B' : '#10B981'
                              }]}>{item.priority}</Text>
                            </View>
                            <View style={styles.sessionResultItemContent}>
                              <Text style={styles.sessionResultItemTitle}>{item.description}</Text>
                              {item.location && (
                                <Text style={styles.sessionResultItemLocation}>
                                  <Ionicons name="location-outline" size={12} color="#64748B" /> {item.location}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))
                      )
                    )}

                    {sessionDetailTab === 'checklist' && (
                      selectedSession.aiResults.checklist.length === 0 ? (
                        <View style={styles.sessionResultEmpty}>
                          <Text style={styles.sessionResultEmptyText}>No checklist items</Text>
                        </View>
                      ) : (
                        selectedSession.aiResults.checklist.map((item, idx) => (
                          <View key={item.id || idx} style={styles.sessionResultItem}>
                            <View style={[styles.sessionResultCheckbox, item.completed && styles.sessionResultCheckboxDone]}>
                              {item.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                            </View>
                            <View style={styles.sessionResultItemContent}>
                              <Text style={[styles.sessionResultItemTitle, item.completed && styles.sessionResultItemTitleDone]}>
                                {item.task}
                              </Text>
                              {item.category && (
                                <Text style={styles.sessionResultItemCategory}>{item.category}</Text>
                              )}
                            </View>
                          </View>
                        ))
                      )
                    )}

                    {sessionDetailTab === 'materials' && (
                      selectedSession.aiResults.materialList.length === 0 ? (
                        <View style={styles.sessionResultEmpty}>
                          <Text style={styles.sessionResultEmptyText}>No materials identified</Text>
                        </View>
                      ) : (
                        selectedSession.aiResults.materialList.map((item, idx) => (
                          <View key={item.id || idx} style={styles.sessionResultItem}>
                            <View style={styles.sessionResultMaterialIcon}>
                              <Ionicons name="cube-outline" size={18} color="#10B981" />
                            </View>
                            <View style={styles.sessionResultItemContent}>
                              <Text style={styles.sessionResultItemTitle}>{item.name}</Text>
                              <View style={styles.sessionResultMaterialDetails}>
                                <Text style={styles.sessionResultMaterialQty}>
                                  Qty: {item.quantity} {item.unit || ''}
                                </Text>
                                {item.notes && (
                                  <Text style={styles.sessionResultMaterialNotes}>{item.notes}</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))
                      )
                    )}
                  </View>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0F2FE',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 14,
    color: '#64748B',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoThumb: {
    width: Math.min((width - 56) / 3, 150),
    height: Math.min((width - 56) / 3, 150),
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addPhotoBtn: {
    width: Math.min((width - 56) / 3, 150),
    height: Math.min((width - 56) / 3, 150),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    gap: 4,
  },
  addPhotoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  voiceNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  voiceNoteContent: {
    flex: 1,
  },
  voiceNoteDuration: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  noVoiceNotes: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noVoiceNotesText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  // Inline Recording Bar Styles
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  inlineRecordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
    marginTop: 8,
  },
  inlineRecordingBarActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  inlineRecordBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineRecordBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  inlineRecordInfo: {
    flex: 1,
  },
  inlineRecordDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  inlineRecordHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  inlineCameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  voiceTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  saveVoiceNoteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveVoiceNoteBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addVoiceNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#0EA5E9',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  addVoiceNoteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  processButton: {
    marginTop: 16,
  },
  processButtonDisabled: {
    opacity: 0.6,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Results Styles
  resultsContainer: {
    flex: 1,
  },
  resultsTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  resultsTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  resultsTabActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
  },
  resultsTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  resultsTabTextActive: {
    color: '#0EA5E9',
  },
  resultsContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  // Punch List Styles
  punchItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  punchItemContent: {
    flex: 1,
  },
  punchItemDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 20,
  },
  punchItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  punchItemLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  // Checklist Styles
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  checklistItemContent: {
    flex: 1,
  },
  checklistItemTask: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 20,
  },
  checklistItemTaskChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  checklistItemCategory: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  checklistItemCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  // Material Styles
  materialItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  materialItemQty: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  materialItemQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  materialItemMeta: {
    gap: 6,
  },
  materialItemCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  materialItemCategoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  materialItemNotes: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Action Buttons
  resultsActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startOverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  startOverBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveResultsBtn: {
    flex: 1,
  },
  saveResultsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveResultsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Processing Overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Voice Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  voiceModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    marginBottom: 16,
    gap: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  orText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  voiceNoteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  addNoteBtn: {},
  addNoteBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addNoteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Photo Preview Modal
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: '100%',
    height: '70%',
  },
  photoPreviewDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  photoPreviewDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Project Picker Styles
  projectPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  projectPickerPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectPickerPlaceholderText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  selectedProjectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedProjectInfo: {
    flex: 1,
  },
  selectedProjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  selectedProjectDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  selectedProjectAddress: {
    fontSize: 12,
    color: '#94A3B8',
  },
  selectedProjectStatus: {
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#94A3B8',
  },
  statusCompleted: {
    backgroundColor: '#10B981',
  },
  statusRoughIn: {
    backgroundColor: '#F59E0B',
  },
  statusInspection: {
    backgroundColor: '#8B5CF6',
  },
  statusFinalTrim: {
    backgroundColor: '#0EA5E9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Project Picker Modal
  projectPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  projectPickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  projectPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  projectPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  projectSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  projectSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  projectListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  projectListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  projectListItemSelected: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  projectListItemInitials: {
    width: 48,
    height: 48,
  },
  projectInitialsGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectInitialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectListItemInfo: {
    flex: 1,
  },
  projectListItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  projectListItemDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  projectListItemAddress: {
    fontSize: 12,
    color: '#94A3B8',
  },
  projectListItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#94A3B8',
  },
  projectListItemStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectSelectedIcon: {
    marginLeft: 4,
  },
  projectListEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  projectListEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  // AI Capture Button Styles
  aiCaptureButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiCaptureGradient: {
    padding: 20,
  },
  aiCaptureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiCaptureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  aiCaptureCameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCaptureTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  aiCaptureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiCaptureSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  aiCaptureHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  // Quick Capture Styles
  quickCaptureRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickCaptureBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  quickCaptureBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  // Horizontal Photos Grid
  photosHorizontalGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 12,
  },
  photoThumbHorizontal: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoLinkedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Voice Note Meta Styles
  voiceNoteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  linkedPhotosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedPhotosText: {
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  // Full-Screen Camera Styles
  fullScreenCameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenCamera: {
    flex: 1,
  },
  photoFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  cameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraRecordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  cameraRecordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  cameraRecordingTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cameraPhotoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  cameraPhotoCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // AI Listening Container
  aiListeningContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  aiWaveBackground: {
    position: 'absolute',
    top: 0,
    width: 400,
    height: 200,
    borderRadius: 200,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  aiOrbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  aiOrb: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  aiOrbGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOrbLeft: {
    width: 40,
    height: 40,
  },
  aiOrbCenter: {
    width: 60,
    height: 60,
  },
  aiOrbRight: {
    width: 40,
    height: 40,
  },
  // Voice Waveform Styles
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 50,
    marginBottom: 12,
  },
  waveformBar: {
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
  },
  aiListeningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiListeningHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  miniPhotosContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  miniPhotoThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  miniPhotoImage: {
    width: '100%',
    height: '100%',
  },
  shutterButton: {
    marginBottom: 16,
  },
  shutterButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    padding: 4,
  },
  shutterButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  cameraDoneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Session Card Styles
  noSessionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noSessionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  noSessionsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sessionIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionProjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sessionProjectName: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionStatText: {
    fontSize: 13,
    color: '#64748B',
  },
  sessionResultsPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  sessionResultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionResultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Session Detail Modal Styles
  sessionDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sessionDetailModal: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '80%',
  },
  sessionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sessionDetailBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDetailHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sessionDetailDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sessionDetailDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDetailContent: {
    flex: 1,
    padding: 16,
  },
  sessionDetailProject: {
    marginBottom: 16,
  },
  sessionDetailProjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sessionDetailProjectInfo: {
    flex: 1,
  },
  sessionDetailProjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionDetailProjectAddress: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sessionDetailStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sessionDetailStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  sessionDetailStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  sessionDetailStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sessionDetailSection: {
    marginBottom: 20,
  },
  sessionDetailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionPhotoScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  sessionPhotoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 8,
  },
  sessionResultTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  sessionResultTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sessionResultTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sessionResultTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sessionResultContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  sessionResultEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  sessionResultEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sessionResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  sessionResultPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionResultPriorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sessionResultItemContent: {
    flex: 1,
  },
  sessionResultItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  sessionResultItemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  sessionResultItemLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sessionResultItemCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sessionResultCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  sessionResultCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  sessionResultMaterialIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionResultMaterialDetails: {
    marginTop: 4,
  },
  sessionResultMaterialQty: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  sessionResultMaterialNotes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

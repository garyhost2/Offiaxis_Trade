import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  // Training Videos
  TrainingVideo,
  getAllTrainingVideos,
  getTrainingCategories,
  addTrainingCategory,
  createTrainingVideo,
  updateTrainingVideo,
  deleteTrainingVideo,
  toggleTrainingVideoFavorite,
  deleteTrainingCategory,
  renameTrainingCategory,
  // Project Templates
  ProjectTemplate,
  TemplateChecklistCategory,
  TemplateChecklistItem,
  TemplateMaterialItem,
  getAllProjectTemplates,
  getTemplateCategories,
  addTemplateCategory,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
  copyTemplateToMyTemplates,
  deleteTemplateCategory,
  renameTemplateCategory,
  // My Templates
  getAllMyTemplates,
  getMyTemplateById,
  updateMyTemplate,
  deleteMyTemplate,
  createMyTemplate,
} from '../utils/projectsData';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

type TabType = 'training' | 'templates' | 'myTemplates';

export default function KnowledgeCenterPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('training');
  const [searchQuery, setSearchQuery] = useState('');

  // Training Videos State
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>([]);
  const [trainingCategories, setTrainingCategories] = useState<string[]>([]);
  const [selectedTrainingCategory, setSelectedTrainingCategory] = useState('All');
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showVideoDetailModal, setShowVideoDetailModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [videoEditData, setVideoEditData] = useState<Partial<TrainingVideo>>({});
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'training' | 'template'>('training');

  // Category Management State (for long-press rename/delete)
  const [showCategoryActionModal, setShowCategoryActionModal] = useState(false);
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState<string>('');
  const [categoryActionType, setCategoryActionType] = useState<'training' | 'template'>('training');
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
  const [renameCategoryValue, setRenameCategoryValue] = useState('');

  // Templates State
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [myTemplates, setMyTemplates] = useState<ProjectTemplate[]>([]);
  const [templateCategories, setTemplateCategories] = useState<string[]>([]);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('All');
  const [showTemplateDetailModal, setShowTemplateDetailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateEditData, setTemplateEditData] = useState<Partial<ProjectTemplate>>({});
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      setTrainingVideos(getAllTrainingVideos());
      setTrainingCategories(getTrainingCategories());
      setProjectTemplates(getAllProjectTemplates());
      setMyTemplates(getAllMyTemplates());
      setTemplateCategories(getTemplateCategories());
    }, [])
  );

  // ==========================================
  // Training Videos Functions
  // ==========================================
  const filteredTrainingVideos = trainingVideos.filter(v => {
    const matchesCategory = selectedTrainingCategory === 'All' || v.category === selectedTrainingCategory;
    const matchesSearch = searchQuery === '' ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Extract YouTube video ID and get thumbnail
  const extractYouTubeThumbnail = (url: string): string | null => {
    if (!url) return null;
    
    // Match various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Return high quality thumbnail URL
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    
    // Check for Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      // For Vimeo, we'd need an API call, so return null for now
      return null;
    }
    
    return null;
  };

  const handleOpenAddVideo = () => {
    setVideoEditData({
      title: '',
      description: '',
      category: trainingCategories[0] || 'General',
      videoUrl: '',
      isFavorite: false,
    });
    setShowAddVideoModal(true);
  };

  const handleSaveVideo = async () => {
    if (!videoEditData.title?.trim()) {
      Alert.alert('Required', 'Please enter a video title.');
      return;
    }
    if (!videoEditData.videoUrl?.trim() && !videoEditData.videoUri) {
      Alert.alert('Required', 'Please enter a video URL or upload a video.');
      return;
    }

    // Auto-extract YouTube thumbnail if no custom thumbnail is set
    let thumbnailUrl = videoEditData.thumbnailUrl;
    if (!thumbnailUrl && videoEditData.videoUrl) {
      const extractedThumbnail = extractYouTubeThumbnail(videoEditData.videoUrl.trim());
      if (extractedThumbnail) {
        thumbnailUrl = extractedThumbnail;
      }
    }

    const newVideo = createTrainingVideo({
      title: videoEditData.title.trim(),
      description: videoEditData.description?.trim() || '',
      category: videoEditData.category || 'General',
      videoUrl: videoEditData.videoUrl?.trim(),
      videoUri: videoEditData.videoUri,
      thumbnailUrl: thumbnailUrl,
      duration: videoEditData.duration,
      isFavorite: false,
    });

    setTrainingVideos(getAllTrainingVideos());
    setShowAddVideoModal(false);
    setVideoEditData({});
    Alert.alert('Success', 'Training video added successfully!');
  };

  // Pick cover image for training video
  const handlePickVideoCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoEditData(prev => ({
          ...prev,
          thumbnailUrl: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoEditData(prev => ({
          ...prev,
          videoUri: result.assets[0].uri,
          thumbnailUrl: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video.');
    }
  };

  const handleOpenVideoDetail = (video: TrainingVideo) => {
    setSelectedVideo(video);
    setShowVideoDetailModal(true);
  };

  // Edit cover image of existing video from detail modal
  const handleEditVideoCoverFromDetail = async () => {
    if (!selectedVideo) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const updatedVideo = updateTrainingVideo(selectedVideo.id, {
          thumbnailUrl: result.assets[0].uri,
        });
        if (updatedVideo) {
          setSelectedVideo(updatedVideo);
          setTrainingVideos(getAllTrainingVideos());
          Alert.alert('Success', 'Cover image updated!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleDeleteVideo = () => {
    if (!selectedVideo) return;

    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${selectedVideo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTrainingVideo(selectedVideo.id);
            setTrainingVideos(getAllTrainingVideos());
            setShowVideoDetailModal(false);
            setSelectedVideo(null);
          },
        },
      ]
    );
  };

  const handleToggleVideoFavorite = (id: string) => {
    toggleTrainingVideoFavorite(id);
    setTrainingVideos(getAllTrainingVideos());
    if (selectedVideo?.id === id) {
      setSelectedVideo(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const handleOpenVideoUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the video URL.');
    });
  };

  // ==========================================
  // Templates Functions
  // ==========================================
  const filteredProjectTemplates = projectTemplates.filter(t => {
    const matchesCategory = selectedTemplateCategory === 'All' || t.category === selectedTemplateCategory;
    const matchesSearch = searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredMyTemplates = myTemplates.filter(t => {
    const matchesCategory = selectedTemplateCategory === 'All' || t.category === selectedTemplateCategory;
    const matchesSearch = searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenTemplateDetail = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDetailModal(true);
  };

  const handleCopyToMyTemplates = () => {
    if (!selectedTemplate) return;

    const copied = copyTemplateToMyTemplates(selectedTemplate.id);
    if (copied) {
      setMyTemplates(getAllMyTemplates());
      setShowTemplateDetailModal(false);
      Alert.alert('Success', `"${selectedTemplate.title}" has been copied to My Templates. You can now customize it!`);
      setActiveTab('myTemplates');
    }
  };

  const handleEditMyTemplate = (template: ProjectTemplate) => {
    setTemplateEditData({ ...template });
    setEditMode('edit');
    setShowEditTemplateModal(true);
    setShowTemplateDetailModal(false);
  };

  const handleDeleteMyTemplate = () => {
    if (!selectedTemplate) return;

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${selectedTemplate.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMyTemplate(selectedTemplate.id);
            setMyTemplates(getAllMyTemplates());
            setShowTemplateDetailModal(false);
            setSelectedTemplate(null);
          },
        },
      ]
    );
  };

  const handleSaveTemplate = () => {
    if (!templateEditData.title?.trim()) {
      Alert.alert('Required', 'Please enter a template title.');
      return;
    }

    if (editMode === 'edit' && selectedTemplate) {
      updateMyTemplate(selectedTemplate.id, templateEditData);
      setMyTemplates(getAllMyTemplates());
      Alert.alert('Success', 'Template updated successfully!');
    } else {
      createMyTemplate({
        title: templateEditData.title.trim(),
        description: templateEditData.description?.trim() || '',
        category: templateEditData.category || templateCategories[0] || 'General',
        thumbnailUrl: templateEditData.thumbnailUrl,
        checklist: templateEditData.checklist || [],
        materials: templateEditData.materials || [],
        estimatedDuration: templateEditData.estimatedDuration,
        difficulty: templateEditData.difficulty,
      });
      setMyTemplates(getAllMyTemplates());
      Alert.alert('Success', 'Template created successfully!');
    }

    setShowEditTemplateModal(false);
    setTemplateEditData({});
  };

  // Pick cover image for template
  const handlePickTemplateCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setTemplateEditData(prev => ({
          ...prev,
          thumbnailUrl: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // Edit cover image of existing template from detail modal
  const handleEditTemplateCoverFromDetail = async () => {
    if (!selectedTemplate || selectedTemplate.isSystemTemplate) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const updatedTemplate = updateMyTemplate(selectedTemplate.id, {
          thumbnailUrl: result.assets[0].uri,
        });
        if (updatedTemplate) {
          setSelectedTemplate(updatedTemplate);
          setMyTemplates(getAllMyTemplates());
          Alert.alert('Success', 'Cover image updated!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleCreateNewTemplate = () => {
    setTemplateEditData({
      title: '',
      description: '',
      category: templateCategories[0] || 'General',
      checklist: [],
      materials: [],
      difficulty: 'Medium',
    });
    setEditMode('add');
    setShowEditTemplateModal(true);
  };

  // Add Category Functions
  const handleOpenAddCategory = (type: 'training' | 'template') => {
    setCategoryType(type);
    setNewCategoryName('');
    setShowAddCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    if (categoryType === 'training') {
      addTrainingCategory(newCategoryName.trim());
      setTrainingCategories(getTrainingCategories());
    } else {
      addTemplateCategory(newCategoryName.trim());
      setTemplateCategories(getTemplateCategories());
    }

    setShowAddCategoryModal(false);
    setNewCategoryName('');
    Alert.alert('Success', 'Category added successfully!');
  };

  // ==========================================
  // Category Long-Press Actions (Rename/Delete)
  // ==========================================
  const handleCategoryLongPress = (categoryName: string, type: 'training' | 'template') => {
    setSelectedCategoryForAction(categoryName);
    setCategoryActionType(type);
    setShowCategoryActionModal(true);
  };

  const handleRenameCategory = () => {
    setRenameCategoryValue(selectedCategoryForAction);
    setShowCategoryActionModal(false);
    setShowRenameCategoryModal(true);
  };

  const handleSaveRenamedCategory = () => {
    if (!renameCategoryValue.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    if (renameCategoryValue.trim() === selectedCategoryForAction) {
      setShowRenameCategoryModal(false);
      return;
    }

    if (categoryActionType === 'training') {
      renameTrainingCategory(selectedCategoryForAction, renameCategoryValue.trim());
      setTrainingCategories(getTrainingCategories());
      setTrainingVideos(getAllTrainingVideos());
      // Update selected category if it was renamed
      if (selectedTrainingCategory === selectedCategoryForAction) {
        setSelectedTrainingCategory(renameCategoryValue.trim());
      }
    } else {
      renameTemplateCategory(selectedCategoryForAction, renameCategoryValue.trim());
      setTemplateCategories(getTemplateCategories());
      setProjectTemplates(getAllProjectTemplates());
      setMyTemplates(getAllMyTemplates());
      // Update selected category if it was renamed
      if (selectedTemplateCategory === selectedCategoryForAction) {
        setSelectedTemplateCategory(renameCategoryValue.trim());
      }
    }

    setShowRenameCategoryModal(false);
    setRenameCategoryValue('');
    Alert.alert('Success', 'Category renamed successfully!');
  };

  const handleDeleteCategory = () => {
    setShowCategoryActionModal(false);
    
    const message = `Are you sure you want to delete "${selectedCategoryForAction}" category?\n\nNote: Items with this category will not be deleted, but they will no longer have a category assigned.`;

    Alert.alert(
      'Delete Category',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (categoryActionType === 'training') {
              deleteTrainingCategory(selectedCategoryForAction);
              setTrainingCategories(getTrainingCategories());
              // Reset to 'All' if the deleted category was selected
              if (selectedTrainingCategory === selectedCategoryForAction) {
                setSelectedTrainingCategory('All');
              }
            } else {
              deleteTemplateCategory(selectedCategoryForAction);
              setTemplateCategories(getTemplateCategories());
              // Reset to 'All' if the deleted category was selected
              if (selectedTemplateCategory === selectedCategoryForAction) {
                setSelectedTemplateCategory('All');
              }
            }
            Alert.alert('Success', 'Category deleted successfully!');
          },
        },
      ]
    );
  };

  // ==========================================
  // Checklist Management Functions
  // ==========================================
  const handleAddChecklistCategory = () => {
    const newCategory: TemplateChecklistCategory = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      items: [],
    };
    setTemplateEditData(prev => ({
      ...prev,
      checklist: [...(prev.checklist || []), newCategory],
    }));
  };

  const handleUpdateChecklistCategoryName = (catId: string, name: string) => {
    setTemplateEditData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(cat =>
        cat.id === catId ? { ...cat, name } : cat
      ),
    }));
  };

  const handleDeleteChecklistCategory = (catId: string) => {
    setTemplateEditData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).filter(cat => cat.id !== catId),
    }));
  };

  const handleAddChecklistItem = (catId: string) => {
    const newItem: TemplateChecklistItem = {
      id: `item-${Date.now()}`,
      text: '',
      checked: false,
    };
    setTemplateEditData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(cat =>
        cat.id === catId ? { ...cat, items: [...cat.items, newItem] } : cat
      ),
    }));
  };

  const handleUpdateChecklistItem = (catId: string, itemId: string, text: string) => {
    setTemplateEditData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(cat =>
        cat.id === catId
          ? {
              ...cat,
              items: cat.items.map(item =>
                item.id === itemId ? { ...item, text } : item
              ),
            }
          : cat
      ),
    }));
  };

  const handleDeleteChecklistItem = (catId: string, itemId: string) => {
    setTemplateEditData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(cat =>
        cat.id === catId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      ),
    }));
  };

  // ==========================================
  // Materials Management Functions
  // ==========================================
  const handleAddMaterialItem = () => {
    const newMaterial: TemplateMaterialItem = {
      id: `mat-${Date.now()}`,
      name: '',
      quantity: '',
      unit: 'units',
    };
    setTemplateEditData(prev => ({
      ...prev,
      materials: [...(prev.materials || []), newMaterial],
    }));
  };

  const handleUpdateMaterialItem = (matId: string, updates: Partial<TemplateMaterialItem>) => {
    setTemplateEditData(prev => ({
      ...prev,
      materials: (prev.materials || []).map(mat =>
        mat.id === matId ? { ...mat, ...updates } : mat
      ),
    }));
  };

  const handleDeleteMaterialItem = (matId: string) => {
    setTemplateEditData(prev => ({
      ...prev,
      materials: (prev.materials || []).filter(mat => mat.id !== matId),
    }));
  };

  // ==========================================
  // Render Functions
  // ==========================================

  const renderTrainingVideoCard = (video: TrainingVideo) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      activeOpacity={0.8}
      onPress={() => handleOpenVideoDetail(video)}
    >
      <View style={styles.videoThumbnailContainer}>
        {video.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.videoThumbnailPlaceholder}>
            <Ionicons name="videocam" size={32} color="#8B5CF6" />
          </View>
        )}
        <View style={styles.playButton}>
          <Ionicons name="play" size={20} color="#FFFFFF" />
        </View>
        {video.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
        {video.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={14} color="#EF4444" />
          </View>
        )}
      </View>
      <View style={styles.videoCardContent}>
        <View style={styles.videoCategoryBadge}>
          <Text style={styles.videoCategoryText}>{video.category}</Text>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoDescription} numberOfLines={2}>{video.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTemplateCard = (template: ProjectTemplate, isMyTemplate: boolean = false) => (
    <TouchableOpacity
      key={template.id}
      style={[styles.templateCard, isMyTemplate && styles.myTemplateCard]}
      activeOpacity={0.8}
      onPress={() => handleOpenTemplateDetail(template)}
    >
      <View style={styles.templateThumbnailContainer}>
        {template.thumbnailUrl ? (
          <Image source={{ uri: template.thumbnailUrl }} style={styles.templateThumbnail} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={isMyTemplate ? ['#7C3AED', '#A855F7'] : ['#4F46E5', '#6366F1']}
            style={styles.templateThumbnailPlaceholder}
          >
            <Ionicons name="clipboard-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
        )}
        {template.difficulty && (
          <View style={[
            styles.difficultyBadge,
            template.difficulty === 'Easy' && styles.difficultyEasy,
            template.difficulty === 'Medium' && styles.difficultyMedium,
            template.difficulty === 'Hard' && styles.difficultyHard,
          ]}>
            <Text style={styles.difficultyText}>{template.difficulty}</Text>
          </View>
        )}
      </View>
      <View style={styles.templateCardContent}>
        <View style={styles.templateCategoryBadge}>
          <Text style={styles.templateCategoryText}>{template.category}</Text>
        </View>
        <Text style={styles.templateTitle} numberOfLines={2}>{template.title}</Text>
        <Text style={styles.templateDescription} numberOfLines={2}>{template.description}</Text>
        <View style={styles.templateStats}>
          <View style={styles.templateStat}>
            <Ionicons name="checkbox-outline" size={14} color="#64748B" />
            <Text style={styles.templateStatText}>
              {template.checklist.reduce((acc, cat) => acc + cat.items.length, 0)} items
            </Text>
          </View>
          <View style={styles.templateStat}>
            <Ionicons name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.templateStatText}>{template.materials.length} materials</Text>
          </View>
        </View>
        {template.estimatedDuration && (
          <View style={styles.templateDuration}>
            <Ionicons name="time-outline" size={14} color="#8B5CF6" />
            <Text style={styles.templateDurationText}>{template.estimatedDuration}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#A855F7']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Knowledge Center</Text>
            <Text style={styles.headerSubtitle}>Training, Templates & Resources</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'training' && styles.tabActive]}
          onPress={() => setActiveTab('training')}
        >
          <Ionicons
            name="videocam-outline"
            size={18}
            color={activeTab === 'training' ? '#7C3AED' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'training' && styles.tabTextActive]}>
            Training
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons
            name="clipboard-outline"
            size={18}
            color={activeTab === 'templates' ? '#7C3AED' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myTemplates' && styles.tabActive]}
          onPress={() => setActiveTab('myTemplates')}
        >
          <Ionicons
            name="folder-outline"
            size={18}
            color={activeTab === 'myTemplates' ? '#7C3AED' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'myTemplates' && styles.tabTextActive]}>
            My Templates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'training' ? 'videos' : 'templates'}...`}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      {activeTab === 'training' && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, selectedTrainingCategory === 'All' && styles.categoryChipActive]}
              onPress={() => setSelectedTrainingCategory('All')}
            >
              <Text style={[styles.categoryChipText, selectedTrainingCategory === 'All' && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            {trainingCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedTrainingCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedTrainingCategory(cat)}
                onLongPress={() => handleCategoryLongPress(cat, 'training')}
                delayLongPress={500}
              >
                <Text style={[styles.categoryChipText, selectedTrainingCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addCategoryChip}
              onPress={() => handleOpenAddCategory('training')}
            >
              <Ionicons name="add" size={16} color="#7C3AED" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {(activeTab === 'templates' || activeTab === 'myTemplates') && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, selectedTemplateCategory === 'All' && styles.categoryChipActive]}
              onPress={() => setSelectedTemplateCategory('All')}
            >
              <Text style={[styles.categoryChipText, selectedTemplateCategory === 'All' && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            {templateCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedTemplateCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedTemplateCategory(cat)}
                onLongPress={() => handleCategoryLongPress(cat, 'template')}
                delayLongPress={500}
              >
                <Text style={[styles.categoryChipText, selectedTemplateCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addCategoryChip}
              onPress={() => handleOpenAddCategory('template')}
            >
              <Ionicons name="add" size={16} color="#7C3AED" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Training Videos */}
        {activeTab === 'training' && (
          <>
            {filteredTrainingVideos.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="videocam-outline" size={48} color="#8B5CF6" />
                </View>
                <Text style={styles.emptyTitle}>No Training Videos</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'No videos match your search' : 'Add your first training video to get started'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity style={styles.emptyButton} onPress={handleOpenAddVideo}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyButtonText}>Add Video</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredTrainingVideos.map(video => renderTrainingVideoCard(video))}
              </View>
            )}
          </>
        )}

        {/* Project Templates */}
        {activeTab === 'templates' && (
          <>
            {filteredProjectTemplates.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="clipboard-outline" size={48} color="#8B5CF6" />
                </View>
                <Text style={styles.emptyTitle}>No Templates</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'No templates match your search' : 'Project templates will appear here'}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredProjectTemplates.map(template => renderTemplateCard(template))}
              </View>
            )}
          </>
        )}

        {/* My Templates */}
        {activeTab === 'myTemplates' && (
          <>
            {filteredMyTemplates.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="folder-outline" size={48} color="#8B5CF6" />
                </View>
                <Text style={styles.emptyTitle}>No Custom Templates</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'No templates match your search'
                    : 'Copy templates from Project Templates or create your own'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNewTemplate}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyButtonText}>Create Template</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredMyTemplates.map(template => renderTemplateCard(template, true))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, Platform.OS === 'web' && { position: 'fixed' as any }]}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => {
            if (activeTab === 'training') {
              handleOpenAddVideo();
            } else if (activeTab === 'myTemplates') {
              handleCreateNewTemplate();
            }
          }}
        >
          <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add Video Modal */}
      <Modal visible={showAddVideoModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Training Video</Text>
              <TouchableOpacity onPress={() => setShowAddVideoModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={videoEditData.title}
                  onChangeText={text => setVideoEditData(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Electrical Panel Basics"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={videoEditData.description}
                  onChangeText={text => setVideoEditData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe what the video covers..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryPicker}>
                    {trainingCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPickerItem,
                          videoEditData.category === cat && styles.categoryPickerItemActive,
                        ]}
                        onPress={() => setVideoEditData(prev => ({ ...prev, category: cat }))}
                      >
                        <Text
                          style={[
                            styles.categoryPickerText,
                            videoEditData.category === cat && styles.categoryPickerTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Video URL (YouTube, Vimeo, etc.)</Text>
                <TextInput
                  style={styles.formInput}
                  value={videoEditData.videoUrl}
                  onChangeText={text => setVideoEditData(prev => ({ ...prev, videoUrl: text }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Or Upload Video File</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickVideo}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#7C3AED" />
                  <Text style={styles.uploadButtonText}>
                    {videoEditData.videoUri ? 'Video Selected' : 'Choose Video'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cover Image (Optional)</Text>
                <Text style={styles.formHint}>
                  YouTube thumbnails are auto-extracted. Add custom image to override.
                </Text>
                <TouchableOpacity 
                  style={styles.coverImagePicker} 
                  onPress={handlePickVideoCoverImage}
                >
                  {videoEditData.thumbnailUrl ? (
                    <Image 
                      source={{ uri: videoEditData.thumbnailUrl }} 
                      style={styles.coverImagePreview} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.coverImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#7C3AED" />
                      <Text style={styles.coverImagePlaceholderText}>Add Cover Image</Text>
                    </View>
                  )}
                  <View style={styles.coverImageEditBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                {videoEditData.thumbnailUrl && (
                  <TouchableOpacity 
                    style={styles.removeCoverButton}
                    onPress={() => setVideoEditData(prev => ({ ...prev, thumbnailUrl: undefined }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={styles.removeCoverText}>Remove Cover Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={videoEditData.duration}
                  onChangeText={text => setVideoEditData(prev => ({ ...prev, duration: text }))}
                  placeholder="e.g., 12:45"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveVideo}>
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.saveButtonGradient}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add Video</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Video Detail Modal */}
      <Modal visible={showVideoDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedVideo && (
              <>
                <View style={styles.detailModalHeader}>
                  <TouchableOpacity onPress={() => setShowVideoDetailModal(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.detailModalActions}>
                    <TouchableOpacity
                      style={styles.detailAction}
                      onPress={() => handleToggleVideoFavorite(selectedVideo.id)}
                    >
                      <Ionicons
                        name={selectedVideo.isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={selectedVideo.isFavorite ? '#EF4444' : '#64748B'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailAction} onPress={handleDeleteVideo}>
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Video Preview */}
                  <View style={styles.videoPreviewWrapper}>
                    <TouchableOpacity
                      style={styles.videoPreviewContainer}
                      onPress={() => selectedVideo.videoUrl && handleOpenVideoUrl(selectedVideo.videoUrl)}
                    >
                      {selectedVideo.thumbnailUrl ? (
                        <Image
                          source={{ uri: selectedVideo.thumbnailUrl }}
                          style={styles.videoPreview}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.videoPreviewPlaceholder}>
                          <Ionicons name="videocam" size={64} color="#8B5CF6" />
                        </View>
                      )}
                      <View style={styles.playButtonLarge}>
                        <Ionicons name="play" size={32} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                    {/* Edit Cover Button */}
                    <TouchableOpacity
                      style={styles.editCoverButton}
                      onPress={handleEditVideoCoverFromDetail}
                    >
                      <Ionicons name="camera" size={18} color="#FFFFFF" />
                      <Text style={styles.editCoverButtonText}>Edit Cover</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailInfo}>
                    <View style={styles.detailCategoryBadge}>
                      <Text style={styles.detailCategoryText}>{selectedVideo.category}</Text>
                    </View>

                    <Text style={styles.detailTitle}>{selectedVideo.title}</Text>
                    <Text style={styles.detailDescription}>{selectedVideo.description}</Text>

                    {selectedVideo.duration && (
                      <View style={styles.detailMeta}>
                        <Ionicons name="time-outline" size={18} color="#7C3AED" />
                        <Text style={styles.detailMetaText}>Duration: {selectedVideo.duration}</Text>
                      </View>
                    )}

                    {selectedVideo.videoUrl && (
                      <TouchableOpacity
                        style={styles.watchButton}
                        onPress={() => handleOpenVideoUrl(selectedVideo.videoUrl!)}
                      >
                        <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.watchButtonGradient}>
                          <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
                          <Text style={styles.watchButtonText}>Watch Video</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Template Detail Modal */}
      <Modal visible={showTemplateDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedTemplate && (
              <>
                <View style={styles.detailModalHeader}>
                  <TouchableOpacity onPress={() => setShowTemplateDetailModal(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.detailModalActions}>
                    {!selectedTemplate.isSystemTemplate && (
                      <>
                        <TouchableOpacity
                          style={styles.detailAction}
                          onPress={() => handleEditMyTemplate(selectedTemplate)}
                        >
                          <Ionicons name="create-outline" size={24} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailAction} onPress={handleDeleteMyTemplate}>
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Template Header */}
                  <View style={styles.templateDetailImageWrapper}>
                    {selectedTemplate.thumbnailUrl ? (
                      <Image
                        source={{ uri: selectedTemplate.thumbnailUrl }}
                        style={styles.templateDetailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={selectedTemplate.isSystemTemplate ? ['#4F46E5', '#6366F1'] : ['#7C3AED', '#A855F7']}
                        style={styles.templateDetailImagePlaceholder}
                      >
                        <Ionicons name="clipboard-outline" size={64} color="#FFFFFF" />
                      </LinearGradient>
                    )}
                    {/* Edit Cover Button - Only for My Templates */}
                    {!selectedTemplate.isSystemTemplate && (
                      <TouchableOpacity
                        style={styles.editCoverButton}
                        onPress={handleEditTemplateCoverFromDetail}
                      >
                        <Ionicons name="camera" size={18} color="#FFFFFF" />
                        <Text style={styles.editCoverButtonText}>Edit Cover</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.detailInfo}>
                    <View style={styles.templateDetailBadges}>
                      <View style={styles.detailCategoryBadge}>
                        <Text style={styles.detailCategoryText}>{selectedTemplate.category}</Text>
                      </View>
                      {selectedTemplate.difficulty && (
                        <View style={[
                          styles.difficultyBadgeDetail,
                          selectedTemplate.difficulty === 'Easy' && styles.difficultyEasy,
                          selectedTemplate.difficulty === 'Medium' && styles.difficultyMedium,
                          selectedTemplate.difficulty === 'Hard' && styles.difficultyHard,
                        ]}>
                          <Text style={styles.difficultyTextDetail}>{selectedTemplate.difficulty}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.detailTitle}>{selectedTemplate.title}</Text>
                    <Text style={styles.detailDescription}>{selectedTemplate.description}</Text>

                    {selectedTemplate.estimatedDuration && (
                      <View style={styles.detailMeta}>
                        <Ionicons name="time-outline" size={18} color="#7C3AED" />
                        <Text style={styles.detailMetaText}>
                          Estimated Duration: {selectedTemplate.estimatedDuration}
                        </Text>
                      </View>
                    )}

                    {/* Checklist Preview */}
                    {selectedTemplate.checklist.length > 0 && (
                      <View style={styles.templateSection}>
                        <Text style={styles.templateSectionTitle}>
                          <Ionicons name="checkbox-outline" size={18} color="#7C3AED" /> Checklist
                        </Text>
                        {selectedTemplate.checklist.map(cat => (
                          <View key={cat.id} style={styles.checklistCategory}>
                            <Text style={styles.checklistCategoryName}>{cat.name}</Text>
                            {cat.items.slice(0, 3).map(item => (
                              <View key={item.id} style={styles.checklistItem}>
                                <Ionicons name="square-outline" size={16} color="#64748B" />
                                <Text style={styles.checklistItemText}>{item.text}</Text>
                              </View>
                            ))}
                            {cat.items.length > 3 && (
                              <Text style={styles.moreItemsText}>+{cat.items.length - 3} more items</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Materials Preview */}
                    {selectedTemplate.materials.length > 0 && (
                      <View style={styles.templateSection}>
                        <Text style={styles.templateSectionTitle}>
                          <Ionicons name="cube-outline" size={18} color="#7C3AED" /> Materials
                        </Text>
                        {selectedTemplate.materials.slice(0, 4).map(mat => (
                          <View key={mat.id} style={styles.materialItem}>
                            <Text style={styles.materialName}>{mat.name}</Text>
                            <Text style={styles.materialQty}>
                              {mat.quantity} {mat.unit}
                            </Text>
                          </View>
                        ))}
                        {selectedTemplate.materials.length > 4 && (
                          <Text style={styles.moreItemsText}>
                            +{selectedTemplate.materials.length - 4} more materials
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                {selectedTemplate.isSystemTemplate && (
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyToMyTemplates}>
                    <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.copyButtonGradient}>
                      <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.copyButtonText}>Copy to My Templates</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Template Modal */}
      <Modal visible={showEditTemplateModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editTemplateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode === 'add' ? 'Create Template' : 'Edit Template'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editTemplateScroll}>
              {/* Basic Info */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={templateEditData.title}
                  onChangeText={text => setTemplateEditData(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Kitchen Remodel Template"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={templateEditData.description}
                  onChangeText={text => setTemplateEditData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe this template..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cover Image</Text>
                <TouchableOpacity 
                  style={styles.coverImagePicker} 
                  onPress={handlePickTemplateCoverImage}
                >
                  {templateEditData.thumbnailUrl ? (
                    <Image 
                      source={{ uri: templateEditData.thumbnailUrl }} 
                      style={styles.coverImagePreview} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.coverImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#7C3AED" />
                      <Text style={styles.coverImagePlaceholderText}>Add Cover Image</Text>
                    </View>
                  )}
                  <View style={styles.coverImageEditBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                {templateEditData.thumbnailUrl && (
                  <TouchableOpacity 
                    style={styles.removeCoverButton}
                    onPress={() => setTemplateEditData(prev => ({ ...prev, thumbnailUrl: undefined }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={styles.removeCoverText}>Remove Cover Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryPicker}>
                    {templateCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPickerItem,
                          templateEditData.category === cat && styles.categoryPickerItemActive,
                        ]}
                        onPress={() => setTemplateEditData(prev => ({ ...prev, category: cat }))}
                      >
                        <Text
                          style={[
                            styles.categoryPickerText,
                            templateEditData.category === cat && styles.categoryPickerTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Estimated Duration</Text>
                  <TextInput
                    style={styles.formInput}
                    value={templateEditData.estimatedDuration}
                    onChangeText={text => setTemplateEditData(prev => ({ ...prev, estimatedDuration: text }))}
                    placeholder="e.g., 2-3 weeks"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.formLabel}>Difficulty</Text>
                  <View style={styles.difficultyPicker}>
                    {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
                      <TouchableOpacity
                        key={diff}
                        style={[
                          styles.difficultyPickerItem,
                          templateEditData.difficulty === diff && styles.difficultyPickerItemActive,
                        ]}
                        onPress={() => setTemplateEditData(prev => ({ ...prev, difficulty: diff }))}
                      >
                        <Text
                          style={[
                            styles.difficultyPickerText,
                            templateEditData.difficulty === diff && styles.difficultyPickerTextActive,
                          ]}
                        >
                          {diff}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Checklist Section */}
              <View style={styles.editSection}>
                <View style={styles.editSectionHeader}>
                  <Text style={styles.editSectionTitle}>Checklist Categories</Text>
                  <TouchableOpacity style={styles.addItemButton} onPress={handleAddChecklistCategory}>
                    <Ionicons name="add" size={18} color="#7C3AED" />
                    <Text style={styles.addItemText}>Add Category</Text>
                  </TouchableOpacity>
                </View>

                {(templateEditData.checklist || []).map(cat => (
                  <View key={cat.id} style={styles.editChecklistCategory}>
                    <View style={styles.editCategoryHeader}>
                      <TextInput
                        style={styles.editCategoryNameInput}
                        value={cat.name}
                        onChangeText={text => handleUpdateChecklistCategoryName(cat.id, text)}
                        placeholder="Category name"
                        placeholderTextColor="#94A3B8"
                      />
                      <TouchableOpacity onPress={() => handleDeleteChecklistCategory(cat.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {cat.items.map(item => (
                      <View key={item.id} style={styles.editChecklistItem}>
                        <Ionicons name="square-outline" size={16} color="#64748B" />
                        <TextInput
                          style={styles.editChecklistItemInput}
                          value={item.text}
                          onChangeText={text => handleUpdateChecklistItem(cat.id, item.id, text)}
                          placeholder="Checklist item"
                          placeholderTextColor="#94A3B8"
                        />
                        <TouchableOpacity onPress={() => handleDeleteChecklistItem(cat.id, item.id)}>
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addChecklistItemButton}
                      onPress={() => handleAddChecklistItem(cat.id)}
                    >
                      <Ionicons name="add" size={16} color="#7C3AED" />
                      <Text style={styles.addChecklistItemText}>Add Item</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Materials Section */}
              <View style={styles.editSection}>
                <View style={styles.editSectionHeader}>
                  <Text style={styles.editSectionTitle}>Materials</Text>
                  <TouchableOpacity style={styles.addItemButton} onPress={handleAddMaterialItem}>
                    <Ionicons name="add" size={18} color="#7C3AED" />
                    <Text style={styles.addItemText}>Add Material</Text>
                  </TouchableOpacity>
                </View>

                {(templateEditData.materials || []).map(mat => (
                  <View key={mat.id} style={styles.editMaterialItem}>
                    <TextInput
                      style={[styles.editMaterialInput, { flex: 2 }]}
                      value={mat.name}
                      onChangeText={text => handleUpdateMaterialItem(mat.id, { name: text })}
                      placeholder="Material name"
                      placeholderTextColor="#94A3B8"
                    />
                    <TextInput
                      style={[styles.editMaterialInput, { flex: 1 }]}
                      value={mat.quantity}
                      onChangeText={text => handleUpdateMaterialItem(mat.id, { quantity: text })}
                      placeholder="Qty"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.editMaterialInput, { flex: 1 }]}
                      value={mat.unit}
                      onChangeText={text => handleUpdateMaterialItem(mat.id, { unit: text })}
                      placeholder="Unit"
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity onPress={() => handleDeleteMaterialItem(mat.id)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTemplate}>
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.saveButtonGradient}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editMode === 'add' ? 'Create Template' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showAddCategoryModal} transparent animationType="fade">
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>
              Add {categoryType === 'training' ? 'Training' : 'Template'} Category
            </Text>
            <TextInput
              style={styles.categoryModalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
            <View style={styles.categoryModalButtons}>
              <TouchableOpacity
                style={styles.categoryModalCancel}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <Text style={styles.categoryModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryModalSave} onPress={handleSaveCategory}>
                <Text style={styles.categoryModalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Action Modal (Rename/Delete) */}
      <Modal visible={showCategoryActionModal} transparent animationType="fade">
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryActionModalContent}>
            <View style={styles.categoryActionWarningIcon}>
              <Ionicons name="warning-outline" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.categoryActionTitle}>
              {`Do you want to delete "${selectedCategoryForAction}" category or rename it?`}
            </Text>
            <View style={styles.categoryActionButtons}>
              <TouchableOpacity
                style={styles.categoryActionRename}
                onPress={handleRenameCategory}
              >
                <Ionicons name="create-outline" size={18} color="#7C3AED" />
                <Text style={styles.categoryActionRenameText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.categoryActionDelete}
                onPress={handleDeleteCategory}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.categoryActionDeleteText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.categoryActionCancelBtn}
                onPress={() => setShowCategoryActionModal(false)}
              >
                <Text style={styles.categoryActionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Category Modal */}
      <Modal visible={showRenameCategoryModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.categoryModalOverlay}
        >
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>Rename Category</Text>
            <TextInput
              style={styles.categoryModalInput}
              value={renameCategoryValue}
              onChangeText={setRenameCategoryValue}
              placeholder="New category name"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
            <View style={styles.categoryModalButtons}>
              <TouchableOpacity
                style={styles.categoryModalCancel}
                onPress={() => {
                  setShowRenameCategoryModal(false);
                  setRenameCategoryValue('');
                }}
              >
                <Text style={styles.categoryModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryModalSave} onPress={handleSaveRenamedCategory}>
                <Text style={styles.categoryModalSaveText}>Save</Text>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#7C3AED',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  addCategoryChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  // Video Card Styles
  videoCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  videoThumbnailContainer: {
    height: 100,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 12,
  },
  videoCardContent: {
    padding: 12,
  },
  videoCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  videoCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  // Template Card Styles
  templateCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  myTemplateCard: {
    shadowColor: '#7C3AED',
  },
  templateThumbnailContainer: {
    height: 100,
    position: 'relative',
  },
  templateThumbnail: {
    width: '100%',
    height: '100%',
  },
  templateThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyEasy: {
    backgroundColor: '#10B981',
  },
  difficultyMedium: {
    backgroundColor: '#F59E0B',
  },
  difficultyHard: {
    backgroundColor: '#EF4444',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  templateCardContent: {
    padding: 12,
  },
  templateCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  templateCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  templateStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateStatText: {
    fontSize: 11,
    color: '#64748B',
  },
  templateDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateDurationText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // FAB
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
    shadowColor: '#7C3AED',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
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
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPickerItemActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryPickerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryPickerTextActive: {
    color: '#FFFFFF',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  saveButton: {
    marginTop: 16,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Detail Modal
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailAction: {
    padding: 4,
  },
  videoPreviewContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    paddingBottom: 20,
  },
  detailCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailMetaText: {
    fontSize: 14,
    color: '#64748B',
  },
  watchButton: {
    marginTop: 8,
  },
  watchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Template Detail
  templateDetailImage: {
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  templateDetailImagePlaceholder: {
    height: 180,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  templateDetailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  difficultyBadgeDetail: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyTextDetail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  templateSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  templateSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  checklistCategory: {
    marginBottom: 16,
  },
  checklistCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  checklistItemText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  materialName: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  materialQty: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  copyButton: {
    marginTop: 16,
  },
  copyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Edit Template Modal
  editTemplateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '95%',
  },
  editTemplateScroll: {
    maxHeight: '75%',
  },
  difficultyPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyPickerItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  difficultyPickerItemActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  difficultyPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  difficultyPickerTextActive: {
    color: '#FFFFFF',
  },
  editSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  editSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  editChecklistCategory: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  editCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editCategoryNameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editChecklistItemInput: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addChecklistItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    marginTop: 4,
  },
  addChecklistItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  editMaterialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editMaterialInput: {
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // Add Category Modal
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryModalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  categoryModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  categoryModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryModalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  categoryModalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Category Action Modal Styles
  categoryActionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  categoryActionWarningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  categoryActionButtons: {
    width: '100%',
    gap: 10,
  },
  categoryActionRename: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
    gap: 8,
  },
  categoryActionRenameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  categoryActionDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    gap: 8,
  },
  categoryActionDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryActionCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  categoryActionCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  // Cover Image Picker Styles
  formHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  coverImagePicker: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverImagePlaceholderText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  coverImageEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removeCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    marginTop: 8,
  },
  removeCoverText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Video Preview Wrapper (for edit cover button positioning)
  videoPreviewWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  editCoverButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editCoverButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Template Detail Image Wrapper
  templateDetailImageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
});
